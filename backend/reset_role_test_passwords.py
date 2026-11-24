"""Local-only, one-account-at-a-time password reset for Potter Community role testing.

Install this one file at: backend/reset_role_test_passwords.py
Run from the backend/ directory:

    python reset_role_test_passwords.py list
    python reset_role_test_passwords.py reset --identifier potter.regular.member@example.com --admin-identifier 9876543210

For an EXISTING account that is not explicitly marked as a test account, add:

    --allow-existing-account

This tool does not create accounts, assign roles, activate accounts, change member
status, or modify permissions. It refuses Admin and President/Head targets.
It generates a secure random password and displays it only after a successful
reset. Do not put this file in a deployed server or run it on production data.
"""

from __future__ import annotations

import argparse
from getpass import getpass
import os
from pathlib import Path
import secrets
import sys

from sqlalchemy import func, or_
from sqlalchemy.engine import make_url

from app.auth import get_password_hash, verify_password
from app.database import DATABASE_URL, SessionLocal
from app.models import User

# These are excluded from being RESET by this test utility. Their owners should
# use the normal password-recovery process if they need to change credentials.
PROTECTED_TARGET_ROLES = {"ADMIN", "PRESIDENT", "PRESIDENT / HEAD"}
ADMINISTRATOR_ROLES = {"ADMIN", "SUPER ADMIN"}
PRODUCTION_ENVIRONMENTS = {"production", "prod", "staging", "stage"}


def check_local_database() -> None:
    for key in ("APP_ENV", "ENVIRONMENT", "FLASK_ENV", "NODE_ENV"):
        if os.getenv(key, "").strip().lower() in PRODUCTION_ENVIRONMENTS:
            raise RuntimeError(f"Refusing to run: {key} indicates a non-development environment")

    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is missing; check backend/.env")

    url = make_url(DATABASE_URL)
    backend = url.get_backend_name()
    if backend == "sqlite":
        db_name = url.database
        if not db_name or db_name == ":memory:":
            raise RuntimeError("A persistent local SQLite database is required")
        path = Path(db_name).expanduser()
        # SQLAlchemy's relative SQLite paths resolve against the process cwd.
        path = path.resolve() if path.is_absolute() else (Path.cwd() / path).resolve()
        if not path.is_file():
            raise RuntimeError(f"SQLite database does not exist: {path}; no changes made")
        return

    if backend in ("postgresql", "mysql", "mariadb"):
        if url.host not in ("localhost", "127.0.0.1", "::1"):
            raise RuntimeError("Refusing to change a remote database")
        return

    raise RuntimeError(f"Unsupported database type for local password reset: {backend}")


def find_user(db, identifier: str) -> User | None:
    value = identifier.strip()
    if not value:
        raise ValueError("An exact email address or phone number is required")
    matches = (
        db.query(User)
        .filter(or_(func.lower(User.email) == value.lower(), User.phone_number == value))
        .limit(2)
        .all()
    )
    if len(matches) > 1:
        raise RuntimeError("Identifier matches multiple accounts; refusing to change either")
    return matches[0] if matches else None


def get_roles(user: User) -> set[str]:
    roles = {(user.role or "").strip().upper()}
    if user.role_record:
        roles.add((user.role_record.name or "").strip().upper())
    return {role for role in roles if role}


def is_explicit_test_account(user: User) -> bool:
    details = user.application_details
    return isinstance(details, dict) and details.get("test_account") is True


def display_roles(user: User) -> str:
    return ", ".join(sorted(get_roles(user))) or "None"


def list_users(db) -> None:
    users = db.query(User).order_by(User.id).all()
    print("\nAccounts in this LOCAL database (read-only):")
    for user in users:
        login = user.email or user.phone_number or "(no login identifier)"
        tag = "TEST" if is_explicit_test_account(user) else "EXISTING"
        print(
            f"ID {user.id:>4} | {user.full_name} | {display_roles(user)} | "
            f"{login} | {tag} | active={bool(user.is_active)}"
        )
    print("\nNo passwords were read or changed.")


def reset_one(db, identifier: str, admin_identifier: str, allow_existing: bool) -> None:
    target = find_user(db, identifier)
    if target is None:
        raise RuntimeError("Target account not found; no changes made")
    if not target.is_active:
        raise RuntimeError("Target account is inactive; no changes made")
    if get_roles(target).intersection(PROTECTED_TARGET_ROLES):
        raise RuntimeError("Admin and President/Head accounts are excluded from this utility")

    test_account = is_explicit_test_account(target)
    if not test_account and not allow_existing:
        raise RuntimeError(
            "This account is not explicitly marked as a test account. "
            "Use --allow-existing-account only for an account you are authorized to manage."
        )

    admin = find_user(db, admin_identifier)
    if admin is None or not admin.is_active or not get_roles(admin).intersection(ADMINISTRATOR_ROLES):
        raise RuntimeError("An active Admin or Super Admin account is required; no changes made")
    if admin.id == target.id:
        raise RuntimeError("Administrator cannot reset their own account using this utility")

    print("\nPASSWORD RESET PREVIEW — nothing has changed")
    print(f"Target ID:          {target.id}")
    print(f"Target name:        {target.full_name}")
    print(f"Target login:       {target.email or target.phone_number or '(missing)'}")
    print(f"Current role(s):    {display_roles(target)}")
    print(f"Account category:   {'LOCAL TEST' if test_account else 'EXISTING ACCOUNT'}")
    print("Fields to change:   hashed_password ONLY")
    print("Roles, permissions, name, status, and all other data: UNCHANGED")

    phrase = f"RESET PASSWORD FOR USER {target.id}"
    if input(f"\nType exactly '{phrase}' to proceed: ").strip() != phrase:
        print("Cancelled; no changes made")
        return

    admin_password = getpass("Enter your current Admin/Super Admin login password (hidden): ")
    if not verify_password(admin_password, admin.hashed_password):
        raise RuntimeError("Administrator authentication failed; no changes made")

    # A unique, unpredictable password is generated for each reset. The plaintext
    # is never stored in the database, source files or a credentials CSV.
    temporary_password = secrets.token_urlsafe(24)
    new_hash = get_password_hash(temporary_password)
    if not verify_password(temporary_password, new_hash):
        raise RuntimeError("Generated password failed hash verification; no changes made")

    try:
        target.hashed_password = new_hash
        db.commit()
    except Exception:
        db.rollback()
        raise

    print("\nSUCCESS — only this account's password hash was updated.")
    print(f"User ID:            {target.id}")
    print(f"Login ID:           {target.email or target.phone_number}")
    print(f"New temporary password: {temporary_password}")
    print("Copy the password now. It will not be saved or shown again by this script.")
    print("Ask the user to choose a new password before deploying the application.")
    print("Existing JWT sessions may remain valid until they expire; this tool does not revoke tokens.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Local Potter Community role-testing password reset")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list", help="List accounts and roles without modifying the database")
    reset = sub.add_parser("reset", help="Reset the password of one explicitly selected account")
    reset.add_argument("--identifier", required=True, help="Exact target email or phone number")
    reset.add_argument("--admin-identifier", required=True, help="Your existing Admin/Super Admin email or phone number")
    reset.add_argument(
        "--allow-existing-account", action="store_true",
        help="Explicitly permit resetting an existing, non-test account you are authorized to manage",
    )
    args = parser.parse_args()
    check_local_database()
    with SessionLocal() as db:
        if args.command == "list":
            list_users(db)
        else:
            reset_one(db, args.identifier, args.admin_identifier, args.allow_existing_account)


if __name__ == "__main__":
    try:
        main()
    except (Exception, KeyboardInterrupt) as exc:
        print(f"Password reset not completed: {exc}", file=sys.stderr)
        sys.exit(1)
