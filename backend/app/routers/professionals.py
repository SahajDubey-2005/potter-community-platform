from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.auth import get_current_user
from app.database import Base, engine, get_db
from app.models import User  # Ensure the users table is registered in shared SQLAlchemy metadata.

router = APIRouter(prefix="/professionals", tags=["Professional Network"])

CATEGORIES = [
    {"id": "healthcare", "name": "Doctors & Healthcare", "icon": "heart-pulse", "specializations": ["General Physician", "Dentist", "Cardiologist", "Dermatologist", "Pediatrician", "Nurse", "Pharmacist", "Other"]},
    {"id": "engineering", "name": "Engineers & IT", "icon": "code", "specializations": ["Software Engineer", "Civil Engineer", "Mechanical Engineer", "Electrical Engineer", "AI/ML", "Data Science", "Cybersecurity", "Other"]},
    {"id": "legal", "name": "Lawyers & Legal", "icon": "scale", "specializations": ["Advocate", "Corporate Law", "Civil Law", "Criminal Law", "Legal Consultant", "Other"]},
    {"id": "finance", "name": "Finance & Accounting", "icon": "wallet", "specializations": ["Chartered Accountant", "Company Secretary", "CMA", "Accountant", "Financial Advisor", "Other"]},
    {"id": "education", "name": "Teachers & Academicians", "icon": "graduation-cap", "specializations": ["School Teacher", "Professor", "Tutor", "Researcher", "Trainer", "Other"]},
    {"id": "business", "name": "Business Owners & Entrepreneurs", "icon": "briefcase-business", "specializations": ["Manufacturer", "Retailer", "Startup Founder", "Consultant", "Service Provider", "Other"]},
    {"id": "architecture", "name": "Architects & Civil Professionals", "icon": "building-2", "specializations": ["Architect", "Civil Consultant", "Interior Designer", "Contractor", "Surveyor", "Other"]},
    {"id": "government", "name": "Government & Public Sector", "icon": "landmark", "specializations": ["Civil Services", "Public Sector", "Government Teacher", "Defence", "Other"]},
    {"id": "creative", "name": "Artists & Creative Professionals", "icon": "palette", "specializations": ["Photographer", "Graphic Designer", "Artist", "Musician", "Content Creator", "Other"]},
    {"id": "other", "name": "Other Professionals", "icon": "users", "specializations": ["Other"]},
]

# These tables are created independently so existing application tables/data are untouched.
class ProfessionalProfile(Base):
    __tablename__ = "professional_profiles"
    id = __import__("sqlalchemy").Column(Integer, primary_key=True, index=True)
    user_id = __import__("sqlalchemy").Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    category = __import__("sqlalchemy").Column(String(40), nullable=False, index=True)
    profession = __import__("sqlalchemy").Column(String(120), nullable=False)
    headline = __import__("sqlalchemy").Column(String(180), nullable=True)
    bio = __import__("sqlalchemy").Column(Text, nullable=True)
    city = __import__("sqlalchemy").Column(String(100), nullable=True, index=True)
    state = __import__("sqlalchemy").Column(String(100), nullable=True, index=True)
    experience_years = __import__("sqlalchemy").Column(Integer, default=0, nullable=False)
    qualifications = __import__("sqlalchemy").Column(Text, nullable=True)
    specialization = __import__("sqlalchemy").Column(String(160), nullable=True)
    organization = __import__("sqlalchemy").Column(String(180), nullable=True)
    designation = __import__("sqlalchemy").Column(String(140), nullable=True)
    skills = __import__("sqlalchemy").Column(JSON, default=list, nullable=False)
    services = __import__("sqlalchemy").Column(JSON, default=list, nullable=False)
    portfolio_url = __import__("sqlalchemy").Column(String(500), nullable=True)
    linkedin_url = __import__("sqlalchemy").Column(String(500), nullable=True)
    github_url = __import__("sqlalchemy").Column(String(500), nullable=True)
    website_url = __import__("sqlalchemy").Column(String(500), nullable=True)
    consultation_mode = __import__("sqlalchemy").Column(String(40), nullable=True)
    availability = __import__("sqlalchemy").Column(String(180), nullable=True)
    price_range = __import__("sqlalchemy").Column(String(100), nullable=True)
    profile_photo_url = __import__("sqlalchemy").Column(String(500), nullable=True)
    verification_status = __import__("sqlalchemy").Column(String(24), default="NOT_SUBMITTED", nullable=False, index=True)
    verification_remark = __import__("sqlalchemy").Column(String(1000), nullable=True)
    is_featured = __import__("sqlalchemy").Column(Boolean, default=False, nullable=False)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)


class ProfessionalDocument(Base):
    __tablename__ = "professional_documents"
    id = __import__("sqlalchemy").Column(Integer, primary_key=True, index=True)
    profile_id = __import__("sqlalchemy").Column(Integer, ForeignKey("professional_profiles.id"), nullable=False, index=True)
    document_type = __import__("sqlalchemy").Column(String(100), nullable=False)
    original_name = __import__("sqlalchemy").Column(String(255), nullable=False)
    stored_name = __import__("sqlalchemy").Column(String(255), nullable=False)
    status = __import__("sqlalchemy").Column(String(24), default="PENDING", nullable=False, index=True)
    reviewer_id = __import__("sqlalchemy").Column(Integer, ForeignKey("users.id"), nullable=True)
    remark = __import__("sqlalchemy").Column(String(1000), nullable=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ProfessionalJob(Base):
    __tablename__ = "professional_jobs"
    id = __import__("sqlalchemy").Column(Integer, primary_key=True, index=True)
    created_by_id = __import__("sqlalchemy").Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = __import__("sqlalchemy").Column(String(40), nullable=False, index=True)
    title = __import__("sqlalchemy").Column(String(180), nullable=False)
    description = __import__("sqlalchemy").Column(Text, nullable=False)
    organization = __import__("sqlalchemy").Column(String(180), nullable=True)
    location = __import__("sqlalchemy").Column(String(160), nullable=True)
    job_type = __import__("sqlalchemy").Column(String(40), default="Full-time", nullable=False)
    apply_url = __import__("sqlalchemy").Column(String(500), nullable=True)
    status = __import__("sqlalchemy").Column(String(24), default="PUBLISHED", nullable=False, index=True)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ProfessionalEnquiry(Base):
    __tablename__ = "professional_enquiries"
    id = __import__("sqlalchemy").Column(Integer, primary_key=True, index=True)
    profile_id = __import__("sqlalchemy").Column(Integer, ForeignKey("professional_profiles.id"), nullable=False, index=True)
    sender_id = __import__("sqlalchemy").Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    enquiry_type = __import__("sqlalchemy").Column(String(40), default="CONTACT", nullable=False)
    subject = __import__("sqlalchemy").Column(String(180), nullable=True)
    message = __import__("sqlalchemy").Column(Text, nullable=False)
    status = __import__("sqlalchemy").Column(String(24), default="NEW", nullable=False)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ProfessionalReview(Base):
    __tablename__ = "professional_reviews"
    id = __import__("sqlalchemy").Column(Integer, primary_key=True, index=True)
    profile_id = __import__("sqlalchemy").Column(Integer, ForeignKey("professional_profiles.id"), nullable=False, index=True)
    reviewer_id = __import__("sqlalchemy").Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = __import__("sqlalchemy").Column(Integer, nullable=False)
    comment = __import__("sqlalchemy").Column(String(1200), nullable=False)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class ProfessionalReport(Base):
    __tablename__ = "professional_reports"
    id = __import__("sqlalchemy").Column(Integer, primary_key=True, index=True)
    profile_id = __import__("sqlalchemy").Column(Integer, ForeignKey("professional_profiles.id"), nullable=False, index=True)
    reporter_id = __import__("sqlalchemy").Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = __import__("sqlalchemy").Column(String(120), nullable=False)
    details = __import__("sqlalchemy").Column(String(1000), nullable=True)
    status = __import__("sqlalchemy").Column(String(24), default="OPEN", nullable=False)
    created_at = __import__("sqlalchemy").Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


Base.metadata.create_all(bind=engine, tables=[ProfessionalProfile.__table__, ProfessionalDocument.__table__, ProfessionalJob.__table__, ProfessionalEnquiry.__table__, ProfessionalReview.__table__, ProfessionalReport.__table__])


class ProfilePayload(BaseModel):
    category: str = Field(min_length=2, max_length=40)
    profession: str = Field(min_length=2, max_length=120)
    headline: Optional[str] = Field(default=None, max_length=180)
    bio: Optional[str] = Field(default=None, max_length=3000)
    city: Optional[str] = Field(default=None, max_length=100)
    state: Optional[str] = Field(default=None, max_length=100)
    experience_years: int = Field(default=0, ge=0, le=70)
    qualifications: Optional[str] = Field(default=None, max_length=1000)
    specialization: Optional[str] = Field(default=None, max_length=160)
    organization: Optional[str] = Field(default=None, max_length=180)
    designation: Optional[str] = Field(default=None, max_length=140)
    skills: list[str] = Field(default_factory=list, max_length=30)
    services: list[str] = Field(default_factory=list, max_length=30)
    portfolio_url: Optional[str] = Field(default=None, max_length=500)
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    github_url: Optional[str] = Field(default=None, max_length=500)
    website_url: Optional[str] = Field(default=None, max_length=500)
    consultation_mode: Optional[str] = Field(default=None, max_length=40)
    availability: Optional[str] = Field(default=None, max_length=180)
    price_range: Optional[str] = Field(default=None, max_length=100)
    profile_photo_url: Optional[str] = Field(default=None, max_length=500)


class JobPayload(BaseModel):
    category: str
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=10, max_length=5000)
    organization: Optional[str] = None
    location: Optional[str] = None
    job_type: str = "Full-time"
    apply_url: Optional[str] = None


class EnquiryPayload(BaseModel):
    profile_id: int
    enquiry_type: str = "CONTACT"
    subject: Optional[str] = Field(default=None, max_length=180)
    message: str = Field(min_length=5, max_length=3000)


class ReviewPayload(BaseModel):
    profile_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=3, max_length=1200)


class ReportPayload(BaseModel):
    profile_id: int
    reason: str = Field(min_length=3, max_length=120)
    details: Optional[str] = Field(default=None, max_length=1000)


def _role_name(user) -> str:
    role = getattr(user, "role", None) or getattr(getattr(user, "role_record", None), "name", "")
    return str(role).upper().replace("_", " ")


def _is_admin(user) -> bool:
    permissions = getattr(user, "permissions", []) or []
    return _role_name(user) in {"ADMIN", "SUPER ADMIN"} or "professionals.review" in permissions


def _profile_dict(profile: ProfessionalProfile, db: Session, include_private: bool = False) -> dict:
    user = db.query(User).filter_by(id=profile.user_id).first()
    reviews = db.query(ProfessionalReview).filter_by(profile_id=profile.id).all()
    avg = round(sum(item.rating for item in reviews) / len(reviews), 1) if reviews else None
    result = {
        "id": profile.id, "user_id": profile.user_id,
        "name": getattr(user, "full_name", "Community Professional"),
        "category": profile.category, "profession": profile.profession,
        "headline": profile.headline, "bio": profile.bio,
        "city": profile.city, "state": profile.state,
        "experience_years": profile.experience_years,
        "qualifications": profile.qualifications, "specialization": profile.specialization,
        "organization": profile.organization, "designation": profile.designation,
        "skills": profile.skills or [], "services": profile.services or [],
        "portfolio_url": profile.portfolio_url, "linkedin_url": profile.linkedin_url,
        "github_url": profile.github_url, "website_url": profile.website_url,
        "consultation_mode": profile.consultation_mode, "availability": profile.availability,
        "price_range": profile.price_range, "profile_photo_url": profile.profile_photo_url,
        "verification_status": profile.verification_status, "is_featured": profile.is_featured,
        "rating": avg, "review_count": len(reviews),
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
    }
    if include_private:
        result["verification_remark"] = profile.verification_remark
        result["documents"] = [
            {"id": d.id, "document_type": d.document_type, "original_name": d.original_name, "status": d.status, "remark": d.remark}
            for d in db.query(ProfessionalDocument).filter_by(profile_id=profile.id).all()
        ]
    return result


@router.get("/categories")
def list_categories():
    return CATEGORIES


@router.get("")
def list_professionals(
    category: Optional[str] = None,
    location: Optional[str] = None,
    q: Optional[str] = Query(default=None, max_length=120),
    featured: bool = False,
    db: Session = Depends(get_db),
):
    query = db.query(ProfessionalProfile).filter(ProfessionalProfile.verification_status == "APPROVED")
    if category:
        query = query.filter(ProfessionalProfile.category == category)
    if location:
        query = query.filter((ProfessionalProfile.city.ilike(f"%{location}%")) | (ProfessionalProfile.state.ilike(f"%{location}%")))
    if featured:
        query = query.filter(ProfessionalProfile.is_featured.is_(True))
    if q:
        like = f"%{q}%"
        query = query.filter((ProfessionalProfile.profession.ilike(like)) | (ProfessionalProfile.specialization.ilike(like)) | (ProfessionalProfile.headline.ilike(like)) | (ProfessionalProfile.skills.cast(String).ilike(like)))
    profiles = query.order_by(ProfessionalProfile.is_featured.desc(), ProfessionalProfile.updated_at.desc()).limit(100).all()
    return [_profile_dict(item, db) for item in profiles]


@router.get("/me")
def get_my_professional_profile(db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = db.query(ProfessionalProfile).filter_by(user_id=user.id).first()
    if not profile:
        return None
    return _profile_dict(profile, db, include_private=True)


@router.put("/me")
def save_my_professional_profile(payload: ProfilePayload, db: Session = Depends(get_db), user=Depends(get_current_user)):
    valid_categories = {item["id"] for item in CATEGORIES}
    if payload.category not in valid_categories:
        raise HTTPException(status_code=400, detail="Select a valid professional category.")
    profile = db.query(ProfessionalProfile).filter_by(user_id=user.id).first()
    is_new_profile = profile is None
    if not profile:
        profile = ProfessionalProfile(user_id=user.id, category=payload.category, profession=payload.profession)
        db.add(profile)
    previous_credentials = (profile.category, profile.profession, profile.qualifications, profile.specialization) if not is_new_profile else None
    for key, value in payload.model_dump().items():
        setattr(profile, key, value)
    updated_credentials = (profile.category, profile.profession, profile.qualifications, profile.specialization)
    if is_new_profile:
        profile.verification_status = "NOT_SUBMITTED"
    elif previous_credentials != updated_credentials and profile.verification_status == "APPROVED":
        profile.verification_status = "PENDING"
    profile.updated_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(profile)
    return _profile_dict(profile, db, include_private=True)


@router.post("/me/documents")
def upload_professional_document(
    document_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    profile = db.query(ProfessionalProfile).filter_by(user_id=user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Save your professional profile before uploading documents.")
    suffix = Path(file.filename or "document").suffix.lower()
    if suffix not in {".pdf", ".png", ".jpg", ".jpeg"}:
        raise HTTPException(status_code=400, detail="Upload PDF, PNG or JPG files only.")
    content = file.file.read(8 * 1024 * 1024 + 1)
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size must be 8 MB or less.")
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    private_dir = Path(__file__).resolve().parents[2] / "private_uploads" / "professional_documents"
    private_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{suffix}"
    (private_dir / stored_name).write_bytes(content)
    db.add(ProfessionalDocument(profile_id=profile.id, document_type=document_type[:100], original_name=(file.filename or "document")[:255], stored_name=stored_name))
    profile.verification_status = "PENDING"
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Document uploaded securely. Your profile is pending verification."}


@router.get("/jobs")
def list_jobs(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ProfessionalJob).filter(ProfessionalJob.status == "PUBLISHED")
    if category:
        query = query.filter(ProfessionalJob.category == category)
    return [{"id": j.id, "category": j.category, "title": j.title, "description": j.description, "organization": j.organization, "location": j.location, "job_type": j.job_type, "apply_url": j.apply_url, "created_at": j.created_at.isoformat()} for j in query.order_by(ProfessionalJob.created_at.desc()).limit(100).all()]


@router.post("/jobs")
def create_job(payload: JobPayload, db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = db.query(ProfessionalProfile).filter_by(user_id=user.id).first()
    if not profile or profile.verification_status != "APPROVED":
        raise HTTPException(status_code=403, detail="Only verified professionals can publish job opportunities.")
    job = ProfessionalJob(created_by_id=user.id, **payload.model_dump())
    db.add(job); db.commit(); db.refresh(job)
    return {"id": job.id, "message": "Job opportunity published."}


@router.post("/enquiries")
def create_enquiry(payload: EnquiryPayload, db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = db.query(ProfessionalProfile).filter_by(id=payload.profile_id).first()
    if not profile or profile.verification_status != "APPROVED":
        raise HTTPException(status_code=404, detail="Verified professional not found.")
    if profile.user_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot send an enquiry to your own profile.")
    item = ProfessionalEnquiry(profile_id=profile.id, sender_id=user.id, enquiry_type=payload.enquiry_type[:40], subject=payload.subject, message=payload.message)
    db.add(item); db.commit(); db.refresh(item)
    return {"id": item.id, "message": "Your request has been sent."}


@router.get("/me/enquiries")
def my_enquiries(db: Session = Depends(get_db), user=Depends(get_current_user)):
    received = db.query(ProfessionalEnquiry).join(ProfessionalProfile, ProfessionalEnquiry.profile_id == ProfessionalProfile.id).filter(ProfessionalProfile.user_id == user.id).all()
    sent = db.query(ProfessionalEnquiry).filter_by(sender_id=user.id).all()
    return {
        "received": [{"id": e.id, "profile_id": e.profile_id, "type": e.enquiry_type, "subject": e.subject, "message": e.message, "status": e.status, "created_at": e.created_at.isoformat()} for e in received],
        "sent": [{"id": e.id, "profile_id": e.profile_id, "type": e.enquiry_type, "subject": e.subject, "message": e.message, "status": e.status, "created_at": e.created_at.isoformat()} for e in sent],
    }


@router.post("/reviews")
def add_review(payload: ReviewPayload, db: Session = Depends(get_db), user=Depends(get_current_user)):
    profile = db.query(ProfessionalProfile).filter_by(id=payload.profile_id, verification_status="APPROVED").first()
    if not profile or profile.user_id == user.id:
        raise HTTPException(status_code=404, detail="Professional profile not found.")
    review = ProfessionalReview(profile_id=profile.id, reviewer_id=user.id, rating=payload.rating, comment=payload.comment)
    db.add(review); db.commit()
    return {"message": "Review submitted."}


@router.post("/reports")
def report_profile(payload: ReportPayload, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not db.query(ProfessionalProfile).filter_by(id=payload.profile_id).first():
        raise HTTPException(status_code=404, detail="Profile not found.")
    db.add(ProfessionalReport(profile_id=payload.profile_id, reporter_id=user.id, reason=payload.reason, details=payload.details))
    db.commit()
    return {"message": "Report submitted for review."}


@router.get("/admin/pending")
def admin_pending_profiles(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Administrator access required.")
    profiles = db.query(ProfessionalProfile).filter(ProfessionalProfile.verification_status == "PENDING").order_by(ProfessionalProfile.created_at.asc()).all()
    return [_profile_dict(item, db, include_private=True) for item in profiles]


@router.get("/admin/documents/{document_id}")
def admin_download_document(document_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Administrator access required.")
    document = db.query(ProfessionalDocument).filter_by(id=document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")
    private_dir = Path(__file__).resolve().parents[2] / "private_uploads" / "professional_documents"
    file_path = private_dir / document.stored_name
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Stored document is unavailable.")
    return FileResponse(path=file_path, filename=document.original_name, media_type="application/octet-stream")


@router.patch("/admin/{profile_id}/decision")
def admin_profile_decision(profile_id: int, decision: str, remark: str = "", db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Administrator access required.")
    profile = db.query(ProfessionalProfile).filter_by(id=profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    decision = decision.upper()
    if decision not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Decision must be APPROVED or REJECTED.")
    profile.verification_status = decision
    profile.verification_remark = remark[:1000] or None
    profile.updated_at = datetime.now(timezone.utc)
    for doc in db.query(ProfessionalDocument).filter_by(profile_id=profile_id).all():
        doc.status = decision
        doc.reviewer_id = user.id
        doc.remark = remark[:1000] or None
    db.commit()
    return {"message": f"Professional profile {decision.lower()}.", "status": decision}


@router.patch("/admin/{profile_id}/feature")
def admin_feature_profile(profile_id: int, featured: bool, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Administrator access required.")
    profile = db.query(ProfessionalProfile).filter_by(id=profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    profile.is_featured = featured
    db.commit()
    return {"message": "Featured status updated."}
