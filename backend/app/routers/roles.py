from datetime import date, datetime, timezone
import re

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user, get_password_hash, require_permission, user_has_any_permission
from app.database import get_db
from app.models import (
    ActivityLog,
    AssistanceApplication,
    AssistanceBenefit,
    AssistanceDocument,
    CommitteeAssignment,
    CommitteeElectionDocument,
    CommunityEvent,
    CommunityRecord,
    EventRegistration,
    FamilyMember,
    FinancePolicy,
    FinancialRefund,
    FinancialTransaction,
    MatrimonialProfile,
    Notification,
    PasswordResetToken,
    Role,
    ScholarshipApplication,
    ScholarshipBenefit,
    ScholarshipDocument,
    ScholarshipScheme,
    User,
    Verification,
)
from app.private_documents import private_document_path, save_private_document


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

SYSTEM_ROLE_NAMES = {
    "ADMIN", "ARTISAN", "CITIZEN", "SUPER ADMIN", "PRESIDENT / HEAD",
    "SECRETARY", "TREASURER", "DIRECTOR", "NOMINATED DIRECTOR",
    "VERIFICATION OFFICER", "SCHOLARSHIP OFFICER", "MATRIMONIAL COORDINATOR",
    "EVENT COORDINATOR", "MEDIA COORDINATOR", "LEGAL GRIEVANCE COORDINATOR",
    "POTTER MARKET ENGAGEMENT COORDINATOR",
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


class AdminAccountCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr | None = None
    phone_number: str | None = Field(default=None, min_length=10, max_length=20)
    password: str = Field(min_length=10, max_length=128)


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
        "is_system": role.name.strip().upper() in SYSTEM_ROLE_NAMES,
        "created_at": role.created_at.isoformat(),
    }


def require_platform_admin(current_user: User) -> None:
    legacy_role = (current_user.role or "").strip().upper()
    dynamic_role = (current_user.role_record.name or "").strip().upper() if current_user.role_record else ""
    if not {"ADMIN", "SUPER ADMIN"}.intersection({legacy_role, dynamic_role}):
        raise HTTPException(status_code=403, detail="Only a platform Admin can create Admin accounts")


@router.post("/admins", status_code=status.HTTP_201_CREATED)
def create_admin_account(
    data: AdminAccountCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create an active platform admin. Public member signup cannot grant admin access."""
    require_platform_admin(current_user)
    email = str(data.email).strip().lower() if data.email else None
    if not email and not data.phone_number:
        raise HTTPException(status_code=422, detail="Provide an email address or phone number for sign-in")
    if email and db.query(User).filter(func.lower(User.email) == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    phone = re.sub(r"\D", "", data.phone_number) if data.phone_number else None
    if phone and len(phone) == 12 and phone.startswith("91"):
        phone = phone[2:]
    elif phone and len(phone) == 11 and phone.startswith("0"):
        phone = phone[1:]
    if phone and not re.fullmatch(r"[6-9]\d{9}", phone):
        raise HTTPException(status_code=422, detail="Enter a valid 10-digit Indian mobile number")
    if phone and db.query(User).filter(User.phone_number == phone).first():
        raise HTTPException(status_code=409, detail="An account with this phone number already exists")
    admin_role = db.query(Role).filter(func.upper(Role.name) == "ADMIN").first()
    if admin_role is None:
        admin_role = Role(name="ADMIN", description="Platform administrator", permissions=[], is_active=True,
                          created_at=datetime.now(timezone.utc))
        db.add(admin_role)
        db.flush()
    if not admin_role.is_active:
        raise HTTPException(status_code=409, detail="The platform Admin role is inactive")
    user = User(
        full_name=data.full_name.strip(), email=email, phone_number=phone,
        hashed_password=get_password_hash(data.password), role="ADMIN", role_id=admin_role.id,
        is_active=True, phone_verified=bool(phone), membership_status="APPROVED",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "full_name": user.full_name, "email": user.email,
            "phone_number": user.phone_number, "role": "ADMIN", "is_active": user.is_active}


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


@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    current_user: User = Depends(require_permission("roles.manage")),
    db: Session = Depends(get_db),
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if role is None:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.name.strip().upper() in SYSTEM_ROLE_NAMES:
        raise HTTPException(status_code=403, detail="Built-in community roles cannot be deleted. Deactivate the role if it should no longer be assigned.")
    has_users = db.query(User.id).filter(User.role_id == role.id).first() is not None
    has_history = db.query(CommitteeAssignment.id).filter(CommitteeAssignment.role_id == role.id).first() is not None
    if has_users or has_history:
        raise HTTPException(status_code=409, detail="This role has members or assignment history. Deactivate it instead to preserve those records.")
    db.delete(role)
    db.commit()
    return {"role_id": role_id, "message": "Role deleted"}


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


@router.delete("/members/{user_id}")
def delete_member_account(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently remove a member and their personal application data."""
    require_platform_admin(current_user)
    if current_user.id == user_id:
        raise HTTPException(status_code=409, detail="You cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Member not found")
    member_role = (user.role_record.name if user.role_record else user.role or "").strip().upper()
    if member_role in {"ADMIN", "SUPER ADMIN"}:
        raise HTTPException(status_code=403, detail="Platform Admin accounts cannot be deleted here")

    scholarship_application_ids = [row[0] for row in db.query(ScholarshipApplication.id).filter(ScholarshipApplication.user_id == user_id).all()]
    assistance_application_ids = [row[0] for row in db.query(AssistanceApplication.id).filter(AssistanceApplication.user_id == user_id).all()]

    # Keep financial records and community material attributable. Refuse the
    # permanent deletion if this account authored records that must be retained.
    protected_records = [
        (db.query(FinancialTransaction.id).filter(FinancialTransaction.user_id == user_id).first(), "financial transactions"),
        (db.query(FinancialRefund.id).filter(FinancialRefund.created_by_id == user_id).first(), "financial refunds"),
        (db.query(CommunityRecord.id).filter(CommunityRecord.created_by_id == user_id).first(), "official community records"),
        (db.query(CommunityEvent.id).filter(CommunityEvent.created_by_id == user_id).first(), "community events"),
        (db.query(ScholarshipScheme.id).filter(ScholarshipScheme.created_by_id == user_id).first(), "scholarship schemes"),
        (db.query(CommitteeAssignment.id).filter(CommitteeAssignment.assigned_by_id == user_id, CommitteeAssignment.user_id != user_id).first(), "committee assignments made for other members"),
        (db.query(ScholarshipBenefit.id).filter(ScholarshipBenefit.recorded_by_id == user_id, ScholarshipBenefit.user_id != user_id).first(), "scholarship benefit records for other members"),
        (db.query(AssistanceBenefit.id).filter(AssistanceBenefit.recorded_by_id == user_id, AssistanceBenefit.application_id.notin_(db.query(AssistanceApplication.id).filter(AssistanceApplication.user_id == user_id))).first(), "assistance benefit records for other members"),
    ]
    retained_record_types = [label for record, label in protected_records if record is not None]
    if retained_record_types:
        raise HTTPException(
            status_code=409,
            detail="This account is linked to retained " + ", ".join(retained_record_types) + ". Deactivate the account instead of permanently deleting it.",
        )

    document_names: set[str] = set()
    verification_rows = db.query(Verification).filter(Verification.user_id == user_id).all()
    document_names.update(row.document_url for row in verification_rows if row.document_url)
    scholarship_documents = db.query(ScholarshipDocument).filter(ScholarshipDocument.application_id.in_(scholarship_application_ids)).all() if scholarship_application_ids else []
    document_names.update(row.file_name for row in scholarship_documents if row.file_name)
    scholarship_benefits = db.query(ScholarshipBenefit).filter(ScholarshipBenefit.application_id.in_(scholarship_application_ids)).all() if scholarship_application_ids else []
    document_names.update(row.proof_file_name for row in scholarship_benefits if row.proof_file_name)
    assistance_documents = db.query(AssistanceDocument).filter(AssistanceDocument.application_id.in_(assistance_application_ids)).all() if assistance_application_ids else []
    document_names.update(row.file_name for row in assistance_documents if row.file_name)
    assistance_benefits = db.query(AssistanceBenefit).filter(AssistanceBenefit.application_id.in_(assistance_application_ids)).all() if assistance_application_ids else []
    document_names.update(row.proof_file_name for row in assistance_benefits if row.proof_file_name)
    election_documents = db.query(CommitteeElectionDocument).join(
        CommitteeAssignment, CommitteeAssignment.id == CommitteeElectionDocument.assignment_id
    ).filter(CommitteeAssignment.user_id == user_id).all()
    document_names.update(row.file_name for row in election_documents if row.file_name)

    try:
        # Preserve the audit trail while detaching references to the deleted user.
        db.query(ActivityLog).filter(ActivityLog.actor_user_id == user_id).update({ActivityLog.actor_user_id: None}, synchronize_session=False)
        db.query(FinancePolicy).filter(FinancePolicy.updated_by_id == user_id).update({FinancePolicy.updated_by_id: None}, synchronize_session=False)
        db.query(FinancialTransaction).filter(FinancialTransaction.verified_by_id == user_id).update({FinancialTransaction.verified_by_id: None}, synchronize_session=False)
        db.query(FinancialTransaction).filter(FinancialTransaction.reconciled_by_id == user_id).update({FinancialTransaction.reconciled_by_id: None}, synchronize_session=False)
        db.query(CommunityRecord).filter(CommunityRecord.approved_by_id == user_id).update({CommunityRecord.approved_by_id: None}, synchronize_session=False)
        db.query(CommunityEvent).filter(CommunityEvent.approved_by_id == user_id).update({CommunityEvent.approved_by_id: None}, synchronize_session=False)
        db.query(EventRegistration).filter(EventRegistration.attendance_marked_by_id == user_id).update({EventRegistration.attendance_marked_by_id: None}, synchronize_session=False)
        db.query(MatrimonialProfile).filter(MatrimonialProfile.reviewed_by_id == user_id).update({MatrimonialProfile.reviewed_by_id: None}, synchronize_session=False)
        db.query(CommitteeAssignment).filter(CommitteeAssignment.ended_by_id == user_id).update({CommitteeAssignment.ended_by_id: None}, synchronize_session=False)

        db.query(Verification).filter(Verification.user_id == user_id).delete(synchronize_session=False)
        db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user_id).delete(synchronize_session=False)
        db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)
        db.query(FamilyMember).filter(FamilyMember.primary_user_id == user_id).delete(synchronize_session=False)
        if election_documents:
            db.query(CommitteeElectionDocument).filter(CommitteeElectionDocument.id.in_([row.id for row in election_documents])).delete(synchronize_session=False)
        db.query(CommitteeAssignment).filter(CommitteeAssignment.user_id == user_id).delete(synchronize_session=False)
        db.query(EventRegistration).filter(EventRegistration.user_id == user_id).delete(synchronize_session=False)
        db.query(MatrimonialProfile).filter(MatrimonialProfile.user_id == user_id).delete(synchronize_session=False)

        if scholarship_application_ids:
            db.query(ScholarshipDocument).filter(ScholarshipDocument.application_id.in_(scholarship_application_ids)).delete(synchronize_session=False)
            db.query(ScholarshipBenefit).filter(ScholarshipBenefit.application_id.in_(scholarship_application_ids)).delete(synchronize_session=False)
            db.query(ScholarshipApplication).filter(ScholarshipApplication.id.in_(scholarship_application_ids)).delete(synchronize_session=False)
        db.query(ScholarshipBenefit).filter(ScholarshipBenefit.user_id == user_id).delete(synchronize_session=False)

        if assistance_application_ids:
            db.query(AssistanceDocument).filter(AssistanceDocument.application_id.in_(assistance_application_ids)).delete(synchronize_session=False)
            db.query(AssistanceBenefit).filter(AssistanceBenefit.application_id.in_(assistance_application_ids)).delete(synchronize_session=False)
            db.query(AssistanceApplication).filter(AssistanceApplication.id.in_(assistance_application_ids)).delete(synchronize_session=False)

        db.delete(user)
        db.commit()
    except Exception:
        db.rollback()
        raise

    for stored_name in document_names:
        try:
            private_document_path(stored_name).unlink(missing_ok=True)
        except (OSError, HTTPException):
            pass

    return {"message": "Member account and personal application data permanently deleted", "user_id": user_id}


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
    return serialize_assignments(rows, db)


def serialize_assignments(rows, db: Session):
    assignment_ids = [assignment.id for assignment, _, _ in rows]
    documents = db.query(CommitteeElectionDocument).filter(
        CommitteeElectionDocument.assignment_id.in_(assignment_ids)
    ).order_by(CommitteeElectionDocument.created_at.desc()).all() if assignment_ids else []
    documents_by_assignment: dict[int, list[CommitteeElectionDocument]] = {}
    for document in documents:
        documents_by_assignment.setdefault(document.assignment_id, []).append(document)

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
        "election_documents": [{
            "id": document.id,
            "title": document.title,
            "original_filename": document.original_filename,
            "created_at": document.created_at.isoformat(),
            "file_url": f"/admin/roles/assignments/{assignment.id}/election-documents/{document.id}/file",
        } for document in documents_by_assignment.get(assignment.id, [])],
        "assigned_at": assignment.assigned_at.isoformat(),
        "ended_at": assignment.ended_at.isoformat() if assignment.ended_at else None,
        "end_reason": assignment.end_reason,
    } for assignment, full_name, role_name in rows]


@router.get("/my-assignments")
def list_my_committee_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(CommitteeAssignment, User.full_name, Role.name)
        .join(User, User.id == CommitteeAssignment.user_id)
        .join(Role, Role.id == CommitteeAssignment.role_id)
        .filter(CommitteeAssignment.user_id == current_user.id)
        .order_by(CommitteeAssignment.assigned_at.desc(), CommitteeAssignment.id.desc())
        .all()
    )
    return serialize_assignments(rows, db)


@router.get("/directory")
def committee_directory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.membership_status != "APPROVED" or not current_user.is_active:
        raise HTTPException(status_code=403, detail="Committee directory is available to approved members")
    rows = (
        db.query(CommitteeAssignment, User, Role.name)
        .join(User, User.id == CommitteeAssignment.user_id)
        .join(Role, Role.id == CommitteeAssignment.role_id)
        .filter(
            CommitteeAssignment.status == "ACTIVE",
            User.membership_status == "APPROVED",
            User.is_active.is_(True),
        )
        .order_by(Role.name.asc(), User.full_name.asc(), CommitteeAssignment.assigned_at.desc())
        .all()
    )
    seen_user_ids: set[int] = set()
    entries = []
    for assignment, member, role_name in rows:
        if member.id in seen_user_ids:
            continue
        seen_user_ids.add(member.id)
        entries.append({
            "member_id": member.id,
            "name": member.full_name,
            "designation": role_name,
            "email": member.email,
            "term_start": assignment.term_start.isoformat() if assignment.term_start else None,
            "term_end": assignment.term_end.isoformat() if assignment.term_end else None,
        })
    return entries


@router.post("/assignments/{assignment_id}/election-documents", status_code=status.HTTP_201_CREATED)
def upload_election_document(
    assignment_id: int,
    title: str = Form(..., min_length=3, max_length=160),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = db.query(CommitteeAssignment).filter(CommitteeAssignment.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=404, detail="Committee assignment not found")
    if assignment.user_id != current_user.id and not user_has_any_permission(current_user, ("roles.manage",), db):
        raise HTTPException(status_code=403, detail="Only the assigned member or a role manager can add election proof")
    original_filename = (file.filename or "Election proof").strip()[:255]
    stored_name = save_private_document(file)
    document = CommitteeElectionDocument(
        assignment_id=assignment.id,
        uploaded_by_id=current_user.id,
        title=title.strip(),
        original_filename=original_filename,
        file_name=stored_name,
        created_at=datetime.now(timezone.utc),
    )
    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()
        private_document_path(stored_name).unlink(missing_ok=True)
        raise
    return {
        "id": document.id,
        "title": document.title,
        "original_filename": document.original_filename,
        "created_at": document.created_at.isoformat(),
    }


@router.get("/assignments/{assignment_id}/election-documents/{document_id}/file")
def view_election_document(
    assignment_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(CommitteeElectionDocument).filter(
        CommitteeElectionDocument.id == document_id,
        CommitteeElectionDocument.assignment_id == assignment_id,
    ).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Election proof document not found")
    assignment = db.query(CommitteeAssignment).filter(CommitteeAssignment.id == assignment_id).first()
    if assignment is None or (assignment.user_id != current_user.id and not user_has_any_permission(current_user, ("roles.manage",), db)):
        raise HTTPException(status_code=403, detail="You cannot access this election proof")
    path = private_document_path(document.file_name)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Election proof file is unavailable")
    return FileResponse(
        path,
        filename=document.original_filename,
        content_disposition_type="inline",
    )


@router.delete("/assignments/{assignment_id}/election-documents/{document_id}")
def delete_election_document(
    assignment_id: int,
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = db.query(CommitteeElectionDocument).filter(
        CommitteeElectionDocument.id == document_id,
        CommitteeElectionDocument.assignment_id == assignment_id,
    ).first()
    if document is None:
        raise HTTPException(status_code=404, detail="Election proof document not found")
    assignment = db.query(CommitteeAssignment).filter(CommitteeAssignment.id == assignment_id).first()
    if assignment is None or (assignment.user_id != current_user.id and not user_has_any_permission(current_user, ("roles.manage",), db)):
        raise HTTPException(status_code=403, detail="You cannot remove this election proof")
    stored_name = document.file_name
    db.delete(document)
    db.commit()
    private_document_path(stored_name).unlink(missing_ok=True)
    return {"message": "Election proof document removed"}


@router.get("/permissions")
def list_permissions(
    current_user: User = Depends(require_permission("roles.manage")),
):
    return sorted(AVAILABLE_PERMISSIONS)
