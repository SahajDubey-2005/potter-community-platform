from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    ARTISAN = "ARTISAN"
    CITIZEN = "CITIZEN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=True
    )

    phone_number = Column(
        String(20),
        unique=True,
        index=True,
        nullable=True
    )

    phone_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    hashed_password = Column(String, nullable=False)

    role = Column(
        String,
        default=UserRole.CITIZEN,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

class VerificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)

    document_type = Column(String, nullable=False)
    document_url = Column(String, nullable=False)

    status = Column(
        String,
        default=VerificationStatus.PENDING,
        nullable=False
    )

    admin_remark = Column(String, nullable=True)

    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)
class PhoneOTP(Base):
    __tablename__ = "phone_otps"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    phone_number: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )
    otp_hash: Mapped[str] = mapped_column(
        String, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    attempts: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    is_used: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
