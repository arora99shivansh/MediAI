import re

_TAG_RE = re.compile(r"<[^>]+>")
_MULTI_SPACE = re.compile(r"[ \t]+")


def sanitize_text(text: str) -> str:
    """Strip HTML/XML tags and collapse redundant whitespace from user-supplied text."""
    cleaned = _TAG_RE.sub("", text)
    cleaned = _MULTI_SPACE.sub(" ", cleaned)
    return cleaned.strip()
