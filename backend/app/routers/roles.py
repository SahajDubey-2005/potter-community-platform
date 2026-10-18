from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_permission
from app.database import get_db
from app.models import CommitteeAssignment, Role, User


router = APIRouter(prefix="/admin/roles", tags=["Role management"])

AVAILABLE_PERMISSIONS = {
    "membership.view",
    "membership.review",
    "documents.review",
    "members.manage",
    "roles.manage",
    "events.manage",
    "announcements.manage",
    "scholarships.review",
    "matrimonial.review",
    "finance.manage",
    "reports.view",
    "community.records.view",
    "community.records.manage",
    "community.approve",
    "marketplace.manage",
}


class RoleInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    permissions: list[str] = Field(default_factory=list)
    is_active: bool = True


class RoleAssignment(BaseModel):
    role_id: int
    term_start: date | None = None
    term_end: date | None = None
    minutes_reference: str | None = Field(default=None, max_length=255)
    assignment_note: str | None = Field(default=None, max_length=1000)


class RoleRevocation(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


def validate_permissions(permissions: list[str]) -> list[str]:
    unknown = sorted(set(permissions) - AVAILABLE_PERMISSIONS)
    if unknown:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown permissions: {', '.join(unknown)}",
        )
    return sorted(set(permissions))


def serialize_role(role: Role, users_count: int = 0) -> dict:
    return {
        "id": role.id,
        "name": role.name,
        "description": role.description,
        "permissions": role.permissions or [],
        "is_active": role.is_active,
        "users_count": users_count,
        "created_at": role.created_at.isoformat(),
    }


@router.get("")
def list_roles(
    current_user: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    roles = db.query(Role).order_by(Role.name.asc()).all()
    return [
        serialize_role(
            role,
            db.query(User).filter(User.role_id == role.id).count(),
        )
        for role in roles
    ]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_role(
    data: RoleInput,
    current_user: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    name = data.name.strip()
    if db.query(Role).filter(func.lower(Role.name) == name.lower()).first():
        raise HTTPException(status_code=409, detail="A role with this name already exists")
    role = Role(
        name=name,
        description=data.description.strip() if data.description else None,
        permissions=validate_permissions(data.permissions),
        is_active=data.is_active,
        created_at=datetime.now(timezone.utc),
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return serialize_role(role)


@router.patch("/{role_id}")
def update_role(
    role_id: int,
    data: RoleInput,
    current_user: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")
    name = data.name.strip()
    duplicate = db.query(Role).filter(
        func.lower(Role.name) == name.lower(), Role.id != role.id
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="A role with this name already exists")
    role.name = name
    role.description = data.description.strip() if data.description else None
    role.permissions = validate_permissions(data.permissions)
    role.is_active = data.is_active
    db.commit()
    db.refresh(role)
    return serialize_role(role, db.query(User).filter(User.role_id == role.id).count())


@router.get("/users")
def list_assignable_users(
    current_user: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.membership_status == "APPROVED", User.is_active.is_(True))
        .order_by(User.full_name.asc())
        .all()
    )
    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role_id": user.role_id,
            "role": user.role_record.name if user.role_record else user.role,
            "membership_number": user.membership_number,
        "is_active": user.is_active,
        }
        for user in users
    ]


@router.patch("/members/{user_id}")
def assign_role(
    user_id: int,
    data: RoleAssignment,
    current_user: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    role = db.query(Role).filter(Role.id == data.role_id).first()
    if user is None or role is None:
        raise HTTPException(status_code=404, detail="Member or role not found")
    if user.membership_status != "APPROVED" or not user.is_active:
        raise HTTPException(status_code=409, detail="Only active, approved members can be assigned committee roles")
    if not role.is_active:
        raise HTTPException(status_code=409, detail="This role is inactive")
    requester_role = (current_user.role_record.name if current_user.role_record else current_user.role or "").strip().upper()
    if role.name.strip().upper() == "ADMIN":
        raise HTTPException(status_code=403, detail="The platform Admin role cannot be assigned through committee appointments")
    if role.name.strip().upper() == "SUPER ADMIN" and requester_role not in {"ADMIN", "SUPER ADMIN"}:
        raise HTTPException(status_code=403, detail="Only an Admin or Super Admin can assign Super Admin access")
    if data.term_start and data.term_end and data.term_end < data.term_start:
        raise HTTPException(status_code=422, detail="Term end must be on or after the term start")
    elected_roles = {"PRESIDENT / HEAD", "SECRETARY", "TREASURER", "DIRECTOR", "NOMINATED DIRECTOR"}
    if role.name.strip().upper() in elected_roles and (data.term_start is None or data.term_end is None):
        raise HTTPException(status_code=422, detail="Elected committee assignments require both term dates")

    now = datetime.now(timezone.utc)
    previous_assignments = db.query(CommitteeAssignment).filter(
        CommitteeAssignment.user_id == user.id,
        CommitteeAssignment.status == "ACTIVE",
    ).all()
    for previous in previous_assignments:
        previous.status = "SUPERSEDED"
        previous.ended_at = now
        previous.ended_by_id = current_user.id
        previous.end_reason = "Replaced by a new committee assignment"

    user.role_id = role.id
    user.role = role.name
    db.add(CommitteeAssignment(
        user_id=user.id,
        role_id=role.id,
        assigned_by_id=current_user.id,
        status="ACTIVE",
        term_start=data.term_start,
        term_end=data.term_end,
        minutes_reference=data.minutes_reference.strip() if data.minutes_reference else None,
        assignment_note=data.assignment_note.strip() if data.assignment_note else None,
        assigned_at=now,
    ))
    db.commit()
    return {
        "user_id": user.id,
        "role_id": role.id,
        "role": role.name,
        "permissions": role.permissions or [],
        "term_start": data.term_start.isoformat() if data.term_start else None,
        "term_end": data.term_end.isoformat() if data.term_end else None,
    }


@router.patch("/members/{user_id}/revoke")
def revoke_role(
    user_id: int,
    data: RoleRevocation,
    current_user: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=409, detail="You cannot revoke your own active role")
    active_assignments = db.query(CommitteeAssignment).filter(
        CommitteeAssignment.user_id == user.id,
        CommitteeAssignment.status == "ACTIVE",
    ).all()
    if not active_assignments:
        raise HTTPException(status_code=409, detail="This member has no active committee assignment")

    now = datetime.now(timezone.utc)
    for assignment in active_assignments:
        assignment.status = "REVOKED"
        assignment.ended_at = now
        assignment.ended_by_id = current_user.id
        assignment.end_reason = data.reason.strip()

    citizen_role = db.query(Role).filter(Role.name == "CITIZEN", Role.is_active.is_(True)).first()
    user.role_id = citizen_role.id if citizen_role else None
    user.role = "CITIZEN"
    db.commit()
    return {"user_id": user.id, "role": user.role, "status": "REVOKED"}


@router.get("/assignments")
def list_assignments(
    current_user: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(CommitteeAssignment, User.full_name, Role.name)
        .join(User, User.id == CommitteeAssignment.user_id)
        .join(Role, Role.id == CommitteeAssignment.role_id)
        .order_by(CommitteeAssignment.assigned_at.desc(), CommitteeAssignment.id.desc())
        .limit(500)
        .all()
    )
    return [{
        "id": assignment.id,
        "user_id": assignment.user_id,
        "member_name": full_name,
        "role_id": assignment.role_id,
        "role": role_name,
        "status": "EXPIRED" if assignment.status == "ACTIVE" and assignment.term_end and assignment.term_end < date.today() else "UPCOMING" if assignment.status == "ACTIVE" and assignment.term_start and assignment.term_start > date.today() else assignment.status,
        "term_start": assignment.term_start.isoformat() if assignment.term_start else None,
        "term_end": assignment.term_end.isoformat() if assignment.term_end else None,
        "minutes_reference": assignment.minutes_reference,
        "assignment_note": assignment.assignment_note,
        "assigned_at": assignment.assigned_at.isoformat(),
        "ended_at": assignment.ended_at.isoformat() if assignment.ended_at else None,
        "end_reason": assignment.end_reason,
    } for assignment, full_name, role_name in rows]


@router.get("/permissions")
def list_permissions(
    current_user: User = Depends(require_permission("roles.manage")),
):
    return sorted(AVAILABLE_PERMISSIONS)
