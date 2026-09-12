"""
Pure Database-Backed RBAC Authentication & JWT Security Module for RAILBLOCK
Ensures all personnel are authenticated against the PostgreSQL/SQLite database with
salted PBKDF2-SHA256 password hashing.
"""
import os
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Callable

import jwt
from fastapi import Depends, Request, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.db_models import UserDB
from app.errors import ProblemException

JWT_SECRET = os.environ.get("JWT_SECRET") or os.environ.get("RAILBLOCK_JWT_SECRET", "super-secret-railblock-key-2026-production-secure")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 168  # 7 days

_bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Cryptographic Password Hashing (PBKDF2-HMAC-SHA256 with 100,000 rounds)
# ---------------------------------------------------------------------------
def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    """Generates a secure PBKDF2-HMAC-SHA256 hash and unique 32-char hex salt."""
    if not salt:
        salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()
    return pw_hash, salt


def verify_password(plain_password: str, hashed_password: str, salt: str) -> bool:
    """Verifies a plain password against the stored hash in constant time."""
    if not plain_password or not hashed_password or not salt:
        return False
    computed_hash, _ = hash_password(plain_password, salt)
    return hmac.compare_digest(computed_hash, hashed_password)


# ---------------------------------------------------------------------------
# JWT Token Generation & Verification
# ---------------------------------------------------------------------------
def create_access_token(username: str, role: Optional[str] = None, department: Optional[str] = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "role": role,
        "department": department,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    if not token:
        raise ProblemException(401, "Unauthorized", "Missing bearer token.")

    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ProblemException(401, "Unauthorized", "Session token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise ProblemException(401, "Unauthorized", "Invalid authentication token.")


# ---------------------------------------------------------------------------
# FastApi Dependencies for User & RBAC Resolution
# ---------------------------------------------------------------------------
def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
    db: Session = Depends(get_db)
) -> dict:
    """
    Dependency: Authenticates incoming request strictly against the database UserDB.
    """
    if credentials is None or not credentials.credentials:
        raise ProblemException(401, "Unauthorized", "Authentication required. Please provide a valid Bearer token.")

    payload = decode_access_token(credentials.credentials)
    username = payload.get("sub")

    if not username:
        raise ProblemException(401, "Unauthorized", "Malformed token.")

    db_user = db.query(UserDB).filter(
        (UserDB.username == username) | (UserDB.id == username) | (UserDB.email == username)
    ).first()

    if not db_user:
        raise ProblemException(401, "Unauthorized", f"User '{username}' does not exist in the database.")

    if not db_user.is_active:
        raise ProblemException(403, "Forbidden", "User account is disabled by Railway Administration.")

    return db_user.to_dict()


def require_roles(*allowed_roles: str) -> Callable:
    """
    Dependency factory: Enforces that the authenticated user possesses one of the allowed RBAC roles.
    """
    def _role_checker(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role")
        if "PLANNER_ADMIN" in allowed_roles and user_role == "PLANNER_ADMIN":
            return current_user
        if user_role not in allowed_roles:
            raise ProblemException(
                403,
                "Forbidden",
                f"Access Denied: Operational persona [{user_role}] does not hold clearance for this module. Required: {list(allowed_roles)}"
            )
        return current_user
    return _role_checker


def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Convenience dependency for Sr. DOM / Planner Admin privileged endpoints."""
    if current_user.get("role") != "PLANNER_ADMIN":
        raise ProblemException(403, "Forbidden", "Access Denied: Senior DOM / Planner Administrator authority required.")
    return current_user
