from app.utils.sanitize import sanitize_text


def test_html_tags_are_stripped() -> None:
    assert sanitize_text("<b>bold</b> text") == "bold text"
    assert sanitize_text("<p>paragraph</p>") == "paragraph"


def test_script_injection_is_stripped() -> None:
    assert sanitize_text("<script>alert('xss')</script>Hello") == "Hello"
    assert "<script>" not in sanitize_text("<script>evil()</script>safe text")


def test_nested_tags_are_stripped() -> None:
    assert sanitize_text("<div><span>content</span></div>") == "content"


def test_plain_text_is_unchanged() -> None:
    assert sanitize_text("What is the normal HbA1c range?") == "What is the normal HbA1c range?"


def test_whitespace_is_collapsed() -> None:
    assert sanitize_text("  extra   spaces  ") == "extra   spaces"


def test_empty_string_is_safe() -> None:
    assert sanitize_text("") == ""
