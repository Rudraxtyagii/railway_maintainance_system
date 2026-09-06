from typing import List
 
from fastapi import APIRouter, Depends
 
from app.auth import get_current_user
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
        "unread": not n["read"],
        "actionUrl": CATEGORY_TO_URL.get(n["category"], DEFAULT_ACTION_URL),
        "category": n["category"],
        "relatedId": n.get("relatedId"),
    }
 
 
@router.get("")
def list_notifications():
    return [_serialize(n) for n in NOTIFICATIONS]
 
 
@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: str):
    for n in NOTIFICATIONS:
        if n["id"] == notification_id:
            n["read"] = True
            return _serialize(n)
    raise ProblemException(404, "Not Found", f"Notification '{notification_id}' does not exist.")
 
 
@router.post("/read-all")
def mark_all_read():
    for n in NOTIFICATIONS:
        n["read"] = True
    return [_serialize(n) for n in NOTIFICATIONS]

# from typing import List

# from fastapi import APIRouter, Depends

# from app.auth import get_current_user
# from app.data import NOTIFICATIONS
# from app.errors import ProblemException
# from app.models import Notification

# router = APIRouter(prefix="/api/notifications", tags=["Notifications"], dependencies=[Depends(get_current_user)])


# @router.get("", response_model=List[Notification])
# def list_notifications():
#     return NOTIFICATIONS


# @router.post("/{notification_id}/read", response_model=Notification)
# def mark_notification_read(notification_id: str):
#     for n in NOTIFICATIONS:
#         if n["id"] == notification_id:
#             n["read"] = True
#             return n
#     raise ProblemException(404, "Not Found", f"Notification '{notification_id}' does not exist.")


# @router.post("/read-all", response_model=List[Notification])
# def mark_all_read():
#     for n in NOTIFICATIONS:
#         n["read"] = True
#     return NOTIFICATIONS
