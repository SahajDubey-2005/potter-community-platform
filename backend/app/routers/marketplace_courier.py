"""Shiprocket courier booking and tracking for existing marketplace orders.

Each (order, product) is a distinct shipment so combined, multi-seller orders
never accidentally ship from another seller's address. API credentials remain
server-only. Shiprocket sends tracking webhooks with an x-api-key secret.
"""
import asyncio
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import hmac
import json
import os
import re
import threading
import time

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import SessionLocal, get_db
from app.models import (
    MarketplaceCourierShipment, MarketplaceCourierWebhook, MarketplaceOrder,
    MarketplaceProduct, MarketplaceSellerPickup, User,
)
from app.notifications import create_notification
from app.routers.marketplace import _is_marketplace_admin, _is_verified_member, _update_combined_status

router = APIRouter(prefix="/marketplace/courier", tags=["Marketplace Courier"])
SHIPROCKET_API = "https://apiv2.shiprocket.in/v1/external"
_token_guard = threading.Lock()
_token_cache = {"token": None, "expires": 0.0}


def _now():
    return datetime.now(timezone.utc)


def _shiprocket_credentials():
    username = os.getenv("SHIPROCKET_EMAIL", "").strip()
    password = os.getenv("SHIPROCKET_PASSWORD", "").strip()
    if not username or not password:
        raise HTTPException(503, "Shiprocket is not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD on the backend.")
    return username, password


def _safe_provider_error(response):
    # Do not leak API credentials, full remote responses, or customer data.
    if response.status_code in {401, 403}:
        return "Shiprocket rejected the API account permissions. Check backend API credentials."
    if response.status_code == 429:
        return "Shiprocket is rate-limiting requests. Retry later."
    try:
        obj = response.json()
        if isinstance(obj, dict):
            message = obj.get("message") or obj.get("error") or obj.get("status_message")
            if isinstance(message, str):
                return message[:250]
    except Exception:
        pass
    return f"Shiprocket returned HTTP {response.status_code}."


def _token():
    username, password = _shiprocket_credentials()
    with _token_guard:
        if _token_cache["token"] and _token_cache["expires"] > time.time() + 90:
            return _token_cache["token"]
        try:
            with httpx.Client(timeout=15) as client:
                response = client.post(f"{SHIPROCKET_API}/auth/login", json={"email": username, "password": password})
        except httpx.RequestError:
            raise HTTPException(502, "Shiprocket authentication could not be reached.")
        if response.status_code >= 400:
            raise HTTPException(502, _safe_provider_error(response))
        try:
            token = response.json().get("token")
        except ValueError:
            token = None
        if not isinstance(token, str) or len(token) < 10:
            raise HTTPException(502, "Shiprocket authentication returned no usable token.")
        _token_cache.update(token=token, expires=time.time() + (9 * 24 * 3600))
        return token


def _remote(method: str, path: str, payload: dict | None = None):
    token = _token()
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    try:
        with httpx.Client(timeout=25) as client:
            response = client.request(method, f"{SHIPROCKET_API}{path}", headers=headers, json=payload)
    except httpx.TimeoutException:
        raise HTTPException(504, "Shiprocket timed out. Check its dashboard before retrying a booking operation.")
    except httpx.RequestError:
        raise HTTPException(502, "Shiprocket could not be reached. Check its dashboard before retrying a booking operation.")
    if response.status_code >= 400:
        raise HTTPException(502, _safe_provider_error(response))
    try:
        body = response.json()
    except ValueError:
        raise HTTPException(502, "Shiprocket returned an invalid response.")
    if not isinstance(body, (dict, list)):
        raise HTTPException(502, "Shiprocket returned an unsupported response.")
    if isinstance(body, dict) and body.get("status_code") in (400, 401, 403, 422, 500):
        raise HTTPException(502, str(body.get("message") or "Shiprocket could not process the request.")[:250])
    return body


def _lookup(obj, key):
    """Pick known fields from provider's shallow nested response envelopes."""
    if isinstance(obj, dict):
        found = obj.get(key)
        if found not in (None, ""):
            return found
        for child_key in ("response", "data", "shipment", "awb_assign", "tracking_data"):
            if child_key in obj:
                found = _lookup(obj[child_key], key)
                if found not in (None, ""):
                    return found
    return None


def _seller_guard(db, user, order_id, product_id):
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id).first()
    if not order:
        raise HTTPException(404, "Marketplace order not found")
    item = next((item for item in (order.items or []) if int(item.get("product_id", -1)) == product_id), None)
    if item is None:
        raise HTTPException(404, "Product does not belong to this order")
    admin = _is_marketplace_admin(user, db)
    if not admin and (not _is_verified_member(user) or int(item.get("seller_id", -1)) != user.id):
        raise HTTPException(403, "Only this product's verified seller or a marketplace administrator may manage delivery")
    return order, item


def _view(shipment):
    return {
        "id": shipment.id, "order_id": shipment.marketplace_order_id, "product_id": shipment.product_id,
        "seller_id": shipment.seller_id, "state": shipment.state,
        "pickup_location": shipment.pickup_location, "pickup_status": shipment.pickup_status,
        "awb_code": shipment.awb_code, "courier_name": shipment.courier_name,
        "courier_status": shipment.courier_status, "last_error": shipment.last_error,
        "last_synced_at": shipment.last_synced_at.isoformat() if shipment.last_synced_at else None,
    }


def _update_item_from_shipment(db, shipment, event=None):
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == shipment.marketplace_order_id).first()
    if order is None:
        return False
    items = [dict(item) for item in (order.items or [])]
    item = next((v for v in items if int(v.get("product_id", -1)) == shipment.product_id), None)
    if not item:
        return False
    item["tracking_provider"] = "Shiprocket"
    item["courier_shipment_state"] = shipment.state
    item["courier_pickup_status"] = shipment.pickup_status
    item["courier_status"] = shipment.courier_status
    item["courier_tracking_number"] = shipment.awb_code
    item["courier_name"] = shipment.courier_name or "Shiprocket"
    if event:
        current = str(item.get("status") or "REQUESTED").upper()
        label = event["status"].upper()
        mapped = "DELIVERED" if label in {"DELIVERED", "DELIVERED TO CUSTOMER"} else (
            "SHIPPED" if any(x in label for x in ("SHIPPED", "IN TRANSIT", "PICKED UP", "OUT FOR DELIVERY", "REACHED", "HANDOVER", "PICKUP COMPLETE")) else "PROCESSING"
        )
        if current not in ("DELIVERED", "CANCELLED"):
            hierarchy = {"REQUESTED": 0, "ACCEPTED": 1, "PROCESSING": 2, "SHIPPED": 3, "DELIVERED": 4}
            if hierarchy.get(mapped, 0) > hierarchy.get(current, 0):
                item["status"] = mapped
                item["status_updated_at"] = event["at"]
                item["status_history"] = list(item.get("status_history") or []) + [{"status": mapped, "at": event["at"], "source": "Shiprocket"}]
        events = list(item.get("tracking_events") or [])
        if not any(e.get("provider_event_key") == event["key"] for e in events):
            record = {
                "status": item.get("status", current), "courier_status": event["status"],
                "at": event["at"], "description": event["description"],
                "location": event["location"], "source": "Shiprocket", "provider_event_key": event["key"],
            }
            events.append(record)
            item["tracking_events"] = events[-250:]
            if event["location"]:
                item["current_location"] = event["location"]
                item["location_updated_at"] = event["at"]
                # No fabricated coordinates from city names or tracking scans.
                item.pop("latitude", None)
                item.pop("longitude", None)
    order.items = items
    _update_combined_status(order, items)
    return True


def _parse_provider_time(value):
    if not value:
        return _now().isoformat()
    raw = str(value).strip()
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            # Shiprocket's local timestamps often have no offset. Do not
            # pretend they are UTC; preserve the provider's original string.
            return raw
        return dt.isoformat()
    except ValueError:
        return raw[:50]


def _provider_event(shipment, status, location=None, at=None, description=None):
    status = str(status or "UPDATE").strip()[:120]
    location = str(location or "").strip()[:200] or None
    raw_at = at
    at = _parse_provider_time(at)
    description = str(description or status).strip()[:300]
    fingerprint = hashlib.sha256(f"{shipment.id}|{status}|{location}|{raw_at or 'NO_TIME'}|{description}".encode()).hexdigest()
    return {"key": fingerprint, "status": status, "location": location, "at": at, "description": description}


def _notify(db, order, item, courier_status):
    if order.user_id:
        create_notification(db, order.user_id, "Marketplace courier update", f"Order #{order.id}: {item.get('name', 'your pottery item')} — {courier_status}.", category="marketplace")


def _save_courier_status(db, shipment, status, location=None, at=None, description=None):
    if not status:
        return False
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == shipment.marketplace_order_id).first()
    if not order:
        return False
    item = next((v for v in (order.items or []) if int(v.get("product_id", -1)) == shipment.product_id), None)
    if not item:
        return False
    event = _provider_event(shipment, status, location, at, description)
    existing = list(item.get("tracking_events") or [])
    changed = not any(e.get("provider_event_key") == event["key"] for e in existing)
    old_status = shipment.courier_status
    if changed:
        shipment.courier_status = event["status"]
        status_upper = event["status"].upper()
        if status_upper == "DELIVERED":
            shipment.state = "DELIVERED"
        elif shipment.state == "PICKUP_REQUESTED" and any(t in status_upper for t in ("PICKED UP", "IN TRANSIT", "SHIPPED", "OUT FOR DELIVERY")):
            shipment.state = "IN_TRANSIT"
        shipment.updated_at = _now()
        _update_item_from_shipment(db, shipment, event)
        if old_status != event["status"]:
            _notify(db, order, item, event["status"])
    return changed


class SellerPickupInput(BaseModel):
    seller_id: int = Field(gt=0)
    pickup_location: str = Field(min_length=2, max_length=160)


@router.put("/pickup-location")
def set_pickup_location(data: SellerPickupInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_marketplace_admin(user, db):
        raise HTTPException(403, "Only a marketplace administrator can assign a registered Shiprocket pickup address")
    if not db.query(User).filter(User.id == data.seller_id).first():
        raise HTTPException(404, "Seller not found")
    name = data.pickup_location.strip()
    if not name:
        raise HTTPException(422, "Pickup location is required")
    assigned = db.query(MarketplaceSellerPickup).filter(MarketplaceSellerPickup.seller_id == data.seller_id).first()
    if not assigned:
        assigned = MarketplaceSellerPickup(seller_id=data.seller_id, pickup_location=name)
        db.add(assigned)
    else:
        assigned.pickup_location = name
    assigned.updated_at = _now()
    db.commit()
    return {"seller_id": data.seller_id, "pickup_location": name}


@router.get("/pickup-location/{seller_id}")
def get_pickup_location(seller_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.id != seller_id and not _is_marketplace_admin(user, db):
        raise HTTPException(403, "You cannot view another seller's pickup assignment")
    assigned = db.query(MarketplaceSellerPickup).filter(MarketplaceSellerPickup.seller_id == seller_id).first()
    return {"seller_id": seller_id, "pickup_location": assigned.pickup_location if assigned else None}


class CreateShipmentInput(BaseModel):
    destination_address: str = Field(min_length=8, max_length=250)
    destination_city: str = Field(min_length=2, max_length=120)
    destination_state: str = Field(min_length=2, max_length=120)
    destination_pincode: str = Field(pattern=r"^[1-9][0-9]{5}$")
    recipient_email: str | None = Field(default=None, max_length=255)
    weight_kg: float = Field(gt=0, le=500)
    length_cm: float = Field(gt=0, le=300)
    breadth_cm: float = Field(gt=0, le=300)
    height_cm: float = Field(gt=0, le=300)


def _provider_create_payload(order, item, shipment):
    phone = re.sub(r"\D", "", order.buyer_phone or "")[-10:]
    if len(phone) != 10:
        raise HTTPException(422, "Buyer phone number is invalid. Contact the buyer before shipping.")
    recipient_email = shipment.recipient_email or order.buyer_email
    if not recipient_email or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", recipient_email):
        raise HTTPException(422, "Enter a valid recipient email for courier booking.")
    if not shipment.destination_address or len(shipment.destination_address.strip()) < 8:
        raise HTTPException(422, "Delivery address is incomplete")
    name_parts = (order.buyer_name or "Customer").strip().split(" ", 1)
    item_price = Decimal(str(item.get("unit_price", 0)))
    quantity = int(item.get("quantity") or 0)
    if quantity < 1 or item_price <= 0:
        raise HTTPException(422, "Marketplace item snapshot is incomplete")
    return {
        "order_id": shipment.reference, "order_date": (order.created_at or _now()).strftime("%Y-%m-%d %H:%M"),
        "pickup_location": shipment.pickup_location,
        "billing_customer_name": name_parts[0], "billing_last_name": name_parts[1] if len(name_parts) > 1 else "",
        "billing_address": shipment.destination_address.strip(),
        "billing_city": shipment.destination_city, "billing_state": shipment.destination_state,
        "billing_pincode": shipment.destination_pincode, "billing_country": "India",
        "billing_email": recipient_email, "billing_phone": phone,
        "shipping_is_billing": True,
        "order_items": [{"name": str(item.get("name", "Pottery item"))[:160], "sku": f"PCP-{shipment.product_id}", "units": quantity, "selling_price": float(item_price)}],
        "payment_method": "Prepaid", "sub_total": float(item_price * quantity),
        "length": float(shipment.length_cm), "breadth": float(shipment.breadth_cm),
        "height": float(shipment.height_cm), "weight": float(shipment.weight_kg),
    }


@router.post("/orders/{order_id}/items/{product_id}/create")
def create_shipment(order_id: int, product_id: int, data: CreateShipmentInput,
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order, item = _seller_guard(db, user, order_id, product_id)
    if str(order.payment_status or "").upper() != "PAID":
        raise HTTPException(409, "Shiprocket prepaid shipping requires a verified PAID marketplace order. Use manual delivery tracking for other payment arrangements.")
    if str(item.get("status") or "").upper() in {"DELIVERED", "CANCELLED"}:
        raise HTTPException(409, "This item cannot be shipped")
    seller_id = int(item["seller_id"])
    pickup = db.query(MarketplaceSellerPickup).filter(MarketplaceSellerPickup.seller_id == seller_id).first()
    if not pickup:
        raise HTTPException(409, "An administrator must assign this seller's registered Shiprocket pickup location first")
    existing = db.query(MarketplaceCourierShipment).filter_by(marketplace_order_id=order_id, product_id=product_id).first()
    if existing and existing.state != "READY_RETRY":
        raise HTTPException(409, "A courier shipment already exists for this item. Review or reconcile it rather than creating a duplicate.")
    # Fail quickly if credentials are absent, before reserving the remote order reference.
    _shiprocket_credentials()
    shipment = existing or MarketplaceCourierShipment(
        marketplace_order_id=order_id, product_id=product_id, seller_id=seller_id,
        reference=f"{order.tracking_number or f'PCP-{order_id}'}-{product_id}", created_at=_now(),
    )
    shipment.pickup_location = pickup.pickup_location
    shipment.destination_address = data.destination_address.strip()
    shipment.destination_city = data.destination_city.strip()
    shipment.destination_state = data.destination_state.strip()
    shipment.destination_pincode = data.destination_pincode
    shipment.recipient_email = data.recipient_email.strip() if data.recipient_email else None
    shipment.weight_kg = Decimal(str(data.weight_kg))
    shipment.length_cm = Decimal(str(data.length_cm))
    shipment.breadth_cm = Decimal(str(data.breadth_cm))
    shipment.height_cm = Decimal(str(data.height_cm))
    shipment.state = "CREATING"
    shipment.updated_at = _now()
    payload = _provider_create_payload(order, item, shipment)
    db.add(shipment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Courier booking is already in progress for this product")
    try:
        response = _remote("POST", "/orders/create/adhoc", payload)
        remote_order_id = _lookup(response, "order_id")
        remote_shipment_id = _lookup(response, "shipment_id")
        if not remote_order_id or not remote_shipment_id:
            raise HTTPException(502, "Shiprocket did not return an order ID and shipment ID. Check its dashboard before retrying.")
        shipment.shiprocket_order_id = str(remote_order_id)
        shipment.shiprocket_shipment_id = int(remote_shipment_id)
        shipment.state = "CREATED"
        shipment.updated_at = _now()
        _update_item_from_shipment(db, shipment)
        db.commit()
        return _view(shipment)
    except Exception as exc:
        db.rollback()
        shipment = db.query(MarketplaceCourierShipment).filter_by(marketplace_order_id=order_id, product_id=product_id).first()
        if shipment and not shipment.shiprocket_shipment_id:
            # A timeout can happen after the provider creates a remote order.
            # Never silently retry and accidentally double-book a parcel.
            shipment.state = "RECONCILE"
            shipment.last_error = str(exc.detail if isinstance(exc, HTTPException) else "Shiprocket booking needs reconciliation")[:500]
            shipment.updated_at = _now()
            db.commit()
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(502, "Shiprocket booking needs reconciliation in the Shiprocket dashboard")


class ReconcileInput(BaseModel):
    """Admin recovery after checking the real Shiprocket dashboard."""
    shiprocket_order_id: str | None = Field(default=None, max_length=100)
    shiprocket_shipment_id: int | None = Field(default=None, gt=0)
    awb_code: str | None = Field(default=None, max_length=120)
    courier_name: str | None = Field(default=None, max_length=120)
    confirmed_not_created: bool = False


@router.post("/orders/{order_id}/items/{product_id}/reconcile")
def reconcile_shipment(order_id: int, product_id: int, data: ReconcileInput,
                       user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_marketplace_admin(user, db):
        raise HTTPException(403, "Only marketplace administrators can reconcile courier bookings")
    _seller_guard(db, user, order_id, product_id)
    shipment = db.query(MarketplaceCourierShipment).filter_by(
        marketplace_order_id=order_id, product_id=product_id).first()
    if not shipment:
        raise HTTPException(404, "No courier booking to reconcile")
    if shipment.state not in {"RECONCILE", "AWB_REVIEW", "PICKUP_REVIEW", "READY_RETRY"}:
        raise HTTPException(409, "This shipment does not require manual reconciliation")
    if data.confirmed_not_created:
        if shipment.shiprocket_shipment_id or data.shiprocket_order_id or data.shiprocket_shipment_id:
            raise HTTPException(409, "Cannot reset a shipment already known to exist in Shiprocket")
        shipment.state = "READY_RETRY"
        shipment.last_error = None
    else:
        if shipment.state == "PICKUP_REVIEW" and shipment.awb_code:
            # The admin verifies pickup request status in the Shiprocket panel.
            shipment.state = "PICKUP_REQUESTED"
            shipment.pickup_status = "Confirmed in Shiprocket dashboard by administrator"
        elif data.shiprocket_order_id and data.shiprocket_shipment_id:
            shipment.shiprocket_order_id = data.shiprocket_order_id.strip()
            shipment.shiprocket_shipment_id = data.shiprocket_shipment_id
            shipment.awb_code = data.awb_code.strip() if data.awb_code else shipment.awb_code
            shipment.courier_name = data.courier_name.strip() if data.courier_name else shipment.courier_name
            shipment.state = "AWB_ASSIGNED" if shipment.awb_code else "CREATED"
        else:
            raise HTTPException(422, "Provide both Shiprocket IDs after verifying the order in the dashboard")
        shipment.last_error = None
    shipment.updated_at = _now()
    _update_item_from_shipment(db, shipment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Another local shipment already uses the specified Shiprocket identifier")
    return _view(shipment)


@router.get("/orders/{order_id}/items/{product_id}")
def shipment_detail(order_id: int, product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _seller_guard(db, user, order_id, product_id)
    shipment = db.query(MarketplaceCourierShipment).filter_by(marketplace_order_id=order_id, product_id=product_id).first()
    return _view(shipment) if shipment else {"state": "NOT_CREATED"}


@router.post("/orders/{order_id}/items/{product_id}/awb")
def assign_awb(order_id: int, product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _seller_guard(db, user, order_id, product_id)
    shipment = db.query(MarketplaceCourierShipment).filter_by(marketplace_order_id=order_id, product_id=product_id).first()
    if not shipment or not shipment.shiprocket_shipment_id:
        raise HTTPException(409, "Create a Shiprocket shipment before assigning an AWB")
    if shipment.awb_code:
        return _view(shipment)
    if shipment.state not in {"CREATED", "AWB_REVIEW"}:
        raise HTTPException(409, "Check the courier shipment state before assigning an AWB")
    # Assignment response may be lost; the provider might already have an AWB.
    # Reconcile via shipment tracking before issuing a fresh assignment.
    try:
        tracked = _remote("GET", f"/courier/track/shipment/{shipment.shiprocket_shipment_id}")
        existing_awb = _lookup(tracked, "awb_code")
    except HTTPException:
        existing_awb = None
    if existing_awb:
        shipment.awb_code = str(existing_awb)
        shipment.courier_name = str(_lookup(tracked, "courier_name") or "Shiprocket")[:120]
    else:
        try:
            response = _remote("POST", "/courier/assign/awb", {"shipment_id": shipment.shiprocket_shipment_id})
        except HTTPException:
            shipment.state = "AWB_REVIEW"
            db.commit()
            raise
        awb = _lookup(response, "awb_code")
        if not awb:
            shipment.state = "AWB_REVIEW"
            db.commit()
            raise HTTPException(502, "AWB not returned. Check Shiprocket dashboard before retrying.")
        shipment.awb_code = str(awb)
        shipment.courier_name = str(_lookup(response, "courier_name") or "Shiprocket")[:120]
    shipment.state = "AWB_ASSIGNED"
    shipment.updated_at = _now()
    _update_item_from_shipment(db, shipment)
    db.commit()
    return _view(shipment)


@router.post("/orders/{order_id}/items/{product_id}/pickup")
def request_pickup(order_id: int, product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _seller_guard(db, user, order_id, product_id)
    shipment = db.query(MarketplaceCourierShipment).filter_by(marketplace_order_id=order_id, product_id=product_id).first()
    if not shipment or not shipment.awb_code:
        raise HTTPException(409, "Assign an AWB before requesting pickup")
    if shipment.state in {"PICKUP_REQUESTED", "IN_TRANSIT", "DELIVERED"}:
        return _view(shipment)
    if shipment.state != "AWB_ASSIGNED":
        raise HTTPException(409, "Check pickup state in Shiprocket before resubmitting")
    try:
        response = _remote("POST", "/courier/generate/pickup", {"shipment_id": [shipment.shiprocket_shipment_id]})
    except HTTPException:
        shipment.state = "PICKUP_REVIEW"
        db.commit()
        raise
    shipment.pickup_status = str(_lookup(response, "pickup_status") or _lookup(response, "message") or "Requested")[:100]
    shipment.state = "PICKUP_REQUESTED"
    shipment.updated_at = _now()
    _update_item_from_shipment(db, shipment)
    db.commit()
    return _view(shipment)


def _sync_shipment(db, shipment):
    if not shipment.awb_code:
        raise HTTPException(409, "AWB must be assigned before tracking can be synchronized")
    data = _remote("GET", f"/courier/track/awb/{shipment.awb_code}")
    tracking = data.get("tracking_data", data) if isinstance(data, dict) else {}
    if isinstance(tracking, list):
        tracking = tracking[0] if tracking else {}
    if not isinstance(tracking, dict):
        tracking = {}
    # Provider may put current status in shipment_track[0] and scans in
    # shipment_track_activities. Historical entries are stored as actual scans.
    track = tracking.get("shipment_track") or []
    current = track[0] if isinstance(track, list) and track else {}
    if not isinstance(current, dict):
        current = {}
    status = current.get("current_status") or tracking.get("current_status") or tracking.get("shipment_status")
    scans = tracking.get("shipment_track_activities") or []
    if isinstance(scans, list):
        for scan in sorted(scans[-100:], key=lambda entry: str(entry.get("date") or entry.get("timestamp") or "") if isinstance(entry, dict) else ""):
            if isinstance(scan, dict):
                _save_courier_status(db, shipment,
                    scan.get("activity") or scan.get("status") or scan.get("sr-status-label") or status,
                    scan.get("location"), scan.get("date") or scan.get("timestamp"),
                    scan.get("activity") or scan.get("status") or status)
    if status:
        _save_courier_status(db, shipment, status,
            current.get("current_location") or tracking.get("current_location"),
            current.get("updated_time_stamp") or tracking.get("updated_time_stamp"), status)
    if not shipment.courier_name:
        shipment.courier_name = str(current.get("courier_name") or _lookup(data, "courier_name") or "Shiprocket")[:120]
    # Preserve a carrier-supplied estimate; never generate an invented ETA.
    eta = tracking.get("etd") or current.get("etd") or tracking.get("estimated_delivery_date")
    if isinstance(eta, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", eta[:10]):
        order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == shipment.marketplace_order_id).first()
        if order:
            items = [dict(item) for item in (order.items or [])]
            for item in items:
                if int(item.get("product_id", -1)) == shipment.product_id:
                    item["estimated_delivery"] = eta[:10]
            order.items = items
    shipment.last_synced_at = _now()
    shipment.updated_at = _now()
    _update_item_from_shipment(db, shipment)
    db.commit()
    return _view(shipment)


@router.post("/orders/{order_id}/items/{product_id}/sync")
def sync_shipment(order_id: int, product_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _seller_guard(db, user, order_id, product_id)
    shipment = db.query(MarketplaceCourierShipment).filter_by(marketplace_order_id=order_id, product_id=product_id).first()
    if not shipment:
        raise HTTPException(404, "Courier shipment not created")
    if shipment.last_synced_at and (_now().replace(tzinfo=None) - shipment.last_synced_at.replace(tzinfo=None)).total_seconds() < 60:
        return _view(shipment)
    return _sync_shipment(db, shipment)


@router.post("/sync-active")
def sync_active_shipments(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_marketplace_admin(user, db):
        raise HTTPException(403, "Only marketplace administrators can synchronize all courier shipments")
    shipments = db.query(MarketplaceCourierShipment).filter(
        MarketplaceCourierShipment.awb_code.isnot(None),
        MarketplaceCourierShipment.state.notin_(["DELIVERED", "RECONCILE"]),
    ).order_by(MarketplaceCourierShipment.last_synced_at.asc().nullsfirst()).limit(100).all()
    completed, failed = 0, 0
    for shipment in shipments:
        try:
            _sync_shipment(db, shipment)
            completed += 1
        except HTTPException:
            db.rollback()
            failed += 1
    return {"synced": completed, "failed": failed, "total_checked": len(shipments)}


@router.post("/webhook")
async def tracking_webhook(request: Request, x_api_key: str | None = Header(default=None), db: Session = Depends(get_db)):
    token = os.getenv("SHIPROCKET_WEBHOOK_TOKEN", "").strip()
    if len(token) < 16:
        raise HTTPException(503, "Courier webhook secret is not configured")
    if not x_api_key or not hmac.compare_digest(x_api_key, token):
        raise HTTPException(401, "Unauthorized webhook")
    body = await request.body()
    if len(body) > 256 * 1024:
        raise HTTPException(413, "Courier webhook payload too large")
    try:
        payload = json.loads(body)
    except (TypeError, ValueError):
        raise HTTPException(400, "Invalid courier webhook body")
    if not isinstance(payload, dict):
        raise HTTPException(400, "Invalid courier webhook event")
    awb = str(payload.get("awb") or payload.get("awb_code") or "").strip()
    shipment = db.query(MarketplaceCourierShipment).filter(MarketplaceCourierShipment.awb_code == awb).first() if awb else None
    if not shipment:
        return {"ok": True, "ignored": True}
    digest = hashlib.sha256(body).hexdigest()
    if db.query(MarketplaceCourierWebhook).filter_by(payload_hash=digest).first():
        return {"ok": True, "duplicate": True}
    status = payload.get("current_status") or payload.get("shipment_status") or payload.get("status")
    location = payload.get("current_location") or payload.get("location")
    when = payload.get("current_timestamp") or payload.get("updated_time_stamp") or payload.get("date")
    if status:
        _save_courier_status(db, shipment, status, location, when, payload.get("activity") or status)
        if payload.get("courier_name"):
            shipment.courier_name = str(payload["courier_name"])[:120]
        shipment.last_synced_at = _now()
        _update_item_from_shipment(db, shipment)
    db.add(MarketplaceCourierWebhook(payload_hash=digest, created_at=_now()))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"ok": True, "duplicate": True}
    return {"ok": True}


async def poll_courier_updates():
    """Optional single-process poller; webhook delivery is the primary update path.

    Enable only on ONE API worker (SHIPROCKET_POLL_ENABLED=1). Multiple workers
    should use one external scheduler calling the admin sync-active endpoint.
    """
    interval = max(300, int(os.getenv("SHIPROCKET_POLL_INTERVAL_SECONDS", "900")))
    while True:
        await asyncio.sleep(interval)
        if not os.getenv("SHIPROCKET_EMAIL") or not os.getenv("SHIPROCKET_PASSWORD"):
            continue
        await asyncio.to_thread(_poll_cycle)


def _poll_cycle():
    db = SessionLocal()
    try:
        shipments = db.query(MarketplaceCourierShipment).filter(
            MarketplaceCourierShipment.awb_code.isnot(None),
            MarketplaceCourierShipment.state.notin_(["DELIVERED", "RECONCILE"]),
        ).order_by(MarketplaceCourierShipment.last_synced_at.asc().nullsfirst()).limit(100).all()
        for shipment in shipments:
            try:
                _sync_shipment(db, shipment)
            except Exception:
                db.rollback()
    finally:
        db.close()
