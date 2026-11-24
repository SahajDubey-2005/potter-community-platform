"""Community assistance requests for official government schemes.

These requests are NOT government applications or government approvals. Official
eligibility and submissions take place exclusively through official channels.
"""
from datetime import datetime, timezone
import json
import re
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import Session

from app.auth import get_current_user, user_has_any_permission
from app.database import get_db
from app.models import GovernmentSchemeRequest, GovernmentSchemeRequestDocument, User
from app.notifications import create_notification
from app.private_documents import private_document_path, save_private_document

router = APIRouter(prefix="/government-schemes", tags=["Government Scheme Assistance"])

# Canonical full scheme records are maintained in one backend catalog.
from app.scheme_catalog import SCHEMES, visible_catalog

MAX_FILES = 5
FINAL_STATES = {"CLOSED", "DECLINED"}
STATUSES = {"PENDING", "UNDER_REVIEW", "NEEDS_INFORMATION", "REFERRED_TO_OFFICIAL_PORTAL", "CLOSED", "DECLINED"}


class SchemeRequestInput(BaseModel):
    scheme_id: str = Field(min_length=3, max_length=120)
    full_name: str = Field(min_length=2, max_length=180)
    mobile: str = Field(min_length=7, max_length=20)
    email: EmailStr
    state: str = Field(min_length=2, max_length=100)
    district: str = Field(min_length=2, max_length=100)
    occupation: str = Field(min_length=2, max_length=160)
    consent: bool

    @field_validator("full_name", "mobile", "state", "district", "occupation", mode="after")
    @classmethod
    def clean_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("mobile", mode="after")
    @classmethod
    def check_mobile(cls, value: str) -> str:
        if not re.fullmatch(r"[+0-9()\- ]{7,20}", value) or len(re.sub(r"\D", "", value)) < 7:
            raise ValueError("Enter a valid phone number")
        return value

    @field_validator("consent", mode="after")
    @classmethod
    def check_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Consent is required")
        return value


class EligibilityInput(BaseModel):
    state: str = Field(min_length=2, max_length=100)
    occupation: str = Field(min_length=2, max_length=160)
    age: int | None = Field(default=None, ge=1, le=120)


class ReviewInput(BaseModel):
    status: str
    remark: str | None = Field(default=None, max_length=1000)


def _is_reviewer(user: User, db: Session) -> bool:
    return user_has_any_permission(user, ("schemes.review",), db)


def _scheme_tables_missing(error: Exception) -> bool:
    # If Alembic has not been run, the database exception can become a generic
    # browser "Failed to fetch" error. Explain the missing migration instead.
    detail = str(getattr(error, "orig", error)).lower()
    return (
        "government_scheme_requests" in detail
        and any(part in detail for part in ("no such table", "does not exist", "undefined table", "undefinedtable"))
    )


def _missing_migration_response() -> HTTPException:
    return HTTPException(
        status_code=503,
        detail='Government Schemes database tables are missing. From the backend folder run "python -m alembic upgrade head", then restart the backend.',
    )


def _serialize(row: GovernmentSchemeRequest, db: Session, include_personal: bool = True) -> dict:
    documents = db.query(GovernmentSchemeRequestDocument).filter(
        GovernmentSchemeRequestDocument.application_id == row.id
    ).order_by(GovernmentSchemeRequestDocument.id).all()
    payload = {
        "id": row.id,
        "reference": f"PCS-{row.created_at.year}-{row.id:06d}",
        "scheme_id": row.scheme_id,
        "scheme_title": row.scheme_title,
        "status": row.status,
        "review_remark": row.review_remark,
        "submitted_at": row.created_at.isoformat(),
        "updated_at": row.updated_at.isoformat(),
        "notice": "This is a Potter Community assistance request, not an official government application or approval.",
        "documents": [
            {"id": document.id, "name": document.original_name,
             "download_url": f"/government-schemes/documents/{document.id}"}
            for document in documents
        ],
    }
    if include_personal:
        payload.update({"user_id": row.user_id, "applicant": row.details})
    return payload


@router.get("/catalog")
def list_catalog():
    return visible_catalog()


@router.post("/eligibility")
def check_eligibility(
    inputs: EligibilityInput,
    current_user: User = Depends(get_current_user),
):
    state = inputs.state.strip().casefold()
    occupation = inputs.occupation.strip().casefold()
    pottery_related = any(token in occupation for token in ("potter", "pottery", "kumhar", "kumhaar", "clay", "ceramic", "matika", "mitti"))
    matches = []
    for scheme_id, scheme in SCHEMES.items():
        if scheme.get("visible") is False:
            continue  # Scholarship remains on the separate Scholarships page.
        reasons = []
        result = "POTENTIAL_MATCH"
        if not pottery_related:
            result = "MORE_DETAILS_NEEDED"
            reasons.append("Your occupation needs verification for the pottery-related activity described in this listing.")
        if scheme.get("scope") == "State" and scheme.get("state", "").casefold() != state:
            result = "STATE_MISMATCH"
            reasons.append(f"This scheme is listed for {scheme['state']} residents.")
        if scheme.get("min_age") is not None or scheme.get("max_age") is not None:
            if inputs.age is None and result == "POTENTIAL_MATCH":
                result = "MORE_DETAILS_NEEDED"
                reasons.append("Age is needed for preliminary screening.")
            elif inputs.age is not None:
                if inputs.age < scheme.get("min_age", 0) or inputs.age > scheme.get("max_age", 120):
                    result = "AGE_MISMATCH" if result == "POTENTIAL_MATCH" else result
                    reasons.append("Your stated age falls outside the age range described in the listing.")
        if scheme.get("applicant_type") == "GROUP":
            if result == "POTENTIAL_MATCH":
                result = "MORE_DETAILS_NEEDED"
            reasons.append("This programme is generally managed through eligible artisan groups, cooperatives or approved agencies.")
        if not reasons:
            reasons.append("Your state and any stated age do not rule this listing out; other official conditions still apply.")
        matches.append({
            "scheme_id": scheme_id,
            "scheme_title": scheme["title"],
            "result": result,
            "reasons": reasons,
        })
    return {
        "results": matches,
        "notice": "Indicative location/age screening only. This does not check residency documents, income, community categories, prior benefits, bank eligibility or scheme availability. Verify everything with the official authority before applying.",
    }


@router.post("/applications", status_code=status.HTTP_201_CREATED)
def submit_request(
    details: str = Form(...),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.membership_status != "APPROVED":
        raise HTTPException(status_code=403, detail="An approved community membership is required to request assistance")
    if len(details) > 10000:
        raise HTTPException(status_code=413, detail="Request data is too large")
    try:
        data = SchemeRequestInput.model_validate_json(details)
    except Exception as exc:
        from pydantic import ValidationError
        if isinstance(exc, ValidationError):
            raise HTTPException(status_code=422, detail="Check the application fields, email, mobile, and consent") from exc
        raise HTTPException(status_code=422, detail="Application details must be valid JSON") from exc
    scheme = SCHEMES.get(data.scheme_id)
    if scheme is None:
        raise HTTPException(status_code=404, detail="Government scheme is not listed")
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=422, detail=f"Upload no more than {MAX_FILES} documents")
    try:
        existing = db.query(GovernmentSchemeRequest.id).filter(
            GovernmentSchemeRequest.user_id == current_user.id,
            GovernmentSchemeRequest.scheme_id == data.scheme_id,
            GovernmentSchemeRequest.status.notin_(FINAL_STATES),
        ).first()
    except (OperationalError, ProgrammingError) as exc:
        if _scheme_tables_missing(exc):
            raise _missing_migration_response() from exc
        raise
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active community assistance request for this scheme")
    now = datetime.now(timezone.utc)
    row = GovernmentSchemeRequest(
        user_id=current_user.id,
        scheme_id=data.scheme_id,
        scheme_title=scheme["title"],
        details=data.model_dump(mode="json", exclude={"consent", "scheme_id"}),
        status="PENDING",
        created_at=now,
        updated_at=now,
    )
    saved_paths: list[Path] = []
    try:
        db.add(row)
        db.flush()
        for upload in files:
            stored_name = save_private_document(upload)
            saved_paths.append(private_document_path(stored_name))
            db.add(GovernmentSchemeRequestDocument(
                application_id=row.id,
                original_name=Path(upload.filename or "Supporting document").name[:255],
                stored_name=stored_name,
                created_at=now,
            ))
        create_notification(
            db, current_user.id, "Scheme assistance request received",
            f"We recorded your request for {scheme['title']}. This has not been sent to a government portal.",
            "government_scheme",
        )
        db.commit()
    except Exception:
        db.rollback()
        for path in saved_paths:
            path.unlink(missing_ok=True)
        raise
    db.refresh(row)
    return _serialize(row, db)


@router.get("/applications")
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(GovernmentSchemeRequest)
    if not _is_reviewer(current_user, db):
        query = query.filter(GovernmentSchemeRequest.user_id == current_user.id)
    try:
        rows = query.order_by(GovernmentSchemeRequest.created_at.desc(), GovernmentSchemeRequest.id.desc()).limit(500).all()
        return [_serialize(row, db) for row in rows]
    except (OperationalError, ProgrammingError) as exc:
        if _scheme_tables_missing(exc):
            raise _missing_migration_response() from exc
        raise


@router.get("/applications/{application_id}")
def get_request(application_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    row = db.query(GovernmentSchemeRequest).filter(GovernmentSchemeRequest.id == application_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Scheme assistance request not found")
    if row.user_id != current_user.id and not _is_reviewer(current_user, db):
        raise HTTPException(status_code=403, detail="You cannot access this request")
    return _serialize(row, db)


@router.patch("/applications/{application_id}/review")
def review_request(
    application_id: int, data: ReviewInput,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    if not _is_reviewer(current_user, db):
        raise HTTPException(status_code=403, detail="Government scheme review permission is required")
    row = db.query(GovernmentSchemeRequest).filter(GovernmentSchemeRequest.id == application_id).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Scheme assistance request not found")
    new_status = data.status.strip().upper()
    if new_status not in STATUSES:
        raise HTTPException(status_code=422, detail="Invalid community review status")
    row.status = new_status
    row.review_remark = data.remark.strip() if data.remark else None
    row.reviewed_by_id = current_user.id
    row.updated_at = datetime.now(timezone.utc)
    create_notification(
        db, row.user_id, "Scheme assistance request updated",
        f"Your Potter Community request for {row.scheme_title} is now {new_status.replace('_', ' ').lower()}. This is not a government approval.",
        "government_scheme",
    )
    db.commit()
    db.refresh(row)
    return _serialize(row, db)


@router.get("/documents/{document_id}")
def download_document(
    document_id: int,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    doc = db.query(GovernmentSchemeRequestDocument).filter(GovernmentSchemeRequestDocument.id == document_id).first()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    row = db.query(GovernmentSchemeRequest).filter(GovernmentSchemeRequest.id == doc.application_id).first()
    if row is None or (row.user_id != current_user.id and not _is_reviewer(current_user, db)):
        raise HTTPException(status_code=403, detail="You cannot access this document")
    path = private_document_path(doc.stored_name)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Document file is unavailable")
    return FileResponse(path, filename=doc.original_name)
