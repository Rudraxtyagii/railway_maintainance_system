"""
RFC 7807 "Problem Details for HTTP APIs" error handling.

Every error response returned by this service matches the shape the
frontend's apiClient expects:

    {
        "status": 409,
        "error": "Conflict",
        "message": "Human readable message",
        "timestamp": "2026-09-05T18:35:00Z"
    }
"""
from datetime import datetime, timezone

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ProblemException(Exception):
    """Raise this anywhere in route handlers to produce an RFC 7807 body."""

    def __init__(self, status_code: int, error: str, message: str):
        self.status_code = status_code
        self.error = error
        self.message = message


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _problem_response(status_code: int, error: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "status": status_code,
            "error": error,
            "message": message,
            "timestamp": _now(),
        },
    )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProblemException)
    async def problem_exception_handler(request: Request, exc: ProblemException):
        return _problem_response(exc.status_code, exc.error, exc.message)

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        # Map common status codes to their RFC 7807 "title" / error name
        titles = {
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            405: "Method Not Allowed",
            409: "Conflict",
            422: "Unprocessable Entity",
            500: "Internal Server Error",
        }
        return _problem_response(
            exc.status_code,
            titles.get(exc.status_code, "Error"),
            str(exc.detail),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        first = exc.errors()[0] if exc.errors() else None
        message = "Request validation failed."
        if first:
            loc = ".".join(str(p) for p in first.get("loc", []) if p != "body")
            message = f"{loc}: {first.get('msg')}" if loc else first.get("msg", message)
        return _problem_response(status.HTTP_422_UNPROCESSABLE_ENTITY, "Validation Error", message)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        return _problem_response(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Internal Server Error", "An unexpected error occurred."
        )
