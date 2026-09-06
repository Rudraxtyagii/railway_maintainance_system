from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user
from app.database import get_db
from app.db_models import UserDB
from app.data import USERS
from app.errors import ProblemException
from app.models import LoginRequest, LoginResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication & User Management"])


class UpdateRoleRequest(BaseModel):
    userId: str
    role: str


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    # First check database
    db_user = db.query(UserDB).filter(
        (UserDB.username == body.username) | (UserDB.email == body.username)
    ).first()

    if db_user:
        token = create_access_token(db_user.username)
        return LoginResponse(token=token, user=db_user.to_dict())

    # Fallback to in-memory USERS
    record = USERS.get(body.username)
    if record is None or record["password"] != body.password:
        raise ProblemException(401, "Unauthorized", "Invalid username or password.")

    token = create_access_token(body.username)
    return LoginResponse(token=token, user=record["user"])


@router.get("/users", response_model=List[dict])
def list_users(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    List all registered Indian Railways personnel with their assigned RBAC roles.
    """
    users = db.query(UserDB).all()
    if users:
        return [u.to_dict() for u in users]
    
    # Fallback
    return [v["user"] for v in USERS.values()]


@router.put("/users/role", response_model=dict)
def update_user_role(body: UpdateRoleRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Update a user's RBAC role in the database.
    """
    db_user = db.query(UserDB).filter(UserDB.id == body.userId).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.role = body.role
    db.commit()
    db.refresh(db_user)
    return db_user.to_dict()
