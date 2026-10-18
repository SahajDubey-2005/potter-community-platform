from datetime import date, datetime, timedelta, timezone
from typing import Optional
import os
import hashlib
import secrets

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CommitteeAssignment, User


# --------------------------------------------------
# ENVIRONMENT CONFIGURATION
# --------------------------------------------------

load_dotenv()

SECRET_KEY: str = os.getenv("SECRET_KEY") or ""

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not configured")

ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30)
)


# --------------------------------------------------
# PASSWORD HASHING
# --------------------------------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """Verify a plain password against its stored hash."""

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def get_password_hash(password: str) -> str:
    """Hash a password before storing it."""

    return pwd_context.hash(password)


# --------------------------------------------------
# ACCESS TOKEN
# --------------------------------------------------

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token for authentication."""

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt


# --------------------------------------------------
# PASSWORD RESET TOKEN
# --------------------------------------------------

PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 10

def create_password_reset_token(user_id: int) -> str:

    """Generate a cryptographically secure reset token."""

    return secrets.token_urlsafe(32)

def hash_password_reset_token(token: str) -> str:

    """Hash a reset token before database storage."""

    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def verify_password_reset_token(token: str) -> bool:

    """Validate the basic reset-token format."""

    return (

        isinstance(token, str)

        and 40 <= len(token) <= 100

    )


# --------------------------------------------------
# AUTHENTICATION SCHEME
# --------------------------------------------------

security = HTTPBearer()


# --------------------------------------------------
# GET CURRENT USER
# --------------------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Authenticate a request using a JWT access token."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if not isinstance(user_id, str):
            raise credentials_exception

        # Reject non-numeric user identifiers.
        if not user_id.isdigit():
            raise credentials_exception

    except (JWTError, ValueError):
        raise credentials_exception

    user = (
        db.query(User)
        .filter(User.id == int(user_id))
        .first()
    )

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    return user


# --------------------------------------------------
# ROLE-BASED ACCESS CONTROL
# --------------------------------------------------

def require_role(required_role: str):
    """Restrict an endpoint to users with a specific role."""

    def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        # `role` is the legacy column; newer accounts may have their role
        # assigned through `role_id` instead. Accept either representation so
        # an administrator provisioned through the roles table can review
        # membership applications too.
        legacy_role = (current_user.role or "").strip().upper()
        dynamic_role = (
            (current_user.role_record.name or "").strip().upper()
            if current_user.role_record
            else ""
        )

        if required_role.upper() not in {legacy_role, dynamic_role} and not (
            required_role.upper() == "ADMIN" and "SUPER ADMIN" in {legacy_role, dynamic_role}
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "You do not have permission "
                    "to access this resource"
                ),
            )

        return current_user

    return role_checker


def user_has_any_permission(current_user: User, permissions: tuple[str, ...], db: Session, allow_admin: bool = True) -> bool:
    role_record = current_user.role_record
    dynamic_role = (role_record.name or "").strip().upper() if role_record else ""
    legacy_role = (current_user.role or "").strip().upper()
    if allow_admin and {"ADMIN", "SUPER ADMIN"}.intersection({legacy_role, dynamic_role}):
        return True
    if role_record is None or not role_record.is_active:
        return False

    has_assignment_history = db.query(CommitteeAssignment.id).filter(
        CommitteeAssignment.user_id == current_user.id,
        CommitteeAssignment.role_id == current_user.role_id,
    ).first() is not None
    if has_assignment_history:
        active_assignment = db.query(CommitteeAssignment).filter(
            CommitteeAssignment.user_id == current_user.id,
            CommitteeAssignment.role_id == current_user.role_id,
            CommitteeAssignment.status == "ACTIVE",
        ).order_by(CommitteeAssignment.assigned_at.desc()).first()
        today = date.today()
        if not active_assignment or (active_assignment.term_start and active_assignment.term_start > today) or (active_assignment.term_end and active_assignment.term_end < today):
            return False
    return bool(set(permissions).intersection(role_record.permissions or []))


def require_permission(required_permission: str, allow_admin: bool = True):
    """Allow administrators or an active dynamic role with this permission."""

    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if not user_has_any_permission(current_user, (required_permission,), db, allow_admin=allow_admin):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )

        return current_user

    return permission_checker


def require_any_permission(*required_permissions: str):
    """Allow an administrator or a role holding any listed permission."""

    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        if not user_has_any_permission(current_user, required_permissions, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this resource")
        return current_user

    return permission_checker
