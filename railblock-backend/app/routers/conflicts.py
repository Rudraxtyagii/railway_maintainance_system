from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import ConflictDB, BundleDB
from app.errors import ProblemException
from app.models import Bundle, Conflict, ConflictResolveRequest
from app.realtime import broadcast_event

conflicts_router = APIRouter(prefix="/api/conflicts", tags=["Conflicts"], dependencies=[Depends(get_current_user)])
bundles_router = APIRouter(prefix="/api/bundles", tags=["Bundles"], dependencies=[Depends(get_current_user)])


@conflicts_router.get("", response_model=List[dict])
def list_conflicts(db: Session = Depends(get_db)):
    conflicts = db.query(ConflictDB).all()
    return [c.to_dict() for c in conflicts]


@conflicts_router.post("/{conflict_id}/resolve", response_model=dict)
def resolve_conflict(conflict_id: str, body: ConflictResolveRequest, db: Session = Depends(get_db)):
    conflict = db.query(ConflictDB).filter(ConflictDB.id == conflict_id).first()
    if conflict is None:
        raise ProblemException(404, "Not Found", f"Conflict '{conflict_id}' does not exist in database.")

    conflict.status = "Resolved"
    conflict.resolution = body.resolution
    db.commit()
    db.refresh(conflict)

    broadcast_event("CONFLICT_RESOLVED", conflict.to_dict())
    broadcast_event("METRICS_UPDATED", {"reason": "CONFLICT_RESOLVED"})

    return conflict.to_dict()


@bundles_router.get("", response_model=List[dict])
def list_bundles(db: Session = Depends(get_db)):
    bundles = db.query(BundleDB).all()
    return [b.to_dict() for b in bundles]


def _transition_bundle(bundle_id: str, new_status: str, db: Session) -> dict:
    bundle = db.query(BundleDB).filter(BundleDB.id == bundle_id).first()
    if bundle is None:
        raise ProblemException(404, "Not Found", f"Bundle '{bundle_id}' does not exist in database.")

    if bundle.status not in ("Candidate", "Accepted", "Rejected"):
        raise ProblemException(409, "Conflict", f"Bundle '{bundle_id}' is in an unrecognized state.")

    bundle.status = new_status
    db.commit()
    db.refresh(bundle)

    broadcast_event("BUNDLE_STATUS_CHANGED", bundle.to_dict())
    broadcast_event("METRICS_UPDATED", {"reason": "BUNDLE_STATUS_CHANGED"})

    return bundle.to_dict()


@bundles_router.post("/{bundle_id}/accept", response_model=dict)
def accept_bundle(bundle_id: str, db: Session = Depends(get_db)):
    return _transition_bundle(bundle_id, "Accepted", db)


@bundles_router.post("/{bundle_id}/reject", response_model=dict)
def reject_bundle(bundle_id: str, db: Session = Depends(get_db)):
    return _transition_bundle(bundle_id, "Rejected", db)
