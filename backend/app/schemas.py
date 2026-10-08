from pydantic import BaseModel, EmailStr

from app.models import UserRole

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.CITIZEN

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

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