from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user, require_role
from app.models import User, Verification
from app.schemas import (
    VerificationCreate,
    VerificationResponse,
    VerificationReview
)


router = APIRouter(
    prefix="/verification",
    tags=["Verification"]
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


@router.patch(
    "/{verification_id}/review",
    response_model=VerificationResponse
)
def review_verification(
    verification_id: int,
    review: VerificationReview,
    current_user: User = Depends(require_role("ADMIN")),
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

    db.commit()
    db.refresh(verification)

    return verification