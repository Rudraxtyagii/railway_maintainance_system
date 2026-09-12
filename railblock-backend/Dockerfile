# Production Dockerfile for RAILBLOCK FastAPI Backend
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing .pyc files & enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose port (default 8080, dynamically overridden by Render $PORT)
EXPOSE 8080

# Run backend service with dynamic PORT binding
CMD ["sh", "-c", "alembic upgrade head || true && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
