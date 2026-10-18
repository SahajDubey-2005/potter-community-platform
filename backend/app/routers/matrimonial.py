from datetime import date, datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, user_has_any_permission
from app.database import get_db
from app.models import MatrimonialProfile, User

router = APIRouter(prefix="/matrimonial", tags=["Matrimonial"])


class ProfileInput(BaseModel):
    gender: Literal["Male", "Female", "Other"]
    education: str = Field(min_length=2, max_length=160)
    occupation: str = Field(min_length=2, max_length=160)
    location: str = Field(min_length=2, max_length=120)
    marital_status: Literal["Never married", "Widowed", "Divorced", "Other"]
    description: str = Field(min_length=10, max_length=1200)


class DecisionInput(BaseModel):
    action: Literal["APPROVE", "REJECT"]


def _age_from_signup(user: User) -> int | None:
    details = user.application_details or {}
    raw = details.get("date_of_birth")
    try:
        born = date.fromisoformat(raw)
    except (TypeError, ValueError):
        return None
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))


def _member(user: User):
    if user.membership_status != "APPROVED":
        raise HTTPException(status_code=403, detail="Only verified members can use matrimonial services")
    age = _age_from_signup(user)
    if age is None or age < 18:
        raise HTTPException(status_code=403, detail="Matrimonial services require verified date of birth and age 18 or above")
    return age


def _serialize(profile: MatrimonialProfile, user: User) -> dict:
    return {"id": profile.id, "userId": user.id, "name": user.full_name,
            "age": profile.age, "gender": profile.gender, "education": profile.education,
            "occupation": profile.occupation, "location": profile.location,
            "maritalStatus": profile.marital_status, "description": profile.description,
            "status": profile.status, "createdAt": profile.created_at.isoformat()}


@router.get("")
def list_profiles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _member(current_user)
    profiles = db.query(MatrimonialProfile, User).join(User, User.id == MatrimonialProfile.user_id).filter(
        MatrimonialProfile.status == "PUBLISHED", MatrimonialProfile.user_id != current_user.id,
    ).order_by(MatrimonialProfile.created_at.desc()).all()
    return [_serialize(profile, user) for profile, user in profiles]


@router.get("/mine")
def my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _member(current_user)
    profile = db.query(MatrimonialProfile).filter_by(user_id=current_user.id).first()
    if not profile:
        return None
    return _serialize(profile, current_user)


@router.post("")
def save_profile(data: ProfileInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    age = _member(current_user)
    profile = db.query(MatrimonialProfile).filter_by(user_id=current_user.id).first()
    now = datetime.now(timezone.utc)
    values = data.model_dump()
    if profile is None:
        profile = MatrimonialProfile(user_id=current_user.id, age=age, **values, status="PENDING", created_at=now, updated_at=now)
        db.add(profile)
    else:
        for key, value in values.items():
            setattr(profile, key, value)
        profile.age = age
        profile.status = "PENDING"
        profile.reviewed_at = None
        profile.reviewed_by_id = None
        profile.updated_at = now
    db.commit()
    db.refresh(profile)
    return _serialize(profile, current_user)


@router.get("/review")
def review_queue(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user_has_any_permission(current_user, ("matrimonial.review",), db):
        raise HTTPException(status_code=403, detail="Matrimonial review permission is required")
    pending = db.query(MatrimonialProfile, User).join(User, User.id == MatrimonialProfile.user_id).filter(MatrimonialProfile.status == "PENDING").order_by(MatrimonialProfile.created_at).all()
    return [_serialize(profile, user) for profile, user in pending]


@router.patch("/{profile_id}/decision")
def decide_profile(profile_id: int, data: DecisionInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user_has_any_permission(current_user, ("matrimonial.review",), db):
        raise HTTPException(status_code=403, detail="Matrimonial review permission is required")
    profile = db.query(MatrimonialProfile).filter_by(id=profile_id, status="PENDING").first()
    if not profile:
        raise HTTPException(status_code=404, detail="Pending matrimonial profile not found")
    profile.status = "PUBLISHED" if data.action == "APPROVE" else "REJECTED"
    profile.reviewed_at = datetime.now(timezone.utc)
    profile.reviewed_by_id = current_user.id
    profile.updated_at = profile.reviewed_at
    db.commit()
    owner = db.query(User).filter_by(id=profile.user_id).first()
    return _serialize(profile, owner)
