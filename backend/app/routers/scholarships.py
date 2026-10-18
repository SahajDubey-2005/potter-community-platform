from datetime import date, datetime, timezone
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_role, user_has_any_permission
from app.database import get_db
from app.models import Role, ScholarshipApplication, ScholarshipBenefit, ScholarshipDocument, ScholarshipScheme, User
from app.notifications import create_notification
from app.private_documents import private_document_path, save_private_document


router = APIRouter(prefix="/scholarships", tags=["Scholarships"])


class SchemeInput(BaseModel):
    scope: str
    name: str = Field(min_length=3, max_length=180)
    provider: str = Field(min_length=2, max_length=180)
    eligibility: str = Field(min_length=5, max_length=3000)
    amount: str | None = Field(default=None, max_length=180)
    start_date: date | None = None
    deadline: date | None = None
    required_documents: list[str] = Field(default_factory=list)
    application_url: str | None = Field(default=None, max_length=1000)
    is_active: bool = True


class ApplicationDecision(BaseModel):
    action: str
    remark: str | None = Field(default=None, max_length=1000)


class BenefitInput(BaseModel):
    benefit_type: str = Field(min_length=2, max_length=160)
    amount: float | None = Field(default=None, ge=0)
    received_at: date | None = None
    reference_number: str | None = Field(default=None, max_length=160)


class BenefitDecision(BaseModel):
    status: str


def _is_admin(user: User) -> bool:
    legacy = (user.role or "").strip().upper()
    dynamic = (user.role_record.name or "").strip().upper() if user.role_record else ""
    return bool({legacy, dynamic} & {"ADMIN", "SUPER ADMIN"})


def _serialize_scheme(scheme: ScholarshipScheme) -> dict:
    expired = bool(scheme.deadline and scheme.deadline < date.today())
    not_open = bool(scheme.start_date and scheme.start_date > date.today())
    return {
        "id": scheme.id, "scope": scheme.scope, "name": scheme.name,
        "provider": scheme.provider, "eligibility": scheme.eligibility,
        "amount": scheme.amount, "start_date": scheme.start_date.isoformat() if scheme.start_date else None,
        "deadline": scheme.deadline.isoformat() if scheme.deadline else None,
        "required_documents": scheme.required_documents or [], "application_url": scheme.application_url,
        "is_active": scheme.is_active, "expired": expired, "not_open": not_open,
    }


def _serialize_application(row: ScholarshipApplication, user: User, scheme: ScholarshipScheme, db: Session) -> dict:
    docs = db.query(ScholarshipDocument).filter(ScholarshipDocument.application_id == row.id).order_by(ScholarshipDocument.id).all()
    benefits = db.query(ScholarshipBenefit).filter(ScholarshipBenefit.application_id == row.id).order_by(ScholarshipBenefit.created_at.desc()).all()
    return {
        "id": row.id, "user_id": row.user_id, "member_name": user.full_name,
        "membership_number": user.membership_number, "scheme_id": scheme.id,
        "scheme_name": scheme.name, "scope": scheme.scope, "provider": scheme.provider,
        "details": row.details or {}, "status": row.status, "review_stage": row.review_stage,
        "admin_remark": row.admin_remark, "officer_remark": row.officer_remark,
        "president_remark": row.president_remark, "created_at": row.created_at.isoformat(),
        "documents": [{"id": d.id, "document_type": d.document_type, "download_url": f"/scholarships/documents/{d.id}"} for d in docs],
        "benefit_status": "DISBURSED" if any(b.verification_status == "VERIFIED" for b in benefits) else "PENDING_VERIFICATION" if any(b.verification_status == "PENDING" for b in benefits) else "REJECTED" if benefits else "NOT_RECORDED",
        "benefits": [_serialize_benefit(b, user.membership_number, scheme.name) for b in benefits],
    }


def _serialize_benefit(benefit: ScholarshipBenefit, member_id: str | None = None, scheme_name: str | None = None) -> dict:
    return {
        "id": benefit.id, "application_id": benefit.application_id, "member_id": member_id or str(benefit.user_id),
        "scheme_name": scheme_name,
        "benefit_type": benefit.benefit_type, "amount": float(benefit.amount) if benefit.amount is not None else None,
        "received_at": benefit.received_at.isoformat() if benefit.received_at else None,
        "reference_number": benefit.reference_number, "verification_status": benefit.verification_status,
        "proof_url": f"/scholarships/benefits/{benefit.id}/proof" if benefit.proof_file_name else None,
        "created_at": benefit.created_at.isoformat(),
    }


@router.get("/schemes")
def list_schemes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(ScholarshipScheme).filter(ScholarshipScheme.is_active.is_(True)).order_by(ScholarshipScheme.scope, ScholarshipScheme.name).all()
    return [_serialize_scheme(row) for row in rows]


@router.post("/schemes", status_code=status.HTTP_201_CREATED)
def create_scheme(data: SchemeInput, db: Session = Depends(get_db), current_user: User = Depends(require_role("ADMIN"))):
    if data.scope != "COMMUNITY":
        raise HTTPException(status_code=403, detail="Government scholarship schemes are read-only. Only Community Scholarships can be managed here.")
    if data.start_date and data.deadline and data.deadline < data.start_date:
        raise HTTPException(status_code=422, detail="Deadline cannot be before the start date")
    scheme = ScholarshipScheme(**data.model_dump(), created_by_id=current_user.id, updated_at=datetime.now(timezone.utc))
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return _serialize_scheme(scheme)


@router.patch("/schemes/{scheme_id}")
def update_scheme(scheme_id: int, data: SchemeInput, db: Session = Depends(get_db), current_user: User = Depends(require_role("ADMIN"))):
    scheme = db.query(ScholarshipScheme).filter(ScholarshipScheme.id == scheme_id).first()
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scholarship scheme not found")
    if scheme.scope != "COMMUNITY" or data.scope != "COMMUNITY":
        raise HTTPException(status_code=403, detail="Government scholarship schemes are read-only. Only Community Scholarships can be managed here.")
    for key, value in data.model_dump().items():
        setattr(scheme, key, value)
    scheme.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(scheme)
    return _serialize_scheme(scheme)


@router.post("/applications", status_code=status.HTTP_201_CREATED)
def apply_for_scholarship(
    scheme_id: int = Form(...),
    details: str = Form("{}"),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.membership_status != "APPROVED":
        raise HTTPException(status_code=403, detail="Only verified members can submit scholarship applications")
    scheme = db.query(ScholarshipScheme).filter(ScholarshipScheme.id == scheme_id, ScholarshipScheme.is_active.is_(True)).first()
    if scheme is None:
        raise HTTPException(status_code=404, detail="Scholarship scheme not found")
    if scheme.scope != "COMMUNITY":
        raise HTTPException(status_code=403, detail="Government scholarship applications must be submitted through the official government portal")
    if scheme.deadline and scheme.deadline < date.today():
        raise HTTPException(status_code=409, detail="This scholarship application period has expired")
    if scheme.start_date and scheme.start_date > date.today():
        raise HTTPException(status_code=409, detail="This scholarship application period has not opened yet")
    if scheme.required_documents and len(files) < len(scheme.required_documents):
        raise HTTPException(status_code=422, detail=f"Upload all required documents ({len(scheme.required_documents)} file(s))")
    try:
        payload = json.loads(details)
        if not isinstance(payload, dict):
            raise ValueError
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Application details must be valid JSON")
    already_applied = db.query(ScholarshipApplication.id).filter(
        ScholarshipApplication.user_id == current_user.id,
        ScholarshipApplication.scheme_id == scheme.id,
        ScholarshipApplication.status != "REJECTED",
    ).first()
    if already_applied:
        raise HTTPException(status_code=409, detail="You already have an active application for this scholarship")
    application = ScholarshipApplication(user_id=current_user.id, scheme_id=scheme.id, details=payload, status="SUBMITTED", review_stage="ADMIN_REVIEW")
    db.add(application)
    db.flush()
    try:
        for index, upload in enumerate(files):
            stored = save_private_document(upload)
            label = scheme.required_documents[index] if index < len(scheme.required_documents) else (upload.filename or "Supporting document")
            db.add(ScholarshipDocument(application_id=application.id, document_type=label[:120], file_name=stored))
        create_notification(db, current_user.id, "Scholarship application submitted", f"Your application for {scheme.name} is under review.", "scholarship")
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(application)
    return _serialize_application(application, current_user, scheme, db)


@router.get("/applications")
def list_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    can_review = _is_admin(current_user) or user_has_any_permission(current_user, ("scholarships.review", "community.approve"), db)
    query = db.query(ScholarshipApplication, User, ScholarshipScheme).join(User, User.id == ScholarshipApplication.user_id).join(ScholarshipScheme, ScholarshipScheme.id == ScholarshipApplication.scheme_id)
    if not can_review:
        query = query.filter(ScholarshipApplication.user_id == current_user.id)
    rows = query.order_by(ScholarshipApplication.created_at.desc()).all()
    return [_serialize_application(application, user, scheme, db) for application, user, scheme in rows]


@router.patch("/applications/{application_id}/decision")
def decide_application(application_id: int, data: ApplicationDecision, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    application = db.query(ScholarshipApplication).filter(ScholarshipApplication.id == application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Scholarship application not found")
    scheme = db.query(ScholarshipScheme).filter(ScholarshipScheme.id == application.scheme_id).first()
    member = db.query(User).filter(User.id == application.user_id).first()
    action = data.action.strip().upper()
    if application.status in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=409, detail="This scholarship application has already been decided")
    if application.review_stage == "ADMIN_REVIEW":
        if not _is_admin(current_user):
            raise HTTPException(status_code=403, detail="Only Admin can perform the initial scholarship review")
        if action == "FORWARD":
            application.review_stage = "SCHOLARSHIP_OFFICER_REVIEW"
            application.status = "UNDER_REVIEW"
        elif action == "REJECT":
            application.review_stage = "REJECTED"
            application.status = "REJECTED"
            application.admin_remark = data.remark
        else:
            raise HTTPException(status_code=422, detail="Admin action must be FORWARD or REJECT")
    elif application.review_stage == "SCHOLARSHIP_OFFICER_REVIEW":
        if _is_admin(current_user) or not user_has_any_permission(current_user, ("scholarships.review",), db, allow_admin=False):
            raise HTTPException(status_code=403, detail="Only the assigned Scholarship Officer can review this stage")
        if action == "FORWARD":
            application.review_stage = "PRESIDENT_REVIEW"
        elif action == "REJECT":
            application.review_stage = "REJECTED"
            application.status = "REJECTED"
        else:
            raise HTTPException(status_code=422, detail="Officer action must be FORWARD or REJECT")
        application.officer_remark = data.remark
    elif application.review_stage == "PRESIDENT_REVIEW":
        if not user_has_any_permission(current_user, ("community.approve",), db, allow_admin=False):
            raise HTTPException(status_code=403, detail="Only the President or Super Admin can make the final decision")
        if action not in {"APPROVE", "REJECT"}:
            raise HTTPException(status_code=422, detail="President action must be APPROVE or REJECT")
        application.status = "APPROVED" if action == "APPROVE" else "REJECTED"
        application.review_stage = application.status
        application.president_remark = data.remark
    else:
        raise HTTPException(status_code=409, detail="Unknown scholarship review stage")
    application.updated_at = datetime.now(timezone.utc)
    create_notification(db, member.id, "Scholarship application update", f"Your application for {scheme.name} moved to {application.review_stage.replace('_', ' ').lower()}.", "scholarship")
    recipient_role = "Scholarship Officer" if application.review_stage == "SCHOLARSHIP_OFFICER_REVIEW" else "President / Head" if application.review_stage == "PRESIDENT_REVIEW" else None
    if recipient_role:
        recipients = db.query(User).join(Role, User.role_id == Role.id).filter(User.is_active.is_(True), Role.is_active.is_(True), Role.name == recipient_role).all()
        for recipient in recipients:
            create_notification(db, recipient.id, "Scholarship review required", f"{member.full_name}'s application for {scheme.name} is ready for your review.", "scholarship")
    db.commit()
    db.refresh(application)
    return _serialize_application(application, member, scheme, db)


@router.get("/documents/{document_id}")
def download_application_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.query(ScholarshipDocument).filter(ScholarshipDocument.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Scholarship document not found")
    application = db.query(ScholarshipApplication).filter(ScholarshipApplication.id == document.application_id).first()
    if application is None:
        raise HTTPException(status_code=404, detail="Scholarship application not found")
    can_review = _is_admin(current_user) or user_has_any_permission(current_user, ("scholarships.review", "community.approve"), db)
    if application.user_id != current_user.id and not can_review:
        raise HTTPException(status_code=403, detail="You cannot access this scholarship document")
    from fastapi.responses import FileResponse
    path = private_document_path(document.file_name)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Scholarship document file is unavailable")
    return FileResponse(path, filename=f"{document.document_type}{path.suffix}")


@router.post("/applications/{application_id}/benefits", status_code=status.HTTP_201_CREATED)
def record_benefit(
    application_id: int,
    benefit_type: str = Form(...),
    amount: float | None = Form(None),
    received_at: date | None = Form(None),
    reference_number: str | None = Form(None),
    proof: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _is_admin(current_user) and not user_has_any_permission(current_user, ("scholarships.review",), db, allow_admin=False):
        raise HTTPException(status_code=403, detail="Scholarship review permission is required to record benefits")
    application = db.query(ScholarshipApplication).filter(ScholarshipApplication.id == application_id, ScholarshipApplication.status == "APPROVED").first()
    if application is None:
        raise HTTPException(status_code=409, detail="Only an approved application can have a benefit recorded")
    proof_name = save_private_document(proof) if proof else None
    benefit = ScholarshipBenefit(application_id=application.id, user_id=application.user_id, benefit_type=benefit_type.strip(), amount=amount, received_at=received_at, reference_number=reference_number, verification_status="PENDING", proof_file_name=proof_name, recorded_by_id=current_user.id)
    db.add(benefit)
    create_notification(db, application.user_id, "Scholarship benefit recorded", "A scholarship benefit was recorded and is awaiting verification.", "scholarship")
    db.commit()
    db.refresh(benefit)
    return _serialize_benefit(benefit)


@router.patch("/benefits/{benefit_id}/verify")
def verify_benefit(benefit_id: int, data: BenefitDecision, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.status not in {"VERIFIED", "REJECTED"}:
        raise HTTPException(status_code=422, detail="Benefit status must be VERIFIED or REJECTED")
    if _is_admin(current_user):
        allowed = True
    else:
        allowed = user_has_any_permission(current_user, ("scholarships.review",), db, allow_admin=False)
    if not allowed:
        raise HTTPException(status_code=403, detail="Scholarship review permission is required")
    benefit = db.query(ScholarshipBenefit).filter(ScholarshipBenefit.id == benefit_id).first()
    if benefit is None:
        raise HTTPException(status_code=404, detail="Benefit record not found")
    benefit.verification_status = data.status
    db.commit()
    db.refresh(benefit)
    create_notification(db, benefit.user_id, "Scholarship benefit verification", f"Your scholarship benefit record was {data.status.lower()}.", "scholarship")
    db.commit()
    member = db.query(User).filter(User.id == benefit.user_id).first()
    application = db.query(ScholarshipApplication).filter(ScholarshipApplication.id == benefit.application_id).first()
    scheme = db.query(ScholarshipScheme).filter(ScholarshipScheme.id == application.scheme_id).first() if application else None
    return _serialize_benefit(benefit, member.membership_number if member else None, scheme.name if scheme else None)


@router.get("/benefits/{benefit_id}/proof")
def download_benefit_proof(benefit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    benefit = db.query(ScholarshipBenefit).filter(ScholarshipBenefit.id == benefit_id).first()
    if benefit is None or not benefit.proof_file_name:
        raise HTTPException(status_code=404, detail="Benefit proof not found")
    can_review = _is_admin(current_user) or user_has_any_permission(current_user, ("scholarships.review", "community.approve"), db)
    if benefit.user_id != current_user.id and not can_review:
        raise HTTPException(status_code=403, detail="You cannot access this benefit proof")
    from fastapi.responses import FileResponse
    path = private_document_path(benefit.proof_file_name)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Benefit proof file is unavailable")
    return FileResponse(path, filename=f"scholarship-benefit-proof{path.suffix}")
