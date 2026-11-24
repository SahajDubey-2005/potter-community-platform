"""Create or repair the Potter Community REGULAR MEMBER test login (local development only).

From the project's backend directory, run:
    python create_regular_member.py

This script never changes an existing real user. It can reset a password ONLY for
an account previously created by this test seed and explicitly marked test_account.
Delete this script before deploying or sharing the project.
"""
from __future__ import annotations

from datetime import datetime, timezone
import os
import sys

from sqlalchemy.engine import make_url

from app.auth import get_password_hash, verify_password
from app.database import DATABASE_URL, SessionLocal
from app.models import User

TEST_EMAIL = "potter.regular.member@example.com"
TEST_PASSWORD = "_5lwdnZJ39ZY387L3z4ViK4NL5VG"
TEST_NAME = "Community Test Member"


def ensure_local_database() -> None:
    if os.getenv("APP_ENV", "").strip().lower() in {"production", "prod"}:
        raise RuntimeError("Test member creation is disabled in production.")
    if os.getenv("ENVIRONMENT", "").strip().lower() in {"production", "prod"}:
        raise RuntimeError("Test member creation is disabled in production.")

    url = make_url(DATABASE_URL)
    if url.get_backend_name() == "sqlite":
        if url.database in {None, "", ":memory:"}:
            raise RuntimeError("A persistent local SQLite database is required.")
        return
    if url.host not in {"localhost", "127.0.0.1", "::1"}:
        raise RuntimeError("Refusing to seed a non-local database. Use local development only.")


def print_login_details(user: User) -> None:
    print(f"Login email: {TEST_EMAIL}")
    print(f"Login password: {TEST_PASSWORD}")
    print(f"Database user ID: {user.id}")
    print(f"Test membership number: {user.membership_number}")
    print("Role: CITIZEN (regular member; no special role)")
    print("Membership: APPROVED (local test only)")
    print("IMPORTANT: Never deploy this demonstration account or this script.")


def create_member() -> None:
    ensure_local_database()
    with SessionLocal() as db:
        existing = db.query(User).filter(User.email == TEST_EMAIL).first()
        if existing is not None:
            details = existing.application_details or {}
            # Refuse to change any actual/privileged account with the same email.
            if not isinstance(details, dict) or details.get("test_account") is not True:
                raise RuntimeError(
                    "An account already uses this email but is not marked as the "
                    "local test member. No changes made."
                )
            if (existing.role or "").strip().upper() != "CITIZEN" or existing.role_id is not None:
                raise RuntimeError("Existing account has different permissions. No changes made.")
            if not existing.is_active or not existing.phone_verified:
                raise RuntimeError(
                    "Existing test account is inactive or unverified. "
                    "No changes made; inspect the account in your local database."
                )

            if verify_password(TEST_PASSWORD, existing.hashed_password):
                print("Existing local test account found; password already matches.")
            else:
                # Fix the previous version's behavior of leaving a demo account
                # with an unknown old password. Only the marked demo is touched.
                existing.hashed_password = get_password_hash(TEST_PASSWORD)
                db.commit()
                print("Existing local test account found; test password repaired.")
            print_login_details(existing)
            return

        user = User(
            full_name=TEST_NAME,
            email=TEST_EMAIL,
            phone_number=None,
            phone_verified=True,  # Local test only, not real SMS verification.
            membership_status="APPROVED",  # Local test only, not genuine approval.
            membership_number=None,
            application_details={
                "date_of_birth": "1998-05-10",  # Fictional adult DOB for local tests.
                "test_account": True,
                "review_stage": "LOCAL_DEMO_ONLY",
            },
            profile_details={
                "occupation": "Community member",
                "bio": "Local demonstration member account",
            },
            hashed_password=get_password_hash(TEST_PASSWORD),
            role="CITIZEN",
            role_id=None,
            is_active=True,
        )
        db.add(user)
        try:
            db.flush()
            user.membership_number = f"POT-TEST-{user.id:06d}"
            db.commit()
        except Exception:
            db.rollback()
            raise
        print("Local regular-member test account created successfully.")
        print_login_details(user)


if __name__ == "__main__":
    try:
        create_member()
    except Exception as error:
        print(f"Could not create/repair local test member: {error}", file=sys.stderr)
        sys.exit(1)
