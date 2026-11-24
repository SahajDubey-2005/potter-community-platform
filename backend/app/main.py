from datetime import datetime, timezone
import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt

from app.auth import ALGORITHM, SECRET_KEY
from app.database import SessionLocal, engine
from app.models import ActivityLog, PotteryMemory
from app.routers import community_assistant
from app.routers import (
    assistance,
    announcements,
    audit,
    auth,
    community_records,
    community_overview,
    emergency,
    events,
    family,
    government_schemes,
    finance,
    marketplace,
    marketplace_payments,
    marketplace_courier,
    member_dashboard,
    leadership_dashboards,
    role_dashboards,
    matrimonial,
    memories,
    notifications,
    professionals,
    roles,
    scholarships,
    support,
    verification,
)

# Only product imagery is intentionally public. Profile memories in uploads/
# must remain accessible exclusively via the authenticated memories endpoint.
UPLOADS_DIR = Path(__file__).resolve().parents[1] / "uploads"
MARKETPLACE_PUBLIC_DIR = UPLOADS_DIR / "marketplace"
MARKETPLACE_PUBLIC_DIR.mkdir(parents=True, exist_ok=True)

# Exact browser origins, not a wildcard. Set CORS_ALLOWED_ORIGINS to a comma-
# separated list of your deployment URLs, e.g. https://potter.example.org.
DEFAULT_DEV_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
CORS_ALLOWED_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ALLOWED_ORIGINS", DEFAULT_DEV_ORIGINS).split(",")
    if origin.strip()
]

app = FastAPI(
    title="Potter Community Platform API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(verification.router)
app.include_router(roles.router)
app.include_router(notifications.router)
app.include_router(announcements.router)
app.include_router(audit.router)
app.include_router(family.router)
app.include_router(community_records.router)
app.include_router(community_overview.router)
app.include_router(member_dashboard.router)
app.include_router(leadership_dashboards.router)
app.include_router(role_dashboards.router)
app.include_router(finance.router)
app.include_router(finance.payments_router)
app.include_router(scholarships.router)
app.include_router(government_schemes.router)
app.include_router(assistance.router)
app.include_router(events.router)
app.include_router(matrimonial.router)
app.include_router(memories.router)
app.include_router(marketplace.router)
app.include_router(marketplace_payments.router)
app.include_router(marketplace_courier.router)
app.include_router(professionals.router)
app.include_router(support.router)
# Preserve the emergency endpoints already present on GitHub main.
app.include_router(emergency.router)
app.include_router(community_assistant.router)

# Keep existing product image URLs (/uploads/marketplace/<filename>) working.
# Do NOT mount the parent uploads directory: it contains private profile photos.
app.mount(
    "/uploads/marketplace",
    StaticFiles(directory=str(MARKETPLACE_PUBLIC_DIR)),
    name="marketplace-uploads",
)


@app.on_event("startup")
def ensure_pottery_memories_table() -> None:
    # Create only this newly added table; existing tables are not modified.
    PotteryMemory.__table__.create(bind=engine, checkfirst=True)



@app.on_event("startup")
async def start_shiprocket_polling() -> None:
    # Webhooks work automatically once configured. Optional polling can run on
    # one API worker only. Do not enable polling on every production worker.
    import asyncio
    import os
    if os.getenv("SHIPROCKET_POLL_ENABLED", "0").strip() == "1":
        app.state.courier_poll_task = asyncio.create_task(marketplace_courier.poll_courier_updates())


@app.on_event("shutdown")
async def stop_shiprocket_polling() -> None:
    import asyncio
    task = getattr(app.state, "courier_poll_task", None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


def record_activity(request, status_code: int) -> None:
    authorization = request.headers.get("authorization", "")
    actor_id = None

    if authorization.lower().startswith("bearer "):
        try:
            claims = jwt.decode(
                authorization[7:].strip(),
                SECRET_KEY,
                algorithms=[ALGORITHM],
            )
            subject = claims.get("sub")
            if isinstance(subject, str) and subject.isdigit():
                actor_id = int(subject)
        except (JWTError, ValueError):
            pass

    # Use the direct peer address. Forwarded headers are not trusted unless
    # the deployment explicitly configures a trusted proxy.
    ip_address = request.client.host if request.client else None
    db = SessionLocal()

    try:
        db.add(
            ActivityLog(
                actor_user_id=actor_id,
                action=request.method.upper(),
                resource=request.url.path[:255],
                status_code=status_code,
                ip_address=ip_address[:64] if ip_address else None,
                created_at=datetime.now(timezone.utc),
            )
        )
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


@app.middleware("http")
async def set_security_headers(request, call_next):
    """Prevent MIME sniffing and caching of personal API responses."""
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    if request.headers.get("authorization") or request.url.path.startswith((
        "/auth/", "/admin/", "/member/", "/role-dashboards/", "/leadership/",
    )):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.middleware("http")
async def audit_mutations(request, call_next):
    if request.method.upper() not in {"POST", "PUT", "PATCH", "DELETE"}:
        return await call_next(request)

    # Deleting audit rows should not create replacement audit rows.
    if request.url.path.startswith("/admin/audit-logs"):
        return await call_next(request)

    try:
        response = await call_next(request)
    except Exception:
        record_activity(request, 500)
        raise

    record_activity(request, response.status_code)
    return response


@app.get("/")
def read_root():
    return {"message": "Potter Platform Backend Running!"}
