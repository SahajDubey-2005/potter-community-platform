import os
import tempfile
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models import PhoneOTP, PasswordResetToken, User, Role
from app.otp_service import generate_otp, save_otp, verify_otp
from app.auth import hash_password_reset_token


# --------------------------------------------------
# Test database configuration
# --------------------------------------------------

_test_db_file = tempfile.NamedTemporaryFile(
    suffix=".db",
    delete=False,
)
_test_db_file.close()

TEST_DATABASE_URL = f"sqlite:///{_test_db_file.name}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

Base.metadata.create_all(bind=test_engine)
# --------------------------------------------------
# Seed default roles for test database
# --------------------------------------------------

with TestingSessionLocal() as db:
    default_roles = [
        Role(
            name="ADMIN",
            description="System administrator",
            is_active=True,
        ),
        Role(
            name="ARTISAN",
            description="Registered potter/artisan",
            is_active=True,
        ),
        Role(
            name="CITIZEN",
            description="Registered citizen/member",
            is_active=True,
        ),
    ]

    db.add_all(default_roles)
    db.commit()

SessionLocal = TestingSessionLocal
client = TestClient(app)


# --------------------------------------------------
# OTP security tests
# --------------------------------------------------

def test_otp_rejects_after_five_incorrect_attempts():
    phone = "+919876543210"

    with SessionLocal() as db:
        try:
            otp = generate_otp()
            record = save_otp(db, phone, otp)

            for _ in range(5):
                assert verify_otp(db, phone, "999999") is False

            db.refresh(record)

            assert record.attempts == 5
            assert record.is_used is True

        finally:
            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()
            db.commit()


def test_expired_otp_is_rejected():
    phone = "+919876543211"

    with SessionLocal() as db:
        try:
            otp = generate_otp()
            record = save_otp(db, phone, otp)

            record.expires_at = (
                datetime.now(timezone.utc)
                - timedelta(minutes=1)
            )
            db.commit()

            assert verify_otp(db, phone, otp) is False

            db.refresh(record)
            assert record.is_used is True

        finally:
            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()
            db.commit()


def test_otp_can_only_be_used_once():
    phone = "+919876543212"

    with SessionLocal() as db:
        try:
            otp = generate_otp()
            save_otp(db, phone, otp)

            assert verify_otp(db, phone, otp) is True
            assert verify_otp(db, phone, otp) is False

        finally:
            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()
            db.commit()


def test_new_otp_invalidates_previous_otp():
    phone = "+919876543213"

    with SessionLocal() as db:
        try:
            old_otp = generate_otp()
            old_record = save_otp(db, phone, old_otp)

            new_otp = generate_otp()
            new_record = save_otp(db, phone, new_otp)

            db.refresh(old_record)
            db.refresh(new_record)

            assert old_record.is_used is True
            assert new_record.is_used is False

            assert verify_otp(db, phone, old_otp) is False
            assert verify_otp(db, phone, new_otp) is True

        finally:
            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()
            db.commit()


def test_otp_hash_is_not_stored_as_plaintext():
    phone = "+919876543214"

    with SessionLocal() as db:
        try:
            otp = generate_otp()
            record = save_otp(db, phone, otp)

            assert record.otp_hash != otp
            assert len(record.otp_hash) == 64

        finally:
            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()
            db.commit()


# --------------------------------------------------
# Authentication security tests
# --------------------------------------------------

def test_request_otp_cooldown():
    unique_id = uuid.uuid4().hex
    phone = f"987{uuid.uuid4().int % 10**7:07d}"
    email = f"cooldown-{unique_id}@example.com"

    try:
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Cooldown Test User",
                "phone_number": phone,
                "email": email,
                "password": "TestPass@123",
            },
        )

        assert response.status_code == 201

        first_response = client.post(
            "/auth/request-otp",
            json={"phone_number": phone},
        )

        assert first_response.status_code == 200

        second_response = client.post(
            "/auth/request-otp",
            json={"phone_number": phone},
        )

        assert second_response.status_code == 429

    finally:
        with SessionLocal() as db:
            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()

            db.query(User).filter(
                User.phone_number == phone
            ).delete()

            db.commit()


def test_unverified_user_cannot_login():
    unique_id = uuid.uuid4().hex
    phone = f"987{uuid.uuid4().int % 10**7:07d}"
    email = f"unverified-{unique_id}@example.com"

    try:
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Unverified Test User",
                "phone_number": phone,
                "email": email,
                "password": "TestPass@123",
            },
        )

        assert response.status_code == 201

        response = client.post(
            "/auth/login",
            json={
                "identifier": email,
                "password": "TestPass@123",
            },
        )

        assert response.status_code == 403
        assert "verify your phone" in response.json()["detail"].lower()

    finally:
        with SessionLocal() as db:
            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()

            db.query(User).filter(
                User.phone_number == phone
            ).delete()

            db.commit()


def test_login_rejects_wrong_password():
    unique_id = uuid.uuid4().hex
    phone = f"987{uuid.uuid4().int % 10**7:07d}"
    email = f"wrong-password-{unique_id}@example.com"

    try:
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Password Test User",
                "phone_number": phone,
                "email": email,
                "password": "TestPass@123",
            },
        )

        assert response.status_code == 201

        response = client.post(
            "/auth/login",
            json={
                "identifier": email,
                "password": "WrongPass@123",
            },
        )

        assert response.status_code == 401

    finally:
        with SessionLocal() as db:
            db.query(User).filter(
                User.phone_number == phone
            ).delete()
            db.commit()


def test_citizen_cannot_access_admin_endpoint():
    unique_id = uuid.uuid4().hex
    phone = f"987{uuid.uuid4().int % 10**7:07d}"
    email = f"citizen-admin-test-{unique_id}@example.com"

    try:
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Citizen Test User",
                "phone_number": phone,
                "email": email,
                "password": "TestPass@123",
            },
        )

        assert response.status_code == 201

        with SessionLocal() as db:
            user = db.query(User).filter(
                User.phone_number == phone
            ).first()

            assert user is not None

            user.phone_verified = True
            db.commit()

        response = client.post(
            "/auth/login",
            json={
                "identifier": email,
                "password": "TestPass@123",
            },
        )

        assert response.status_code == 200

        token = response.json()["access_token"]

        response = client.get(
            "/auth/admin-test",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

    finally:
        with SessionLocal() as db:
            db.query(User).filter(
                User.phone_number == phone
            ).delete()
            db.commit()




# --------------------------------------------------
# Community membership approval tests
# --------------------------------------------------

def test_admin_can_approve_membership_and_generate_id():
    unique_id = uuid.uuid4().hex
    admin_phone = f"987{uuid.uuid4().int % 10**7:07d}"
    member_phone = f"987{uuid.uuid4().int % 10**7:07d}"
    admin_email = f"admin-membership-{unique_id}@example.com"
    member_email = f"member-membership-{unique_id}@example.com"

    try:
        for name, phone, email in [
            ("Membership Test Admin", admin_phone, admin_email),
            ("Membership Test Member", member_phone, member_email),
        ]:
            response = client.post(
                "/auth/register",
                json={
                    "full_name": name,
                    "phone_number": phone,
                    "email": email,
                    "password": "TestPass@123",
                },
            )
            assert response.status_code == 201

        with SessionLocal() as db:
            admin = db.query(User).filter(
                User.phone_number == admin_phone
            ).first()
            member = db.query(User).filter(
                User.phone_number == member_phone
            ).first()

            assert admin is not None and member is not None

            admin.role = "ADMIN"
            admin.phone_verified = True
            member.phone_verified = True
            member_id = member.id
            db.commit()

        response = client.post(
            "/auth/login",
            json={
                "identifier": admin_email,
                "password": "TestPass@123",
            },
        )
        assert response.status_code == 200
        admin_token = response.json()["access_token"]

        response = client.patch(
            f"/verification/members/{member_id}/review",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "APPROVED", "admin_remark": "Verified"},
        )

        assert response.status_code == 200
        result = response.json()
        assert result["membership_status"] == "APPROVED"
        assert result["membership_number"].startswith("POT-")
        assert result["membership_number"].endswith(f"{member_id:06d}")

        # A reviewed application cannot be reviewed again.
        response = client.patch(
            f"/verification/members/{member_id}/review",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"status": "REJECTED", "admin_remark": "Second review"},
        )
        assert response.status_code == 409

    finally:
        with SessionLocal() as db:
            for phone in [admin_phone, member_phone]:
                user = db.query(User).filter(
                    User.phone_number == phone
                ).first()
                if user is not None:
                    db.query(PasswordResetToken).filter(
                        PasswordResetToken.user_id == user.id
                    ).delete()
                    db.query(PhoneOTP).filter(
                        PhoneOTP.phone_number == phone
                    ).delete()
                    db.delete(user)
            db.commit()


def test_citizen_cannot_approve_membership():
    unique_id = uuid.uuid4().hex
    citizen_phone = f"987{uuid.uuid4().int % 10**7:07d}"
    member_phone = f"987{uuid.uuid4().int % 10**7:07d}"
    citizen_email = f"citizen-review-{unique_id}@example.com"
    member_email = f"member-review-{unique_id}@example.com"

    try:
        for name, phone, email in [
            ("Regular Citizen", citizen_phone, citizen_email),
            ("Pending Member", member_phone, member_email),
        ]:
            response = client.post(
                "/auth/register",
                json={
                    "full_name": name,
                    "phone_number": phone,
                    "email": email,
                    "password": "TestPass@123",
                },
            )
            assert response.status_code == 201

        with SessionLocal() as db:
            citizen = db.query(User).filter(
                User.phone_number == citizen_phone
            ).first()
            member = db.query(User).filter(
                User.phone_number == member_phone
            ).first()

            assert citizen is not None and member is not None
            citizen.phone_verified = True
            member_id = member.id
            db.commit()

        response = client.post(
            "/auth/login",
            json={
                "identifier": citizen_email,
                "password": "TestPass@123",
            },
        )
        assert response.status_code == 200

        response = client.patch(
            f"/verification/members/{member_id}/review",
            headers={
                "Authorization": f"Bearer {response.json()['access_token']}"
            },
            json={"status": "APPROVED"},
        )
        assert response.status_code == 403

        with SessionLocal() as db:
            member = db.query(User).filter(
                User.id == member_id
            ).first()
            assert member is not None
            assert member.membership_status == "PENDING"
            assert member.membership_number is None

    finally:
        with SessionLocal() as db:
            for phone in [citizen_phone, member_phone]:
                user = db.query(User).filter(
                    User.phone_number == phone
                ).first()
                if user is not None:
                    db.query(PasswordResetToken).filter(
                        PasswordResetToken.user_id == user.id
                    ).delete()
                    db.query(PhoneOTP).filter(
                        PhoneOTP.phone_number == phone
                    ).delete()
                    db.delete(user)
            db.commit()


# --------------------------------------------------
# Password reset end-to-end test
# --------------------------------------------------

def test_password_reset_flow_and_token_reuse():
    unique_id = uuid.uuid4().hex
    phone = f"987{uuid.uuid4().int % 10**7:07d}"
    email = f"password-reset-{unique_id}@example.com"

    old_password = "OldPass@123"
    new_password = "NewPass@456"

    user_id = None

    try:
        # 1. Register a user.
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Password Reset Test User",
                "phone_number": phone,
                "email": email,
                "password": old_password,
            },
        )

        assert response.status_code == 201

        # 2. Verify the phone for this isolated test.
        with SessionLocal() as db:
            user = db.query(User).filter(
                User.phone_number == phone
            ).first()

            assert user is not None

            user.phone_verified = True
            db.commit()

            user_id = user.id

            # 3. Create a known password-reset OTP.
            save_otp(
                db,
                phone,
                "123456",
                purpose="password_reset",
            )

        # 4. Verify the OTP and obtain a reset token.
        response = client.post(
            "/auth/verify-reset-otp",
            json={
                "phone_number": phone,
                "otp": "123456",
            },
        )

        assert response.status_code == 200

        reset_token = response.json()["reset_token"]

        assert reset_token
        assert response.json()["expires_in_minutes"] == 10

        # 5. Reset the password.
        response = client.post(
            "/auth/reset-password",
            json={
                "reset_token": reset_token,
                "new_password": new_password,
                "confirm_password": new_password,
            },
        )

        assert response.status_code == 200
        assert response.json()["message"] == "Password reset successfully"

        # 6. Confirm login succeeds with the new password.
        response = client.post(
            "/auth/login",
            json={
                "identifier": phone,
                "password": new_password,
            },
        )

        assert response.status_code == 200
        assert "access_token" in response.json()

        # 7. Confirm the old password no longer works.
        response = client.post(
            "/auth/login",
            json={
                "identifier": phone,
                "password": old_password,
            },
        )

        assert response.status_code == 401

        # 8. Confirm the reset token cannot be reused.
        response = client.post(
            "/auth/reset-password",
            json={
                "reset_token": reset_token,
                "new_password": "AnotherPass@789",
                "confirm_password": "AnotherPass@789",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired reset token"

    finally:
        with SessionLocal() as db:
            if user_id is not None:
                db.query(PasswordResetToken).filter(
                    PasswordResetToken.user_id == user_id
                ).delete()

            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()

            db.query(User).filter(
                User.phone_number == phone
            ).delete()

            db.commit()


# --------------------------------------------------
# Test database cleanup
# --------------------------------------------------



# --------------------------------------------------
# Password reset token security tests
# --------------------------------------------------


def test_password_reset_rejects_mismatched_passwords():
    response = client.post(
        "/auth/reset-password",
        json={
            "reset_token": "a" * 50,
            "new_password": "SecurePass@123",
            "confirm_password": "DifferentPass@123",
        },
    )

    assert response.status_code == 422


def test_password_reset_rejects_password_shorter_than_eight_characters():
    response = client.post(
        "/auth/reset-password",
        json={
            "reset_token": "a" * 50,
            "new_password": "Short1!",
            "confirm_password": "Short1!",
        },
    )

    assert response.status_code == 422


def test_invalid_password_reset_token_rejected():
    response = client.post(
        "/auth/reset-password",
        json={
            "reset_token": "invalid-token-value",
            "new_password": "SecurePass@123",
            "confirm_password": "SecurePass@123",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid or expired reset token"


def test_expired_password_reset_token_rejected():
    unique_id = uuid.uuid4().hex
    phone = f"987{uuid.uuid4().int % 10**7:07d}"
    email = f"expired-reset-{unique_id}@example.com"
    raw_token = "expired-test-token-" + unique_id
    user_id = None

    try:
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Expired Reset Test User",
                "phone_number": phone,
                "email": email,
                "password": "SecurePass@123",
            },
        )
        assert response.status_code == 201

        with SessionLocal() as db:
            user = db.query(User).filter(
                User.phone_number == phone
            ).first()
            assert user is not None
            user_id = user.id

            db.add(
                PasswordResetToken(
                    user_id=user.id,
                    token_hash=hash_password_reset_token(raw_token),
                    expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
                    is_used=False,
                    created_at=datetime.now(timezone.utc),
                )
            )
            db.commit()

        response = client.post(
            "/auth/reset-password",
            json={
                "reset_token": raw_token,
                "new_password": "NewSecurePass@123",
                "confirm_password": "NewSecurePass@123",
            },
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Invalid or expired reset token"

    finally:
        with SessionLocal() as db:
            if user_id is not None:
                db.query(PasswordResetToken).filter(
                    PasswordResetToken.user_id == user_id
                ).delete()
                db.query(PhoneOTP).filter(
                    PhoneOTP.phone_number == phone
                ).delete()
                db.query(User).filter(
                    User.id == user_id
                ).delete()
                db.commit()


@pytest.fixture(scope="module", autouse=True)
def cleanup_test_database():
    try:
        yield
    finally:
        app.dependency_overrides.pop(get_db, None)
        client.close()
        test_engine.dispose()

        if os.path.exists(_test_db_file.name):
            os.remove(_test_db_file.name)


# --------------------------------------------------
# Current user profile tests
# --------------------------------------------------

def test_member_can_fetch_own_profile_and_membership_status():
    unique_id = uuid.uuid4().hex
    phone = f"987{uuid.uuid4().int % 10**7:07d}"
    email = f"profile-{unique_id}@example.com"

    try:
        response = client.post(
            "/auth/register",
            json={
                "full_name": "Profile Test User",
                "phone_number": phone,
                "email": email,
                "password": "TestPass@123",
            },
        )
        assert response.status_code == 201

        with SessionLocal() as db:
            user = db.query(User).filter(
                User.phone_number == phone
            ).first()
            assert user is not None
            user.phone_verified = True
            db.commit()

        response = client.post(
            "/auth/login",
            json={
                "identifier": email,
                "password": "TestPass@123",
            },
        )
        assert response.status_code == 200
        token = response.json()["access_token"]

        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Profile Test User"
        assert data["phone_number"] == phone
        assert data["email"] == email
        assert data["membership_status"] == "PENDING"
        assert data["membership_number"] is None

    finally:
        with SessionLocal() as db:
            user = db.query(User).filter(
                User.phone_number == phone
            ).first()
            if user:
                db.query(PasswordResetToken).filter(
                    PasswordResetToken.user_id == user.id
                ).delete()
                db.delete(user)
            db.query(PhoneOTP).filter(
                PhoneOTP.phone_number == phone
            ).delete()
            db.commit()


def test_member_profile_requires_authentication():
    response = client.get("/auth/me")
    assert response.status_code == 401
