"""Guard against signup returning HTTP 500 after a successful database commit."""
import unittest
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.schemas import UserResponse


class RegistrationResponseSchemaTests(unittest.TestCase):
    def test_new_email_verified_member_with_no_profile_details_serializes(self):
        """New users may have no verified phone and no profile_details yet."""
        user = SimpleNamespace(
            id=71,
            full_name="New Member",
            email="new.member@example.com",
            phone_number=None,
            role="CITIZEN",
            is_active=True,
            membership_status="PENDING",
            membership_number=None,
            profile_details=None,
        )
        app = FastAPI()

        @app.get("/test-registration-response", response_model=UserResponse)
        def registration_response():
            return user

        with TestClient(app) as client:
            response = client.get("/test-registration-response")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["profile_details"], {})
        self.assertIsNone(payload["phone_number"])
        self.assertEqual(payload["membership_status"], "PENDING")

    def test_existing_profile_details_are_unchanged(self):
        model = UserResponse.model_validate(SimpleNamespace(
            id=72, full_name="Member", email="existing.member@example.com",
            phone_number="9876543210", role="CITIZEN", is_active=True,
            membership_status="APPROVED", membership_number="POT-2026-000072",
            profile_details={"bio": "Pottery artist"},
        ))
        self.assertEqual(model.profile_details, {"bio": "Pottery artist"})


if __name__ == "__main__":
    unittest.main()
