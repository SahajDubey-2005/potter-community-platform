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
from app.models import PhoneOTP, User
from app.otp_service import generate_otp, save_otp, verify_otp


_test_db_file = tempfile.NamedTemporaryFile(
    suffix=".db", delete=False
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

SessionLocal = TestingSessionLocal
client = TestClient(app)


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
                datetime.now(timezone.utc) - timedelta(minutes=1)
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


def test_request_otp_cooldown():
    # Generate unique credentials so repeated test runs
    # do not fail because of duplicate registration.
    unique_id = uuid.uuid4().hex
    phone = f"987{uuid.uuid4().int % 10**7:07d}"
    email = f"cooldown-{unique_id}@example.com"

    try:
        # Register a fresh, unverified user.
        register_response = client.post(
            "/auth/register",
            json={
                "full_name": "Cooldown Test User",
                "phone_number": phone,
                "email": email,
                "password": "TestPass@123",
            },
        )

        assert register_response.status_code == 201

        # First OTP request should succeed.
        first_response = client.post(
            "/auth/request-otp",
            json={"phone_number": phone},
        )

        assert first_response.status_code == 200

        # Immediate second request should be rate-limited.
        second_response = client.post(
            "/auth/request-otp",
            json={"phone_number": phone},
        )

        assert second_response.status_code == 429

    finally:
        # Remove OTP records and the temporary test user.
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
        # Register a new CITIZEN account.
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

        # Verify phone number directly for this authorization test.
        with SessionLocal() as db:
            user = db.query(User).filter(
                User.phone_number == phone
            ).first()
            assert user is not None, "Registered user was not found"
            user.phone_verified = True
            db.commit()

        # Log in and obtain a token.
        response = client.post(
            "/auth/login",
            json={
                "identifier": email,
                "password": "TestPass@123",
            },
        )
        assert response.status_code == 200
        token = response.json()["access_token"]

        # A CITIZEN must not access an ADMIN-only endpoint.
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
