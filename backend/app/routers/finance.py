from datetime import datetime, timezone
from decimal import Decimal
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission, user_has_any_permission
from app.database import get_db
from app.models import FinancePolicy, FinancialRefund, FinancialTransaction, Role, User
from app.notifications import create_notification


router = APIRouter(prefix="/finance", tags=["Treasurer finance"])
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
