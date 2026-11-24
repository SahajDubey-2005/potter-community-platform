from datetime import date, datetime, timezone
import hashlib
import hmac
import secrets
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission, user_has_any_permission
from app.database import get_db
from app.models import MarketplaceOrder, MarketplaceProduct, User


router = APIRouter(prefix="/marketplace", tags=["Marketplace"])
MARKETPLACE_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "marketplace"
MARKETPLACE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_MARKETPLACE_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_MARKETPLACE_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
optional_bearer = HTTPBearer(auto_error=False)


class ProductInput(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str = Field(min_length=5, max_length=2000)
    category: str = Field(min_length=2, max_length=80)
    price: Decimal = Field(gt=0, le=99999999)
    image_url: str | None = Field(default=None, max_length=1000)


class OrderItemInput(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=1, le=100)


class OrderInput(BaseModel):
    items: list[OrderItemInput] = Field(min_length=1, max_length=50)
    buyer_name: str = Field(min_length=2, max_length=160)
    buyer_phone: str = Field(min_length=10, max_length=20)
    buyer_email: str | None = Field(default=None, max_length=255)
    delivery_address: str = Field(min_length=8, max_length=1000)


def optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    if credentials is None:
        return None
    return get_current_user(credentials, db)


def _can_manage(user: User, db: Session) -> bool:
    return user_has_any_permission(user, ("marketplace.manage",), db)


def _is_verified_member(user: User) -> bool:
    return str(user.membership_status or "").upper() == "APPROVED"


def _product_out(product: MarketplaceProduct, seller_name: str, can_manage: bool = False) -> dict:
    return {
        "id": product.id,
        "seller_id": product.seller_id,
        "seller_name": seller_name,
        "name": product.name,
        "description": product.description,
        "category": product.category,
        "price": float(product.price),
        "image": product.image_url,
        "is_active": product.is_active,
        "created_at": product.created_at.isoformat(),
        "can_manage": can_manage,
    }


def _order_out(order: MarketplaceOrder) -> dict:
    # A single checkout may contain items from multiple independent sellers.
    # Keep each product's own status and location history in its JSON snapshot.
    return {
        "id": order.id,
        "tracking_number": order.tracking_number or f"PCP-LEGACY-{order.id}",
        "items": order.items,
        "total_amount": float(order.total_amount),
        "status": order.status,
        "created_at": order.created_at.isoformat(),
        "delivery_address": order.delivery_address or "",
        "payment_status": order.payment_status or "UNPAID",
        "payment_reference": order.payment_reference,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
    }


def _is_marketplace_admin(user: User, db: Session) -> bool:
    role_name = user.role_record.name if user.role_record else user.role
    return _can_manage(user, db) and str(role_name or "").upper() in {"ADMIN", "SUPER ADMIN"}


def _update_combined_status(order: MarketplaceOrder, items: list[dict]) -> None:
    # Preserve the existing summary priority and per-seller split-order behavior.
    statuses = [item.get("status", order.status or "REQUESTED") for item in items]
    if all(value == "DELIVERED" for value in statuses):
        order.status = "DELIVERED"
    elif all(value == "CANCELLED" for value in statuses):
        order.status = "CANCELLED"
    elif any(value == "SHIPPED" for value in statuses):
        order.status = "SHIPPED"
    elif any(value == "PROCESSING" for value in statuses):
        order.status = "PROCESSING"
    elif any(value == "ACCEPTED" for value in statuses):
        order.status = "ACCEPTED"
    else:
        order.status = "REQUESTED"


@router.post("/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not _is_verified_member(current_user):
        raise HTTPException(status_code=403, detail="Only verified community members can upload marketplace images")
    extension = ALLOWED_MARKETPLACE_IMAGE_TYPES.get(file.content_type or "")
    if not extension:
        raise HTTPException(status_code=415, detail="Choose a JPG, PNG, or WEBP image")
    content = await file.read(MAX_MARKETPLACE_IMAGE_BYTES + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The selected image is empty")
    if len(content) > MAX_MARKETPLACE_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
    # The browser-provided Content-Type is not trustworthy. Match it to the
    # actual file signature so HTML/SVG or other active files cannot be served
    # back from the public marketplace image directory.
    is_supported_image = {
        "image/jpeg": content.startswith(b"\xff\xd8\xff"),
        "image/png": content.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/webp": len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP",
    }.get(file.content_type or "", False)
    if not is_supported_image:
        raise HTTPException(status_code=415, detail="The uploaded file does not match its JPG, PNG, or WEBP type")
    filename = f"{uuid4().hex}{extension}"
    destination = MARKETPLACE_UPLOAD_DIR / filename
    destination.write_bytes(content)
    return {"image_url": f"/uploads/marketplace/{filename}"}


@router.get("/products")
def list_products(current_user: User | None = Depends(optional_current_user), db: Session = Depends(get_db)):
    products = db.query(MarketplaceProduct).filter(MarketplaceProduct.is_active.is_(True)).order_by(MarketplaceProduct.created_at.desc()).all()
    sellers = {user.id: user.full_name for user in db.query(User).filter(User.id.in_([p.seller_id for p in products])).all()} if products else {}
    return [_product_out(product, sellers.get(product.seller_id, "Community artisan"), bool(current_user and (product.seller_id == current_user.id or _can_manage(current_user, db)))) for product in products]


@router.get("/my-products")
def list_my_products(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    can_manage = _can_manage(current_user, db)
    query = db.query(MarketplaceProduct)
    if not can_manage:
        query = query.filter(MarketplaceProduct.seller_id == current_user.id)
    products = query.order_by(MarketplaceProduct.created_at.desc()).all()
    return [_product_out(p, current_user.full_name if p.seller_id == current_user.id else "Community artisan", can_manage or p.seller_id == current_user.id) for p in products]


@router.post("/products", status_code=status.HTTP_201_CREATED)
def create_product(data: ProductInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_verified_member(current_user):
        raise HTTPException(status_code=403, detail="Only verified community members can list marketplace products")
    product = MarketplaceProduct(
        seller_id=current_user.id,
        name=data.name.strip(),
        description=data.description.strip(),
        category=data.category.strip(),
        price=data.price,
        image_url=data.image_url.strip() if data.image_url else None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return _product_out(product, current_user.full_name, True)


@router.patch("/products/{product_id}")
def update_product(product_id: int, data: ProductInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.seller_id == current_user.id and not _is_verified_member(current_user):
        raise HTTPException(status_code=403, detail="Only verified community members can manage seller listings")
    if product.seller_id != current_user.id and not _can_manage(current_user, db):
        raise HTTPException(status_code=403, detail="You can only edit your own listings")
    product.name = data.name.strip()
    product.description = data.description.strip()
    product.category = data.category.strip()
    product.price = data.price
    product.image_url = data.image_url.strip() if data.image_url else None
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return _product_out(product, current_user.full_name if product.seller_id == current_user.id else "Community artisan", True)


@router.delete("/products/{product_id}")
def delete_product(product_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    product = db.query(MarketplaceProduct).filter(MarketplaceProduct.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.seller_id == current_user.id and not _is_verified_member(current_user):
        raise HTTPException(status_code=403, detail="Only verified community members can manage seller listings")
    if product.seller_id != current_user.id and not _can_manage(current_user, db):
        raise HTTPException(status_code=403, detail="You can only remove your own listings")
    db.delete(product)
    db.commit()
    return {"message": "Product listing removed"}


@router.post("/orders", status_code=status.HTTP_201_CREATED)
def place_order(data: OrderInput, current_user: User | None = Depends(optional_current_user), db: Session = Depends(get_db)):
    quantities: dict[int, int] = {}
    for item in data.items:
        quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity
    products = db.query(MarketplaceProduct).filter(
        MarketplaceProduct.id.in_(quantities), MarketplaceProduct.is_active.is_(True)
    ).all()
    if len(products) != len(quantities):
        raise HTTPException(status_code=400, detail="One or more cart items are no longer available. Refresh the marketplace and try again.")
    item_snapshot = []
    now = datetime.now(timezone.utc)
    total = Decimal("0.00")
    for product in products:
        quantity = quantities[product.id]
        price = Decimal(product.price)
        total += price * quantity
        item_snapshot.append({"product_id": product.id, "name": product.name, "quantity": quantity, "unit_price": float(price), "seller_id": product.seller_id, "status": "REQUESTED", "status_history": [{"status": "REQUESTED", "at": now.isoformat()}], "tracking_events": [{"status": "REQUESTED", "description": "Order request received", "at": now.isoformat(), "location": None}]})
    access_key = secrets.token_urlsafe(32)
    order = MarketplaceOrder(
        tracking_number=f"PCP-{uuid4().hex[:16].upper()}",
        tracking_access_hash=hashlib.sha256(access_key.encode("utf-8")).hexdigest(),
        user_id=current_user.id if current_user else None,
        buyer_name=data.buyer_name.strip(),
        buyer_phone=data.buyer_phone.strip(),
        buyer_email=data.buyer_email.strip() if data.buyer_email else None,
        delivery_address=data.delivery_address.strip(),
        items=item_snapshot,
        total_amount=total,
        status="REQUESTED",
        created_at=datetime.now(timezone.utc),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    # The access key is shown only after checkout; the database stores its hash.
    return {**_order_out(order), "tracking_access_key": access_key}


class TrackingLookupInput(BaseModel):
    order_id: int = Field(gt=0)
    access_key: str = Field(min_length=20, max_length=256)


@router.post("/track")
def track_order_by_access_key(data: TrackingLookupInput, db: Session = Depends(get_db)):
    # Guest tracking cannot use guessable order IDs alone.
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == data.order_id).first()
    supplied_hash = hashlib.sha256(data.access_key.encode("utf-8")).hexdigest()
    if not order or not order.tracking_access_hash or not hmac.compare_digest(order.tracking_access_hash, supplied_hash):
        raise HTTPException(status_code=404, detail="Order not found. Check your order ID and private tracking code.")
    return _order_out(order)


@router.get("/seller-orders")
def list_seller_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if str(current_user.membership_status or "").upper() != "APPROVED" and not _can_manage(current_user, db):
        raise HTTPException(status_code=403, detail="Only verified sellers can view marketplace order requests")
    can_manage_all = _is_marketplace_admin(current_user, db)
    orders = db.query(MarketplaceOrder).order_by(MarketplaceOrder.created_at.desc()).limit(300).all()
    output = []
    for order in orders:
        matching_items = order.items if can_manage_all else [item for item in order.items if item.get("seller_id") == current_user.id]
        if not matching_items:
            continue
        output.append({
            **_order_out(order), "items": matching_items,
            "buyer_name": order.buyer_name or "Buyer", "buyer_phone": order.buyer_phone or "",
            "buyer_email": order.buyer_email, "delivery_address": order.delivery_address or "",
        })
    return output


@router.get("/orders")
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(MarketplaceOrder).filter(MarketplaceOrder.user_id == current_user.id).order_by(MarketplaceOrder.created_at.desc()).limit(100).all()
    return [_order_out(order) for order in orders]


class OrderStatusInput(BaseModel):
    status: str = Field(pattern="^(ACCEPTED|PROCESSING|SHIPPED|DELIVERED|CANCELLED)$")


@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    data: OrderStatusInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if data.status == "CANCELLED" and order.payment_status in {"PAID", "REFUND_PENDING", "PARTIALLY_REFUNDED"}:
        raise HTTPException(status_code=409, detail="Refund the online payment before cancelling a paid order")

    is_admin = _is_marketplace_admin(current_user, db)
    if not is_admin and not _is_verified_member(current_user):
        raise HTTPException(status_code=403, detail="Only verified sellers can update order status")

    items = [dict(item) for item in (order.items or [])]
    owned_items = [item for item in items if is_admin or int(item.get("seller_id", -1)) == current_user.id]
    if not owned_items:
        raise HTTPException(status_code=403, detail="You are not authorized to update this order")

    now = datetime.now(timezone.utc).isoformat()
    for item in owned_items:
        previous = item.get("status") or order.status or "REQUESTED"
        if previous in {"DELIVERED", "CANCELLED"}:
            raise HTTPException(status_code=409, detail=f"Order item is already {previous.lower()}")
        history = list(item.get("status_history") or [])
        history.append({"status": data.status, "at": now, "updated_by": current_user.id})
        events = list(item.get("tracking_events") or [])
        events.append({"status": data.status, "at": now, "description": "Shipment status updated by seller", "location": None, "updated_by": current_user.id})
        item["tracking_events"] = events
        item["status"] = data.status
        item["status_history"] = history
        item["status_updated_at"] = now

    order.items = items
    _update_combined_status(order, items)

    db.commit()
    db.refresh(order)
    return _order_out(order)


class ShipmentLocationInput(BaseModel):
    product_id: int = Field(gt=0)
    location: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, pattern="^(REQUESTED|ACCEPTED|PROCESSING|SHIPPED|DELIVERED|CANCELLED)$")
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    courier_name: str | None = Field(default=None, max_length=120)
    courier_tracking_number: str | None = Field(default=None, max_length=120)
    estimated_delivery: date | None = None


@router.patch("/orders/{order_id}/tracking")
def update_shipment_location(
    order_id: int,
    data: ShipmentLocationInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only the product's seller (or authorized marketplace administrator) can
    # report a location. No customer-supplied updates or simulated GPS points.
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id).first()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    is_admin = _is_marketplace_admin(current_user, db)
    if not is_admin and not _is_verified_member(current_user):
        raise HTTPException(status_code=403, detail="Only verified sellers can update shipment locations")
    if (data.latitude is None) != (data.longitude is None):
        raise HTTPException(status_code=422, detail="Enter both latitude and longitude, or leave both empty")
    items = [dict(item) for item in (order.items or [])]
    item = next((value for value in items if int(value.get("product_id", -1)) == data.product_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Product is not part of this order")
    if not is_admin and int(item.get("seller_id", -1)) != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update tracking for your own products")
    previous = str(item.get("status") or "REQUESTED")
    if previous in {"DELIVERED", "CANCELLED"}:
        raise HTTPException(status_code=409, detail="This shipment is already finished")
    next_status = data.status or previous
    if next_status == "CANCELLED" and order.payment_status in {"PAID", "REFUND_PENDING", "PARTIALLY_REFUNDED"}:
        raise HTTPException(status_code=409, detail="Refund the online payment before cancelling a paid order")
    if data.status and data.status != previous:
        valid_progress = ["REQUESTED", "ACCEPTED", "PROCESSING", "SHIPPED", "DELIVERED"]
        if data.status != "CANCELLED" and valid_progress.index(data.status) < valid_progress.index(previous):
            raise HTTPException(status_code=409, detail="Shipment status cannot move backwards")
    now = datetime.now(timezone.utc).isoformat()
    location = data.location.strip()
    if len(location) < 2:
        raise HTTPException(status_code=422, detail="Enter a valid shipment location")
    entry = {
        "status": next_status, "location": location, "at": now,
        "description": (data.description or "Shipment location updated").strip() or "Shipment location updated",
        "updated_by": current_user.id,
    }
    if data.latitude is not None:
        entry["latitude"] = data.latitude
        entry["longitude"] = data.longitude
        item["latitude"] = data.latitude
        item["longitude"] = data.longitude
    else:
        # Never show a previous coordinate as the location of a newer text-only scan.
        item.pop("latitude", None)
        item.pop("longitude", None)
    events = list(item.get("tracking_events") or [])
    events.append(entry)
    item["tracking_events"] = events
    item["current_location"] = location
    item["location_updated_at"] = now
    if next_status != previous:
        history = list(item.get("status_history") or [])
        history.append({"status": next_status, "at": now, "updated_by": current_user.id})
        item["status_history"] = history
        item["status_updated_at"] = now
        item["status"] = next_status
    if data.courier_name is not None:
        item["courier_name"] = data.courier_name.strip() or None
    if data.courier_tracking_number is not None:
        item["courier_tracking_number"] = data.courier_tracking_number.strip() or None
    if data.estimated_delivery is not None:
        item["estimated_delivery"] = data.estimated_delivery.isoformat()
    order.items = items
    _update_combined_status(order, items)
    db.commit()
    db.refresh(order)
    return _order_out(order)
