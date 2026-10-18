from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    model_validator,
)




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
    role: str
    is_active: bool
    membership_status: str = "PENDING"
    membership_number: str | None = None
    permissions: list[str] = Field(default_factory=list)

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



class PasswordResetOTPVerify(BaseModel):
    phone_number: str = Field(
        min_length=10,
        max_length=20,
    )
    otp: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )

class PasswordResetRequest(BaseModel):
    reset_token: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self
