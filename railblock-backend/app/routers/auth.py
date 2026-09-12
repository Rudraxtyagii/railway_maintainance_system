from typing import List, Optional
from datetime import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_user,
    require_roles,
    hash_password,
    verify_password
)
from app.database import get_db
from app.db_models import UserDB, AuditLogDB
from app.errors import ProblemException
from app.models import (
    LoginRequest,
    LoginResponse,
    UserOut,
    UserCreateRequest,
    UserUpdateRequest
)
from app.realtime import broadcast_event

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates Railway Personnel strictly against the PostgreSQL/SQLite UserDB table.
    Verifies salted PBKDF2-HMAC-SHA256 password hash.
    """
    clean_username = body.username.strip().lower()

    db_user = db.query(UserDB).filter(
        (UserDB.username.ilike(clean_username)) |
        (UserDB.email.ilike(clean_username)) |
        (UserDB.id.ilike(clean_username))
    ).first()

    if not db_user:
        raise ProblemException(401, "Unauthorized", "Invalid Indian Railways service credentials or username.")

    if not db_user.is_active:
        raise ProblemException(403, "Forbidden", "User account has been suspended by Railway Administration.")

    # Verify salted password hash
    is_valid = verify_password(body.password, db_user.password_hash, db_user.salt)
    if not is_valid:
        raise ProblemException(401, "Unauthorized", "Invalid password provided for this account.")

    # Update last login timestamp
    db_user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(db_user)

    # Issue JWT token with role and department claims
    token = create_access_token(
        username=db_user.username,
        role=db_user.role,
        department=db_user.department
    )

    # Log successful login to Audit Log
    try:
        audit = AuditLogDB(
            user_id=db_user.id,
            action="USER_LOGIN_SUCCESS",
            resource_type="User",
            resource_id=db_user.id,
            details=f"Successful database authentication for {db_user.name} ({db_user.role})",
            timestamp=datetime.utcnow()
        )
        db.add(audit)
        db.commit()
    except Exception:
        pass

    return LoginResponse(token=token, user=UserOut(**db_user.to_dict()))


@router.get("/me", response_model=UserOut)
def get_current_profile(current_user: dict = Depends(get_current_user)):
    """Returns the authenticated profile of the active Railway officer."""
    return UserOut(**current_user)


@router.get("/users", response_model=List[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all registered Indian Railways personnel from the database.
    """
    users = db.query(UserDB).order_by(UserDB.created_at.asc()).all()
    return [UserOut(**u.to_dict()) for u in users]


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user_by_admin(
    body: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("PLANNER_ADMIN"))
):
    """
    Admin-only user provisioning. Only authorized Senior DOM / Planner Admins can register new personnel.
    """
    # Check if username or email already exists
    existing = db.query(UserDB).filter(
        (UserDB.username.ilike(body.username)) | (UserDB.email.ilike(body.email))
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"User with username '{body.username}' or email '{body.email}' already exists in database."
        )

    pw_hash, salt = hash_password(body.password)
    new_id = f"USR-{uuid.uuid4().hex[:6].upper()}"

    new_user = UserDB(
        id=new_id,
        username=body.username.strip().lower(),
        password_hash=pw_hash,
        salt=salt,
        name=body.name.strip(),
        email=body.email.strip().lower(),
        role=body.role,
        department=body.department,
        designation=body.designation,
        zone=body.zone or "Northern Railway",
        division=body.division or "Delhi Division",
        avatar=body.avatar or "IR",
        permissions=body.permissions or [],
        is_active=True,
        created_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    broadcast_event("USER_PROVISIONED", {"userId": new_user.id, "username": new_user.username, "role": new_user.role})
    return UserOut(**new_user.to_dict())


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    body: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_roles("PLANNER_ADMIN"))
):
    """
    Admin-only update of personnel details, role, department, or active status.
    """
    db_user = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail=f"User with ID '{user_id}' not found.")

    if body.name is not None:
        db_user.name = body.name
    if body.email is not None:
        db_user.email = body.email.strip().lower()
    if body.role is not None:
        db_user.role = body.role
    if body.department is not None:
        db_user.department = body.department
    if body.designation is not None:
        db_user.designation = body.designation
    if body.zone is not None:
        db_user.zone = body.zone
    if body.division is not None:
        db_user.division = body.division
    if body.isActive is not None:
        db_user.is_active = body.isActive
    if body.permissions is not None:
        db_user.permissions = body.permissions
    if body.password:
        pw_hash, salt = hash_password(body.password)
        db_user.password_hash = pw_hash
        db_user.salt = salt

    db.commit()
    db.refresh(db_user)

    broadcast_event("USER_UPDATED", {"userId": db_user.id, "role": db_user.role})
    return UserOut(**db_user.to_dict())
