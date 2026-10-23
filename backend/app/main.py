from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from jose import JWTError, jwt

from app.routers import auth, verification, roles, notifications, audit, family, community_records, finance, scholarships, assistance, events, matrimonial, marketplace, support, emergency
from app.auth import ALGORITHM, SECRET_KEY
from app.database import SessionLocal
from app.models import ActivityLog

app = FastAPI(
    title="Potter Community Platform API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(verification.router)
app.include_router(roles.router)
app.include_router(notifications.router)
app.include_router(audit.router)
app.include_router(family.router)
app.include_router(community_records.router)
app.include_router(finance.router)
app.include_router(scholarships.router)
app.include_router(assistance.router)
app.include_router(events.router)
app.include_router(matrimonial.router)
app.include_router(marketplace.router)
app.include_router(support.router)
app.include_router(emergency.router)


def record_activity(request, status_code: int) -> None:
    authorization = request.headers.get("authorization", "")
    actor_id = None
    if authorization.lower().startswith("bearer "):
        try:
            claims = jwt.decode(authorization[7:].strip(), SECRET_KEY, algorithms=[ALGORITHM])
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
        db.add(ActivityLog(
            actor_user_id=actor_id,
            action=request.method.upper(),
            resource=request.url.path[:255],
            status_code=status_code,
            ip_address=ip_address[:64] if ip_address else None,
            created_at=datetime.now(timezone.utc),
        ))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


@app.middleware("http")
async def audit_mutations(request, call_next):
    if request.method.upper() not in {"POST", "PUT", "PATCH", "DELETE"}:
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
