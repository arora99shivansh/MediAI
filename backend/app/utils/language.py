from langdetect import LangDetectException, detect

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
}


def resolve_language(text: str, requested_language: str) -> str:
    if requested_language != "auto":
        return requested_language
    try:
        return LANGUAGE_NAMES.get(detect(text), "English")
    except LangDetectException:
        return "English"
