from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission, user_has_any_permission
from app.database import get_db
from app.models import CommunityRecord, Role, User
from app.notifications import create_notification


router = APIRouter(prefix="/community/records", tags=["Community records"])


class CommunityRecordInput(BaseModel):
    record_type: Literal["NOTICE", "MEETING", "MINUTES", "ACTIVITY"]
    title: str = Field(min_length=3, max_length=160)
    content: str = Field(min_length=5, max_length=5000)
    scheduled_at: datetime | None = None
    venue: str | None = Field(default=None, max_length=255)
    submit_for_approval: bool = True


class RecordDecision(BaseModel):
    decision: Literal["APPROVED", "REJECTED"]
    remark: str | None = Field(default=None, max_length=1000)


def serialize_record(record: CommunityRecord, author_name: str) -> dict:
    return {
        "id": record.id,
        "record_type": record.record_type,
        "title": record.title,
        "content": record.content,
        "scheduled_at": record.scheduled_at.isoformat() if record.scheduled_at else None,
        "venue": record.venue,
        "status": record.status,
        "created_by_id": record.created_by_id,
        "created_by": author_name,
        "approved_by_id": record.approved_by_id,
        "approval_remark": record.approval_remark,
        "created_at": record.created_at.isoformat(),
        "updated_at": record.updated_at.isoformat(),
    }


@router.get("")
def list_community_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    can_view_all = user_has_any_permission(
        current_user,
        ("community.records.view", "community.records.manage", "community.approve", "reports.view"),
        db,
    )
    query = db.query(CommunityRecord, User.full_name).join(User, User.id == CommunityRecord.created_by_id)
    if can_view_all:
        query = query.filter(
            (CommunityRecord.status == "PUBLISHED")
            | (CommunityRecord.created_by_id == current_user.id)
            | (CommunityRecord.status == "PENDING_APPROVAL" if user_has_any_permission(current_user, ("community.approve",), db) else False)
        )
    else:
        query = query.filter(CommunityRecord.status == "PUBLISHED")
    return [serialize_record(record, author) for record, author in query.order_by(CommunityRecord.updated_at.desc()).all()]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_community_record(
    data: CommunityRecordInput,
    current_user: User = Depends(require_permission("community.records.manage")),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    record = CommunityRecord(
        record_type=data.record_type,
        title=data.title.strip(),
        content=data.content.strip(),
        scheduled_at=data.scheduled_at,
        venue=data.venue.strip() if data.venue else None,
        status="PENDING_APPROVAL" if data.submit_for_approval else "DRAFT",
        created_by_id=current_user.id,
        created_at=now,
        updated_at=now,
    )
    db.add(record)
    db.flush()
    if data.submit_for_approval:
        approvers = db.query(User).outerjoin(Role, User.role_id == Role.id).filter(
            User.is_active.is_(True),
            (Role.name.in_(["ADMIN", "President / Head"])) | (User.role == "ADMIN"),
        ).all()
        for approver in approvers:
            if approver.id != current_user.id:
                create_notification(
                    db,
                    approver.id,
                    "Community record awaiting approval",
                    f'{record.record_type.title()} "{record.title}" is ready for review.',
                    "community",
                )
    db.commit()
    db.refresh(record)
    return serialize_record(record, current_user.full_name)


@router.patch("/{record_id}")
def update_community_record(
    record_id: int,
    data: CommunityRecordInput,
    current_user: User = Depends(require_permission("community.records.manage")),
    db: Session = Depends(get_db),
):
    record = db.query(CommunityRecord).filter(CommunityRecord.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Community record not found")
    if record.created_by_id != current_user.id or record.status not in {"DRAFT", "REJECTED"}:
        raise HTTPException(status_code=409, detail="Only your draft or rejected record can be edited")

    record.record_type = data.record_type
    record.title = data.title.strip()
    record.content = data.content.strip()
    record.scheduled_at = data.scheduled_at
    record.venue = data.venue.strip() if data.venue else None
    record.status = "PENDING_APPROVAL" if data.submit_for_approval else "DRAFT"
    record.approval_remark = None
    record.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    return serialize_record(record, current_user.full_name)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_community_record(
    record_id: int,
    current_user: User = Depends(require_permission("community.records.manage")),
    db: Session = Depends(get_db),
):
    record = db.query(CommunityRecord).filter(CommunityRecord.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Community record not found")
    if record.created_by_id != current_user.id or record.status not in {"DRAFT", "REJECTED"}:
        raise HTTPException(status_code=409, detail="Only your draft or rejected record can be deleted")
    db.delete(record)
    db.commit()


@router.patch("/{record_id}/decision")
def decide_community_record(
    record_id: int,
    data: RecordDecision,
    current_user: User = Depends(require_permission("community.approve")),
    db: Session = Depends(get_db),
):
    record = db.query(CommunityRecord).filter(CommunityRecord.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail="Community record not found")
    if record.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=409, detail="This record is not awaiting approval")
    if data.decision == "REJECTED" and not (data.remark or "").strip():
        raise HTTPException(status_code=422, detail="Add a reason when rejecting a community record")

    record.status = "PUBLISHED" if data.decision == "APPROVED" else "REJECTED"
    record.approved_by_id = current_user.id
    record.approval_remark = data.remark.strip() if data.remark else None
    record.updated_at = datetime.now(timezone.utc)
    create_notification(
        db,
        record.created_by_id,
        "Community record reviewed",
        f'Your {record.record_type.lower()} "{record.title}" was {data.decision.lower()}.',
        "community",
    )
    db.commit()
    db.refresh(record)
    return serialize_record(record, current_user.full_name)
