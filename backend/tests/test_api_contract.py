from app.main import app


def test_openapi_contains_required_routes() -> None:
    schema = app.openapi()
    paths = schema["paths"]
    for route in [
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/chat",
        "/api/v1/chat/history",
        "/api/v1/upload",
        "/api/v1/documents",
        "/api/v1/search",
        "/api/v1/admin/dashboard",
        "/api/v1/health",
    ]:
        assert route in paths
