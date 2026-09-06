from typing import List

from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.data import BUNDLES, CONFLICTS, find_bundle, find_conflict
from app.errors import ProblemException
from app.models import Bundle, Conflict, ConflictResolveRequest

conflicts_router = APIRouter(prefix="/api/conflicts", tags=["Conflicts"], dependencies=[Depends(get_current_user)])
bundles_router = APIRouter(prefix="/api/bundles", tags=["Bundles"], dependencies=[Depends(get_current_user)])


@conflicts_router.get("", response_model=List[Conflict])
def list_conflicts():
    return CONFLICTS


@conflicts_router.post("/{conflict_id}/resolve", response_model=Conflict)
def resolve_conflict(conflict_id: str, body: ConflictResolveRequest):
    conflict = find_conflict(conflict_id)
    if conflict is None:
        raise ProblemException(404, "Not Found", f"Conflict '{conflict_id}' does not exist.")
    conflict["status"] = "Resolved"
    conflict["resolution"] = body.resolution
    return conflict


@bundles_router.get("", response_model=List[Bundle])
def list_bundles():
    return BUNDLES


def _transition_bundle(bundle_id: str, new_status: str) -> dict:
    bundle = find_bundle(bundle_id)
    if bundle is None:
        raise ProblemException(404, "Not Found", f"Bundle '{bundle_id}' does not exist.")
    if bundle["status"] not in ("Candidate", "Accepted", "Rejected"):
        raise ProblemException(409, "Conflict", f"Bundle '{bundle_id}' is in an unrecognized state.")
    bundle["status"] = new_status
    return bundle


@bundles_router.post("/{bundle_id}/accept", response_model=Bundle)
def accept_bundle(bundle_id: str):
    return _transition_bundle(bundle_id, "Accepted")


@bundles_router.post("/{bundle_id}/reject", response_model=Bundle)
def reject_bundle(bundle_id: str):
    return _transition_bundle(bundle_id, "Rejected")
