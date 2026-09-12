"""
Database Configuration & Session Factory for RAILBLOCK (v3.0)
Supports PostgreSQL 16 (production & docker) with connection pooling and SQLite (development/fallback).
"""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("railblock.database")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "railblock.db")
DATABASE_URL = os.getenv("DATABASE_URL")

# If URL starts with postgres://, convert to postgresql:// for SQLAlchemy 2.0 compatibility
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = None

if DATABASE_URL:
    try:
        if DATABASE_URL.startswith("sqlite"):
            engine = create_engine(
                DATABASE_URL,
                connect_args={"check_same_thread": False},
                echo=False
            )
        else:
            engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                pool_recycle=300,
                echo=False
            )
    except Exception as e:
        logger.warning(f"Failed to initialize engine with DATABASE_URL={DATABASE_URL}: {e}. Falling back to SQLite.")
        engine = None

if engine is None:
    # Local SQLite persistent store
    fallback_url = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        fallback_url,
        connect_args={"check_same_thread": False},
        echo=False
    )
    logger.info(f"Initialized RAILBLOCK database using SQLite at {DB_PATH}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session per request.
    Ensures proper closing after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
