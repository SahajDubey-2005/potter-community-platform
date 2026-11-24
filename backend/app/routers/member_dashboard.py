"""Authenticated, owner-scoped regular member dashboard.

Uses the existing tables and membership permissions. No new tables, approval
bypasses, or extra privileges are introduced.
"""
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    AssistanceApplication,
    CommunityEvent,
    EmergencyRequest,
    EventRegistration,
    FamilyMember,
    GovernmentSchemeRequest,
    MarketplaceOrder,
    MarketplaceProduct,
    MatrimonialProfile,
    Notification,
    ScholarshipApplication,
    User,
    Verification,
)

router = APIRouter(prefix="/member", tags=["Member dashboard"])


def _count(db: Session, model, *conditions) -> int:
    return int(db.query(func.count()).select_from(model).filter(*conditions).scalar() or 0)


@router.get("/dashboard")
def get_member_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Only return data owned by the authenticated account."""
    member_id = current_user.id
    today = date.today()

    counts = {
        "my_orders": _count(db, MarketplaceOrder, MarketplaceOrder.user_id == member_id),
        "my_products": _count(db, MarketplaceProduct, MarketplaceProduct.seller_id == member_id),
        "event_registrations": _count(db, EventRegistration, EventRegistration.user_id == member_id),
        "scholarship_applications": _count(db, ScholarshipApplication, ScholarshipApplication.user_id == member_id),
        "scheme_assistance_requests": _count(db, GovernmentSchemeRequest, GovernmentSchemeRequest.user_id == member_id),
        "widow_assistance_requests": _count(db, AssistanceApplication, AssistanceApplication.user_id == member_id),
        "emergency_requests": _count(db, EmergencyRequest, EmergencyRequest.user_id == member_id),
        "family_members": _count(db, FamilyMember, FamilyMember.primary_user_id == member_id),
        "my_documents": _count(db, Verification, Verification.user_id == member_id),
        "unread_notifications": _count(db, Notification, Notification.user_id == member_id, Notification.is_read.is_(False)),
    }

    upcoming = (
        db.query(CommunityEvent, EventRegistration)
        .join(EventRegistration, EventRegistration.event_id == CommunityEvent.id)
        .filter(
            EventRegistration.user_id == member_id,
            CommunityEvent.status == "PUBLISHED",
            CommunityEvent.event_date >= today,
        )
        .order_by(CommunityEvent.event_date.asc(), CommunityEvent.event_time.asc())
        .limit(4)
        .all()
    )
    recent_notifications = (
        db.query(Notification)
        .filter(Notification.user_id == member_id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(5)
        .all()
    )
    recent_orders = (
        db.query(MarketplaceOrder)
        .filter(MarketplaceOrder.user_id == member_id)
        .order_by(MarketplaceOrder.created_at.desc(), MarketplaceOrder.id.desc())
        .limit(3)
        .all()
    )
    matrimonial = db.query(MatrimonialProfile).filter(MatrimonialProfile.user_id == member_id).first()
    details = current_user.application_details or {}

    return {
        "member": {
            "name": current_user.full_name,
            "membership_number": current_user.membership_number,
            "membership_status": current_user.membership_status,
            "matrimonial_profile_status": matrimonial.status if matrimonial else None,
            "has_verified_birth_date": bool(details.get("date_of_birth")),
        },
        "counts": counts,
        "upcoming_registered_events": [
            {
                "id": event.id,
                "title": event.title,
                "date": event.event_date.isoformat(),
                "time": event.event_time,
                "venue": event.venue,
                "attendance_status": registration.attendance_status,
            }
            for event, registration in upcoming
        ],
        "recent_notifications": [
            {
                "id": item.id,
                "title": item.title,
                "message": item.message,
                "created_at": item.created_at.isoformat(),
                "is_read": item.is_read,
            }
            for item in recent_notifications
        ],
        "recent_orders": [
            {
                "id": item.id,
                "status": item.status,
                "payment_status": item.payment_status,
                "created_at": item.created_at.isoformat(),
            }
            for item in recent_orders
        ],
    }

@router.get("/directory")
def list_public_member_directory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """A minimal directory for verified members, without private contact data."""
    if current_user.membership_status != "APPROVED":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Member directory requires approved membership")
    users = (
        db.query(User)
        .filter(User.membership_status == "APPROVED", User.is_active.is_(True))
        .order_by(User.full_name.asc(), User.id.asc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": member.id,
            "full_name": member.full_name,
            "role": "Verified Member",  # No internal role assignments are disclosed.
            "membership_number": None,
            "is_active": True,
        }
        for member in users
    ]
