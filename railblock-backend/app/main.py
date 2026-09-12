import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from alembic.config import Config
from alembic import command

from app.database import engine, Base
from app.db_init import init_db
from app.errors import register_error_handlers
from app.realtime import router as realtime_router
from app.routers import (
    admin,
    ai_copilot,
    analytics,
    auth,
    conflicts,
    corridors,
    data_quality,
    hitl,
    ingest,
    ml_optimization,
    notifications,
    optimization,
    priority,
    schedules,
    sync,
    tasks,
)

logger = logging.getLogger("railblock.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run Alembic migrations if alembic.ini is present
    ini_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "alembic.ini")
    if not os.path.exists(ini_path):
        ini_path = "alembic.ini"

    try:
        if os.path.exists(ini_path):
            logger.info("Executing Alembic migrations...")
            alembic_cfg = Config(ini_path)
            command.upgrade(alembic_cfg, "head")
            logger.info("Alembic migrations completed successfully.")
    except Exception as e:
        logger.warning(f"Alembic migration notice: {e}. Falling back to create_all.")

    # Initialize tables and seed Indian Railways datasets if empty
    init_db()
    yield


app = FastAPI(
    title="RAILBLOCK API (v3.0)",
    description=(
        "Real-Time Automatic Block Planning & RAG-Powered Command System — SIH PS 26027, "
        "Ministry of Railways, Centre for Railway Information Systems (CRIS), Government of India."
    ),
    version="3.0.0",
    lifespan=lifespan
)

# ---------------------------------------------------------------------------
# Production CORS Configuration
# ---------------------------------------------------------------------------
raw_origins = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
]

if raw_origins:
    for orig in raw_origins.split(","):
        clean_orig = orig.strip().rstrip("/")
        if clean_orig and clean_orig not in allowed_origins:
            allowed_origins.append(clean_orig)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

# Mount Routers
app.include_router(realtime_router)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(ingest.router)
app.include_router(hitl.router)
app.include_router(tasks.router)
app.include_router(corridors.router)
app.include_router(conflicts.conflicts_router)
app.include_router(conflicts.bundles_router)
app.include_router(optimization.router)
app.include_router(ml_optimization.router)
app.include_router(ai_copilot.router)
app.include_router(schedules.router)
app.include_router(sync.router)
app.include_router(analytics.router)
app.include_router(data_quality.router)
app.include_router(priority.router)
app.include_router(notifications.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "RAILBLOCK API (v3.0)",
        "status": "ok",
        "database": "PostgreSQL 16 / SQLAlchemy Persistent Store",
        "realtimeStream": "WebSocket & SSE Active",
        "ragEngine": "G&SR / ACTM / IRPWM / BWM Grounded Knowledge Base"
    }


@app.get("/health", tags=["Health"])
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "db_status": "connected",
            "database": "PostgreSQL 16 / SQLite Persistent Store",
            "ragStatus": "ready",
            "realtimeStatus": "ready"
        }
    except Exception as e:
        return {"status": "unhealthy", "db_status": "disconnected", "error": str(e)}
