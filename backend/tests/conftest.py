"""
Fixtures compartidas para todos los tests del backend.
Provee: DB in-memory, TestClient de FastAPI, y helpers de auth.
"""
import os
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DEV_NO_AUTH"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"

from database import Base, get_db
from models import User, Game, Platform, Price, Alert, RefreshToken
from security import hash_password
from main import app

from fastapi.testclient import TestClient


@pytest.fixture()
def db():
    """SQLite in-memory database, fresh per test. Uses StaticPool to keep one connection."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestSession = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db):
    """FastAPI TestClient that uses the in-memory DB."""
    def _override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def test_user(db) -> User:
    """Creates a test user in the DB."""
    user = User(email="test@nexus.dev", password_hash=hash_password("TestPass123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def auth_client(client, test_user):
    """TestClient already logged in (cookie set)."""
    client.post("/api/auth/login", data={
        "username": test_user.email,
        "password": "TestPass123",
    })
    return client


@pytest.fixture()
def sample_game(db, test_user) -> Game:
    """A game in the backlog with prices."""
    game = Game(
        igdb_id=1942,
        user_id=test_user.id,
        title="The Witcher 3",
        cover_url="//images.igdb.com/igdb/image/upload/t_thumb/co1wyy.jpg",
        status="backlog",
        owned_platform="pc",
        genres="RPG,Adventure",
        hltb_main_hours=51.5,
        hltb_completionist_hours=173.0,
        has_coop=False,
    )
    db.add(game)
    db.flush()

    db.add(Platform(game_id=game.id, platform_name="PC"))
    db.add(Platform(game_id=game.id, platform_name="Switch"))
    db.add(Price(
        game_id=game.id,
        store_name="steam",
        current_price=1500.0,
        lowest_price=750.0,
        currency="ARS",
    ))
    db.commit()
    db.refresh(game)
    return game
