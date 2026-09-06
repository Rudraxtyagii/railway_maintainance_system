import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.data import USERS
from app.errors import ProblemException

# In production, load this from a secrets manager / environment variable.
JWT_SECRET = os.environ.get("RAILBLOCK_JWT_SECRET", "railblock-dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 12

_bearer_scheme = HTTPBearer(auto_error=False)


def create_access_token(username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "iat": now,
        "exp": now + timedelta(hours=JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise ProblemException(401, "Unauthorized", "Session token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise ProblemException(401, "Unauthorized", "Invalid authentication token.")


def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> dict:
    """Dependency: enforces `Authorization: Bearer <token>` on protected routes."""
    if credentials is None or not credentials.credentials:
        raise ProblemException(401, "Unauthorized", "Missing bearer token.")

    payload = decode_access_token(credentials.credentials)
    username = payload.get("sub")
    record = USERS.get(username)
    if record is None:
        raise ProblemException(401, "Unauthorized", "Token does not correspond to a known user.")
    return record["user"]
