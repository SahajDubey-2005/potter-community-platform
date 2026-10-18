from datetime import date, datetime, timezone
import json

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import AssistanceApplication, AssistanceBenefit, AssistanceDocument, User
from app.notifications import create_notification
from app.private_documents import private_document_path, save_private_document


router = APIRouter(prefix="/assistance", tags=["Widow pension and assistance"])


class DecisionInput(BaseModel):
    status: str
    reason: str | None = Field(default=None, max_length=1000)


class BenefitStatusInput(BaseModel):
    status: str


def _is_admin(user: User) -> bool:
    old_role = (user.role or "").strip().upper()
    current_role = (user.role_record.name or "").strip().upper() if user.role_record else ""
    return bool({old_role, current_role} & {"ADMIN", "SUPER ADMIN"})


def _serialize_benefit(benefit: AssistanceBenefit) -> dict:
    return {
        "id": benefit.id,
        "benefitType": benefit.benefit_type,
        "amount": float(benefit.amount) if benefit.amount is not None else None,
        "receivedAt": benefit.received_at.isoformat() if benefit.received_at else None,
        "referenceNumber": benefit.reference_number,
        "verificationStatus": benefit.verification_status,
        "proofUrl": f"/assistance/benefits/{benefit.id}/proof" if benefit.proof_file_name else None,
    }


def _serialize_application(row: AssistanceApplication, user: User, db: Session) -> dict:
    documents = db.query(AssistanceDocument).filter(AssistanceDocument.application_id == row.id).order_by(AssistanceDocument.id).all()
    benefits = db.query(AssistanceBenefit).filter(AssistanceBenefit.application_id == row.id).order_by(AssistanceBenefit.created_at.desc()).all()
    return {
        **(row.details or {}),
        "id": row.id,
        "memberName": user.full_name,
        "assistanceType": row.assistance_type,
        "scope": row.scope,
        "status": row.status,
        "decisionReason": row.decision_reason or "No decision recorded yet.",
        "officialStatus": row.official_status,
        "officialVerificationNote": row.official_verification_note,
        "officialReference": row.official_reference,
        "referenceNumber": f"WFA-{row.created_at.year}-{row.id:06d}",
        "submittedAt": row.created_at.isoformat(),
        "documents": [{"id": document.id, "documentType": document.document_type, "downloadUrl": f"/assistance/documents/{document.id}"} for document in documents],
        "benefitHistory": [_serialize_benefit(benefit) for benefit in benefits],
    }


@router.post("/applications", status_code=status.HTTP_201_CREATED)
def submit_assistance_request(
    details: str = Form(...),
    assistance_type: str = Form(...),
    scope: str = Form("GOVERNMENT"),
    official_reference: str | None = Form(None),
    files: list[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.membership_status != "APPROVED":
        raise HTTPException(status_code=403, detail="Only verified members can submit an assistance request")
    scope = scope.strip().upper()
    if scope not in {"GOVERNMENT", "COMMUNITY"}:
        raise HTTPException(status_code=422, detail="Choose Government or Community assistance")
    try:
        payload = json.loads(details)
        if not isinstance(payload, dict):
            raise ValueError
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Request details must be valid JSON")
    for key in ("applicantName", "state", "district", "annualIncome"):
        if not str(payload.get(key, "")).strip():
            raise HTTPException(status_code=422, detail=f"{key} is required")

    now = datetime.now(timezone.utc)
    application = AssistanceApplication(
        user_id=current_user.id,
        assistance_type=assistance_type.strip()[:80],
        scope=scope,
        details=payload,
        status="SUBMITTED",
        official_status="REFERENCE_PROVIDED" if official_reference else "NOT_SUBMITTED",
        official_reference=official_reference.strip()[:160] if official_reference else None,
        created_at=now,
        updated_at=now,
    )
    db.add(application)
    db.flush()
    try:
        for upload in files:
            stored = save_private_document(upload)
            db.add(AssistanceDocument(application_id=application.id, document_type=(upload.filename or "Supporting document")[:120], file_name=stored, created_at=now))
        create_notification(db, current_user.id, "Assistance request submitted", "Your request has been sent to the community for review. This does not submit a government application.", "assistance")
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(application)
    return _serialize_application(application, current_user, db)


@router.get("/applications")
def list_assistance_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(AssistanceApplication, User).join(User, User.id == AssistanceApplication.user_id)
    if not _is_admin(current_user):
        query = query.filter(AssistanceApplication.user_id == current_user.id)
    return [_serialize_application(row, owner, db) for row, owner in query.order_by(AssistanceApplication.created_at.desc()).all()]


@router.patch("/applications/{application_id}/resubmit")
def resubmit_assistance_request(
    application_id: int,
    details: str = Form(...),
    files: list[UploadFile] = File(default=[]),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    row = db.query(AssistanceApplication).filter(
        AssistanceApplication.id == application_id,
        AssistanceApplication.user_id == current_user.id,
        AssistanceApplication.status == "DOCUMENTS_REQUIRED",
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="No assistance request is waiting for resubmission")
    try:
        payload = json.loads(details)
        if not isinstance(payload, dict):
            raise ValueError
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail="Request details must be valid JSON")
    for key in ("applicantName", "state", "district", "annualIncome"):
        if not str(payload.get(key, "")).strip():
            raise HTTPException(status_code=422, detail=f"{key} is required")
    now = datetime.now(timezone.utc)
    row.details = payload
    row.status = "RESUBMITTED"
    row.decision_reason = None
    row.updated_at = now
    try:
        for upload in files:
            stored = save_private_document(upload)
            db.add(AssistanceDocument(application_id=row.id, document_type=(upload.filename or "Supporting document")[:120], file_name=stored, created_at=now))
        create_notification(db, current_user.id, "Assistance documents resubmitted", "Your updated assistance request is back with the community for review.", "assistance")
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(row)
    return _serialize_application(row, current_user, db)


@router.patch("/applications/{application_id}/decision")
def decide_assistance_request(application_id: int, payload: DecisionInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only an administrator can review assistance requests")
    if payload.status not in {"APPROVED", "REJECTED", "DOCUMENTS_REQUIRED"}:
        raise HTTPException(status_code=422, detail="Status must be APPROVED, REJECTED, or DOCUMENTS_REQUIRED")
    row = db.query(AssistanceApplication).filter(AssistanceApplication.id == application_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Assistance request not found")
    if row.status in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=409, detail="This assistance request has already been decided")
    row.status = payload.status
    row.decision_reason = payload.reason.strip() if payload.reason else None
    row.updated_at = datetime.now(timezone.utc)
    create_notification(db, row.user_id, "Assistance request update", f"Your assistance request is {payload.status.lower().replace('_', ' ')}.", "assistance")
    db.commit()
    db.refresh(row)
    owner = db.query(User).filter(User.id == row.user_id).first()
    return _serialize_application(row, owner, db)


@router.patch("/applications/{application_id}/official-status")
def update_official_status(application_id: int, payload: DecisionInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only an administrator can verify official scheme status")
    allowed = {"NOT_SUBMITTED", "REFERENCE_PROVIDED", "SUBMITTED", "PENDING", "APPROVED", "REJECTED", "DISBURSED"}
    if payload.status not in allowed:
        raise HTTPException(status_code=422, detail="Unsupported official scheme status")
    if payload.status in {"APPROVED", "REJECTED", "DISBURSED"} and not (payload.reason and payload.reason.strip()):
        raise HTTPException(status_code=422, detail="Add a verification note or evidence reference for this official status")
    row = db.query(AssistanceApplication).filter(AssistanceApplication.id == application_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Assistance request not found")
    if row.scope != "GOVERNMENT":
        raise HTTPException(status_code=409, detail="Official government status applies only to Government assistance requests")
    row.official_status = payload.status
    row.official_verification_note = payload.reason.strip() if payload.reason else row.official_verification_note
    row.updated_at = datetime.now(timezone.utc)
    create_notification(db, row.user_id, "Official assistance status updated", f"Official status recorded as {payload.status.lower()}.", "assistance")
    db.commit()
    db.refresh(row)
    owner = db.query(User).filter(User.id == row.user_id).first()
    return _serialize_application(row, owner, db)


@router.get("/documents/{document_id}")
def download_assistance_document(document_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = db.query(AssistanceDocument).filter(AssistanceDocument.id == document_id).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Assistance document not found")
    application = db.query(AssistanceApplication).filter(AssistanceApplication.id == document.application_id).first()
    if application.user_id != current_user.id and not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="You cannot access this assistance document")
    path = private_document_path(document.file_name)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Assistance document is unavailable")
    from fastapi.responses import FileResponse
    return FileResponse(path, filename=f"assistance-document{path.suffix}")


@router.post("/applications/{application_id}/benefits", status_code=status.HTTP_201_CREATED)
def record_assistance_benefit(application_id: int, benefit_type: str = Form(...), amount: float | None = Form(None), received_at: date | None = Form(None), reference_number: str | None = Form(None), proof: UploadFile | None = File(None), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only an administrator can record benefit receipts")
    application = db.query(AssistanceApplication).filter(AssistanceApplication.id == application_id).first()
    if application is None or not (
        (application.scope == "COMMUNITY" and application.status == "APPROVED")
        or (application.scope == "GOVERNMENT" and application.official_status in {"APPROVED", "DISBURSED"})
    ):
        raise HTTPException(status_code=409, detail="Confirm the official benefit status before recording a receipt")
    proof_name = save_private_document(proof) if proof else None
    benefit = AssistanceBenefit(application_id=application.id, benefit_type=benefit_type.strip()[:160], amount=amount, received_at=received_at, reference_number=reference_number, verification_status="PENDING", proof_file_name=proof_name, recorded_by_id=current_user.id, created_at=datetime.now(timezone.utc))
    db.add(benefit)
    db.commit()
    db.refresh(benefit)
    create_notification(db, application.user_id, "Assistance benefit recorded", "A benefit record was added and is awaiting verification.", "assistance")
    db.commit()
    return _serialize_benefit(benefit)


@router.patch("/benefits/{benefit_id}/verify")
def verify_assistance_benefit(benefit_id: int, payload: BenefitStatusInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Only an administrator can verify benefit records")
    if payload.status not in {"VERIFIED", "REJECTED"}:
        raise HTTPException(status_code=422, detail="Status must be VERIFIED or REJECTED")
    benefit = db.query(AssistanceBenefit).filter(AssistanceBenefit.id == benefit_id).first()
    if benefit is None:
        raise HTTPException(status_code=404, detail="Benefit record not found")
    benefit.verification_status = payload.status
    db.commit()
    db.refresh(benefit)
    application = db.query(AssistanceApplication).filter(AssistanceApplication.id == benefit.application_id).first()
    create_notification(db, application.user_id, "Assistance benefit update", f"Benefit receipt was {payload.status.lower()}.", "assistance")
    db.commit()
    return _serialize_benefit(benefit)


@router.get("/benefits/{benefit_id}/proof")
def download_assistance_benefit_proof(benefit_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    benefit = db.query(AssistanceBenefit).filter(AssistanceBenefit.id == benefit_id).first()
    if benefit is None or not benefit.proof_file_name:
        raise HTTPException(status_code=404, detail="Benefit proof not found")
    application = db.query(AssistanceApplication).filter(AssistanceApplication.id == benefit.application_id).first()
    if application.user_id != current_user.id and not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="You cannot access this benefit proof")
    path = private_document_path(benefit.proof_file_name)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Benefit proof is unavailable")
    from fastapi.responses import FileResponse
    return FileResponse(path, filename=f"assistance-benefit-proof{path.suffix}")
