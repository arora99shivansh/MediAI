import json
import logging
from contextlib import asynccontextmanager
from datetime import UTC, datetime as _dt

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

from app.api.v1.router import api_router
from app.config.settings import get_settings
from app.database.mongo import close_mongo_connection, connect_to_mongo
from app.middleware.metrics import MetricsMiddleware, metrics_endpoint
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security import configure_security


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        entry: dict = {
            "ts": _dt.now(UTC).isoformat(timespec="milliseconds"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            entry["exc"] = self.formatException(record.exc_info)
        return json.dumps(entry)


settings = get_settings()

_handler = logging.StreamHandler()
_handler.setFormatter(_JsonFormatter() if settings.is_production else logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
logging.basicConfig(handlers=[_handler], level=logging.INFO, force=True)
logger = logging.getLogger("mediai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    logger.info("MediAI backend started", extra={"environment": settings.environment})
    yield
    await close_mongo_connection()
    logger.info("MediAI backend stopped")


app = FastAPI(
    title="MediAI API",
    description=(
        "Enterprise AI medical assistant powered by Retrieval-Augmented Generation. "
        "Upload clinical documents and ask grounded questions with source citations. "
        "All responses include evidence, red-flag guidance, and professional care recommendations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    contact={"name": "MediAI Support"},
    license_info={"name": "Proprietary"},
)

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda _, exc: JSONResponse({"error": {"code": 429, "message": "Rate limit exceeded", "detail": str(exc)}}, status_code=429))

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP error {exc.status_code}", extra={"url": str(request.url), "detail": exc.detail})
    return JSONResponse({"error": {"code": exc.status_code, "message": exc.detail}}, status_code=exc.status_code)

def sanitize_dict(obj):
    if isinstance(obj, dict):
        return {k: sanitize_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_dict(v) for v in obj]
    elif isinstance(obj, (str, int, float, bool, type(None))):
        return obj
    return str(obj)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = sanitize_dict(exc.errors())
    errors = jsonable_encoder(errors)
    logger.warning("Validation error", extra={"url": str(request.url), "errors": errors})
    return JSONResponse({"error": {"code": 422, "message": "Validation Error", "details": errors}}, status_code=422)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", extra={"url": str(request.url)}, exc_info=exc)
    return JSONResponse({"error": {"code": 500, "message": "Internal Server Error"}}, status_code=500)

app.add_middleware(SlowAPIMiddleware)
app.add_middleware(MetricsMiddleware)
app.add_middleware(RequestIDMiddleware)
configure_security(app)

app.include_router(api_router, prefix=settings.api_v1_prefix)
app.add_api_route("/metrics", metrics_endpoint, methods=["GET"], tags=["Monitoring"], include_in_schema=False)


@app.get("/", tags=["Health"], summary="Root")
async def root() -> dict:
    return {"app": settings.app_name, "status": "running", "docs": "/docs", "version": "1.0.0"}
