"""Razorpay payments linked to real marketplace orders, including guest checkout.

This does not change the existing general-purpose /api/payments or finance workflows.
"""
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
import hashlib
import hmac
import json
import os
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user, user_has_any_permission
from app.database import get_db
from app.models import (
    FinancialTransaction, MarketplaceOrder, MarketplacePayment, MarketplacePaymentRefund,
    MarketplacePaymentWebhook, User,
)
from app.notifications import create_notification
from app.routers.finance import _razorpay_config, _razorpay_request
from app.routers.marketplace import _is_marketplace_admin, optional_current_user

router = APIRouter(prefix="/marketplace/payments", tags=["Marketplace payments"])


class PaymentAccess(BaseModel):
    order_id: int = Field(gt=0)
    access_key: str | None = Field(default=None, max_length=256)


class PaymentVerify(PaymentAccess):
    razorpay_order_id: str = Field(min_length=5, max_length=100)
    razorpay_payment_id: str = Field(min_length=5, max_length=100)
    razorpay_signature: str = Field(min_length=20, max_length=256)


class RefundInput(BaseModel):
    order_id: int = Field(gt=0)
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    reason: str = Field(min_length=5, max_length=500)


def _get_order(db: Session, order_id: int) -> MarketplaceOrder:
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Marketplace order not found")
    return order


def _authorize_order(db: Session, data: PaymentAccess, user: User | None) -> MarketplaceOrder:
    order = _get_order(db, data.order_id)
    if user and order.user_id == user.id:
        return order
    if data.access_key and order.tracking_access_hash:
        digest = hashlib.sha256(data.access_key.encode("utf-8")).hexdigest()
        if hmac.compare_digest(order.tracking_access_hash, digest):
            return order
    raise HTTPException(status_code=404, detail="Order not found. Sign in or enter its private tracking code.")


def _amount_paise(order: MarketplaceOrder) -> int:
    # Never trust a browser-supplied price; the stored checkout snapshot is authoritative.
    amount = Decimal(str(order.total_amount))
    paise = int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    if paise < 100 or paise > 999999999:
        raise HTTPException(status_code=422, detail="Order amount is outside the supported Razorpay payment range")
    return paise


def _public_status(order: MarketplaceOrder) -> dict:
    return {
        "order_id": order.id,
        "payment_status": order.payment_status or "UNPAID",
        "payment_reference": order.payment_reference,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "total_amount": float(order.total_amount),
        "currency": "INR",
    }


def _record_finance_receipt(db: Session, order: MarketplaceOrder, payment: MarketplacePayment) -> None:
    # Existing treasurer finance model requires a user; guest orders remain recorded
    # in the marketplace ledger, without inventing a user account.
    if not order.user_id or not payment.razorpay_payment_id:
        return
    if db.query(FinancialTransaction).filter(
        FinancialTransaction.transaction_reference == payment.razorpay_payment_id
    ).first():
        return
    now = datetime.now(timezone.utc)
    db.add(FinancialTransaction(
        public_reference=f"PAY-{now.year}-{secrets.token_hex(4).upper()}",
        user_id=order.user_id,
        payment_type="marketplace-order",
        amount=Decimal(payment.amount_paise) / Decimal(100),
        payer_name=(order.buyer_name or "Marketplace buyer")[:160],
        payer_email=order.buyer_email,
        transaction_reference=payment.razorpay_payment_id,
        source="MARKETPLACE_RAZORPAY_TEST" if os.getenv("RAZORPAY_TEST_MODE", "true").lower() in ("1", "true", "yes", "on") else "MARKETPLACE_RAZORPAY",
        status="VERIFIED",
        receipt_number=f"ACK-{now.year}-{secrets.token_hex(3).upper()}",
        reconciled=False,
        created_at=payment.paid_at or now,
        verified_at=now,
    ))


def _capture(db: Session, order: MarketplaceOrder, attempt: MarketplacePayment, payment_data: dict) -> bool:
    if (
        payment_data.get("order_id") != attempt.razorpay_order_id
        or payment_data.get("status") != "captured"
        or payment_data.get("currency") != "INR"
        or int(payment_data.get("amount") or -1) != attempt.amount_paise
        or attempt.amount_paise != _amount_paise(order)
        or not payment_data.get("id")
    ):
        raise HTTPException(status_code=409, detail="Razorpay payment is not captured or does not match this order")
    existing = db.query(MarketplacePayment).filter(
        MarketplacePayment.razorpay_payment_id == payment_data["id"],
    ).first()
    if existing and existing.id != attempt.id:
        raise HTTPException(status_code=409, detail="Payment reference belongs to another checkout attempt")
    if order.payment_status in {"PAID", "REFUND_PENDING", "PARTIALLY_REFUNDED", "REFUNDED"} and order.payment_reference != payment_data["id"]:
        # A separately captured second payment must be resolved manually; never
        # silently overwrite the first successful marketplace payment.
        raise HTTPException(status_code=409, detail="This order has a different recorded payment; contact support for a duplicate charge")
    first_capture = attempt.status != "CAPTURED" and order.payment_reference != payment_data["id"]
    now = datetime.now(timezone.utc)
    attempt.razorpay_payment_id = payment_data["id"]
    attempt.status = "CAPTURED"
    attempt.paid_at = attempt.paid_at or now
    attempt.updated_at = now
    order.payment_status = "PAID" if order.payment_status in (None, "UNPAID", "PAYMENT_FAILED") else order.payment_status
    order.payment_reference = payment_data["id"]
    order.paid_at = order.paid_at or now
    _record_finance_receipt(db, order, attempt)
    if first_capture:
        if order.user_id:
            create_notification(db, order.user_id, "Marketplace payment confirmed", f"Payment for order #{order.id} was verified by Razorpay.", "marketplace")
        seller_ids = {int(item["seller_id"]) for item in (order.items or []) if item.get("seller_id") is not None}
        for seller in db.query(User).filter(User.id.in_(seller_ids)).all() if seller_ids else []:
            if seller.id != order.user_id:
                create_notification(db, seller.id, "Marketplace order paid", f"Order #{order.id} has a verified online payment.", "marketplace")
    return first_capture


def _sync_refund_status(db: Session, order: MarketplaceOrder, payment: MarketplacePayment) -> None:
    refunds = db.query(MarketplacePaymentRefund).filter(
        MarketplacePaymentRefund.marketplace_payment_id == payment.id
    ).all()
    paid_back = sum(r.amount_paise for r in refunds if r.status == "PROCESSED")
    pending = any(r.status == "PENDING" for r in refunds)
    if paid_back >= payment.amount_paise:
        order.payment_status = "REFUNDED"
    elif pending:
        order.payment_status = "REFUND_PENDING"
    elif paid_back > 0:
        order.payment_status = "PARTIALLY_REFUNDED"
    else:
        order.payment_status = "PAID"


def _update_refund(db: Session, payment: MarketplacePayment, data: dict, admin_id: int | None = None, reason: str | None = None) -> MarketplacePaymentRefund:
    refund_id = data.get("id")
    if not refund_id or data.get("payment_id") != payment.razorpay_payment_id:
        raise HTTPException(status_code=409, detail="Refund does not match the marketplace payment")
    amount = int(data.get("amount") or 0)
    if amount <= 0 or amount > payment.amount_paise:
        raise HTTPException(status_code=409, detail="Invalid refund amount returned by Razorpay")
    provider_status = str(data.get("status") or "pending").lower()
    new_status = "PROCESSED" if provider_status == "processed" else "FAILED" if provider_status == "failed" else "PENDING"
    refund = db.query(MarketplacePaymentRefund).filter(
        MarketplacePaymentRefund.razorpay_refund_id == refund_id
    ).first()
    now = datetime.now(timezone.utc)
    if refund:
        if refund.marketplace_payment_id != payment.id or refund.amount_paise != amount:
            raise HTTPException(status_code=409, detail="Conflicting Razorpay refund reference")
        # A delayed failed/pending webhook must never undo a processed refund.
        if refund.status == "PROCESSED" and new_status != "PROCESSED":
            new_status = "PROCESSED"
        refund.status = new_status
        refund.updated_at = now
    else:
        refund = MarketplacePaymentRefund(
            marketplace_payment_id=payment.id, razorpay_refund_id=refund_id,
            amount_paise=amount, status=new_status, reason=reason,
            created_by_id=admin_id, created_at=now, updated_at=now,
        )
        db.add(refund)
    db.flush()
    order = _get_order(db, payment.marketplace_order_id)
    old = order.payment_status
    _sync_refund_status(db, order, payment)
    if old != order.payment_status and order.user_id:
        create_notification(db, order.user_id, "Marketplace refund status updated", f"Refund for order #{order.id}: {order.payment_status.replace('_', ' ').title()}.", "marketplace")
    return refund


@router.post("/create-order")
def create_payment_order(data: PaymentAccess, user: User | None = Depends(optional_current_user), db: Session = Depends(get_db)):
    order = _authorize_order(db, data, user)
    if order.payment_status not in {None, "UNPAID", "PAYMENT_FAILED"}:
        raise HTTPException(status_code=409, detail="This order already has a payment or refund in progress")
    if order.status in {"CANCELLED", "DELIVERED"}:
        raise HTTPException(status_code=409, detail="This order is no longer eligible for online payment")
    if any(item.get("status") == "CANCELLED" for item in (order.items or [])):
        raise HTTPException(status_code=409, detail="One or more products were cancelled. Contact the seller before paying the original full amount.")
    amount = _amount_paise(order)
    key_id, key_secret, test_mode = _razorpay_config()
    result = _razorpay_request("POST", "/orders", key_id, key_secret, {
        "amount": amount, "currency": "INR",
        "receipt": f"MKT-{order.id}-{secrets.token_hex(5)}",
        "notes": {"marketplace_order_id": str(order.id), "purpose": "marketplace-order", "mode": "test" if test_mode else "live"},
    })
    if not result.get("id") or int(result.get("amount") or -1) != amount or result.get("currency") != "INR":
        raise HTTPException(status_code=502, detail="Razorpay returned an invalid order amount")
    db.add(MarketplacePayment(
        marketplace_order_id=order.id, razorpay_order_id=result["id"],
        amount_paise=amount, currency="INR", status="CREATED",
        created_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc),
    ))
    db.commit()
    return {"keyId": key_id, "razorpayOrderId": result["id"], "amount": amount, "currency": "INR", "testMode": test_mode, "marketplaceOrderId": order.id}


@router.post("/verify")
def verify_payment(data: PaymentVerify, user: User | None = Depends(optional_current_user), db: Session = Depends(get_db)):
    order = _authorize_order(db, data, user)
    attempt = db.query(MarketplacePayment).filter(
        MarketplacePayment.marketplace_order_id == order.id,
        MarketplacePayment.razorpay_order_id == data.razorpay_order_id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Razorpay order is not linked to this marketplace order")
    key_id, key_secret, _ = _razorpay_config()
    signed = f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode("utf-8")
    expected = hmac.new(key_secret.encode("utf-8"), signed, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, data.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature")
    razorpay_order = _razorpay_request("GET", f"/orders/{data.razorpay_order_id}", key_id, key_secret)
    if int(razorpay_order.get("amount") or -1) != attempt.amount_paise or razorpay_order.get("currency") != "INR" or razorpay_order.get("status") != "paid":
        raise HTTPException(status_code=409, detail="Razorpay has not confirmed this order as paid")
    captured = _razorpay_request("GET", f"/payments/{data.razorpay_payment_id}", key_id, key_secret)
    _capture(db, order, attempt, captured)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Payment reference has already been recorded")
    db.refresh(order)
    return {"verified": True, **_public_status(order)}


@router.post("/status")
def get_payment_status(data: PaymentAccess, user: User | None = Depends(optional_current_user), db: Session = Depends(get_db)):
    order = _authorize_order(db, data, user)
    return _public_status(order)


@router.post("/refund")
def create_refund(data: RefundInput, admin: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Refund initiation is restricted to finance-authorized marketplace admins.
    if not _is_marketplace_admin(admin, db) or not user_has_any_permission(admin, ("finance.manage",), db):
        raise HTTPException(status_code=403, detail="Only authorized marketplace finance administrators can issue refunds")
    order = _get_order(db, data.order_id)
    if order.payment_status not in {"PAID", "PARTIALLY_REFUNDED"} or not order.payment_reference:
        raise HTTPException(status_code=409, detail="This order does not have a refundable captured payment")
    payment = db.query(MarketplacePayment).filter(
        MarketplacePayment.marketplace_order_id == order.id,
        MarketplacePayment.razorpay_payment_id == order.payment_reference,
        MarketplacePayment.status == "CAPTURED",
    ).first()
    if not payment:
        raise HTTPException(status_code=409, detail="No captured marketplace payment is recorded")
    refunds = db.query(MarketplacePaymentRefund).filter(
        MarketplacePaymentRefund.marketplace_payment_id == payment.id
    ).all()
    if any(r.status == "PENDING" for r in refunds):
        raise HTTPException(status_code=409, detail="A refund is already pending for this payment")
    remaining = payment.amount_paise - sum(r.amount_paise for r in refunds if r.status == "PROCESSED")
    amount = int((data.amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP)) if data.amount else remaining
    if amount < 100 or amount > remaining:
        raise HTTPException(status_code=422, detail="Refund amount must be at least ₹1 and no greater than the unrefunded balance")
    key_id, key_secret, _ = _razorpay_config()
    response = _razorpay_request("POST", f"/payments/{payment.razorpay_payment_id}/refund", key_id, key_secret, {
        "amount": amount,
        "notes": {"marketplace_order_id": str(order.id), "reason": data.reason.strip()[:200]},
        # Stable receipt prevents accidentally issuing a second refund if the
        # provider succeeded but the server did not persist its first response.
        "receipt": f"MKT-RFD-{order.id}-{payment.id}-{remaining}",
    })
    refund = _update_refund(db, payment, response, admin.id, data.reason.strip())
    db.commit()
    return {"order_id": order.id, "refund_reference": refund.razorpay_refund_id, "refund_status": refund.status, "payment_status": order.payment_status}


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db), signature: str | None = Header(None, alias="X-Razorpay-Signature")):
    secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "").strip()
    if not secret:
        raise HTTPException(status_code=503, detail="Razorpay webhook secret is not configured")
    # Reject oversized requests as they stream in, before storing an unbounded
    # body in memory. Genuine Razorpay webhook events are far smaller than 1 MB.
    limit = 1024 * 1024
    data = bytearray()
    async for chunk in request.stream():
        if len(data) + len(chunk) > limit:
            raise HTTPException(status_code=413, detail="Razorpay webhook payload is too large")
        data.extend(chunk)
    body = bytes(data)
    if not signature or not hmac.compare_digest(hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest(), signature):
        raise HTTPException(status_code=400, detail="Invalid Razorpay webhook signature")
    try:
        payload = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid webhook JSON")
    event_type = payload.get("event")
    if event_type not in {"payment.captured", "refund.processed", "refund.failed"}:
        return {"ok": True, "ignored": True}
    event_id = (request.headers.get("X-Razorpay-Event-Id") or hashlib.sha256(body).hexdigest())[:128]
    if db.query(MarketplacePaymentWebhook).filter(MarketplacePaymentWebhook.event_id == event_id).first():
        return {"ok": True, "duplicate": True}
    entity_kind = "payment" if event_type == "payment.captured" else "refund"
    entity = (((payload.get("payload") or {}).get(entity_kind) or {}).get("entity") or {})
    if event_type == "payment.captured":
        attempt = db.query(MarketplacePayment).filter(MarketplacePayment.razorpay_order_id == entity.get("order_id")).first()
        if not attempt:
            return {"ok": True, "ignored": True}
        order = _get_order(db, attempt.marketplace_order_id)
        _capture(db, order, attempt, entity)
    else:
        payment = db.query(MarketplacePayment).filter(MarketplacePayment.razorpay_payment_id == entity.get("payment_id")).first()
        if not payment:
            return {"ok": True, "ignored": True}
        _update_refund(db, payment, entity)
    db.add(MarketplacePaymentWebhook(event_id=event_id, event_type=event_type, created_at=datetime.now(timezone.utc)))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return {"ok": True, "duplicate": True}
    return {"ok": True}
