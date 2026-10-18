from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, require_permission, user_has_any_permission
from app.models import User, Verification
from app.schemas import (
    VerificationCreate,
    VerificationResponse,
    VerificationReview
)
from app.private_documents import private_document_path, save_private_document
from app.notifications import create_notification


router = APIRouter(
    prefix="/verification",
    tags=["Verification"]
)


@router.post("/upload", response_model=VerificationResponse)
def upload_verification_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stored_name = save_private_document(file)
    now = datetime.now(timezone.utc).isoformat()
    verification = Verification(
        user_id=current_user.id,
        document_type=document_type.strip(),
        document_url=stored_name,
        status="PENDING",
        admin_remark=None,
        created_at=now,
        updated_at=now,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)
    return verification


@router.get("/{verification_id}/file")
def download_verification_document(
    verification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verification = (
        db.query(Verification)
        .filter(Verification.id == verification_id)
        .first()
    )
    if verification is None:
        raise HTTPException(status_code=404, detail="Document not found")

    is_admin = (
        (current_user.role or "").strip().upper() == "ADMIN"
        or (
            current_user.role_record is not None
            and current_user.role_record.name.strip().upper() == "ADMIN"
        )
    )
    can_review_sensitive_documents = user_has_any_permission(current_user, ("documents.review",), db)
    if not is_admin and not can_review_sensitive_documents and verification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You cannot access this document")

    path = private_document_path(verification.document_url)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Document file is unavailable")
    return FileResponse(
        path,
        filename=f"{verification.document_type}{path.suffix}",
        content_disposition_type="inline",
    )


@router.post("/", response_model=VerificationResponse)
def create_verification(
    verification: VerificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc).isoformat()

    new_verification = Verification(
        user_id=current_user.id,
        document_type=verification.document_type,
        document_url=verification.document_url,
        status="PENDING",
        admin_remark=None,
        created_at=now,
        updated_at=now
    )

    db.add(new_verification)
    db.commit()
    db.refresh(new_verification)

    return new_verification


# --------------------------------------------------
# LIST VERIFICATION APPLICATIONS
# --------------------------------------------------

@router.get("/", response_model=list[VerificationResponse])
def list_verifications(
    current_user: User = Depends(require_permission("documents.review")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Verification)
        .order_by(Verification.created_at.desc())
        .all()
    )


@router.patch(
    "/{verification_id}/review",
    response_model=VerificationResponse
)
def review_verification(
    verification_id: int,
    review: VerificationReview,
    current_user: User = Depends(require_permission("documents.review")),
    db: Session = Depends(get_db)
):
    verification = (
        db.query(Verification)
        .filter(Verification.id == verification_id)
        .first()
    )

    if verification is None:
        raise HTTPException(
            status_code=404,
            detail="Verification not found"
        )

    if review.status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be APPROVED or REJECTED"
        )

    verification.status = review.status    # type: ignore[assignment]
    verification.admin_remark = review.admin_remark    # type: ignore[assignment]
    verification.updated_at = datetime.now(timezone.utc).isoformat()  # type: ignore[assignment]

    create_notification(
        db,
        verification.user_id,
        "Document review completed",
        f"Your {verification.document_type} was {review.status.lower()}.",
        "verification",
    )

    db.commit()
    db.refresh(verification)

    return verification


# --------------------------------------------------
# COMMUNITY MEMBERSHIP REVIEW
# --------------------------------------------------

@router.patch("/members/{user_id}/review")
def review_membership(
    user_id: int,
    review: VerificationReview,
    current_user: User = Depends(require_permission("membership.review")),
    db: Session = Depends(get_db),
):
    member = db.query(User).filter(User.id == user_id).first()

    if member is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if review.status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be APPROVED or REJECTED",
        )

    if member.membership_status != "PENDING":
        raise HTTPException(
            status_code=409,
            detail="Membership application has already been reviewed",
        )

    if review.status == "APPROVED":
        year = datetime.now(timezone.utc).year
        member.membership_number = f"POT-{year}-{member.id:06d}"

    member.membership_status = review.status

    create_notification(
        db,
        member.id,
        "Membership application update",
        "Your membership application was approved." if review.status == "APPROVED" else "Your membership application was not approved.",
        "membership",
    )

    try:
        db.commit()
        db.refresh(member)
    except Exception:
        db.rollback()
        raise

    return {
        "user_id": member.id,
        "membership_status": member.membership_status,
        "membership_number": member.membership_number,
        "message": (
            "Membership approved successfully"
            if review.status == "APPROVED"
            else "Membership rejected"
        ),
    }
