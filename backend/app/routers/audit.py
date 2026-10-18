from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth import require_role
from app.database import get_db
from app.models import ActivityLog, User


router = APIRouter(prefix="/admin/audit-logs", tags=["Audit logs"])


@router.get("")
def list_activity_logs(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(ActivityLog, User.full_name)
        .outerjoin(User, User.id == ActivityLog.actor_user_id)
        .order_by(ActivityLog.created_at.desc(), ActivityLog.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "actor_user_id": log.actor_user_id,
            "actor_name": actor_name or "Unauthenticated visitor",
            "action": log.action,
            "resource": log.resource,
            "status_code": log.status_code,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        }
        for log, actor_name in rows
    ]
