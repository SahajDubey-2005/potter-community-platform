"""Potter Community: isolated API security regression tests.

Run from backend/: python -m unittest discover -s tests -p 'test_security_regression.py' -v

Safety: DATABASE_URL is redirected to a fresh temporary SQLite database BEFORE
application modules are imported. No tests send payments, courier requests, SMS,
or email, and none connect to the configured live member database.
"""
import base64
import secrets
import shutil
import os
import tempfile
import unittest
from pathlib import Path
from urllib.parse import urlsplit

# Must happen before importing any app.* modules. SQLAlchemy constructs its
# engine from the environment at import time.
_TEST_DIR = tempfile.TemporaryDirectory(prefix="potter_security_tests_")
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(_TEST_DIR.name, "security_test.db"))
os.environ["SECRET_KEY"] = "local-security-tests-only-please-never-use-in-production-2026"
os.environ["SHIPROCKET_POLL_ENABLED"] = "0"
os.environ["OTP_DEBUG_MODE"] = "false"
os.environ["RAZORPAY_WEBHOOK_SECRET"] = "isolated-test-webhook-secret-not-for-production"
os.environ.pop("CORS_ALLOWED_ORIGINS", None)

from fastapi.testclient import TestClient

from app.auth import create_access_token
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models import User
from app.routers import memories

# No live database or external services are used.
Base.metadata.create_all(bind=engine)

# A valid 1x1 PNG used only to exercise the public product-image endpoint.
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/"
    "ScLytAAAAABJRU5ErkJggg=="
)


class SecurityRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.member = User(
            full_name="Security Test Member", email="security.member@example.com",
            phone_number=None, hashed_password="not-used-in-these-tests",
            role="CITIZEN", phone_verified=True, membership_status="APPROVED", is_active=True,
        )
        cls.other = User(
            full_name="Second Test Member", email="security.other@example.com",
            phone_number=None, hashed_password="not-used-in-these-tests",
            role="CITIZEN", phone_verified=True, membership_status="APPROVED", is_active=True,
        )
        cls.db.add_all([cls.member, cls.other])
        cls.db.commit()
        cls.db.refresh(cls.member)
        cls.db.refresh(cls.other)
        cls.auth1 = {"Authorization": f"Bearer {create_access_token({'sub': str(cls.member.id)})}"}
        cls.auth2 = {"Authorization": f"Bearer {create_access_token({'sub': str(cls.other.id)})}"}
        # Isolated memory storage; the static file mount must never expose it.
        cls._prior_memory_dir = memories.MEMORY_UPLOAD_DIR
        memories.MEMORY_UPLOAD_DIR = Path(_TEST_DIR.name, "profile_memories")
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls):
        # On Windows, SQLite keeps its file locked until pooled connections are
        # closed. Dispose the engine before removing the temporary database.
        try:
            cls.client_context.__exit__(None, None, None)
        finally:
            memories.MEMORY_UPLOAD_DIR = cls._prior_memory_dir
            cls.db.close()
            engine.dispose()
            _TEST_DIR.cleanup()

    def test_01_module_routes_are_registered(self):
        # Some FastAPI versions expose included-router objects without a
        # `.path` attribute in app.routes. OpenAPI exposes registered API paths
        # consistently, including endpoints from included routers.
        routes = set(app.openapi().get("paths", {}))
        for required in (
            "/auth/login", "/auth/me", "/marketplace/products",
            "/marketplace/payments/webhook", "/marketplace/courier/webhook",
            "/member/dashboard", "/role-dashboards/officer",
            "/role-dashboards/seller", "/announcements/public",
            "/government-schemes/catalog", "/profile/memories/{memory_id}/image",
        ):
            with self.subTest(route=required):
                self.assertIn(required, routes)

    def test_02_protected_profile_rejects_no_token(self):
        response = self.client.get("/auth/me")
        self.assertIn(response.status_code, {401, 403})

    def test_03_jwt_profile_returns_only_account(self):
        one = self.client.get("/auth/me", headers=self.auth1)
        two = self.client.get("/auth/me", headers=self.auth2)
        self.assertEqual(one.status_code, 200, one.text)
        self.assertEqual(two.status_code, 200, two.text)
        self.assertEqual(one.json()["id"], self.member.id)
        self.assertEqual(two.json()["id"], self.other.id)

    def test_04_dashboard_denies_ordinary_member_officer_access(self):
        response = self.client.get("/role-dashboards/officer", headers=self.auth1)
        self.assertEqual(response.status_code, 403, response.text)

    def test_05_memory_image_is_owner_only_not_public(self):
        uploaded = self.client.post(
            "/profile/memories", headers=self.auth1,
            data={"caption": "private test memory"},
            files={"file": ("private.png", PNG, "image/png")},
        )
        self.assertEqual(uploaded.status_code, 201, uploaded.text)
        memory_id = uploaded.json()["id"]
        path = f"/profile/memories/{memory_id}/image"
        own = self.client.get(path, headers=self.auth1)
        other = self.client.get(path, headers=self.auth2)
        anonymous = self.client.get(path)
        self.assertEqual(own.status_code, 200)
        self.assertEqual(other.status_code, 404)
        self.assertIn(anonymous.status_code, {401, 403})
        # Create a real sentinel under the historical public uploads tree.
        # The previous mount would have leaked this file without authentication.
        from app.main import UPLOADS_DIR
        public_test_dir = UPLOADS_DIR / "profile_memories" / f"security-test-{secrets.token_hex(8)}"
        public_test_dir.mkdir(parents=True, exist_ok=True)
        sentinel = public_test_dir / "private.png"
        try:
            sentinel.write_bytes(PNG)
            self.assertTrue(sentinel.is_file())
            self.assertEqual(
                self.client.get(f"/uploads/profile_memories/{public_test_dir.name}/{sentinel.name}").status_code,
                404,
            )
        finally:
            shutil.rmtree(public_test_dir, ignore_errors=True)
        self.assertEqual(self.client.delete(f"/profile/memories/{memory_id}", headers=self.auth1).status_code, 200)

    def test_06_public_marketplace_images_still_work(self):
        response = self.client.post(
            "/marketplace/upload-image", headers=self.auth1,
            files={"file": ("sample.png", PNG, "image/png")},
        )
        self.assertEqual(response.status_code, 200, response.text)
        url = response.json()["image_url"]
        self.assertTrue(url.startswith("/uploads/marketplace/"), url)
        public = self.client.get(url)
        self.assertEqual(public.status_code, 200)
        # Keep the test from leaving files in the project folder.
        from app.routers.marketplace import MARKETPLACE_UPLOAD_DIR
        (MARKETPLACE_UPLOAD_DIR / Path(urlsplit(url).path).name).unlink(missing_ok=True)

    def test_07_reject_html_disguised_as_image(self):
        response = self.client.post(
            "/marketplace/upload-image", headers=self.auth1,
            files={"file": ("malicious.png", b"<html><script>alert(1)</script></html>", "image/png")},
        )
        self.assertEqual(response.status_code, 415, response.text)

    def test_08_reject_file_type_mismatch(self):
        response = self.client.post(
            "/marketplace/upload-image", headers=self.auth1,
            files={"file": ("mismatch.jpg", PNG, "image/jpeg")},
        )
        self.assertEqual(response.status_code, 415, response.text)

    def test_09_reject_unauthorized_product_upload(self):
        response = self.client.post(
            "/marketplace/upload-image", files={"file": ("sample.png", PNG, "image/png")},
        )
        self.assertIn(response.status_code, {401, 403})

    def test_10_cors_allows_local_dev_frontend(self):
        response = self.client.options(
            "/auth/login",
            headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
        )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.headers.get("access-control-allow-origin"), "http://localhost:5173")

    def test_11_cors_rejects_untrusted_origin(self):
        response = self.client.options(
            "/auth/login",
            headers={"Origin": "https://untrusted.example.invalid", "Access-Control-Request-Method": "POST"},
        )
        self.assertEqual(response.status_code, 400, response.text)
        self.assertNotIn("access-control-allow-origin", response.headers)

    def test_12_other_member_notifications_are_not_exposed(self):
        from app.models import Notification
        from datetime import datetime, timezone
        notification = Notification(
            user_id=self.other.id, title="Private notification", message="Only the owner should view this.",
            category="community", is_read=False, created_at=datetime.now(timezone.utc)
        )
        self.db.add(notification)
        self.db.commit()
        own = self.client.get("/notifications", headers=self.auth1)
        second = self.client.get("/notifications", headers=self.auth2)
        self.assertEqual(own.status_code, 200, own.text)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertNotIn("Only the owner should view this.", own.text)
        self.assertIn("Only the owner should view this.", second.text)
        self.db.delete(notification)
        self.db.commit()

    def test_13_member_dashboard_is_private(self):
        from app.models import MarketplaceOrder
        from datetime import datetime, timezone
        order = MarketplaceOrder(
            user_id=self.other.id, buyer_name="Second Test Member",
            items=[{"seller_id": self.other.id, "name": "Test pottery", "quantity": 1, "unit_price": 100}],
            total_amount=100, status="REQUESTED", payment_status="UNPAID",
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(order)
        self.db.commit()
        member1 = self.client.get("/member/dashboard", headers=self.auth1)
        member2 = self.client.get("/member/dashboard", headers=self.auth2)
        self.assertEqual(member1.status_code, 200, member1.text)
        self.assertEqual(member2.status_code, 200, member2.text)
        self.assertEqual(member1.json()["counts"]["my_orders"], 0)
        self.assertEqual(member2.json()["counts"]["my_orders"], 1)
        self.db.delete(order)
        self.db.commit()

    def test_14_document_download_is_owner_only(self):
        from app.models import Verification
        from app import private_documents
        from datetime import datetime, timezone
        old_private_dir = private_documents.PRIVATE_DOCUMENT_DIR
        private_documents.PRIVATE_DOCUMENT_DIR = Path(_TEST_DIR.name, "private_uploads")
        stored_name = None
        try:
            response = self.client.post(
                "/verification/upload", headers=self.auth1,
                data={"document_type": "Community certificate"},
                files={"file": ("certificate.png", PNG, "image/png")},
            )
            self.assertEqual(response.status_code, 200, response.text)
            doc_id = response.json()["id"]
            self.assertEqual(self.client.get(f"/verification/{doc_id}/file", headers=self.auth1).status_code, 200)
            self.assertEqual(self.client.get(f"/verification/{doc_id}/file", headers=self.auth2).status_code, 403)
            self.assertIn(self.client.get(f"/verification/{doc_id}/file").status_code, {401, 403})
            row = self.db.query(Verification).filter(Verification.id == doc_id).first()
            if row:
                stored_name = row.document_url
                self.db.delete(row)
                self.db.commit()
        finally:
            if stored_name:
                (private_documents.PRIVATE_DOCUMENT_DIR / stored_name).unlink(missing_ok=True)
            private_documents.PRIVATE_DOCUMENT_DIR = old_private_dir

    def test_15_regular_member_cannot_create_admin(self):
        response = self.client.post(
            "/admin/roles/admins", headers=self.auth1,
            json={"full_name":"Unauthorized Admin", "email":"not-admin@example.com", "password":"guessme12345"},
        )
        self.assertEqual(response.status_code, 403, response.text)

    def test_16_regular_member_cannot_publish_announcements(self):
        response = self.client.post(
            "/announcements", headers=self.auth1,
            json={"title":"Unapproved notice", "description":"This should never be published by a member.", "status":"PUBLISHED"},
        )
        self.assertEqual(response.status_code, 403, response.text)

    def test_17_regular_member_cannot_review_matrimonial_profiles(self):
        response = self.client.get("/matrimonial/review", headers=self.auth1)
        self.assertEqual(response.status_code, 403, response.text)

    def test_18_regular_member_cannot_refund_payments(self):
        response = self.client.post(
            "/marketplace/payments/refund", headers=self.auth1,
            json={"order_id": 1, "reason":"Unauthorized transaction reversal"},
        )
        self.assertEqual(response.status_code, 403, response.text)

    def test_19_regular_member_cannot_sync_all_courier_shipments(self):
        response = self.client.post("/marketplace/courier/sync-active", headers=self.auth1)
        self.assertEqual(response.status_code, 403, response.text)

    def test_20_guest_order_requires_private_tracking_code(self):
        response = self.client.post(
            "/marketplace/track", json={"order_id": 999999, "access_key": "a" * 36},
        )
        self.assertEqual(response.status_code, 404, response.text)

    def test_21_payment_webhook_rejects_forged_signature(self):
        response = self.client.post(
            "/marketplace/payments/webhook",
            content=b'{"event":"payment.captured"}',
            headers={"X-Razorpay-Signature": "bad-signature", "Content-Type": "application/json"},
        )
        self.assertEqual(response.status_code, 400, response.text)

    def test_22_large_payment_webhook_rejected_before_processing(self):
        response = self.client.post(
            "/marketplace/payments/webhook",
            content=b"x" * (1024 * 1024 + 100),
            headers={"X-Razorpay-Signature": "bad-signature"},
        )
        self.assertEqual(response.status_code, 413, response.text)

    def test_23_public_catalog_does_not_require_authentication(self):
        response = self.client.get("/government-schemes/catalog")
        self.assertEqual(response.status_code, 200, response.text)
        self.assertGreaterEqual(len(response.json()), 29)

    def test_24_normal_member_cannot_list_private_documents(self):
        response = self.client.get("/verification/", headers=self.auth1)
        self.assertEqual(response.status_code, 403, response.text)

    def test_25_public_images_get_nosniff_header(self):
        response = self.client.get("/")
        self.assertEqual(response.headers.get("X-Content-Type-Options"), "nosniff")

    def test_26_document_upload_rejects_fake_pdf(self):
        response = self.client.post(
            "/verification/upload", headers=self.auth1,
            data={"document_type": "Community certificate"},
            files={"file": ("certificate.pdf", b"<html>not a PDF</html>", "application/pdf")},
        )
        self.assertEqual(response.status_code, 400, response.text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
