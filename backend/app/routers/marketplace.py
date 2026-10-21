from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission, user_has_any_permission
from app.database import get_db
from app.models import MarketplaceOrder, MarketplaceProduct, User


router = APIRouter(prefix="/marketplace", tags=["Marketplace"])
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
    return {
        "id": order.id,
        "items": order.items,
        "total_amount": float(order.total_amount),
        "status": order.status,
        "created_at": order.created_at.isoformat(),
    }


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
    total = Decimal("0.00")
    for product in products:
        quantity = quantities[product.id]
        price = Decimal(product.price)
        total += price * quantity
        item_snapshot.append({"product_id": product.id, "name": product.name, "quantity": quantity, "unit_price": float(price), "seller_id": product.seller_id})
    order = MarketplaceOrder(
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
    return _order_out(order)


@router.get("/seller-orders")
def list_seller_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if str(current_user.membership_status or "").upper() != "APPROVED" and not _can_manage(current_user, db):
        raise HTTPException(status_code=403, detail="Only verified sellers can view marketplace order requests")
    role_name = current_user.role_record.name if current_user.role_record else current_user.role
    can_manage_all = user_has_any_permission(current_user, ("marketplace.manage",), db) and str(role_name or "").upper() in {"ADMIN", "SUPER ADMIN"}
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
