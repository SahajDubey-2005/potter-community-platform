"""Real, read-only dashboards for community officers and marketplace sellers.

Role names, active appointments, and permissions are resolved from the authenticated
account. No client-provided role or user identifier is trusted. No table changes.
"""
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, user_has_any_permission
from app.database import get_db
from app.models import (
    Announcement, CommitteeAssignment, CommunityEvent, EmergencyRequest,
    EventRegistration, MarketplaceCourierShipment, MarketplaceOrder,
    MarketplaceProduct, MatrimonialProfile, Notification, Role,
    ScholarshipApplication, ScholarshipScheme, SupportInquiry, User,
    Verification,
)

router = APIRouter(prefix="/role-dashboards", tags=["Department and seller dashboards"])

OFFICER_ROLES = {
    "SCHOLARSHIP OFFICER": "Scholarship Officer",
    "MATRIMONIAL COORDINATOR": "Matrimonial Coordinator",
    "EVENT COORDINATOR": "Event Coordinator",
    "VERIFICATION OFFICER": "Verification Officer",
    "MEDIA COORDINATOR": "Media Coordinator",
    "LEGAL GRIEVANCE COORDINATOR": "Legal Grievance Coordinator",
}


def _active_dynamic_role(user: User, db: Session) -> str | None:
    role = user.role_record
    if not role or not role.is_active:
        return None
    assignment_exists = db.query(CommitteeAssignment.id).filter(
        CommitteeAssignment.user_id == user.id,
        CommitteeAssignment.role_id == role.id,
    ).first()
    if assignment_exists:
        today = date.today()
        current = db.query(CommitteeAssignment.id).filter(
            CommitteeAssignment.user_id == user.id,
            CommitteeAssignment.role_id == role.id,
            CommitteeAssignment.status == "ACTIVE",
            (CommitteeAssignment.term_start.is_(None) | (CommitteeAssignment.term_start <= today)),
            (CommitteeAssignment.term_end.is_(None) | (CommitteeAssignment.term_end >= today)),
        ).first()
        if not current:
            return None
    return " ".join(str(role.name or "").replace("_", " ").upper().split())


def _count(db: Session, model, *filters) -> int:
    return int(db.query(func.count()).select_from(model).filter(*filters).scalar() or 0)


def _can(user: User, db: Session, *permissions: str) -> bool:
    return user_has_any_permission(user, tuple(permissions), db, allow_admin=False)


def _metric(metrics: list, key: str, label: str, value: int | float, description: str, fmt: str = "number"):
    metrics.append({"key": key, "label": label, "value": value, "description": description, "format": fmt})


def _action(actions: list, label: str, page: str, permitted: bool = True):
    if permitted:
        actions.append({"label": label, "page": page})


def _general_notice_count(db: Session) -> int:
    return _count(db, Announcement,
                  Announcement.status == "PUBLISHED", Announcement.audience == "ALL",
                  (Announcement.expires_at.is_(None) | (Announcement.expires_at > datetime.now(timezone.utc).replace(tzinfo=None))))


def _own_notifications(db: Session, user_id: int) -> int:
    return _count(db, Notification, Notification.user_id == user_id, Notification.is_read.is_(False))


def _upcoming_events(db: Session, *, limit: int = 4):
    return [
        {"id": row.id, "title": row.title, "date": row.event_date.isoformat(), "venue": row.venue}
        for row in db.query(CommunityEvent).filter(
            CommunityEvent.status == "PUBLISHED", CommunityEvent.event_date >= date.today()
        ).order_by(CommunityEvent.event_date, CommunityEvent.id).limit(limit).all()
    ]


def _assignment_note(user: User, db: Session):
    if not user.role_id:
        return None
    today = date.today()
    row = db.query(CommitteeAssignment).filter(
        CommitteeAssignment.user_id == user.id,
        CommitteeAssignment.role_id == user.role_id,
        CommitteeAssignment.status == "ACTIVE",
        (CommitteeAssignment.term_start.is_(None) | (CommitteeAssignment.term_start <= today)),
        (CommitteeAssignment.term_end.is_(None) | (CommitteeAssignment.term_end >= today)),
    ).order_by(CommitteeAssignment.assigned_at.desc()).first()
    if row is None:
        return None
    return {
        "note": row.assignment_note,
        "term_start": row.term_start.isoformat() if row.term_start else None,
        "term_end": row.term_end.isoformat() if row.term_end else None,
    }


@router.get("/officer")
def officer_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role_key = _active_dynamic_role(current_user, db)
    role = OFFICER_ROLES.get(role_key or "")
    if role is None:
        raise HTTPException(403, "An active department-officer role is required")

    metrics, actions, highlights = [], [], []
    _metric(metrics, "unread_notifications", "My unread notifications",
            _own_notifications(db, current_user.id), "Only notifications addressed to you")
    _metric(metrics, "upcoming_events", "Upcoming public events",
            _count(db, CommunityEvent, CommunityEvent.status == "PUBLISHED", CommunityEvent.event_date >= date.today()),
            "Future published community events")
    _action(actions, "My profile", "profile")
    _action(actions, "Notifications", "notifications")
    _action(actions, "Announcements", "announcements")

    if role == "Scholarship Officer":
        _action(actions, "Scholarship applications", "scholarships", _can(current_user, db, "scholarships.review"))
        if _can(current_user, db, "scholarships.review"):
            _metric(metrics, "officer_review", "Scholarships awaiting officer review",
                    _count(db, ScholarshipApplication, ScholarshipApplication.review_stage == "SCHOLARSHIP_OFFICER_REVIEW",
                           ScholarshipApplication.status.notin_(["REJECTED", "APPROVED"])), "Requests assigned to the officer stage")
            _metric(metrics, "scholarship_open", "Scholarship applications in progress",
                    _count(db, ScholarshipApplication, ScholarshipApplication.status.notin_(["REJECTED", "APPROVED"])),
                    "Applications across the existing community workflow")
            highlights = ["Review scholarship requests in the existing Scholarships section."]
        _metric(metrics, "active_scholarships", "Active scholarship listings",
                _count(db, ScholarshipScheme, ScholarshipScheme.is_active.is_(True)), "Current scheme catalog")
    elif role == "Matrimonial Coordinator":
        _action(actions, "Matrimonial reviews", "matrimonial", _can(current_user, db, "matrimonial.review"))
        if _can(current_user, db, "matrimonial.review"):
            _metric(metrics, "pending_profiles", "Profiles awaiting review",
                    _count(db, MatrimonialProfile, MatrimonialProfile.status == "PENDING"), "Private review queue; do not distribute candidate details")
            _metric(metrics, "published_profiles", "Published profiles",
                    _count(db, MatrimonialProfile, MatrimonialProfile.status == "PUBLISHED"), "Approved profiles in the database")
            highlights = ["Review submissions through the existing permission-protected Matrimonial section."]
    elif role == "Event Coordinator":
        _action(actions, "Manage events", "events", _can(current_user, db, "events.manage"))
        if _can(current_user, db, "events.manage"):
            owned_ids = db.query(CommunityEvent.id).filter(CommunityEvent.created_by_id == current_user.id)
            _metric(metrics, "my_events", "Events I created", _count(db, CommunityEvent, CommunityEvent.created_by_id == current_user.id), "Only events created by your account")
            _metric(metrics, "pending_events", "My events awaiting approval",
                    _count(db, CommunityEvent, CommunityEvent.created_by_id == current_user.id, CommunityEvent.status == "PENDING_APPROVAL"),
                    "Awaiting the President's decision")
            _metric(metrics, "registrations_for_my_events", "Registrations for my events",
                    _count(db, EventRegistration, EventRegistration.event_id.in_(owned_ids)), "Registrations for events created by you")
            highlights = ["Create events and record attendance in the existing Events section."]
    elif role == "Verification Officer":
        _action(actions, "Review documents", "documents", _can(current_user, db, "documents.review"))
        _action(actions, "Membership reviews", "members", _can(current_user, db, "membership.review"))
        if _can(current_user, db, "documents.review"):
            _metric(metrics, "pending_documents", "Pending document reviews",
                    _count(db, Verification, Verification.status == "PENDING"), "Documents awaiting verification")
            _metric(metrics, "approved_documents", "Approved documents",
                    _count(db, Verification, Verification.status == "APPROVED"), "Previously approved document submissions")
        if _can(current_user, db, "membership.review"):
            _metric(metrics, "pending_members", "Pending member applications",
                    _count(db, User, User.membership_status == "PENDING", User.is_active.is_(True)),
                    "Members awaiting verification or approval")
    elif role == "Media Coordinator":
        _action(actions, "Manage announcements", "announcements", _can(current_user, db, "announcements.manage"))
        if _can(current_user, db, "announcements.manage"):
            _metric(metrics, "my_drafts", "My announcement drafts",
                    _count(db, Announcement, Announcement.created_by_id == current_user.id, Announcement.status == "DRAFT"),
                    "Draft notices you authored")
            _metric(metrics, "published_announcements", "Published announcements",
                    _count(db, Announcement, Announcement.status == "PUBLISHED"), "Published notices in the database")
        else:
            _metric(metrics, "published_announcements", "Current community announcements",
                    _general_notice_count(db), "Community-wide notices only")
        highlights = ["Media assets and publication permissions remain managed by their existing features; no sample gallery data is used."]
    elif role == "Legal Grievance Coordinator":
        _action(actions, "Support enquiries", "support-inquiries", _can(current_user, db, "membership.review"))
        _action(actions, "Emergency requests", "emergency", _can(current_user, db, "emergency.manage"))
        if _can(current_user, db, "membership.review"):
            _metric(metrics, "open_inquiries", "Open support enquiries",
                    _count(db, SupportInquiry, SupportInquiry.status.in_(["NEW", "OPEN", "IN_PROGRESS"])),
                    "Existing support workflow, permission restricted")
        if _can(current_user, db, "emergency.manage"):
            _metric(metrics, "open_emergencies", "Open emergency requests",
                    _count(db, EmergencyRequest, EmergencyRequest.status.in_(["NEW", "PENDING", "UNDER_REVIEW", "IN_PROGRESS"])),
                    "Existing emergency support workflow, permission restricted")
        highlights = ["This dashboard reports on existing support and emergency requests only; a dedicated legal case-management API is not part of the current backend."]

    return {
        "role": role,
        "member": {"name": current_user.full_name, "membership_status": current_user.membership_status},
        "metrics": metrics,
        "actions": actions,
        "highlights": highlights,
        "upcoming_events": _upcoming_events(db),
        "my_assignment": _assignment_note(current_user, db),
    }


@router.get("/seller")
def seller_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Seller-only figures calculated from the logged-in user's own listings/items.

    Any approved member is eligible to start selling under the existing marketplace
    rules. No buyer's contact information or other sellers' amounts are returned.
    """
    if str(current_user.membership_status or "").upper() != "APPROVED":
        raise HTTPException(403, "Approved community membership is required for selling")

    metrics, actions, highlights = [], [], []
    user_id = current_user.id
    _metric(metrics, "active_listings", "My active products",
            _count(db, MarketplaceProduct, MarketplaceProduct.seller_id == user_id, MarketplaceProduct.is_active.is_(True)), "Current listings owned by you")
    _metric(metrics, "inactive_listings", "My inactive products",
            _count(db, MarketplaceProduct, MarketplaceProduct.seller_id == user_id, MarketplaceProduct.is_active.is_(False)), "Unpublished products owned by you")
    _metric(metrics, "unread_notifications", "My unread notifications", _own_notifications(db, user_id), "Only your personal notifications")
    _metric(metrics, "courier_shipments", "My courier shipments", _count(db, MarketplaceCourierShipment, MarketplaceCourierShipment.seller_id == user_id), "Shiprocket shipments associated with your own products")

    order_ids = set()
    items_count = 0
    open_items = 0
    delivered_items = 0
    paid_item_total = 0.0
    recent = []
    # Iterate historical orders without joining the buyer or exposing private data.
    for order in db.query(MarketplaceOrder).order_by(MarketplaceOrder.created_at.desc(), MarketplaceOrder.id.desc()).yield_per(200):
        owned = [item for item in (order.items or []) if isinstance(item, dict) and str(item.get("seller_id")) == str(user_id)]
        if not owned:
            continue
        order_ids.add(order.id)
        items_count += len(owned)
        for item in owned:
            status = str(item.get("status") or "REQUESTED").upper()
            if status == "DELIVERED":
                delivered_items += 1
            elif status != "CANCELLED":
                open_items += 1
            if str(order.payment_status or "").upper() == "PAID":
                try:
                    qty = max(0, int(item.get("quantity") or 0))
                    unit = max(0.0, float(item.get("unit_price") or 0))
                    paid_item_total += qty * unit
                except (TypeError, ValueError, OverflowError):
                    pass
        if len(recent) < 6:
            recent.append({
                "id": order.id,
                "title": f"Order #{order.id} — {len(owned)} of your item(s)",
                "date": order.created_at.date().isoformat() if order.created_at else "",
                "detail": ", ".join(str(i.get("name") or "Product")[:60] for i in owned[:3]),
                "status": " / ".join(sorted({str(i.get("status") or "REQUESTED") for i in owned})),
            })

    _metric(metrics, "my_orders", "Orders containing my products", len(order_ids), "Counted once per order, even for multi-item orders")
    _metric(metrics, "open_order_items", "My order items in progress", open_items, "My items not yet delivered or cancelled")
    _metric(metrics, "delivered_order_items", "My delivered order items", delivered_items, "Only delivery confirmations for my products")
    _metric(metrics, "paid_item_value", "Paid item value (gross)", round(paid_item_total, 2), "Gross checkout item value, not net payout after fees or refunds", "currency")

    actions = [
        {"label": "Manage products", "page": "marketplace"},
        {"label": "Seller orders & tracking", "page": "order-tracking"},
        {"label": "Notifications", "page": "notifications"},
        {"label": "My profile", "page": "profile"},
    ]
    return {
        "role": "Marketplace Seller",
        "member": {"name": current_user.full_name, "membership_status": current_user.membership_status},
        "metrics": metrics,
        "actions": actions,
        "highlights": highlights,
        "recent_activity": recent,
        "my_assignment": None,
        "upcoming_events": [],
    }
