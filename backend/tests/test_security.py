"""
P0 — Tests unitarios de security.py (JWT tokens + hashing).
Cobertura: creación/verificación de tokens, expiración, password hashing.
"""
import pytest
import jwt
from datetime import timedelta, datetime, timezone
from unittest.mock import patch

from security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    create_password_reset_token, verify_password_reset_token,
    SECRET_KEY, REFRESH_SECRET_KEY, PASSWORD_RESET_SECRET_KEY, ALGORITHM,
)


class TestPasswordHashing:
    def test_hash_and_verify_correct(self):
        hashed = hash_password("MySecretPass123")
        assert hashed != "MySecretPass123"
        assert verify_password("MySecretPass123", hashed)

    def test_verify_wrong_password(self):
        hashed = hash_password("CorrectPassword")
        assert not verify_password("WrongPassword", hashed)

    def test_hash_is_unique_per_call(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # bcrypt salt makes each hash unique


class TestAccessToken:
    def test_create_and_decode(self):
        token = create_access_token(data={"sub": "user@test.com"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "user@test.com"
        assert "exp" in payload

    def test_custom_expiry(self):
        token = create_access_token(
            data={"sub": "x@y.com"},
            expires_delta=timedelta(minutes=5)
        )
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        assert (exp - now).total_seconds() < 310
        assert (exp - now).total_seconds() > 280

    def test_expired_token_raises(self):
        token = create_access_token(
            data={"sub": "x@y.com"},
            expires_delta=timedelta(seconds=-1)
        )
        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

    def test_wrong_secret_raises(self):
        token = create_access_token(data={"sub": "x@y.com"})
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, "wrong_secret", algorithms=[ALGORITHM])


class TestRefreshToken:
    def test_uses_different_secret(self):
        token = create_refresh_token(data={"sub": "user@test.com"})
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "user@test.com"

    def test_default_expiry_7_days(self):
        token = create_refresh_token(data={"sub": "x@y.com"})
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = (exp - now).total_seconds()
        assert 6.9 * 86400 < delta < 7.1 * 86400


class TestPasswordResetToken:
    def test_create_and_verify(self):
        token = create_password_reset_token("reset@test.com")
        email = verify_password_reset_token(token)
        assert email == "reset@test.com"

    def test_has_scope_field(self):
        token = create_password_reset_token("x@y.com")
        payload = jwt.decode(token, PASSWORD_RESET_SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["scope"] == "password_reset"

    def test_expired_returns_none(self):
        token = create_password_reset_token("x@y.com")
        # Manually create an expired one
        expired = jwt.encode(
            {"sub": "x@y.com", "scope": "password_reset",
             "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
            PASSWORD_RESET_SECRET_KEY, algorithm=ALGORITHM
        )
        assert verify_password_reset_token(expired) is None

    def test_wrong_scope_returns_none(self):
        token = jwt.encode(
            {"sub": "x@y.com", "scope": "access",
             "exp": datetime.now(timezone.utc) + timedelta(minutes=15)},
            PASSWORD_RESET_SECRET_KEY, algorithm=ALGORITHM
        )
        assert verify_password_reset_token(token) is None

    def test_invalid_token_returns_none(self):
        assert verify_password_reset_token("garbage.token.here") is None
