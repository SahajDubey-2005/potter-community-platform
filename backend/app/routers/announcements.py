"""Database-backed community announcements.

Only authorized community editors can create, publish, update or remove notices.
Read endpoints filter unpublished, expired and audience-restricted notices.
"""
from datetime import date, datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator, field_validator
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission, user_has_any_permission
from app.database import get_db
from app.models import Announcement, CommitteeAssignment, User
from app.notifications import create_notification

router = APIRouter(prefix="/announcements", tags=["Community Announcements"])

AnnouncementCategory = Literal["General", "Events", "Government Schemes", "Marketplace", "Important"]
AnnouncementAudience = Literal["ALL", "MEMBERS", "ARTISANS", "COMMITTEE"]
AnnouncementStatus = Literal["DRAFT", "PUBLISHED"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=5000)
    category: AnnouncementCategory = "General"
    audience: AnnouncementAudience = "ALL"
    is_public: bool = False
    is_pinned: bool = False
    status: AnnouncementStatus = "PUBLISHED"
    expires_at: datetime | None = None

    @field_validator("title", "description")
    @classmethod
    def nonblank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @model_validator(mode="after")
    def validate_visibility(self):
        if self.is_public and self.audience != "ALL":
            raise ValueError("Only All users announcements can be public")
        if self.status == "PUBLISHED" and self.expires_at and as_utc(self.expires_at) <= utc_now():
            raise ValueError("Published announcements must expire in the future")
        return self


class AnnouncementUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=160)
    description: str | None = Field(default=None, min_length=10, max_length=5000)
    category: AnnouncementCategory | None = None
    audience: AnnouncementAudience | None = None
    is_public: bool | None = None
    is_pinned: bool | None = None
    status: AnnouncementStatus | None = None
    expires_at: datetime | None = None

    @field_validator("title", "description")
    @classmethod
    def nonblank(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field cannot be blank")
        return cleaned


def _serialize(row: Announcement) -> dict:
    return {
        "id": row.id,
        "title": row.title,
        "description": row.description,
        "category": row.category,
        "audience": row.audience,
        "public": row.is_public,
        "is_public": row.is_public,
        "is_pinned": row.is_pinned,
        "status": row.status,
        "date": as_utc(row.published_at or row.created_at).strftime("%d %b %Y"),
        "created_at": as_utc(row.created_at).isoformat(),
        "updated_at": as_utc(row.updated_at).isoformat(),
        "published_at": as_utc(row.published_at).isoformat() if row.published_at else None,
        "expires_at": as_utc(row.expires_at).isoformat() if row.expires_at else None,
        "created_by_id": row.created_by_id,
    }


def _is_visible_now(row: Announcement, now: datetime) -> bool:
    return (
        row.status == "PUBLISHED"
        and row.published_at is not None
        and as_utc(row.published_at) <= now
        and (row.expires_at is None or as_utc(row.expires_at) > now)
    )


def _is_committee_member(user: User, db: Session) -> bool:
    if user_has_any_permission(user, ("announcements.manage",), db):
        return True
    if not user.role_id:
        return False
    today = date.today()
    return db.query(CommitteeAssignment.id).filter(
        CommitteeAssignment.user_id == user.id,
        CommitteeAssignment.role_id == user.role_id,
        CommitteeAssignment.status == "ACTIVE",
        (CommitteeAssignment.term_start.is_(None) | (CommitteeAssignment.term_start <= today)),
        (CommitteeAssignment.term_end.is_(None) | (CommitteeAssignment.term_end >= today)),
    ).first() is not None


def _can_view_audience(audience: str, user: User, db: Session) -> bool:
    if audience == "ALL":
        return True
    if audience == "MEMBERS":
        return user.membership_status == "APPROVED"
    if audience == "ARTISANS":
        role_name = (user.role_record.name or "").strip().upper() if user.role_record else ""
        return user.membership_status == "APPROVED" and (
            (user.role or "").strip().upper() == "ARTISAN" or "ARTISAN" in role_name
        )
    if audience == "COMMITTEE":
        return _is_committee_member(user, db)
    return False


def _notify_audience(db: Session, announcement: Announcement, author_id: int) -> int:
    # Notifications go only to active accounts allowed to view this audience.
    sent = 0
    for user in db.query(User).filter(User.is_active.is_(True)).all():
        if user.id != author_id and _can_view_audience(announcement.audience, user, db):
            create_notification(
                db, user.id,
                "New community announcement",
                f"{announcement.title}: {announcement.description[:280]}",
                "announcements",
            )
            sent += 1
    return sent


@router.get("/public")
def list_public(db: Session = Depends(get_db)):
    now = utc_now()
    rows = db.query(Announcement).filter(
        Announcement.status == "PUBLISHED",
        Announcement.is_public.is_(True),
        Announcement.audience == "ALL",
    ).order_by(Announcement.is_pinned.desc(), Announcement.published_at.desc(), Announcement.id.desc()).limit(300).all()
    return [_serialize(row) for row in rows if _is_visible_now(row, now)]


@router.get("/manage")
def list_managed(
    current_user: User = Depends(require_permission("announcements.manage")),
    db: Session = Depends(get_db),
):
    rows = db.query(Announcement).order_by(Announcement.updated_at.desc(), Announcement.id.desc()).limit(500).all()
    return [_serialize(row) for row in rows]


@router.get("")
def list_visible(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = utc_now()
    rows = db.query(Announcement).filter(Announcement.status == "PUBLISHED").order_by(
        Announcement.is_pinned.desc(), Announcement.published_at.desc(), Announcement.id.desc()
    ).limit(500).all()
    return [_serialize(row) for row in rows if _is_visible_now(row, now) and _can_view_audience(row.audience, current_user, db)]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementCreate,
    current_user: User = Depends(require_permission("announcements.manage")),
    db: Session = Depends(get_db),
):
    now = utc_now()
    row = Announcement(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        audience=payload.audience,
        is_public=payload.is_public,
        is_pinned=payload.is_pinned,
        status=payload.status,
        expires_at=as_utc(payload.expires_at),
        created_by_id=current_user.id,
        created_at=now,
        updated_at=now,
        published_at=now if payload.status == "PUBLISHED" else None,
    )
    db.add(row)
    db.flush()
    notification_count = _notify_audience(db, row, current_user.id) if row.status == "PUBLISHED" else 0
    db.commit()
    db.refresh(row)
    return {**_serialize(row), "notified_members": notification_count}


@router.patch("/{announcement_id}")
def update_announcement(
    announcement_id: int,
    payload: AnnouncementUpdate,
    current_user: User = Depends(require_permission("announcements.manage")),
    db: Session = Depends(get_db),
):
    row = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Announcement not found")
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        return _serialize(row)
    if any(key in changes and changes[key] is None for key in (
        "title", "description", "category", "audience", "status", "is_public", "is_pinned"
    )):
        raise HTTPException(status_code=422, detail="Announcement fields cannot be null")
    if "expires_at" in changes:
        changes["expires_at"] = as_utc(changes["expires_at"])
    merged = {field: changes.get(field, getattr(row, field)) for field in (
        "title", "description", "category", "audience", "status", "is_public", "is_pinned", "expires_at"
    )}
    if merged["is_public"] and merged["audience"] != "ALL":
        raise HTTPException(status_code=422, detail="Only All users announcements can be public")
    if merged["status"] == "PUBLISHED" and merged["expires_at"] and as_utc(merged["expires_at"]) <= utc_now():
        raise HTTPException(status_code=422, detail="Published announcements must expire in the future")
    just_published = row.status != "PUBLISHED" and merged["status"] == "PUBLISHED"
    for key, value in changes.items():
        setattr(row, key, value)
    now = utc_now()
    if just_published:
        row.published_at = now
    row.updated_at = now
    notification_count = _notify_audience(db, row, current_user.id) if just_published else 0
    db.commit()
    db.refresh(row)
    return {**_serialize(row), "notified_members": notification_count}


@router.delete("/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    current_user: User = Depends(require_permission("announcements.manage")),
    db: Session = Depends(get_db),
):
    row = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(row)
    db.commit()
    return {"message": "Announcement deleted", "id": announcement_id}
