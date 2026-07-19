from app.utils.language import resolve_language


def test_resolve_language_uses_requested_language() -> None:
    assert resolve_language("hello", "French") == "French"


def test_resolve_language_detects_supported_language() -> None:
    assert resolve_language("This is a medical report", "auto") == "English"
