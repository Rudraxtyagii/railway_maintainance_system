from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.db_models import DataQualitySampleDB
from app.data import DATA_QUALITY_METRICS, SAMPLE_UNSTRUCTURED, parse_defect_text
from app.errors import ProblemException
from app.models import DataQualityMetrics, ParsedDefectResponse, ParseTextRequest

router = APIRouter(
    prefix="/api/data-quality", tags=["Data Quality & NLP Parsing"], dependencies=[Depends(get_current_user)]
)


@router.get("/metrics", response_model=DataQualityMetrics)
def data_quality_metrics(db: Session = Depends(get_db)):
    samples = db.query(DataQualitySampleDB).all()
    unstructured = [s.to_dict() for s in samples] if samples else SAMPLE_UNSTRUCTURED
    return {**DATA_QUALITY_METRICS, "sampleUnstructured": unstructured}


@router.post("/parse", response_model=ParsedDefectResponse)
def parse_defect(body: ParseTextRequest):
    if not body.text or not body.text.strip():
        raise ProblemException(400, "Bad Request", "Field 'text' must not be empty.")
    return parse_defect_text(body.text)

