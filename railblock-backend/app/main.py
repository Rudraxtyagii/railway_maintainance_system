from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.db_init import init_db
from app.errors import register_error_handlers
from app.routers import (
    ai_copilot,
    analytics,
    auth,
    conflicts,
    corridors,
    data_quality,
    ml_optimization,
    notifications,
    optimization,
    priority,
    schedules,
    sync,
    tasks,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database tables and seed Indian Railways datasets
    init_db()
    yield


app = FastAPI(
    title="RAILBLOCK API",
    description=(
        "AI-Powered Automatic Block Planning backend — SIH PS 26027, "
        "Ministry of Railways, Government of India."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(auth.router)
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
    return {"service": "RAILBLOCK API", "status": "ok", "database": "SQLite / SQLAlchemy Persistent Store"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "db_status": "connected"}
