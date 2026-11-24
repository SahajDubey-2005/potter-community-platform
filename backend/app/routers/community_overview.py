from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import CommunityEvent, User

router = APIRouter(prefix="/community", tags=["Community overview"])


@router.get("/overview")
def community_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Real, non-sensitive overview counts for the signed-in dashboard."""
    return {
        "verified_members": db.query(User).filter(
            User.membership_status == "APPROVED",
            User.is_active.is_(True),
        ).count(),
        "published_events": db.query(CommunityEvent).filter(
            CommunityEvent.status == "PUBLISHED"
        ).count(),
        "upcoming_events": db.query(CommunityEvent).filter(
            CommunityEvent.status == "PUBLISHED",
            CommunityEvent.event_date >= date.today(),
        ).count(),
    }
