"""
Database Configuration & Session Factory for RAILBLOCK
Uses SQLite with SQLAlchemy ORM (WAL mode enabled for concurrent reads/writes)
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL - defaults to local SQLite file `railblock.db`
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "railblock.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Create engine with connect_args for SQLite thread safety
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

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
