from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.otp_service import generate_otp, save_otp, verify_otp
from app.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    OTPRequest,
    OTPVerify,
)
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    require_role,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# --------------------------------------------------
# REQUEST OTP
# --------------------------------------------------

@router.post("/request-otp")
def request_otp(
    request: OTPRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.phone_number == request.phone_number)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number is not registered",
        )

    if user.phone_verified:
        return {
            "message": "Phone number is already verified"
        }

    otp = generate_otp()

    save_otp(
        db=db,
        phone_number=request.phone_number,
        otp=otp,
    )

    # SMS provider is not integrated yet.
    # Never return the original OTP in this API response.
    return {
        "message": (
            "OTP generated and stored. "
            "SMS delivery is not configured yet."
        )
    }


# --------------------------------------------------
# VERIFY OTP
# --------------------------------------------------

@router.post("/verify-otp")
def verify_phone_otp(
    request: OTPVerify,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.phone_number == request.phone_number)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number is not registered",
        )

    if user.phone_verified:
        return {
            "message": "Phone number is already verified",
            "phone_verified": True,
        }

    is_valid = verify_otp(
        db=db,
        phone_number=request.phone_number,
        otp=request.otp,
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    user.phone_verified = True
    db.commit()
    db.refresh(user)

    return {
        "message": "Phone number verified successfully",
        "phone_verified": user.phone_verified,
    }


# --------------------------------------------------
# REGISTER USER
# --------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    existing_phone = (
        db.query(User)
        .filter(User.phone_number == user.phone_number)
        .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    if user.email is not None:
        existing_email = (
            db.query(User)
            .filter(User.email == user.email)
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    hashed_pwd = get_password_hash(user.password)

    new_user = User(
        full_name=user.full_name,
        phone_number=user.phone_number,
        email=user.email,
        hashed_password=hashed_pwd,
        role="CITIZEN",
        is_active=True,
        phone_verified=False,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

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
        user = (
            db.query(User)
            .filter(User.email == identifier)
            .first()
        )
    else:
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

    if user.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
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