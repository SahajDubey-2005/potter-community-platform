import secrets
import hashlib
import hmac
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from app.models import PhoneOTP


from datetime import datetime, timedelta, timezone
load_dotenv()

OTP_EXPIRY_MINUTES = 5
MAX_OTP_ATTEMPTS = 5


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP."""
    return f"{secrets.randbelow(1_000_000):06d}"


def get_otp_expiry() -> datetime:
    """Return the UTC expiry time for a new OTP."""
    return datetime.now(timezone.utc) + timedelta(
        minutes=OTP_EXPIRY_MINUTES
    )


def is_otp_expired(expires_at: datetime) -> bool:
    """Check whether an OTP has expired."""

    # SQLite may return a naive datetime even when
    # timezone=True is specified in the model.
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return datetime.now(timezone.utc) >= expires_at

def hash_otp(otp: str) -> str:
    """Securely hash an OTP using HMAC-SHA256."""
    secret_key = os.getenv("SECRET_KEY")

    if not secret_key:
        raise RuntimeError("SECRET_KEY is not configured")

    return hmac.new(
        secret_key.encode("utf-8"),
        otp.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


def verify_otp_hash(otp: str, stored_hash: str) -> bool:
    """Verify an OTP against its stored hash."""
    return hmac.compare_digest(
        hash_otp(otp),
        stored_hash
    )
def save_otp(
    db: Session,
    phone_number: str,
    otp: str,
) -> PhoneOTP:
    """Invalidate old OTPs and securely store a new OTP."""

    try:
        # Invalidate previously unused OTPs for this phone.
        db.query(PhoneOTP).filter(
            PhoneOTP.phone_number == phone_number,
            PhoneOTP.is_used.is_(False),
        ).update(
            {"is_used": True},
            synchronize_session=False,
        )

        # Create the new OTP record.
        otp_record = PhoneOTP(
            phone_number=phone_number,
            otp_hash=hash_otp(otp),
            expires_at=get_otp_expiry(),
            attempts=0,
            is_used=False,
            created_at=datetime.now(timezone.utc),
        )

        db.add(otp_record)
        db.commit()
        db.refresh(otp_record)

        return otp_record

    except Exception:
        db.rollback()
        raise

def verify_otp(
    db: Session,
    phone_number: str,
    otp: str
) -> bool:
    """Verify an OTP with expiry and attempt limits."""

    otp_record = (
        db.query(PhoneOTP)
        .filter(
            PhoneOTP.phone_number == phone_number,
            PhoneOTP.is_used.is_(False)
        )
        .order_by(PhoneOTP.created_at.desc(), PhoneOTP.id.desc())
        .first()
    )

    if otp_record is None:
        return False

    if is_otp_expired(otp_record.expires_at):
        otp_record.is_used = True
        db.commit()
        return False

    if otp_record.attempts >= MAX_OTP_ATTEMPTS:
        otp_record.is_used = True
        db.commit()
        return False

    if not verify_otp_hash(otp, otp_record.otp_hash):
        otp_record.attempts += 1

        if otp_record.attempts >= MAX_OTP_ATTEMPTS:
            otp_record.is_used = True

        db.commit()
        return False

    otp_record.is_used = True
    db.commit()
    return True
