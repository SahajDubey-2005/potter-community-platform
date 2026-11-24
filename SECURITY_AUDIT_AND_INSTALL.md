# Potter Community Platform — Security & Integration Testing Update

**Prepared:** 23 November 2026  
**Scope:** Targeted fixes to confirmed issues; not a production certification.

## Baseline and preservation

This update was assembled from the original uploaded `potter-community-platform.zip`, the subsequent individual update files, and the **latest** `potter-remaining-eight-role-dashboards.zip` overlaid after the seven-leadership-dashboard package. If you have edited any of the four affected source files **after** installing those updates, compare and merge those local changes rather than overwriting them without review.

- No frontend file is included or changed.
- `frontend/src/App.jsx`, Google Translate, all 29 Government Schemes, the 15 dashboard components, Professional Network, announcements, marketplace orders, Razorpay transaction logic, and Shiprocket shipping workflows are not otherwise changed.
- Existing database tables, passwords, credentials, and migrations are not modified.

## Included files

| Path | Action | Purpose |
| --- | --- | --- |
| `backend/app/main.py` | Replace | Restrict public file mount to marketplace images; origin allowlist; secure response headers |
| `backend/app/private_documents.py` | Replace | Validate PDF/JPG/PNG signatures; reject fake documents |
| `backend/app/routers/marketplace.py` | Replace | Reject product images whose actual bytes don't match declared JPG/PNG/WEBP type |
| `backend/app/routers/marketplace_payments.py` | Replace | Enforce 1 MB streamed Razorpay webhook payload limit before signature verification |
| `backend/tests/test_security_regression.py` | New | 26 isolated API security and compatibility regression tests |
| `SECURITY_AUDIT_AND_INSTALL.md` | New | This guide and the follow-up checklist |

## Installation steps (VS Code on Windows)

1. **Stop the backend and back up your existing project and database first.** If your DB is PostgreSQL, use a PostgreSQL backup. Do not rely on copying an in-use SQLite file.
2. Download and extract the update ZIP to a separate folder. The ZIP contains the **exact relative file paths** shown above, not a complete replacement project.
3. Open the Potter Community project in VS Code. Copy the extracted `backend` folder **into your project root**; choose **Merge folders**, not **Replace entire folder**. For the four existing `.py` files, replace each corresponding file after reviewing any newer local edits.
4. Copy the root `SECURITY_AUDIT_AND_INSTALL.md` file if you wish to retain this guide.
5. **No database migration is required for this update.** Do not run old seed scripts or reset your DB.
6. Add the approved frontend origins to **`backend/.env`**, only if you use a host other than the two local Vite defaults:
   ```dotenv
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```
   For a deployed site, use the real, exact HTTPS frontend URL(s), for example `CORS_ALLOWED_ORIGINS=https://your-domain.example`. Keep all existing `.env` secrets unchanged. Never use `*` in this setting.
7. In the VS Code backend terminal (with your virtual environment active), run:
   ```powershell
   cd backend
   python -m unittest discover -s tests -p "test_security_regression.py" -v
   ```
   The test suite **forces its own disposable SQLite database** before importing any app modules. It does not contact live Razorpay, Shiprocket, email or SMS services.
8. Restart FastAPI from `backend`:
   ```powershell
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   Keep the frontend running with your normal `npm run dev` command.
9. Log in with a normal member account and an authorized administrator account, verify the checklist below, and inspect the backend console for errors.

### Known compatibility changes

- **Public files:** `/uploads/marketplace/<filename>` remains available for products. URLs under `/uploads/profile_memories/...` and any other previously public parent-upload folders now return 404. Personal profile memories remain accessible through `/profile/memories/{id}/image` **with authentication**. Ensure your production reverse proxy does **not** directly expose `backend/uploads/` as a whole.
- **Image/document uploads:** Files with incorrect or missing JPG, PNG, WEBP, or PDF signatures will now be rejected. Legitimate files in supported formats continue to work.
- **CORS:** Only `localhost:5173` and `127.0.0.1:5173` are allowed by default. If using another local port (e.g. 5174), an IP address, or a production domain, set `CORS_ALLOWED_ORIGINS` accordingly and restart FastAPI.
- **Webhooks:** Razorpay requests larger than 1 MB are rejected with HTTP 413. Existing valid webhook signature verification remains in place.
- **Sensitive API responses:** Authenticated API responses and key authenticated endpoints receive `Cache-Control: no-store`. Responses have `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`.

## Verified in an isolated test environment

26/26 regression tests passed, covering:

- API route registration for auth, orders, payments, courier, announcements, government schemes, and role dashboards
- authenticated and unauthenticated profile access with actual JWTs
- ordinary member rejected from officer dashboard, administrative account creation, announcements publishing, matrimonial review, refunds, and global courier sync
- owner-only profile memory images and uploaded verification documents
- blocking a real sentinel file from the previously public profile memory directory
- regular member's dashboard only counts their own marketplace orders
- notification ownership
- marketplace public product-image compatibility and fake file rejection
- CORS trusted/untrusted origins
- private guest tracking-code rejection for nonexistent orders
- invalid Razorpay signature and oversized webhook rejection
- public 29-entry Government Schemes catalog
- `nosniff` response header

The tests used a freshly created temporary SQLite database and simulated users with real JWT tokens. **No live merchant account, SMTP, SMS, Shiprocket, Razorpay, production data, or production deployment was exercised.** No existing member data was altered.

## Findings requiring further work before public launch

**1. Fresh SQLite Alembic migration chain — confirmed blocker.**
`python -m alembic upgrade head` fails on a brand-new SQLite database in pre-existing revision `2d5eb219047a` because SQLite does not support `ALTER TABLE users ALTER COLUMN role SET NOT NULL`. This update intentionally does **not** edit historical migrations or stamp the database. A separate, carefully staged SQLite migration repair or PostgreSQL-only bootstrap plan is needed. Existing databases already migrated to the current head may not be affected. Never stamp a partially migrated database as a workaround.

**2. Production credentials and debug settings.**
Review `SECRET_KEY`, Razorpay and Shiprocket credentials, webhooks, `OTP_DEBUG_MODE`, and any demo/test credentials. Disable OTP debug mode in production, rotate any credentials previously shown in screenshots, and avoid bundling `.env`, real databases, uploads, or `.git` history in deployment archives.

**3. Authentication hardening still pending.**
Production login, OTP and password-reset endpoints require independently tested rate limiting and abuse monitoring, token/session revocation rules, and MFA for privileged accounts. These were **not** added here because they require deployment choices (e.g. Redis, trusted proxy, token invalidation strategy) and would otherwise risk breaking login.

**4. Real integration tests still needed.**
Test full JWT login, every one of the 15 roles, approver workflows, all upload variants, actual Razorpay test-mode captures/refunds and webhook redeliveries, Shiprocket pickup/AWB/tracking with provider-approved test shipments, and a production-built frontend. Payment and courier operations can incur real charges: only test them against appropriate test environments or deliberately approved live test parcels.

**5. Browser-side token and frontend security.**
The existing frontend stores JWTs in browser storage. Review XSS defenses, CSP, third-party scripts including the existing translation integration, and whether a secure cookie-based session is appropriate before public release. This phase did not change Google Translate or your login architecture.

## Manual smoke test by role

| Account type | Check |
| --- | --- |
| General Member | My profile; own dashboard; own documents/orders/notifications; no administrative tools |
| Super Admin/Admin | Real counts, members, roles, documents and finance permissions |
| President/Secretary/Treasurer/Directors | Role-specific dashboards, approval controls and active appointment checks |
| Six department officers | Only their department's authorized queues and actions |
| Marketplace Seller | Own listings and order items only; courier control for own shipments |
| Public/guest | Catalog and approved public notices; order lookup requires private tracking code |

Also verify language switching (English/Hindi/Kannada), all Government Schemes listings, marketplace product images, payment checkout, and order tracking after replacement.

## Rollback

Stop FastAPI, restore **only the four backed-up Python source files** to their former paths, then restart. No data migration is needed for the rollback. Keep the test suite and report if desired.
