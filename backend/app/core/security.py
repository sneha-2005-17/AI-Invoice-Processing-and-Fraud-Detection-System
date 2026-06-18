# Monkey patch bcrypt for passlib compatibility in newer python/bcrypt versions
import bcrypt
original_hashpw = bcrypt.hashpw
def patched_hashpw(password, salt):
    if len(password) > 72:
        password = password[:72]
    return original_hashpw(password, salt)
bcrypt.hashpw = patched_hashpw

from datetime import datetime, timedelta, timezone
from typing import Any
import bleach
from jose import jwt
from passlib.context import CryptContext
from app.core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

PROMPT_INJECTION_MARKERS = [
    "ignore previous instructions",
    "reveal system prompt",
    "developer message",
    "jailbreak",
    "exfiltrate",
]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, role: str, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload: dict[str, Any] = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def sanitize_text(value: str) -> str:
    return bleach.clean(value or "", tags=[], attributes={}, strip=True)


def has_prompt_injection(value: str) -> bool:
    lowered = (value or "").lower()
    return any(marker in lowered for marker in PROMPT_INJECTION_MARKERS)


def mask_sensitive(value: str | None) -> str | None:
    if not value:
        return value
    if len(value) <= 6:
        return "***"
    return f"{value[:2]}***{value[-4:]}"
