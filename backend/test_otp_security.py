from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models import PhoneOTP
from app.otp_service import generate_otp, save_otp, verify_otp


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
