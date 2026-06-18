from pathlib import Path
from time import sleep
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import get_settings
from app.core.database import Base, engine
from app.models import entities
from app.models.entities import Role
from app.models.enums import RoleName
from app.routers import admin, auth, dashboard, evaluation, fraud, invoices, rag, reports

settings = get_settings()
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])

app = FastAPI(
    title="AI Invoice Processing and Fraud Detection API",
    version="1.0.0",
    description="OCR, fraud scoring, RAG compliance, LangGraph workflow, analytics, RBAC, reports, and evaluation APIs.",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_database() -> None:
    last_error: Exception | None = None
    for _ in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except Exception as exc:
            last_error = exc
            sleep(2)
    if last_error:
        raise last_error


@app.on_event("startup")
def seed_roles() -> None:
    from app.core.database import SessionLocal
    from app.models.entities import User

    for directory in [settings.upload_dir, settings.report_dir]:
        Path(directory).mkdir(parents=True, exist_ok=True)

    init_database()
    db = SessionLocal()
    try:
        for role in RoleName:
            if not db.query(Role).filter(Role.name == role.value).first():
                db.add(Role(name=role.value, description=f"{role.value.title()} role"))
        db.commit()

        admin_role = db.query(Role).filter(Role.name == RoleName.ADMIN.value).first()
        if admin_role and not db.query(User).filter(User.email == "admin@example.com").first():
            from app.core.security import hash_password
            admin_user = User(
                email="admin@example.com",
                full_name="Admin User",
                password_hash=hash_password("password123"),
                role_id=admin_role.id,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    return response


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(auth.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(fraud.router, prefix="/api")
app.include_router(rag.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(evaluation.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
