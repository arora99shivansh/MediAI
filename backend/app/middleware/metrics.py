from time import perf_counter

from prometheus_client import Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

REQUEST_COUNT = Counter("mediai_http_requests_total", "HTTP requests", ["method", "path", "status"])
REQUEST_LATENCY = Histogram("mediai_http_request_latency_seconds", "HTTP latency", ["method", "path"])


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        started = perf_counter()
        response = await call_next(request)
        REQUEST_COUNT.labels(request.method, request.url.path, response.status_code).inc()
        REQUEST_LATENCY.labels(request.method, request.url.path).observe(perf_counter() - started)
        return response


async def metrics_endpoint() -> Response:
    return Response(generate_latest(), media_type="text/plain; version=0.0.4")
