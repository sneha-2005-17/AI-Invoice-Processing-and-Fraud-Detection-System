from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, sanitize_text, verify_password
from app.dependencies import get_current_user
from app.models.entities import Role, User
from app.models.enums import RoleName
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.audit_service import write_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    role = db.query(Role).filter(Role.name == RoleName.USER.value).first()
    if not role:
        role = Role(name=RoleName.USER.value, description="Standard invoice user")
        db.add(role)
        db.commit()
        db.refresh(role)
    user = User(
        email=payload.email.lower(),
        full_name=sanitize_text(payload.full_name),
        password_hash=hash_password(payload.password),
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    write_audit(db, "user.registered", "user", actor_id=user.id, entity_id=str(user.id))
    return TokenResponse(access_token=create_access_token(user.email, role.name), role=role.name)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    write_audit(db, "user.login", "user", actor_id=user.id, entity_id=str(user.id))
    return TokenResponse(access_token=create_access_token(user.email, user.role.name), role=user.role.name)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(id=user.id, email=user.email, full_name=user.full_name, role=user.role.name, is_active=user.is_active)
