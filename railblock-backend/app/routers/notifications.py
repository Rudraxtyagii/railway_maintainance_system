from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import NotificationDB
from app.data import NOTIFICATIONS
from app.errors import ProblemException

router = APIRouter(prefix="/api/notifications", tags=["Notifications"], dependencies=[Depends(get_current_user)])

# Where clicking a notification should take the user, based on what it's about.
CATEGORY_TO_URL = {
    "Task": "/block-requests",
    "Conflict": "/conflicts",
    "Bundle": "/conflicts",
    "Sync": "/data-sync",
    "Schedule": "/schedule",
    "Optimization": "/optimization",
}
DEFAULT_ACTION_URL = "/notifications"


def _serialize(n: dict) -> dict:
    return {
        "id": n["id"],
        "type": n["type"],
        "title": n["title"],
        "message": n["message"],
        "timestamp": n["timestamp"],
        "read": n.get("read", False),
        "unread": not n.get("read", False),
        "actionUrl": CATEGORY_TO_URL.get(n.get("category"), DEFAULT_ACTION_URL),
        "category": n.get("category", "Task"),
        "relatedId": n.get("relatedId"),
    }


@router.get("")
def list_notifications(db: Session = Depends(get_db)):
    db_notifications = db.query(NotificationDB).order_by(NotificationDB.created_at.desc()).all()
    if db_notifications:
        return [n.to_dict() for n in db_notifications]
    return [_serialize(n) for n in NOTIFICATIONS]


@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: str, db: Session = Depends(get_db)):
    db_n = db.query(NotificationDB).filter(NotificationDB.id == notification_id).first()
    if db_n:
        db_n.read = True
        db.commit()
        db.refresh(db_n)

        # Sync in-memory fallback
        for n in NOTIFICATIONS:
            if n["id"] == notification_id:
                n["read"] = True
                break

        return db_n.to_dict()

    for n in NOTIFICATIONS:
        if n["id"] == notification_id:
            n["read"] = True
            return _serialize(n)
    raise ProblemException(404, "Not Found", f"Notification '{notification_id}' does not exist.")


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db_notifications = db.query(NotificationDB).all()
    if db_notifications:
        for n in db_notifications:
            n.read = True
        db.commit()

        for n in NOTIFICATIONS:
            n["read"] = True

        return [n.to_dict() for n in db_notifications]

    for n in NOTIFICATIONS:
        n["read"] = True
    return [_serialize(n) for n in NOTIFICATIONS]

