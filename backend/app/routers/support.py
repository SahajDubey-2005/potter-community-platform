from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.auth import require_permission
from app.database import get_db
from app.models import SupportInquiry, User


router = APIRouter(prefix="/support", tags=["Help and support"])


class InquiryCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr | None = None
    phone_number: str | None = Field(default=None, max_length=20)
    category: str = Field(min_length=2, max_length=80)
    message: str = Field(min_length=10, max_length=3000)


class InquiryUpdate(BaseModel):
    status: str = Field(pattern="^(NEW|IN_PROGRESS|RESOLVED)$")


def serialize_inquiry(item: SupportInquiry) -> dict:
    return {
        "id": item.id,
        "full_name": item.full_name,
        "email": item.email,
        "phone_number": item.phone_number,
        "category": item.category,
        "message": item.message,
        "status": item.status,
        "created_at": item.created_at.isoformat(),
        "resolved_at": item.resolved_at.isoformat() if item.resolved_at else None,
    }


@router.post("/inquiries", status_code=status.HTTP_201_CREATED)
def create_inquiry(data: InquiryCreate, db: Session = Depends(get_db)):
    email = str(data.email).strip().lower() if data.email else None
    phone = "".join(character for character in (data.phone_number or "") if character.isdigit()) or None
    if not email and not phone:
        raise HTTPException(status_code=422, detail="Provide an email address or phone number so the team can contact you")
    item = SupportInquiry(
        full_name=data.full_name.strip(), email=email, phone_number=phone,
        category=data.category.strip(), message=data.message.strip(), status="NEW",
        created_at=datetime.now(timezone.utc),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"message": "Your enquiry has been received. The community team will review it."}


@router.get("/inquiries")
def list_inquiries(
    current_user: User = Depends(require_permission("membership.review")),
    db: Session = Depends(get_db),
):
    rows = db.query(SupportInquiry).order_by(SupportInquiry.created_at.desc(), SupportInquiry.id.desc()).limit(500).all()
    return [serialize_inquiry(row) for row in rows]


@router.patch("/inquiries/{inquiry_id}")
def update_inquiry(
    inquiry_id: int,
    data: InquiryUpdate,
    current_user: User = Depends(require_permission("membership.review")),
    db: Session = Depends(get_db),
):
    item = db.query(SupportInquiry).filter(SupportInquiry.id == inquiry_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Support enquiry not found")
    item.status = data.status
    item.resolved_at = datetime.now(timezone.utc) if data.status == "RESOLVED" else None
    db.commit()
    db.refresh(item)
    return serialize_inquiry(item)
