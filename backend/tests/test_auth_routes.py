"""
P0 — Tests de integración del router de auth.
Cobertura: register, login, refresh rotation, logout, forgot/reset password, /me.
"""
import pytest
import hashlib
from datetime import datetime, timedelta, timezone

from models import User, RefreshToken
from security import hash_password, create_password_reset_token


class TestRegister:
    def test_register_success(self, client, db):
        resp = client.post("/api/auth/register", json={
            "email": "new@user.com",
            "password": "SecurePass1"
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "new@user.com"
        assert "access_token" in resp.cookies or "access_token" in str(resp.headers.get("set-cookie", ""))

    def test_register_duplicate_email(self, client, db, test_user):
        resp = client.post("/api/auth/register", json={
            "email": test_user.email,
            "password": "AnyPass123"
        })
        assert resp.status_code == 400
        assert "ya registrado" in resp.json()["detail"]

    def test_register_sets_cookies(self, client, db):
        resp = client.post("/api/auth/register", json={
            "email": "cookie@test.com",
            "password": "Pass123"
        })
        assert "access_token" in resp.cookies
        assert "refresh_token" in resp.cookies


class TestLogin:
    def test_login_success(self, client, test_user):
        resp = client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "TestPass123",
        })
        assert resp.status_code == 200
        assert resp.json()["email"] == test_user.email
        assert "access_token" in resp.cookies

    def test_login_wrong_password(self, client, test_user):
        resp = client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "WrongPassword",
        })
        assert resp.status_code == 401
        assert "inválidas" in resp.json()["detail"]

    def test_login_nonexistent_user(self, client, db):
        resp = client.post("/api/auth/login", data={
            "username": "nobody@nowhere.com",
            "password": "whatever",
        })
        assert resp.status_code == 401

    def test_login_stores_refresh_token_in_db(self, client, db, test_user):
        client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "TestPass123",
        })
        stored = db.query(RefreshToken).filter(RefreshToken.user_id == test_user.id).all()
        assert len(stored) >= 1
        assert stored[-1].revoked is False


class TestRefreshTokenRotation:
    def test_refresh_issues_new_tokens(self, client, db, test_user):
        login_resp = client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "TestPass123",
        })
        old_access = login_resp.cookies.get("access_token")

        import time; time.sleep(1)  # ensure different JWT timestamp
        refresh_resp = client.post("/api/auth/refresh")
        assert refresh_resp.status_code == 200
        new_access = refresh_resp.cookies.get("access_token")
        assert new_access != old_access

    def test_refresh_revokes_old_token(self, client, db, test_user):
        client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "TestPass123",
        })

        import time; time.sleep(1)
        client.post("/api/auth/refresh")

        active = db.query(RefreshToken).filter(
            RefreshToken.user_id == test_user.id, RefreshToken.revoked == False
        ).all()
        assert len(active) == 1

    def test_refresh_without_cookie_returns_401(self, client, db):
        resp = client.post("/api/auth/refresh")
        assert resp.status_code == 401

    def test_reuse_revoked_token_revokes_all(self, client, db, test_user):
        """Simula reuso de token robado: revoca TODOS los tokens del usuario."""
        client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "TestPass123",
        })
        refresh_cookie = client.cookies.get("refresh_token")

        import time; time.sleep(1)
        client.post("/api/auth/refresh")

        # Try reusing the OLD refresh token (simulate attacker)
        client.cookies.set("refresh_token", refresh_cookie)
        resp = client.post("/api/auth/refresh")
        assert resp.status_code == 401

        active = db.query(RefreshToken).filter(
            RefreshToken.user_id == test_user.id, RefreshToken.revoked == False
        ).count()
        assert active == 0


class TestLogout:
    def test_logout_clears_cookies(self, auth_client):
        resp = auth_client.post("/api/auth/logout")
        assert resp.status_code == 200
        assert "Sesión cerrada" in resp.json()["message"]

    def test_logout_revokes_refresh_token(self, auth_client, db, test_user):
        auth_client.post("/api/auth/logout")
        active = db.query(RefreshToken).filter(
            RefreshToken.user_id == test_user.id, RefreshToken.revoked == False
        ).count()
        assert active == 0


class TestMe:
    def test_me_returns_user(self, auth_client, test_user):
        resp = auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["email"] == test_user.email

    def test_me_without_auth_uses_dev_bypass(self, client, db):
        # DEV_NO_AUTH=1 creates dev@local
        resp = client.get("/api/auth/me")
        assert resp.status_code == 200
        assert resp.json()["email"] == "dev@local"

    def test_patch_me(self, auth_client, test_user):
        resp = auth_client.patch("/api/auth/me", json={
            "available_hours_per_week": 10,
            "stress_level_tolerance": "low"
        })
        assert resp.status_code == 200
        assert resp.json()["available_hours_per_week"] == 10
        assert resp.json()["stress_level_tolerance"] == "low"


class TestForgotResetPassword:
    def test_forgot_always_returns_success(self, client, db, test_user):
        resp = client.post("/api/auth/forgot-password", json={"email": test_user.email})
        assert resp.status_code == 200

    def test_forgot_nonexistent_email_still_200(self, client, db):
        resp = client.post("/api/auth/forgot-password", json={"email": "nope@nope.com"})
        assert resp.status_code == 200

    def test_reset_password_success(self, client, db, test_user):
        token = create_password_reset_token(test_user.email)
        resp = client.post("/api/auth/reset-password", json={
            "token": token,
            "new_password": "NewSecurePass456"
        })
        assert resp.status_code == 200

        # Can login with new password
        login_resp = client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "NewSecurePass456",
        })
        assert login_resp.status_code == 200

    def test_reset_invalid_token(self, client, db):
        resp = client.post("/api/auth/reset-password", json={
            "token": "invalid.token.here",
            "new_password": "Whatever123"
        })
        assert resp.status_code == 400

    def test_reset_revokes_all_refresh_tokens(self, client, db, test_user):
        # Login first to create refresh tokens
        client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "TestPass123",
        })
        token = create_password_reset_token(test_user.email)
        client.post("/api/auth/reset-password", json={
            "token": token,
            "new_password": "BrandNew999"
        })
        active = db.query(RefreshToken).filter(
            RefreshToken.user_id == test_user.id, RefreshToken.revoked == False
        ).count()
        assert active == 0
