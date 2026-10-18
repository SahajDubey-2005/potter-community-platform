from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import FamilyMember, User
from app.notifications import create_notification


router = APIRouter(prefix="/family-members", tags=["Family members"])


class FamilyMemberInput(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    relationship: str = Field(min_length=2, max_length=60)
    date_of_birth: str | None = Field(default=None, max_length=10)
    gender: str | None = Field(default=None, max_length=40)
    phone_number: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=255)


class FamilyMemberReview(BaseModel):
    status: str
    admin_remark: str | None = Field(default=None, max_length=500)


def serialize_family_member(member: FamilyMember) -> dict:
    return {
        "id": member.id,
        "primary_user_id": member.primary_user_id,
        "full_name": member.full_name,
        "relationship": member.relationship,
        "date_of_birth": member.date_of_birth,
        "gender": member.gender,
        "phone_number": member.phone_number,
        "email": member.email,
        "membership_status": member.membership_status,
        "membership_number": member.membership_number,
        "admin_remark": member.admin_remark,
        "created_at": member.created_at.isoformat() if member.created_at else None,
        "updated_at": member.updated_at.isoformat() if member.updated_at else None,
    }


@router.get("")
def list_my_family_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(FamilyMember).filter(
        FamilyMember.primary_user_id == current_user.id,
    ).order_by(FamilyMember.created_at.desc(), FamilyMember.id.desc()).all()
    return [serialize_family_member(row) for row in rows]


@router.post("", status_code=201)
def add_family_member(
    payload: FamilyMemberInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    values = payload.model_dump()
    values["full_name"] = values["full_name"].strip()
    values["relationship"] = values["relationship"].strip()
    now = datetime.now(timezone.utc)
    member = FamilyMember(primary_user_id=current_user.id, **values, created_at=now, updated_at=now)
    db.add(member)
    db.commit()
    db.refresh(member)
    return serialize_family_member(member)


@router.patch("/{family_member_id}")
def update_family_member(
    family_member_id: int,
    payload: FamilyMemberInput,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = db.query(FamilyMember).filter(
        FamilyMember.id == family_member_id,
        FamilyMember.primary_user_id == current_user.id,
    ).first()
    if member is None:
        raise HTTPException(status_code=404, detail="Family member not found")
    if member.membership_status == "APPROVED":
        raise HTTPException(status_code=409, detail="Contact the community office to change an approved family record")
    for key, value in payload.model_dump().items():
        setattr(member, key, value.strip() if isinstance(value, str) else value)
    member.membership_status = "PENDING"
    member.admin_remark = None
    member.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(member)
    return serialize_family_member(member)


@router.delete("/{family_member_id}", status_code=204)
def delete_family_member(
    family_member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = db.query(FamilyMember).filter(
        FamilyMember.id == family_member_id,
        FamilyMember.primary_user_id == current_user.id,
    ).first()
    if member is None:
        raise HTTPException(status_code=404, detail="Family member not found")
    if member.membership_status == "APPROVED":
        raise HTTPException(status_code=409, detail="Approved family records cannot be deleted")
    db.delete(member)
    db.commit()


@router.get("/admin/pending")
def list_pending_family_members(
    current_user: User = Depends(require_permission("membership.review")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(FamilyMember, User.full_name.label("primary_name"), User.membership_number)
        .join(User, User.id == FamilyMember.primary_user_id)
        .filter(FamilyMember.membership_status == "PENDING")
        .order_by(FamilyMember.created_at.asc())
        .all()
    )
    return [
        {**serialize_family_member(member), "primary_member_name": primary_name, "primary_membership_number": membership_number}
        for member, primary_name, membership_number in rows
    ]


@router.patch("/admin/{family_member_id}/review")
def review_family_member(
    family_member_id: int,
    review: FamilyMemberReview,
    current_user: User = Depends(require_permission("membership.review")),
    db: Session = Depends(get_db),
):
    if review.status not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Status must be APPROVED or REJECTED")
    member = db.query(FamilyMember).filter(FamilyMember.id == family_member_id).first()
    if member is None:
        raise HTTPException(status_code=404, detail="Family member not found")
    member.membership_status = review.status
    member.admin_remark = review.admin_remark.strip() if review.admin_remark else None
    member.updated_at = datetime.now(timezone.utc)
    if review.status == "APPROVED" and not member.membership_number:
        member.membership_number = f"POT-FAM-{datetime.now(timezone.utc).year}-{member.id:06d}"
    create_notification(
        db,
        member.primary_user_id,
        "Family membership reviewed",
        f"{member.full_name}'s family membership was {review.status.lower()}." + (f" {member.admin_remark}" if member.admin_remark else ""),
        "membership",
    )
    db.commit()
    db.refresh(member)
    return serialize_family_member(member)
