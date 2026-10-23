from datetime import datetime, timezone
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, user_has_any_permission
from app.database import get_db
from app.models import EmergencyRequest, User
from app.notifications import create_notification


router = APIRouter(prefix="/emergency", tags=["Emergency support"])
EMERGENCY_TYPES = {"Medical Emergency", "Accident", "Blood Requirement", "Other Emergency"}


class EmergencyRequestCreate(BaseModel):
    emergency_type: str = Field(min_length=3, max_length=80)
    description: str = Field(min_length=10, max_length=3000)
    location: str = Field(min_length=3, max_length=500)
    contact_phone: str | None = Field(default=None, max_length=20)


class EmergencyRequestReview(BaseModel):
    status: str = Field(pattern="^(ACKNOWLEDGED|RESOLVED|REJECTED)$")
    review_note: str | None = Field(default=None, max_length=1000)


def can_manage_emergency(user: User, db: Session) -> bool:
    return user_has_any_permission(user, ("emergency.manage",), db)


def serialize_request(row: EmergencyRequest, member_name: str | None = None) -> dict:
    return {
        "id": row.id,
        "user_id": row.user_id,
        "member_name": member_name,
        "emergency_type": row.emergency_type,
        "description": row.description,
        "location": row.location,
        "contact_phone": row.contact_phone,
        "status": row.status,
        "review_note": row.review_note,
        "created_at": row.created_at.isoformat(),
        "updated_at": row.updated_at.isoformat(),
    }


@router.post("/requests", status_code=status.HTTP_201_CREATED)
def create_emergency_request(
    data: EmergencyRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.membership_status != "APPROVED":
        raise HTTPException(status_code=403, detail="Emergency requests are available to verified members")
    emergency_type = data.emergency_type.strip()
    if emergency_type not in EMERGENCY_TYPES:
        raise HTTPException(status_code=422, detail="Choose a valid emergency type")
    phone = re.sub(r"\D", "", data.contact_phone or current_user.phone_number or "")
    if len(phone) == 12 and phone.startswith("91"):
        phone = phone[2:]
    if not re.fullmatch(r"[6-9]\d{9}", phone):
        raise HTTPException(status_code=422, detail="Enter a contactable 10-digit phone number")

    now = datetime.now(timezone.utc)
    row = EmergencyRequest(
        user_id=current_user.id,
        emergency_type=emergency_type,
        description=data.description.strip(),
        location=data.location.strip(),
        contact_phone=phone,
        status="NEW",
        created_at=now,
        updated_at=now,
    )
    db.add(row)
    db.flush()
    reviewers = db.query(User).filter(User.is_active.is_(True)).all()
    for reviewer in reviewers:
        if reviewer.id != current_user.id and can_manage_emergency(reviewer, db):
            create_notification(db, reviewer.id, "Emergency support request", f"A new {emergency_type.lower()} request needs review.", "emergency")
    db.commit()
    db.refresh(row)
    return serialize_request(row, current_user.full_name)


@router.get("/requests")
def list_emergency_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(EmergencyRequest, User.full_name).join(User, User.id == EmergencyRequest.user_id)
    if not can_manage_emergency(current_user, db):
        query = query.filter(EmergencyRequest.user_id == current_user.id)
    rows = query.order_by(EmergencyRequest.created_at.desc(), EmergencyRequest.id.desc()).limit(500).all()
    return [serialize_request(row, name) for row, name in rows]


@router.patch("/requests/{request_id}")
def review_emergency_request(
    request_id: int,
    data: EmergencyRequestReview,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not can_manage_emergency(current_user, db):
        raise HTTPException(status_code=403, detail="You do not have permission to review emergency requests")
    row = db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    row.status = data.status
    row.review_note = data.review_note.strip() if data.review_note else None
    row.updated_at = datetime.now(timezone.utc)
    create_notification(db, row.user_id, "Emergency support update", f"Your emergency support request is now {data.status.lower()}.", "emergency")
    db.commit()
    db.refresh(row)
    owner = db.query(User).filter(User.id == row.user_id).first()
    return serialize_request(row, owner.full_name if owner else None)
