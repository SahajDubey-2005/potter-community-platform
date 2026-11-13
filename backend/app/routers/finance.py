from datetime import datetime, timezone
import time
from decimal import Decimal
import hashlib
import hmac
import os
import secrets
import string

import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission, user_has_any_permission
from app.database import get_db
from app.models import FinancePolicy, FinancialRefund, FinancialTransaction, Role, User
from app.notifications import create_notification


router = APIRouter(prefix="/finance", tags=["Treasurer finance"])
payments_router = APIRouter(prefix="/api/payments", tags=["Razorpay payments"])
PAYMENT_TYPES = {"membership-registration", "membership-renewal", "marketplace-order", "donation", "event-fee"}


class FinancePolicyInput(BaseModel):
    registration_fee: Decimal | None = Field(default=None, ge=0, le=99999999)
    renewal_fee: Decimal | None = Field(default=None, ge=0, le=99999999)
    event_fee: Decimal | None = Field(default=None, ge=0, le=99999999)


class TransactionInput(BaseModel):
    payment_type: str
    amount: Decimal = Field(gt=0, le=99999999)
    payer_name: str = Field(min_length=2, max_length=160)
    payer_email: EmailStr | None = None
    transaction_reference: str = Field(min_length=3, max_length=160)


class RefundInput(BaseModel):
    amount: Decimal = Field(gt=0)
    reason: str = Field(min_length=3, max_length=1000)


class RefundDecision(BaseModel):
    decision: str
    remark: str | None = Field(default=None, max_length=1000)


class RazorpayOrderInput(BaseModel):
    paymentType: str
    amount: Decimal = Field(gt=0, le=99999999)
    payerName: str = Field(min_length=2, max_length=160)
    payerEmail: EmailStr | None = None


class RazorpayVerificationInput(BaseModel):
    razorpay_order_id: str = Field(min_length=5, max_length=100)
    razorpay_payment_id: str = Field(min_length=5, max_length=100)
    razorpay_signature: str = Field(min_length=20, max_length=256)


class RazorpayUpiQrInput(BaseModel):
    paymentType: str
    amount: Decimal = Field(gt=0, le=99999999)
    payerName: str = Field(min_length=2, max_length=160)
    payerEmail: EmailStr | None = None


def _razorpay_config():
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    test_mode = os.getenv("RAZORPAY_TEST_MODE", "true").strip().lower() in {"1", "true", "yes", "on"}
    if not key_id or not key_secret:
        raise HTTPException(status_code=503, detail="Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the backend environment.")
    if test_mode and not key_id.startswith("rzp_test_"):
        raise HTTPException(status_code=503, detail="Razorpay test mode is enabled, but the configured key is not a test key. Use an rzp_test_ key ID.")
    if not test_mode and key_id.startswith("rzp_test_"):
        raise HTTPException(status_code=503, detail="Live mode is selected but a Razorpay test key is configured.")
    return key_id, key_secret, test_mode


def _razorpay_request(method: str, path: str, key_id: str, key_secret: str, payload: dict | None = None):
    try:
        response = httpx.request(
            method,
            f"https://api.razorpay.com/v1{path}",
            auth=(key_id, key_secret),
            json=payload,
            timeout=20.0,
        )
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not connect to Razorpay. Please retry in a moment.")
    try:
        body = response.json()
    except ValueError:
        body = {}
    if response.is_error:
        description = body.get("error", {}).get("description") if isinstance(body, dict) else None
        raise HTTPException(status_code=502, detail=description or "Razorpay could not process the request.")
    return body


@payments_router.post("/create-order")
def create_razorpay_order(
    data: RazorpayOrderInput,
    current_user: User = Depends(get_current_user),
):
    payment_type = data.paymentType.strip()
    if payment_type not in PAYMENT_TYPES:
        raise HTTPException(status_code=422, detail="Select a valid payment type")
    key_id, key_secret, test_mode = _razorpay_config()
    amount = int((data.amount * 100).quantize(Decimal("1")))
    if amount < 100:
        raise HTTPException(status_code=422, detail="The minimum Razorpay payment amount is ₹1.")
    order = _razorpay_request("POST", "/orders", key_id, key_secret, {
        "amount": amount,
        "currency": "INR",
        "receipt": f"POT-{secrets.token_hex(8).upper()}",
        "notes": {
            "user_id": str(current_user.id),
            "payment_type": payment_type,
            "payer_name": data.payerName.strip(),
            "payer_email": str(data.payerEmail).lower() if data.payerEmail else "",
            "environment": "test" if test_mode else "live",
        },
    })
    if not order.get("id") or not order.get("amount"):
        raise HTTPException(status_code=502, detail="Razorpay returned an incomplete order response.")
    return {
        "keyId": key_id,
        "orderId": order["id"],
        "amount": order["amount"],
        "currency": order.get("currency", "INR"),
        "testMode": test_mode,
    }


@payments_router.post("/verify")
def verify_razorpay_payment(
    data: RazorpayVerificationInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    key_id, key_secret, test_mode = _razorpay_config()
    signed_payload = f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(key_secret.encode("utf-8"), signed_payload, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_signature, data.razorpay_signature):
        raise HTTPException(status_code=400, detail="Razorpay payment signature verification failed.")

    order = _razorpay_request("GET", f"/orders/{data.razorpay_order_id}", key_id, key_secret)
    notes = order.get("notes") or {}
    if str(notes.get("user_id", "")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="This payment order does not belong to the signed-in account.")

    payment = _razorpay_request("GET", f"/payments/{data.razorpay_payment_id}", key_id, key_secret)
    if payment.get("order_id") != data.razorpay_order_id:
        raise HTTPException(status_code=400, detail="The payment does not match the supplied order.")
    if payment.get("status") != "captured":
        raise HTTPException(status_code=409, detail=f"Payment is not captured yet (current status: {payment.get('status', 'unknown')}).")
    if int(payment.get("amount", 0)) != int(order.get("amount", -1)) or payment.get("currency") != "INR":
        raise HTTPException(status_code=400, detail="The captured payment amount does not match the order.")

    existing = db.query(FinancialTransaction).filter(
        FinancialTransaction.transaction_reference == data.razorpay_payment_id
    ).first()
    if existing:
        if existing.user_id != current_user.id:
            raise HTTPException(status_code=409, detail="This payment is already associated with another account.")
        row = existing
    else:
        now = datetime.now(timezone.utc)
        amount_rupees = (Decimal(str(payment["amount"])) / Decimal("100")).quantize(Decimal("0.01"))
        row = FinancialTransaction(
            public_reference=f"PAY-{now.year}-{secrets.token_hex(4).upper()}",
            user_id=current_user.id,
            payment_type=notes.get("payment_type", "donation"),
            amount=amount_rupees,
            payer_name=(notes.get("payer_name") or "Community member")[:160],
            payer_email=(notes.get("payer_email") or None),
            transaction_reference=data.razorpay_payment_id,
            source="RAZORPAY_TEST" if test_mode else "RAZORPAY",
            status="VERIFIED",
            receipt_number=f"ACK-{now.year}-{secrets.token_hex(3).upper()}",
            reconciled=False,
            verified_at=now,
            created_at=datetime.fromtimestamp(int(payment.get("created_at", now.timestamp())), timezone.utc),
        )
        db.add(row)
        try:
            db.commit()
            db.refresh(row)
        except IntegrityError:
            db.rollback()
            row = db.query(FinancialTransaction).filter(
                FinancialTransaction.transaction_reference == data.razorpay_payment_id,
                FinancialTransaction.user_id == current_user.id,
            ).first()
            if row is None:
                raise HTTPException(status_code=409, detail="This payment reference has already been recorded.")

    return {
        "verified": True,
        "paymentStatus": payment.get("status"),
        "transactionReference": row.transaction_reference,
        "recordId": row.public_reference,
        "amount": float(row.amount),
        "receiptNumber": row.receipt_number,
        "paidAt": row.created_at.isoformat(),
    }



@payments_router.post("/create-upi-qr")
def create_razorpay_upi_qr(
    data: RazorpayUpiQrInput,
    current_user: User = Depends(get_current_user),
):
    """Create a single-use, fixed-amount Razorpay UPI QR for the signed-in user."""
    payment_type = data.paymentType.strip()
    if payment_type not in PAYMENT_TYPES:
        raise HTTPException(status_code=422, detail="Select a valid payment type")
    key_id, key_secret, test_mode = _razorpay_config()
    amount = int((data.amount * 100).quantize(Decimal("1")))
    if amount < 100:
        raise HTTPException(status_code=422, detail="The minimum Razorpay payment amount is ₹1.")
    expires_at = int(time.time()) + (15 * 60)
    qr = _razorpay_request("POST", "/payments/qr_codes", key_id, key_secret, {
        "type": "upi_qr",
        "name": "Potter Community",
        "usage": "single_use",
        "fixed_amount": True,
        "payment_amount": amount,
        "description": f"Potter Community - {payment_type}"[:255],
        "close_by": expires_at,
        "notes": {
            "user_id": str(current_user.id),
            "payment_type": payment_type,
            "payer_name": data.payerName.strip(),
            "payer_email": str(data.payerEmail).lower() if data.payerEmail else "",
            "environment": "test" if test_mode else "live",
        },
    })
    if not qr.get("id") or not qr.get("image_url"):
        raise HTTPException(status_code=502, detail="Razorpay did not return a QR image. Check QR Code API access in your Razorpay account.")
    return {
        "qrCodeId": qr["id"],
        "imageUrl": qr["image_url"],
        "amount": float(data.amount),
        "currency": qr.get("currency", "INR"),
        "expiresAt": datetime.fromtimestamp(expires_at, timezone.utc).isoformat(),
        "testMode": test_mode,
    }


@payments_router.get("/upi-qr/{qr_id}/status")
def check_razorpay_upi_qr_status(
    qr_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Check Razorpay's QR payment collection and record only captured payments."""
    key_id, key_secret, test_mode = _razorpay_config()
    qr = _razorpay_request("GET", f"/payments/qr_codes/{qr_id}", key_id, key_secret)
    notes = qr.get("notes") or {}
    if str(notes.get("user_id", "")) != str(current_user.id):
        raise HTTPException(status_code=403, detail="This UPI QR does not belong to the signed-in account.")

    collection = _razorpay_request("GET", f"/payments/qr_codes/{qr_id}/payments", key_id, key_secret)
    items = collection.get("items") or []
    captured = next((item for item in items if item.get("status") == "captured" and item.get("captured") is True), None)
    if captured is None:
        return {"verified": False, "paymentStatus": "pending", "message": "No captured payment has been received for this QR yet."}

    expected_amount = int(qr.get("payment_amount") or 0)
    if int(captured.get("amount", -1)) != expected_amount or captured.get("currency") != "INR":
        raise HTTPException(status_code=400, detail="The captured UPI payment amount does not match this QR code.")

    payment_id = captured.get("id")
    if not payment_id:
        raise HTTPException(status_code=502, detail="Razorpay returned a captured QR payment without a payment ID.")
    existing = db.query(FinancialTransaction).filter(
        FinancialTransaction.transaction_reference == payment_id
    ).first()
    if existing:
        if existing.user_id != current_user.id:
            raise HTTPException(status_code=409, detail="This payment is already associated with another account.")
        row = existing
    else:
        now = datetime.now(timezone.utc)
        amount_rupees = (Decimal(str(captured["amount"])) / Decimal("100")).quantize(Decimal("0.01"))
        row = FinancialTransaction(
            public_reference=f"PAY-{now.year}-{secrets.token_hex(4).upper()}",
            user_id=current_user.id,
            payment_type=notes.get("payment_type", "donation"),
            amount=amount_rupees,
            payer_name=(notes.get("payer_name") or "Community member")[:160],
            payer_email=(notes.get("payer_email") or None),
            transaction_reference=payment_id,
            source="RAZORPAY_TEST_UPI_QR" if test_mode else "RAZORPAY_UPI_QR",
            status="VERIFIED",
            receipt_number=f"ACK-{now.year}-{secrets.token_hex(3).upper()}",
            reconciled=False,
            verified_at=now,
            created_at=datetime.fromtimestamp(int(captured.get("created_at", now.timestamp())), timezone.utc),
        )
        db.add(row)
        try:
            db.commit()
            db.refresh(row)
        except IntegrityError:
            db.rollback()
            row = db.query(FinancialTransaction).filter(
                FinancialTransaction.transaction_reference == payment_id,
                FinancialTransaction.user_id == current_user.id,
            ).first()
            if row is None:
                raise HTTPException(status_code=409, detail="This QR payment has already been recorded.")

    return {
        "verified": True,
        "paymentStatus": "captured",
        "transactionReference": row.transaction_reference,
        "recordId": row.public_reference,
        "amount": float(row.amount),
        "receiptNumber": row.receipt_number,
        "paidAt": row.created_at.isoformat(),
    }

def _policy(db: Session) -> FinancePolicy:
    policy = db.query(FinancePolicy).filter(FinancePolicy.id == 1).first()
    if policy is None:
        policy = FinancePolicy(id=1, updated_at=datetime.now(timezone.utc))
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy


def _transaction_out(row: FinancialTransaction) -> dict:
    return {
        "id": row.public_reference,
        "user_id": row.user_id,
        "type": row.payment_type,
        "amount": float(row.amount),
        "payerName": row.payer_name,
        "payerEmail": row.payer_email or "",
        "transactionReference": row.transaction_reference,
        "status": {"PENDING_VERIFICATION": "Pending verification", "VERIFIED": "Verified", "REJECTED": "Rejected"}.get(row.status, row.status),
        "receiptNumber": row.receipt_number,
        "createdAt": row.created_at.isoformat(),
        "reconciled": row.reconciled,
        "verifiedAt": row.verified_at.isoformat() if row.verified_at else None,
        "source": row.source,
    }


def _refund_out(row: FinancialRefund, transaction: FinancialTransaction) -> dict:
    return {
        "id": row.public_reference,
        "paymentId": transaction.public_reference,
        "transactionReference": transaction.transaction_reference,
        "amount": float(row.amount),
        "reason": row.reason,
        "status": {"REQUESTED": "Requested", "APPROVED": "Approved for processing", "REJECTED": "Rejected", "REFUNDED": "Refunded"}.get(row.status, row.status),
        "createdAt": row.created_at.isoformat(),
        "updatedAt": row.updated_at.isoformat(),
    }


@router.get("/policy")
def get_finance_policy(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    policy = _policy(db)
    return {
        "registration_fee": float(policy.registration_fee) if policy.registration_fee is not None else None,
        "renewal_fee": float(policy.renewal_fee) if policy.renewal_fee is not None else None,
        "event_fee": float(policy.event_fee) if policy.event_fee is not None else None,
        "updated_at": policy.updated_at.isoformat(),
    }


@router.put("/policy")
def update_finance_policy(
    data: FinancePolicyInput,
    current_user: User = Depends(require_permission("finance.manage")),
    db: Session = Depends(get_db),
):
    policy = _policy(db)
    policy.registration_fee = data.registration_fee
    policy.renewal_fee = data.renewal_fee
    policy.event_fee = data.event_fee
    policy.updated_by_id = current_user.id
    policy.updated_at = datetime.now(timezone.utc)
    db.commit()
    return get_finance_policy(current_user, db)


@router.get("/transactions")
def list_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FinancialTransaction)
    if not user_has_any_permission(current_user, ("finance.manage",), db):
        query = query.filter(FinancialTransaction.user_id == current_user.id)
    rows = query.order_by(FinancialTransaction.created_at.desc()).limit(500).all()
    return [_transaction_out(row) for row in rows]


@router.post("/transactions", status_code=status.HTTP_201_CREATED)
def create_transaction(
    data: TransactionInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment_type = data.payment_type.strip()
    transaction_reference = data.transaction_reference.strip()
    if payment_type not in PAYMENT_TYPES:
        raise HTTPException(status_code=422, detail="Select a valid payment type")
    if db.query(FinancialTransaction.id).filter(FinancialTransaction.transaction_reference == transaction_reference).first():
        raise HTTPException(status_code=409, detail="That transaction reference has already been submitted")
    now = datetime.now(timezone.utc)
    public_reference = f"PAY-{now.year}-{secrets.token_hex(4).upper()}"
    row = FinancialTransaction(
        public_reference=public_reference,
        user_id=current_user.id,
        payment_type=payment_type,
        amount=data.amount.quantize(Decimal("0.01")),
        payer_name=data.payer_name.strip(),
        payer_email=str(data.payer_email).lower() if data.payer_email else None,
        transaction_reference=transaction_reference,
        source="OFFLINE_REFERENCE",
        status="PENDING_VERIFICATION",
        receipt_number=f"ACK-{now.year}-{secrets.token_hex(3).upper()}",
        reconciled=False,
        created_at=now,
    )
    db.add(row)
    try:
        db.flush()
        treasurers = db.query(User).join(Role, User.role_id == Role.id).filter(
            User.is_active.is_(True),
            Role.name.in_(["Treasurer", "ADMIN"]),
        ).all()
        for treasurer in treasurers:
            create_notification(db, treasurer.id, "Payment reference awaiting review", f"{row.payer_name} submitted a {row.payment_type.replace('-', ' ')} transaction reference.", "finance")
        db.commit()
        db.refresh(row)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That transaction reference has already been submitted")
    return _transaction_out(row)


@router.patch("/transactions/{public_reference}/verify")
def verify_transaction(
    public_reference: str,
    current_user: User = Depends(require_permission("finance.manage")),
    db: Session = Depends(get_db),
):
    row = db.query(FinancialTransaction).filter(FinancialTransaction.public_reference == public_reference).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Payment record not found")
    if row.status != "PENDING_VERIFICATION":
        raise HTTPException(status_code=409, detail="Only pending payment records can be verified")
    row.status = "VERIFIED"
    row.verified_by_id = current_user.id
    row.verified_at = datetime.now(timezone.utc)
    create_notification(db, row.user_id, "Payment record verified", f"Your payment record {row.public_reference} has been verified.", "finance")
    db.commit()
    return _transaction_out(row)


@router.patch("/transactions/{public_reference}/reconcile")
def reconcile_transaction(
    public_reference: str,
    current_user: User = Depends(require_permission("finance.manage")),
    db: Session = Depends(get_db),
):
    row = db.query(FinancialTransaction).filter(FinancialTransaction.public_reference == public_reference).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Payment record not found")
    if row.status != "VERIFIED":
        raise HTTPException(status_code=409, detail="Verify the payment before reconciliation")
    row.reconciled = True
    row.reconciled_by_id = current_user.id
    row.reconciled_at = datetime.now(timezone.utc)
    db.commit()
    return _transaction_out(row)


@router.get("/refunds")
def list_refunds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(FinancialRefund, FinancialTransaction).join(FinancialTransaction, FinancialTransaction.id == FinancialRefund.transaction_id)
    if not user_has_any_permission(current_user, ("finance.manage", "community.approve"), db):
        query = query.filter(FinancialTransaction.user_id == current_user.id)
    return [_refund_out(refund, transaction) for refund, transaction in query.order_by(FinancialRefund.created_at.desc()).limit(500).all()]


@router.post("/transactions/{public_reference}/refunds", status_code=status.HTTP_201_CREATED)
def request_refund(
    public_reference: str,
    data: RefundInput,
    current_user: User = Depends(require_permission("finance.manage")),
    db: Session = Depends(get_db),
):
    transaction = db.query(FinancialTransaction).filter(FinancialTransaction.public_reference == public_reference).first()
    if transaction is None:
        raise HTTPException(status_code=404, detail="Payment record not found")
    if transaction.status != "VERIFIED":
        raise HTTPException(status_code=409, detail="Only verified payments can be considered for a refund")
    previous_refunds = db.query(FinancialRefund).filter(FinancialRefund.transaction_id == transaction.id, FinancialRefund.status != "REJECTED").all()
    if sum((Decimal(str(refund.amount)) for refund in previous_refunds), Decimal("0")) + data.amount > Decimal(str(transaction.amount)):
        raise HTTPException(status_code=409, detail="Refund amount exceeds the verified payment amount")
    now = datetime.now(timezone.utc)
    refund = FinancialRefund(
        public_reference=f"RFD-{now.year}-{secrets.token_hex(4).upper()}",
        transaction_id=transaction.id,
        amount=data.amount.quantize(Decimal("0.01")),
        reason=data.reason.strip(),
        status="REQUESTED",
        created_by_id=current_user.id,
        created_at=now,
        updated_at=now,
    )
    db.add(refund)
    db.flush()
    presidents = db.query(User).join(Role, User.role_id == Role.id).filter(
        User.is_active.is_(True),
        Role.name == "President / Head",
    ).all()
    for president in presidents:
        create_notification(db, president.id, "Refund request awaiting approval", f"Refund request {refund.public_reference} needs your decision.", "finance")
    db.commit()
    db.refresh(refund)
    return _refund_out(refund, transaction)


@router.patch("/refunds/{public_reference}/decision")
def decide_refund(
    public_reference: str,
    data: RefundDecision,
    current_user: User = Depends(require_permission("community.approve")),
    db: Session = Depends(get_db),
):
    refund = db.query(FinancialRefund).filter(FinancialRefund.public_reference == public_reference).first()
    if refund is None:
        raise HTTPException(status_code=404, detail="Refund request not found")
    if refund.status != "REQUESTED" or data.decision not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=409, detail="This refund request cannot be decided")
    if data.decision == "REJECTED" and not (data.remark or "").strip():
        raise HTTPException(status_code=422, detail="Give a reason when rejecting a refund")
    refund.status = data.decision
    refund.reason = f"{refund.reason}\nDecision: {data.remark.strip()}" if data.remark else refund.reason
    refund.updated_at = datetime.now(timezone.utc)
    create_notification(db, refund.created_by_id, "Refund request reviewed", f"Refund request {refund.public_reference} was {data.decision.lower()}.", "finance")
    db.commit()
    transaction = db.query(FinancialTransaction).filter(FinancialTransaction.id == refund.transaction_id).first()
    return _refund_out(refund, transaction)


@router.patch("/refunds/{public_reference}/processed")
def mark_refund_processed(
    public_reference: str,
    current_user: User = Depends(require_permission("finance.manage")),
    db: Session = Depends(get_db),
):
    refund = db.query(FinancialRefund).filter(FinancialRefund.public_reference == public_reference).first()
    if refund is None:
        raise HTTPException(status_code=404, detail="Refund request not found")
    if refund.status != "APPROVED":
        raise HTTPException(status_code=409, detail="A President-approved refund is required before recording payment")
    refund.status = "REFUNDED"
    refund.updated_at = datetime.now(timezone.utc)
    create_notification(db, refund.created_by_id, "Refund processed", f"Refund request {refund.public_reference} is recorded as processed.", "finance")
    db.commit()
    transaction = db.query(FinancialTransaction).filter(FinancialTransaction.id == refund.transaction_id).first()
    return _refund_out(refund, transaction)
