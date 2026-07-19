from app.auth.jwt import create_access_token, decode_access_token
from app.utils.password import hash_password, verify_password


def test_password_hash_round_trip() -> None:
    hashed = hash_password("VeryStrongPass123")
    assert hashed != "VeryStrongPass123"
    assert verify_password("VeryStrongPass123", hashed)
    assert not verify_password("WrongPassword123", hashed)


def test_access_token_contains_subject_and_role() -> None:
    token = create_access_token("user-123", "doctor")
    payload = decode_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["role"] == "doctor"
    assert payload["type"] == "access"
