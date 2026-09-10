from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import ConflictDB, BundleDB
from app.data import BUNDLES, CONFLICTS, find_bundle, find_conflict
from app.errors import ProblemException
from app.models import Bundle, Conflict, ConflictResolveRequest

conflicts_router = APIRouter(prefix="/api/conflicts", tags=["Conflicts"], dependencies=[Depends(get_current_user)])
bundles_router = APIRouter(prefix="/api/bundles", tags=["Bundles"], dependencies=[Depends(get_current_user)])


@conflicts_router.get("", response_model=List[Conflict])
def list_conflicts(db: Session = Depends(get_db)):
    conflicts = db.query(ConflictDB).all()
    if conflicts:
        return [c.to_dict() for c in conflicts]
    return CONFLICTS


@conflicts_router.post("/{conflict_id}/resolve", response_model=Conflict)
def resolve_conflict(conflict_id: str, body: ConflictResolveRequest, db: Session = Depends(get_db)):
    conflict = db.query(ConflictDB).filter(ConflictDB.id == conflict_id).first()
    if conflict is not None:
        conflict.status = "Resolved"
        conflict.resolution = body.resolution
        db.commit()
        db.refresh(conflict)

        # Sync in-memory fallback
        mem = find_conflict(conflict_id)
        if mem:
            mem["status"] = "Resolved"
            mem["resolution"] = body.resolution

        return conflict.to_dict()

    mem = find_conflict(conflict_id)
    if mem is None:
        raise ProblemException(404, "Not Found", f"Conflict '{conflict_id}' does not exist.")
    mem["status"] = "Resolved"
    mem["resolution"] = body.resolution
    return mem


@bundles_router.get("", response_model=List[Bundle])
def list_bundles(db: Session = Depends(get_db)):
    bundles = db.query(BundleDB).all()
    if bundles:
        return [b.to_dict() for b in bundles]
    return BUNDLES


def _transition_bundle(bundle_id: str, new_status: str, db: Session) -> dict:
    bundle = db.query(BundleDB).filter(BundleDB.id == bundle_id).first()
    if bundle is not None:
        if bundle.status not in ("Candidate", "Accepted", "Rejected"):
            raise ProblemException(409, "Conflict", f"Bundle '{bundle_id}' is in an unrecognized state.")
        bundle.status = new_status
        db.commit()
        db.refresh(bundle)

        mem = find_bundle(bundle_id)
        if mem:
            mem["status"] = new_status

        return bundle.to_dict()

    mem = find_bundle(bundle_id)
    if mem is None:
        raise ProblemException(404, "Not Found", f"Bundle '{bundle_id}' does not exist.")
    if mem["status"] not in ("Candidate", "Accepted", "Rejected"):
        raise ProblemException(409, "Conflict", f"Bundle '{bundle_id}' is in an unrecognized state.")
    mem["status"] = new_status
    return mem


@bundles_router.post("/{bundle_id}/accept", response_model=Bundle)
def accept_bundle(bundle_id: str, db: Session = Depends(get_db)):
    return _transition_bundle(bundle_id, "Accepted", db)


@bundles_router.post("/{bundle_id}/reject", response_model=Bundle)
def reject_bundle(bundle_id: str, db: Session = Depends(get_db)):
    return _transition_bundle(bundle_id, "Rejected", db)

