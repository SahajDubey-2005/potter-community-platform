from datetime import date, datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission, user_has_any_permission
from app.database import get_db
from app.models import CommunityEvent, EventRegistration, Role, User
from app.notifications import create_notification


router = APIRouter(prefix="/events", tags=["Community events"])


class EventInput(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=5, max_length=1200)
    announcement: str | None = Field(default=None, max_length=600)
    date: date
    time: str = Field(min_length=4, max_length=10)
    venue: str = Field(min_length=2, max_length=160)
    registration_enabled: bool = True


class EventDecision(BaseModel):
    action: Literal["APPROVE", "REJECT"]
    remark: str | None = Field(default=None, max_length=1000)


class AttendanceInput(BaseModel):
    status: Literal["ATTENDED", "ABSENT"]


def _can_manage(user: User, db: Session) -> bool:
    return user_has_any_permission(user, ("events.manage",), db)


def _serialize_event(event: CommunityEvent, current_user: User, db: Session, can_manage: bool) -> dict:
    registrations_query = db.query(EventRegistration, User).join(User, User.id == EventRegistration.user_id).filter(EventRegistration.event_id == event.id)
    if not can_manage:
        registrations_query = registrations_query.filter(EventRegistration.user_id == current_user.id)
    registrations = registrations_query.order_by(EventRegistration.registered_at).all()
    rows = [{"user_id": registration.user_id, "name": member.full_name, "registeredAt": registration.registered_at.isoformat(), "attendanceStatus": registration.attendance_status, "attendanceMarkedAt": registration.attendance_marked_at.isoformat() if registration.attendance_marked_at else None} for registration, member in registrations]
    attendance = {row["name"]: {"status": "Attended" if row["attendanceStatus"] == "ATTENDED" else "Absent", "markedAt": row["attendanceMarkedAt"]} for row in rows if row["attendanceStatus"]}
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "announcement": event.announcement,
        "date": event.event_date.isoformat(),
        "time": event.event_time,
        "venue": event.venue,
        "registrationEnabled": event.registration_enabled,
        "status": event.status,
        "published": event.status == "PUBLISHED",
        "createdAt": event.created_at.isoformat(),
        "createdBy": db.query(User.full_name).filter(User.id == event.created_by_id).scalar() or "Authorized organizer",
        "registrations": rows,
        "registrationCount": db.query(EventRegistration.id).filter(EventRegistration.event_id == event.id).count(),
        "attendance": attendance,
        "approvalRemark": event.approval_remark,
    }


@router.get("")
def list_events(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    can_manage = _can_manage(current_user, db)
    query = db.query(CommunityEvent)
    if can_manage:
        query = query.filter((CommunityEvent.status == "PUBLISHED") | (CommunityEvent.created_by_id == current_user.id) | (CommunityEvent.status == "PENDING_APPROVAL"))
    else:
        query = query.filter(CommunityEvent.status == "PUBLISHED")
    events = query.order_by(CommunityEvent.event_date, CommunityEvent.event_time).all()
    return [_serialize_event(event, current_user, db, can_manage) for event in events]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_event(data: EventInput, current_user: User = Depends(require_permission("events.manage")), db: Session = Depends(get_db)):
    if data.date < date.today():
        raise HTTPException(status_code=422, detail="Event date cannot be in the past")
    now = datetime.now(timezone.utc)
    event = CommunityEvent(title=data.title.strip(), description=data.description.strip(), announcement=data.announcement.strip() if data.announcement else None, event_date=data.date, event_time=data.time, venue=data.venue.strip(), registration_enabled=data.registration_enabled, status="PENDING_APPROVAL", created_by_id=current_user.id, created_at=now, updated_at=now)
    db.add(event)
    db.flush()
    approvers = db.query(User).join(Role, User.role_id == Role.id).filter(User.is_active.is_(True), Role.is_active.is_(True), Role.name == "President / Head").all()
    for approver in approvers:
        create_notification(db, approver.id, "Community event approval needed", f"{current_user.full_name} submitted {event.title} for approval.", "events")
    db.commit()
    db.refresh(event)
    return _serialize_event(event, current_user, db, True)


@router.patch("/{event_id}/decision")
def decide_event(event_id: int, data: EventDecision, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user_has_any_permission(current_user, ("community.approve",), db, allow_admin=False):
        raise HTTPException(status_code=403, detail="President approval permission is required")
    event = db.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=409, detail="This event has already been reviewed")
    event.status = "PUBLISHED" if data.action == "APPROVE" else "REJECTED"
    event.approved_by_id = current_user.id
    event.approval_remark = data.remark.strip() if data.remark else None
    event.updated_at = datetime.now(timezone.utc)
    create_notification(db, event.created_by_id, "Community event review update", f"Your event {event.title} was {event.status.lower()}.", "events")
    db.commit()
    db.refresh(event)
    return _serialize_event(event, current_user, db, True)


@router.post("/{event_id}/registrations", status_code=status.HTTP_201_CREATED)
def register_for_event(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.membership_status != "APPROVED":
        raise HTTPException(status_code=403, detail="Only verified members can register for community events")
    event = db.query(CommunityEvent).filter(CommunityEvent.id == event_id, CommunityEvent.status == "PUBLISHED").first()
    if event is None:
        raise HTTPException(status_code=404, detail="Published event not found")
    if not event.registration_enabled:
        raise HTTPException(status_code=409, detail="Registration is closed for this event")
    if event.event_date < date.today():
        raise HTTPException(status_code=409, detail="Registration is closed because this event has passed")
    registration = db.query(EventRegistration).filter(EventRegistration.event_id == event.id, EventRegistration.user_id == current_user.id).first()
    if registration:
        raise HTTPException(status_code=409, detail="You are already registered for this event")
    registration = EventRegistration(event_id=event.id, user_id=current_user.id, registered_at=datetime.now(timezone.utc))
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return {"event_id": event.id, "registered": True, "registered_at": registration.registered_at.isoformat()}


@router.patch("/{event_id}/attendance/{user_id}")
def mark_attendance(event_id: int, user_id: int, data: AttendanceInput, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not _can_manage(current_user, db):
        raise HTTPException(status_code=403, detail="Event organizer permission is required to mark attendance")
    registration = db.query(EventRegistration).filter(EventRegistration.event_id == event_id, EventRegistration.user_id == user_id).first()
    if registration is None:
        raise HTTPException(status_code=404, detail="Member is not registered for this event")
    registration.attendance_status = data.status
    registration.attendance_marked_at = datetime.now(timezone.utc)
    registration.attendance_marked_by_id = current_user.id
    db.commit()
    return {"event_id": event_id, "user_id": user_id, "status": data.status, "marked_at": registration.attendance_marked_at.isoformat()}
