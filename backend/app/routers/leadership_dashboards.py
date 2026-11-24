"""Read-only, permission-scoped dashboards for seven existing leadership roles.

No database changes. All numbers are computed from the existing database, with
ordinary members unable to query leadership data. The verified active role is
resolved on the server; a caller cannot request someone else's role dashboard.
"""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, user_has_any_permission
from app.database import get_db
from app.models import (
    ActivityLog, Announcement, CommitteeAssignment, CommunityEvent,
    CommunityRecord, EmergencyRequest, FinancialRefund,
    FinancialTransaction, Notification, Role, ScholarshipApplication,
    SupportInquiry, User, Verification,
)

router = APIRouter(prefix="/leadership", tags=["Leadership dashboards"])

LEADERSHIP_ROLES = {
    "SUPER ADMIN": "Super Admin",
    "ADMIN": "Admin",
    "PRESIDENT / HEAD": "President / Head",
    "SECRETARY": "Secretary",
    "TREASURER": "Treasurer",
    "DIRECTOR": "Director",
    "NOMINATED DIRECTOR": "Nominated Director",
}


def _role_for_user(user: User, db: Session) -> str:
    """Use the existing dynamic role + appointment validity, not a request param."""
    dynamic = user.role_record
    legacy_name = str(user.role or "").strip().upper().replace("_", " ")
    if dynamic is None:
        # Platform administrators are sometimes provisioned with a legacy role.
        return LEADERSHIP_ROLES.get(legacy_name, "") if legacy_name in {"SUPER ADMIN", "ADMIN"} else ""
    if not dynamic.is_active:
        return ""
    role_name = str(dynamic.name or "").strip().upper().replace("_", " ")
    role = LEADERSHIP_ROLES.get(role_name, "")
    if not role:
        return ""
    history = db.query(CommitteeAssignment).filter(
        CommitteeAssignment.user_id == user.id,
        CommitteeAssignment.role_id == dynamic.id,
    ).first()
    if history is not None:
        now = date.today()
        current = db.query(CommitteeAssignment).filter(
            CommitteeAssignment.user_id == user.id,
            CommitteeAssignment.role_id == dynamic.id,
            CommitteeAssignment.status == "ACTIVE",
        ).order_by(CommitteeAssignment.assigned_at.desc()).first()
        if not current or (current.term_start and current.term_start > now) or (current.term_end and current.term_end < now):
            return ""
    return role


def _count(db: Session, model, *where) -> int:
    return int(db.query(func.count()).select_from(model).filter(*where).scalar() or 0)


def _metric(metrics: list, key: str, label: str, number, description: str, fmt="number"):
    metrics.append({"key": key, "label": label, "value": number, "description": description, "format": fmt})


def _allowed(user: User, db: Session, *permissions: str) -> bool:
    return user_has_any_permission(user, tuple(permissions), db)


def _actions(role: str, user: User, db: Session) -> list[dict]:
    all_actions = {
        "Super Admin": [("Member approvals", "members", "membership.review"), ("Roles & committee", "committee-roles", "roles.manage"), ("Financial records", "payments", "finance.manage"), ("Events", "events", None), ("Announcements", "announcements", None), ("Official records", "community-records", "community.records.view"), ("Emergency support", "emergency", "emergency.manage"), ("Support enquiries", "support-inquiries", "membership.review")],
        "Admin": [("Member approvals", "members", "membership.review"), ("Documents", "documents", "documents.review"), ("Emergency support", "emergency", "emergency.manage"), ("Announcements", "announcements", None), ("Events", "events", None), ("Official records", "community-records", "community.records.view"), ("Support enquiries", "support-inquiries", "membership.review")],
        "President / Head": [("Review memberships", "members", "community.approve"), ("Event approvals", "events", "community.approve"), ("Official records", "community-records", "community.approve"), ("Scholarships", "scholarships", None), ("Announcements", "announcements", None)],
        "Secretary": [("Meeting minutes", "community-records", "community.records.manage"), ("Announcements", "announcements", None), ("Events", "events", None), ("Member directory", "members", "membership.view")],
        "Treasurer": [("Payments & fees", "payments", "finance.manage"), ("Events", "events", None), ("Member directory", "members", "membership.view"), ("Announcements", "announcements", None)],
        "Director": [("Member directory", "members", "membership.view"), ("Events", "events", None), ("Scholarships", "scholarships", None), ("Announcements", "announcements", None), ("Official records", "community-records", "community.records.view")],
        "Nominated Director": [("Events", "events", None), ("Announcements", "announcements", None), ("Member directory", "members", "membership.view"), ("Official records", "community-records", "community.records.view")],
    }
    rows = []
    for label, page, permission in all_actions.get(role, []):
        if permission is None or _allowed(user, db, permission):
            rows.append({"label": label, "page": page})
    rows.append({"label": "My profile", "page": "profile"})
    return rows


@router.get("/dashboard")
def leadership_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = _role_for_user(current_user, db)
    if not role:
        raise HTTPException(status_code=403, detail="An active leadership role is required for this dashboard")
    metrics: list[dict] = []
    today = date.today()
    user_id = current_user.id

    member_view = _allowed(current_user, db, "membership.view", "membership.review", "reports.view")
    member_review = _allowed(current_user, db, "membership.review")
    records_view = _allowed(current_user, db, "community.records.view", "community.records.manage", "community.approve", "reports.view")
    records_manage = _allowed(current_user, db, "community.records.manage")
    event_manage = _allowed(current_user, db, "events.manage")
    president_approval = user_has_any_permission(current_user, ("community.approve",), db, allow_admin=False)
    finance_access = _allowed(current_user, db, "finance.manage")

    # Safe shared information available to signed-in community leaders.
    if role in {"Director", "Nominated Director"}:
        _metric(metrics, "upcoming_events", "Upcoming events", _count(db, CommunityEvent, CommunityEvent.status == "PUBLISHED", CommunityEvent.event_date >= today), "Published future events")
        _metric(metrics, "published_announcements", "Published announcements", _count(db, Announcement, Announcement.status == "PUBLISHED", Announcement.audience == "ALL", (Announcement.expires_at.is_(None) | (Announcement.expires_at > datetime.now(timezone.utc).replace(tzinfo=None)))), "Community-wide active notices")
        _metric(metrics, "my_active_assignments", "My active assignments", _count(db, CommitteeAssignment, CommitteeAssignment.user_id == user_id, CommitteeAssignment.status == "ACTIVE", (CommitteeAssignment.term_start.is_(None) | (CommitteeAssignment.term_start <= today)), (CommitteeAssignment.term_end.is_(None) | (CommitteeAssignment.term_end >= today))), "My current committee appointments")

    if member_view and role in {"Super Admin", "Admin", "President / Head", "Director", "Nominated Director"}:
        _metric(metrics, "approved_members", "Approved members", _count(db, User, User.membership_status == "APPROVED", User.is_active.is_(True)), "Currently active approved accounts")

    if member_review and role in {"Super Admin", "Admin"}:
        _metric(metrics, "pending_members", "Membership requests", _count(db, User, User.membership_status == "PENDING", User.is_active.is_(True)), "Accounts awaiting approval")

    if _allowed(current_user, db, "documents.review") and role in {"Super Admin", "Admin"}:
        _metric(metrics, "pending_documents", "Documents to review", _count(db, Verification, Verification.status == "PENDING"), "Unreviewed document submissions")

    if _allowed(current_user, db, "emergency.manage") and role in {"Super Admin", "Admin"}:
        _metric(metrics, "open_emergencies", "Open emergency requests", _count(db, EmergencyRequest, EmergencyRequest.status.in_(["NEW", "PENDING", "UNDER_REVIEW", "IN_PROGRESS"])), "Community support requests requiring attention")

    if _allowed(current_user, db, "membership.review") and role in {"Super Admin", "Admin"}:
        _metric(metrics, "open_enquiries", "Open enquiries", _count(db, SupportInquiry, SupportInquiry.status.in_(["NEW", "OPEN", "IN_PROGRESS"])), "Unresolved community enquiries")

    if role in {"Super Admin", "Admin", "President / Head", "Secretary"}:
        if event_manage or president_approval:
            _metric(metrics, "events_waiting_approval", "Events awaiting approval", _count(db, CommunityEvent, CommunityEvent.status == "PENDING_APPROVAL"), "Submitted events awaiting a decision")
        _metric(metrics, "upcoming_events", "Upcoming events", _count(db, CommunityEvent, CommunityEvent.status == "PUBLISHED", CommunityEvent.event_date >= today), "Published future community events")

    if records_view and role in {"Super Admin", "Admin", "President / Head", "Secretary", "Director"}:
        if _allowed(current_user, db, "community.approve"):
            _metric(metrics, "pending_records", "Records awaiting approval", _count(db, CommunityRecord, CommunityRecord.status == "PENDING_APPROVAL"), "Pending community record approvals")
        _metric(metrics, "published_records", "Published records", _count(db, CommunityRecord, CommunityRecord.status == "PUBLISHED"), "Accessible official community records")

    if records_manage and role == "Secretary":
        _metric(metrics, "my_record_drafts", "My record drafts", _count(db, CommunityRecord, CommunityRecord.created_by_id == user_id, CommunityRecord.status == "DRAFT"), "Unsubmitted meeting notes and records")

    if role == "President / Head" and president_approval:
        # Review stage is stored in users.application_details JSON. Count in
        # Python for cross-database compatibility (SQLite and PostgreSQL).
        pending = db.query(User.application_details).filter(User.membership_status == "PENDING", User.is_active.is_(True)).all()
        awaiting = sum(1 for (details,) in pending if isinstance(details, dict) and details.get("review_stage") == "PRESIDENT_REVIEW")
        _metric(metrics, "president_membership_queue", "Members awaiting decision", awaiting, "Membership cases forwarded for final approval")
        _metric(metrics, "president_scholarship_queue", "Scholarship decisions", _count(db, ScholarshipApplication, ScholarshipApplication.review_stage == "PRESIDENT_REVIEW"), "Scholarship requests at the president's review stage")

    if role == "Treasurer" or (role == "Super Admin" and finance_access):
        if finance_access:
            _metric(metrics, "pending_finance", "Payments to verify", _count(db, FinancialTransaction, FinancialTransaction.status == "PENDING_VERIFICATION"), "Transactions awaiting financial verification")
            _metric(metrics, "verified_finance", "Verified payments", _count(db, FinancialTransaction, FinancialTransaction.status == "VERIFIED"), "Verified community payment records")
            _metric(metrics, "unreconciled_finance", "Unreconciled payments", _count(db, FinancialTransaction, FinancialTransaction.status == "VERIFIED", FinancialTransaction.reconciled.is_(False)), "Verified transactions awaiting reconciliation")
            _metric(metrics, "pending_refunds", "Refund requests", _count(db, FinancialRefund, FinancialRefund.status == "REQUESTED"), "Refund requests awaiting review")
            verified_sum = db.query(func.sum(FinancialTransaction.amount)).filter(FinancialTransaction.status == "VERIFIED").scalar()
            _metric(metrics, "verified_volume", "Verified transaction value", float(verified_sum or 0), "Recorded verified community payments", "currency")

    if role == "Secretary":
        _metric(metrics, "published_announcements", "Active announcements", _count(db, Announcement, Announcement.status == "PUBLISHED", Announcement.audience == "ALL", (Announcement.expires_at.is_(None) | (Announcement.expires_at > datetime.now(timezone.utc).replace(tzinfo=None)))), "Visible current community-wide notices")

    if role == "Super Admin":
        _metric(metrics, "active_accounts", "Active accounts", _count(db, User, User.is_active.is_(True)), "Active registered platform accounts")

    latest_events = db.query(CommunityEvent).filter(
        CommunityEvent.status == "PUBLISHED", CommunityEvent.event_date >= today
    ).order_by(CommunityEvent.event_date.asc(), CommunityEvent.id.asc()).limit(4).all()
    assignment = db.query(CommitteeAssignment).filter(
        CommitteeAssignment.user_id == user_id,
        CommitteeAssignment.role_id == current_user.role_id,
        CommitteeAssignment.status == "ACTIVE",
        (CommitteeAssignment.term_start.is_(None) | (CommitteeAssignment.term_start <= today)),
        (CommitteeAssignment.term_end.is_(None) | (CommitteeAssignment.term_end >= today)),
    ).order_by(CommitteeAssignment.assigned_at.desc()).first()

    return {
        "role": role,
        "member": {"name": current_user.full_name, "membership_status": current_user.membership_status},
        "metrics": metrics,
        "actions": _actions(role, current_user, db),
        "upcoming_events": [
            {"id": ev.id, "title": ev.title, "date": ev.event_date.isoformat(), "venue": ev.venue}
            for ev in latest_events
        ],
        "my_assignment": {
            "note": assignment.assignment_note,
            "term_start": assignment.term_start.isoformat() if assignment.term_start else None,
            "term_end": assignment.term_end.isoformat() if assignment.term_end else None,
        } if assignment else None,
    }
