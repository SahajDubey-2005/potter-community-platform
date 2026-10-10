from pydantic import BaseModel, EmailStr, Field

from app.models import UserRole


# -------------------------
# User Registration
# -------------------------

class UserCreate(BaseModel):
    full_name: str
    phone_number: str
    email: EmailStr | None = None
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    phone_number: str
    email: EmailStr | None = None
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


# -------------------------
# User Login
# -------------------------

class UserLogin(BaseModel):
    identifier: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


# -------------------------
# Verification
# -------------------------

class VerificationCreate(BaseModel):
    document_type: str
    document_url: str


class VerificationResponse(BaseModel):
    id: int
    user_id: int
    document_type: str
    document_url: str
    status: str
    admin_remark: str | None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class VerificationReview(BaseModel):
    status: str
    admin_remark: str | None = None


# -------------------------
# Phone OTP
# -------------------------

class OTPRequest(BaseModel):
    phone_number: str = Field(
        min_length=10,
        max_length=20
    )
class OTPVerify(BaseModel):
    phone_number: str = Field(
        min_length=10,
        max_length=20
    )
    otp: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$"
    )
