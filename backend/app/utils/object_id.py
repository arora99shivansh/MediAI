from bson import ObjectId


def object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise ValueError("Invalid identifier")
    return ObjectId(value)


def serialize_document(document: dict) -> dict:
    return {key: str(value) if isinstance(value, ObjectId) else value for key, value in document.items()}
