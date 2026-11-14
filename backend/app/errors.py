from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM_MEDIA_TYPE = "application/problem+json"
STATUS_TITLES = {status.value: status.phrase for status in HTTPStatus}


def problem_response(
    status: int,
    detail: str | None = None,
    errors: list[dict] | None = None,
    headers: dict | None = None,
) -> JSONResponse:
    body = {
        "type": "about:blank",
        "title": STATUS_TITLES.get(status, "Error"),
        "status": status,
    }
    if detail is not None:
        body["detail"] = detail
    if errors:
        body["errors"] = errors
    return JSONResponse(
        status_code=status,
        content=body,
        media_type=PROBLEM_MEDIA_TYPE,
        headers=headers,
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # Covers our HTTPException raises and FastAPI's own (e.g. unknown routes)
    return problem_response(
        exc.status_code,
        detail=str(exc.detail),
        headers=getattr(exc, "headers", None),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        # Drop the location prefix ("body", "query", ...) and keep the field path
        path = [str(p) for p in err["loc"] if p not in ("body", "query", "path", "header")]
        errors.append({"field": ".".join(path) or "body", "message": err["msg"]})

    return problem_response(
        422,
        detail="The request is invalid.",
        errors=errors,
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)