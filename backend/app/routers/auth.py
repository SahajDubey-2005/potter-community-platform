from jose import JWTError, jwt
from datetime import date, datetime, timedelta, timezone
import os
import re

from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from pydantic import BaseModel, EmailStr, Field, TypeAdapter, ValidationError
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Role, PhoneOTP, PasswordResetToken, Verification, CommitteeAssignment

from app.otp_service import (
    generate_otp,
    save_otp,
    verify_otp,
)

from app.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    OTPRequest,
    OTPVerify,
    PasswordResetOTPVerify,
    PasswordResetRequest,
)

from app.auth import (
    SECRET_KEY,
    ALGORITHM,
    get_password_hash,
    verify_password,
    create_access_token,
    require_role,
    require_permission,
    require_any_permission,
    get_current_user,
    user_has_any_permission,
    create_password_reset_token,
    hash_password_reset_token,
    verify_password_reset_token,
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
)
from app.private_documents import save_private_document
from app.private_documents import private_document_path
from app.notifications import create_notification

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


class MemberActivationUpdate(BaseModel):
    is_active: bool


class MembershipDecision(BaseModel):
    remark: str = Field(min_length=3, max_length=1000)


# --------------------------------------------------
# HELPERS
# --------------------------------------------------

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def normalize_phone_number(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    return digits


def debug_otp_enabled() -> bool:
    return os.getenv("OTP_DEBUG_MODE", "false").strip().lower() in {"1", "true", "yes", "on"}


def normalize_datetime(value: datetime) -> datetime:
    """Normalize SQLite's naive datetimes to UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def get_latest_otp(
    db: Session,
    phone_number: str,
    purpose: str,
):
    return (
        db.query(PhoneOTP)
        .filter(
            PhoneOTP.phone_number == phone_number,
            PhoneOTP.purpose == purpose,
        )
        .order_by(
            PhoneOTP.created_at.desc(),
            PhoneOTP.id.desc(),
        )
        .first()
    )


# --------------------------------------------------
# REQUEST PHONE VERIFICATION OTP
# --------------------------------------------------

@router.post("/request-otp")
def request_otp(
    request: OTPRequest,
    db: Session = Depends(get_db),
):
    """
    Request OTP for phone verification during signup.

    The user does not need to exist yet. The phone number is
    temporarily verified before the registration request is created.
    """

    phone_number = normalize_phone_number(request.phone_number)
    if not re.fullmatch(r"[6-9]\d{9}", phone_number):
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit Indian mobile number")

    user = (
        db.query(User)
        .filter(User.phone_number == phone_number)
        .first()
    )

    # If an existing account is already verified, don't send another OTP.
    if user and user.phone_verified:
        return {
            "message": "Phone number is already verified",
            "phone_verified": True,
        }

    # Existing unverified user -> normal phone verification.
    # New phone number -> signup verification.
    purpose = (
        "phone_verification"
        if user
        else "signup"
    )

    latest_otp = get_latest_otp(
        db,
        phone_number,
        purpose,
    )

    if latest_otp:
        created_at = normalize_datetime(latest_otp.created_at)

        if (utc_now() - created_at).total_seconds() < 60:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait before requesting another OTP",
            )

    if not debug_otp_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OTP delivery is not configured. Please contact the administrator.",
        )

    otp = generate_otp()

    save_otp(
        db=db,
        phone_number=phone_number,
        otp=otp,
        purpose=purpose,
    )

    return {
        "message": "Development OTP generated. Enter it to verify this phone number.",
        "phone_verified": False,
        "debug_otp": otp,
    }


# --------------------------------------------------
# REQUEST PASSWORD RESET OTP
# --------------------------------------------------

@router.post("/forgot-password")
def forgot_password(
    request: OTPRequest,
    db: Session = Depends(get_db),
):
    phone_number = normalize_phone_number(request.phone_number)
    if not re.fullmatch(r"[6-9]\d{9}", phone_number):
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit Indian mobile number")
    if not debug_otp_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OTP delivery is not configured. Please contact the administrator.",
        )

    generic_response = {
        "message": (
            "If the account is eligible, "
            "password reset instructions will be sent."
        )
    }

    user = (
        db.query(User)
        .filter(User.phone_number == phone_number)
        .first()
    )

    if (
        user is None
        or not user.is_active
        or not user.phone_verified
    ):
        return generic_response

    latest_otp = get_latest_otp(
        db,
        phone_number,
        "password_reset",
    )

    if latest_otp:
        created_at = normalize_datetime(latest_otp.created_at)

        if (utc_now() - created_at).total_seconds() < 60:
            return generic_response

    otp = generate_otp()

    save_otp(
        db=db,
        phone_number=phone_number,
        otp=otp,
        purpose="password_reset",
    )

    return {**generic_response, "debug_otp": otp}


# --------------------------------------------------
# VERIFY PHONE VERIFICATION OTP
# --------------------------------------------------

@router.post("/verify-otp")
def verify_phone_otp(
    request: OTPVerify,
    db: Session = Depends(get_db),
):
    """
    Verify OTP for both:
    - existing unverified users
    - new signup users
    """

    phone_number = normalize_phone_number(request.phone_number)
    if not re.fullmatch(r"[6-9]\d{9}", phone_number):
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit Indian mobile number")

    user = (
        db.query(User)
        .filter(User.phone_number == phone_number)
        .first()
    )

    # Existing account.
    if user:
        if user.phone_verified:
            return {
                "message": "Phone number is already verified",
                "phone_verified": True,
            }

        purpose = "phone_verification"

    # New signup account.
    else:
        purpose = "signup"

    is_valid = verify_otp(
        db=db,
        phone_number=phone_number,
        otp=request.otp,
        purpose=purpose,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    # Existing user: permanently mark phone as verified.
    if user:
        user.phone_verified = True
        db.commit()
        db.refresh(user)

        return {
            "message": "Phone number verified successfully",
            "phone_verified": True,
        }

    # New signup: return a short-lived verification token.
    verification_token = create_access_token(
        {
            "sub": f"signup:{phone_number}",
            "purpose": "signup_phone_verification",
        },
        expires_delta=timedelta(minutes=10),
    )

    return {
        "message": "Phone number verified successfully",
        "phone_verified": True,
        "verified": True,
        "verificationToken": verification_token,
    }


# --------------------------------------------------
# VERIFY PASSWORD RESET OTP
# --------------------------------------------------

@router.post("/verify-reset-otp")
def verify_password_reset_otp(
    request: PasswordResetOTPVerify,
    db: Session = Depends(get_db),
):
    phone_number = normalize_phone_number(request.phone_number)
    user = (
        db.query(User)
        .filter(User.phone_number == phone_number)
        .first()
    )

    if (
        user is None
        or not user.is_active
        or not user.phone_verified
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    is_valid = verify_otp(
        db=db,
        phone_number=phone_number,
        otp=request.otp,
        purpose="password_reset",
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    try:
        # Invalidate previously issued reset tokens.
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.is_used.is_(False),
        ).update(
            {"is_used": True},
            synchronize_session=False,
        )

        raw_token = create_password_reset_token(user.id)

        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_password_reset_token(raw_token),
            expires_at=utc_now() + timedelta(
                minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
            ),
            is_used=False,
            created_at=utc_now(),
        )

        db.add(reset_record)
        db.commit()

    except Exception:
        db.rollback()
        raise

    # Return the raw token only once.
    # The client must keep it temporarily for the reset request.
    return {
        "message": "OTP verified successfully",
        "reset_token": raw_token,
        "expires_in_minutes": PASSWORD_RESET_TOKEN_EXPIRE_MINUTES,
    }


# --------------------------------------------------
# RESET PASSWORD
# --------------------------------------------------

# --------------------------------------------------
# RESET PASSWORD
# --------------------------------------------------

@router.post("/reset-password")
def reset_password(
    request: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    raw_token = request.reset_token

    if not verify_password_reset_token(raw_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    token_hash = hash_password_reset_token(raw_token)

    try:
        # Find an unused reset token.
        reset_record = (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.is_used.is_(False),
            )
            .first()
        )

        if reset_record is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        # Check expiry before consuming the token.
        if utc_now() >= normalize_datetime(
            reset_record.expires_at
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        # Make sure the associated user is still active.
        user = (
            db.query(User)
            .filter(User.id == reset_record.user_id)
            .first()
        )

        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token",
            )

        # Update the password.
        user.hashed_password = get_password_hash(
            request.new_password
        )

        # Consume the token only after all validation succeeds.
        reset_record.is_used = True

        # Invalidate any other unused reset tokens for this user.
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.id != reset_record.id,
            PasswordResetToken.is_used.is_(False),
        ).update(
            {"is_used": True},
            synchronize_session=False,
        )

        db.commit()

        return {
            "message": "Password reset successfully"
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise



# --------------------------------------------------
# REGISTER USER
# --------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    full_name: str = Form(..., min_length=2, max_length=160),
    phone: str = Form(...),
    email: str = Form(..., min_length=3, max_length=255),
    password: str = Form(..., min_length=8, max_length=128),
    confirmPassword: str = Form(..., min_length=8, max_length=128),
    phoneVerificationToken: str = Form(...),
    dateOfBirth: str = Form(...),
    gender: str = Form(...),
    permanentAddress: str = Form(..., min_length=5, max_length=1000),
    correspondenceAddress: str = Form(..., min_length=5, max_length=1000),
    bloodGroup: str | None = Form(None),
    certificate: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    full_name = full_name.strip()
    phone_number = normalize_phone_number(phone)
    permanent_address = permanentAddress.strip()
    correspondence_address = correspondenceAddress.strip()
    gender = gender.strip()
    blood_group = bloodGroup.strip() if bloodGroup else None

    if len(full_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter your full name",
        )

    if not re.fullmatch(r"[6-9]\d{9}", phone_number):
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit Indian mobile number")

    if password != confirmPassword:
        raise HTTPException(status_code=400, detail="Password and confirm password must match")

    try:
        email = TypeAdapter(EmailStr).validate_python(email.strip()).lower()
    except ValidationError:
        raise HTTPException(status_code=400, detail="Enter a valid email address")

    try:
        birth_date = date.fromisoformat(dateOfBirth)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Enter a valid date of birth")
    today = date.today()
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    if birth_date >= today or age < 18:
        raise HTTPException(status_code=400, detail="Members must be at least 18 years old")
    if gender not in {"Male", "Female", "Non-binary", "Prefer not to say"}:
        raise HTTPException(status_code=400, detail="Select a valid gender")
    if len(permanent_address) < 5 or len(correspondence_address) < 5:
        raise HTTPException(status_code=400, detail="Enter both permanent and correspondence addresses")
    if not certificate.filename:
        raise HTTPException(status_code=400, detail="Upload your caste/community certificate")

    # Verify the short-lived signup phone verification token
    try:
        payload = jwt.decode(
            phoneVerificationToken,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        expected_sub = f"signup:{phone_number}"

        if payload.get("sub") != expected_sub:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone verification token",
            )

        if payload.get("purpose") != "signup_phone_verification":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token purpose",
            )

    except HTTPException:
        raise
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired phone verification token",
        )

    # Check duplicate phone
    existing_phone = (
        db.query(User)
        .filter(User.phone_number == phone_number)
        .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    # Check duplicate email
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Get default CITIZEN role
    citizen_role = (
        db.query(Role)
        .filter(
            Role.name == "CITIZEN",
            Role.is_active.is_(True),
        )
        .first()
    )

    if citizen_role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Default CITIZEN role is not configured",
        )

    # Create pending membership
    new_user = User(
        full_name=full_name,
        phone_number=phone_number,
        email=email,
        hashed_password=get_password_hash(password),
        role="CITIZEN",
        role_id=citizen_role.id,
        is_active=True,
        phone_verified=True,
        membership_status="PENDING",
        membership_number=None,
        application_details={
            "review_stage": "ADMIN_REVIEW",
            "date_of_birth": birth_date.isoformat(),
            "gender": gender,
            "permanent_address": permanent_address,
            "correspondence_address": correspondence_address,
            "blood_group": blood_group,
        },
    )

    stored_name = None
    try:
        db.add(new_user)
        db.flush()

        stored_name = save_private_document(certificate)
        now = datetime.now(timezone.utc).isoformat()
        db.add(Verification(
            user_id=new_user.id,
            document_type="Community certificate",
            document_url=stored_name,
            status="PENDING",
            admin_remark=None,
            created_at=now,
            updated_at=now,
        ))

        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        if stored_name:
            private_document_path(stored_name).unlink(missing_ok=True)
        raise

    return new_user


# --------------------------------------------------
# LOGIN USER
# --------------------------------------------------

@router.post("/login", response_model=Token)
def login_user(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    identifier = credentials.identifier.strip()

    if "@" in identifier:
        identifier = identifier.lower()
        user = (
            db.query(User)
            .filter(User.email == identifier)
            .first()
        )
    else:
        identifier = normalize_phone_number(identifier)
        if not re.fullmatch(r"[6-9]\d{9}", identifier):
            raise HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Bearer"})
        user = (
            db.query(User)
            .filter(User.phone_number == identifier)
            .first()
        )

    if not user or not verify_password(
        credentials.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    if not user.phone_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your phone number before logging in",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# --------------------------------------------------
# CURRENT USER PROFILE
# --------------------------------------------------

@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the authenticated user's profile and membership status."""
    role_record = current_user.role_record
    role_permissions = role_record.permissions or [] if role_record is not None else []
    has_term_history = role_record is not None and db.query(CommitteeAssignment.id).filter(
        CommitteeAssignment.user_id == current_user.id,
        CommitteeAssignment.role_id == current_user.role_id,
    ).first() is not None
    role_is_current = role_record is not None and (
        not has_term_history
        or user_has_any_permission(current_user, tuple(role_permissions), db)
    )
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "phone_number": current_user.phone_number,
        "email": current_user.email,
        "role": role_record.name if role_record and role_is_current else "CITIZEN" if has_term_history else current_user.role,
        "permissions": role_permissions if role_is_current else [],
        "is_active": current_user.is_active,
        "membership_status": current_user.membership_status,
        "membership_number": current_user.membership_number,
    }


# --------------------------------------------------
# ADMIN TEST
# --------------------------------------------------

@router.get("/admin-test")
def admin_test(
    current_user: User = Depends(require_role("ADMIN")),
):
    return {
        "message": "Welcome Admin!",
        "user": current_user.full_name,
    }


# --------------------------------------------------
# ADMIN MEMBERSHIP VERIFICATION
# --------------------------------------------------

@router.get("/admin/members")
def get_member_directory(
    current_user: User = Depends(require_any_permission("membership.view", "members.manage")),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.membership_status == "APPROVED")
        .order_by(User.full_name.asc())
        .all()
    )
    return [{
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "membership_status": user.membership_status,
        "membership_number": user.membership_number,
        "is_active": user.is_active,
        "role": user.role_record.name if user.role_record else user.role,
        "role_id": user.role_id,
    } for user in users]


@router.patch("/admin/members/{user_id}/status")
def set_member_activation(
    user_id: int,
    data: MemberActivationUpdate,
    current_user: User = Depends(require_permission("members.manage")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Member not found")
    if user.membership_status != "APPROVED":
        raise HTTPException(status_code=409, detail="Only approved members can be activated or deactivated")
    if user.id == current_user.id:
        raise HTTPException(status_code=409, detail="You cannot deactivate your own account")
    role_name = (user.role_record.name if user.role_record else user.role or "").strip().upper()
    if role_name in {"ADMIN", "SUPER ADMIN"}:
        raise HTTPException(status_code=403, detail="Platform administrator accounts cannot be changed here")

    user.is_active = data.is_active
    create_notification(
        db,
        user.id,
        "Account access updated",
        "Your member account has been activated." if data.is_active else "Your member account has been deactivated. Contact the community administrator if you need help.",
        "membership",
    )
    db.commit()
    return {"user_id": user.id, "is_active": user.is_active}

@router.get("/admin/memberships/pending")
def get_pending_memberships(
    current_user: User = Depends(require_any_permission("membership.review", "community.approve")),
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.membership_status == "PENDING")
        .order_by(User.id.asc())
        .all()
    )
    user_ids = [user.id for user in users]
    document_statuses: dict[int, list[str]] = {}
    if user_ids:
        for user_id, document_status in db.query(Verification.user_id, Verification.status).filter(Verification.user_id.in_(user_ids)).all():
            document_statuses.setdefault(user_id, []).append(document_status)

    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "phone_verified": user.phone_verified,
            "membership_status": user.membership_status,
            "membership_number": user.membership_number,
            "document_count": len(document_statuses.get(user.id, [])),
            "approved_documents_count": sum(status == "APPROVED" for status in document_statuses.get(user.id, [])),
            "review_stage": (user.application_details or {}).get("review_stage", "ADMIN_REVIEW"),
        }
        for user in users
    ]


@router.get("/admin/memberships/{user_id}")
def get_membership_application(
    user_id: int,
    current_user: User = Depends(require_any_permission("membership.review", "community.approve")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    documents = (
        db.query(Verification)
        .filter(Verification.user_id == user.id)
        .order_by(Verification.created_at.desc())
        .all()
    )

    return {
        "id": user.id,
        "full_name": user.full_name,
        "phone_number": user.phone_number,
        "email": user.email,
        "phone_verified": user.phone_verified,
        "membership_status": user.membership_status,
        "membership_number": user.membership_number,
        "application_details": user.application_details or {},
        "review_stage": (user.application_details or {}).get("review_stage", "ADMIN_REVIEW"),
        "documents": [
            {
                "id": document.id,
                "document_type": document.document_type,
                "status": document.status,
                "admin_remark": document.admin_remark,
                "created_at": document.created_at,
                "download_url": f"/verification/{document.id}/file",
            }
            for document in documents
        ],
    }


@router.post("/admin/memberships/{user_id}/request-documents")
def request_membership_documents(
    user_id: int,
    current_user: User = Depends(require_permission("membership.review")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.membership_status != "PENDING":
        raise HTTPException(status_code=409, detail="Documents can only be requested for a pending membership")

    create_notification(
        db,
        user.id,
        "Please resubmit your membership documents",
        "We could not find your uploaded documents attached to your membership request. Please sign in, open Documents, and submit them again for verification.",
        "verification",
    )
    details = dict(user.application_details or {})
    current_role = (current_user.role_record.name if current_user.role_record else current_user.role or "").strip().upper()
    details["review_stage"] = "ADMIN_REVIEW" if current_role == "ADMIN" else "VERIFICATION_OFFICER_REVIEW"
    user.application_details = details
    db.commit()
    return {"message": "The member was notified to resubmit their documents."}


@router.post("/admin/memberships/{user_id}/forward-to-verification")
def forward_membership_to_verification(
    user_id: int,
    current_user: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    details = dict(user.application_details or {})
    if user.membership_status != "PENDING" or details.get("review_stage", "ADMIN_REVIEW") != "ADMIN_REVIEW":
        raise HTTPException(status_code=409, detail="This application is not awaiting initial administrator review")
    documents = db.query(Verification).filter(Verification.user_id == user.id).all()
    if not documents or any(document.status != "APPROVED" for document in documents):
        raise HTTPException(status_code=409, detail="Review and approve all uploaded documents before forwarding this application")
    verifiers = db.query(User).join(Role, User.role_id == Role.id).filter(
        User.is_active.is_(True),
        Role.is_active.is_(True),
        func.lower(func.trim(Role.name)) == "verification officer",
    ).all()
    if not verifiers:
        raise HTTPException(
            status_code=409,
            detail="No active Verification Officer is assigned. Assign this role to an approved member in Committee & Roles, then try again.",
        )
    details["review_stage"] = "VERIFICATION_OFFICER_REVIEW"
    user.application_details = details
    for verifier in verifiers:
        create_notification(db, verifier.id, "Membership application for verification", f"{user.full_name}'s membership application is ready for verification review.", "verification")
    db.commit()
    return {"user_id": user.id, "review_stage": details["review_stage"]}


@router.post("/admin/memberships/{user_id}/forward-to-president")
def forward_membership_to_president(
    user_id: int,
    current_user: User = Depends(require_permission("documents.review", allow_admin=False)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    details = dict(user.application_details or {})
    if user.membership_status != "PENDING" or details.get("review_stage", "ADMIN_REVIEW") != "VERIFICATION_OFFICER_REVIEW":
        raise HTTPException(status_code=409, detail="This application is not awaiting verification officer review")
    documents = db.query(Verification).filter(Verification.user_id == user.id).all()
    if not documents or any(document.status != "APPROVED" for document in documents):
        raise HTTPException(status_code=409, detail="Review and approve all uploaded documents before forwarding to the President")
    details["review_stage"] = "PRESIDENT_REVIEW"
    user.application_details = details
    presidents = db.query(User).join(Role, User.role_id == Role.id).filter(User.is_active.is_(True), Role.name == "President / Head").all()
    for president in presidents:
        create_notification(db, president.id, "Membership decision required", f"{user.full_name}'s verified membership application is ready for your decision.", "membership")
    db.commit()
    return {"user_id": user.id, "review_stage": details["review_stage"]}


@router.patch("/admin/memberships/{user_id}/approve")
def approve_membership(
    user_id: int,
    current_user: User = Depends(require_permission("community.approve", allow_admin=False)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.membership_status == "APPROVED":
        return {
            "message": "Membership is already approved",
            "user_id": user.id,
            "membership_status": user.membership_status,
            "membership_number": user.membership_number,
        }

    if user.membership_status == "REJECTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejected membership cannot be approved directly",
        )

    if (user.application_details or {}).get("review_stage", "ADMIN_REVIEW") != "PRESIDENT_REVIEW":
        raise HTTPException(status_code=409, detail="The verification officer must forward this application to the President first")

    approved_document = (
        db.query(Verification)
        .filter(
            Verification.user_id == user.id,
            Verification.status == "APPROVED",
        )
        .first()
    )
    if approved_document is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Review and approve at least one submitted document before approving this membership.",
        )

    user.membership_status = "APPROVED"

    if not user.membership_number:
        year = datetime.now(timezone.utc).year
        user.membership_number = f"POT-{year}-{user.id:06d}"

    create_notification(
        db,
        user.id,
        "Membership approved",
        f"Your membership is approved. Your membership ID is {user.membership_number}.",
        "membership",
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "Membership approved successfully",
        "user_id": user.id,
        "full_name": user.full_name,
        "membership_status": user.membership_status,
        "membership_number": user.membership_number,
    }


@router.patch("/admin/memberships/{user_id}/reject")
def reject_membership(
    user_id: int,
    decision: MembershipDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.membership_status == "REJECTED":
        return {
            "message": "Membership is already rejected",
            "user_id": user.id,
            "membership_status": user.membership_status,
        }

    if user.membership_status == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Approved membership cannot be rejected directly",
        )

    stage = (user.application_details or {}).get("review_stage", "ADMIN_REVIEW")
    current_role_name = (user.role_record.name if user.role_record else current_user.role or "").strip().upper()
    if stage == "ADMIN_REVIEW":
        allowed = current_role_name == "ADMIN"
    elif stage == "VERIFICATION_OFFICER_REVIEW":
        allowed = user_has_any_permission(current_user, ("documents.review",), db, allow_admin=False)
    else:
        allowed = user_has_any_permission(current_user, ("community.approve",), db, allow_admin=False)
    if not allowed:
        raise HTTPException(status_code=403, detail="Your role cannot reject this application at its current review stage")

    user.membership_status = "REJECTED"
    details = dict(user.application_details or {})
    details["rejection_remark"] = decision.remark.strip()
    user.application_details = details

    create_notification(
        db,
        user.id,
        "Membership application update",
        f"Your membership application was not approved. Review reason: {decision.remark.strip()}",
        "membership",
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "Membership rejected successfully",
        "user_id": user.id,
        "full_name": user.full_name,
        "membership_status": user.membership_status,
    }
