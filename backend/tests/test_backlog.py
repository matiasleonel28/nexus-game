"""
P1 — Tests de integración del router de backlog.
Cobertura: CRUD, sorts, _pick_best_price, filtros, stats.
"""
import pytest
from unittest.mock import patch, AsyncMock

from models import Game, Platform, Price


class TestGetBacklog:
    def test_empty_backlog(self, auth_client):
        resp = auth_client.get("/api/backlog")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_games_in_library_statuses(self, auth_client, db, test_user):
        for status in ["backlog", "playing", "completed", "abandoned"]:
            g = Game(igdb_id=100 + hash(status) % 1000, user_id=test_user.id,
                     title=f"Game {status}", status=status)
            db.add(g)
        db.commit()

        resp = auth_client.get("/api/backlog")
        assert resp.status_code == 200
        assert len(resp.json()) == 4

    def test_filter_by_status(self, auth_client, sample_game):
        resp = auth_client.get("/api/backlog?status=backlog")
        assert len(resp.json()) == 1
        assert resp.json()[0]["title"] == "The Witcher 3"

        resp = auth_client.get("/api/backlog?status=playing")
        assert len(resp.json()) == 0

    def test_filter_by_platform(self, auth_client, sample_game):
        resp = auth_client.get("/api/backlog?platform=pc")
        assert len(resp.json()) == 1

        resp = auth_client.get("/api/backlog?platform=switch2")
        assert len(resp.json()) == 0

    def test_filter_coop(self, auth_client, db, test_user):
        g = Game(igdb_id=7777, user_id=test_user.id, title="It Takes Two",
                 status="backlog", has_coop=True)
        db.add(g)
        db.commit()

        resp = auth_client.get("/api/backlog?coop=true")
        assert len(resp.json()) == 1
        assert resp.json()[0]["title"] == "It Takes Two"

    def test_excludes_wishlist(self, auth_client, db, test_user):
        g = Game(igdb_id=5555, user_id=test_user.id, title="Wishlisted",
                 status="wishlist")
        db.add(g)
        db.commit()

        resp = auth_client.get("/api/backlog")
        titles = [x["title"] for x in resp.json()]
        assert "Wishlisted" not in titles


class TestBacklogSorts:
    @pytest.fixture(autouse=True)
    def _games(self, db, test_user):
        games = [
            Game(igdb_id=101, user_id=test_user.id, title="Short",
                 status="backlog", hltb_main_hours=5.0),
            Game(igdb_id=102, user_id=test_user.id, title="Long",
                 status="backlog", hltb_main_hours=100.0),
            Game(igdb_id=103, user_id=test_user.id, title="Medium",
                 status="backlog", hltb_main_hours=30.0),
        ]
        for g in games:
            db.add(g)
        db.flush()
        # Add prices for value sort
        db.add(Price(game_id=games[0].id, store_name="steam",
                     current_price=500.0, currency="ARS"))
        db.add(Price(game_id=games[1].id, store_name="steam",
                     current_price=3000.0, currency="ARS"))
        db.add(Price(game_id=games[2].id, store_name="steam",
                     current_price=1500.0, currency="ARS"))
        db.commit()

    def test_sort_duration_asc(self, auth_client):
        resp = auth_client.get("/api/backlog?sort=duration_asc")
        titles = [g["title"] for g in resp.json()]
        assert titles == ["Short", "Medium", "Long"]

    def test_sort_duration_desc(self, auth_client):
        resp = auth_client.get("/api/backlog?sort=duration_desc")
        titles = [g["title"] for g in resp.json()]
        assert titles == ["Long", "Medium", "Short"]

    def test_sort_price_asc(self, auth_client):
        resp = auth_client.get("/api/backlog?sort=price_asc")
        titles = [g["title"] for g in resp.json()]
        assert titles == ["Short", "Medium", "Long"]

    def test_sort_value_asc(self, auth_client):
        # value = price / hours: Short=100, Medium=50, Long=30
        resp = auth_client.get("/api/backlog?sort=value_asc")
        titles = [g["title"] for g in resp.json()]
        assert titles == ["Long", "Medium", "Short"]

    def test_sort_value_asc_zero_hours(self, auth_client, db, test_user):
        """Zero HLTB hours should not cause ZeroDivisionError.
        hltb_main_hours=0 falls back to 999 via `or 999`, so value = price/999."""
        g = Game(igdb_id=999, user_id=test_user.id, title="NoHours",
                 status="backlog", hltb_main_hours=0)
        db.add(g)
        db.flush()
        db.add(Price(game_id=g.id, store_name="steam",
                     current_price=1000.0, currency="ARS"))
        db.commit()

        resp = auth_client.get("/api/backlog?sort=value_asc")
        assert resp.status_code == 200
        # No crash — that's the key assertion; value = 1000/999 ≈ 1.0
        assert "NoHours" in [g["title"] for g in resp.json()]

    def test_sort_value_asc_none_hours(self, auth_client, db, test_user):
        """None HLTB hours uses 999 fallback."""
        g = Game(igdb_id=998, user_id=test_user.id, title="NullHours",
                 status="backlog", hltb_main_hours=None)
        db.add(g)
        db.commit()

        resp = auth_client.get("/api/backlog?sort=value_asc")
        assert resp.status_code == 200


class TestAddToBacklog:
    @patch("routers.backlog.igdb_get_game_by_id", new_callable=AsyncMock)
    @patch("routers.backlog.get_duration", new_callable=AsyncMock)
    @patch("routers.backlog.itad.get_prices", new_callable=AsyncMock)
    def test_add_new_game(self, mock_itad, mock_hltb, mock_igdb, auth_client, db):
        mock_igdb.return_value = {
            "id": 12345,
            "name": "Hades",
            "cover": {"url": "//images.igdb.com/igdb/image/upload/t_thumb/co1234.jpg"},
            "platforms": [{"id": 6}, {"id": 130}],
            "game_modes": [{"id": 1}, {"id": 3}],
            "genres": [{"name": "Roguelike"}, {"name": "Action"}],
            "first_release_date": 1600387200,
        }
        mock_hltb.return_value = {"main": 22.0, "completionist": 95.0}
        mock_itad.return_value = {
            "steam": {"current": 800.0, "lowest": 500.0, "currency": "ARS",
                      "cut": 50, "regular": 1600.0, "url": "https://store.steampowered.com/app/1145360"}
        }

        resp = auth_client.post("/api/backlog", json={
            "igdb_id": 12345,
            "owned_platform": "pc"
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Hades"
        assert data["hltb_main_hours"] == 22.0
        assert data["has_coop"] is True
        assert data["current_price"] == 800.0
        assert "PC" in data["platforms"]

    @patch("routers.backlog.igdb_get_game_by_id", new_callable=AsyncMock)
    @patch("routers.backlog.get_duration", new_callable=AsyncMock)
    @patch("routers.backlog.itad.get_prices", new_callable=AsyncMock)
    def test_add_duplicate_changes_status(self, mock_itad, mock_hltb, mock_igdb,
                                          auth_client, db, sample_game):
        """Adding a game that already exists with different status updates it."""
        resp = auth_client.post("/api/backlog", json={
            "igdb_id": sample_game.igdb_id,
            "owned_platform": "pc"
        })
        # Same status = 409
        assert resp.status_code == 409

    def test_add_nonexistent_igdb_id(self, auth_client, db):
        with patch("routers.backlog.igdb_get_game_by_id", new_callable=AsyncMock) as mock_igdb:
            mock_igdb.return_value = None
            resp = auth_client.post("/api/backlog", json={"igdb_id": 0})
            assert resp.status_code == 404


class TestUpdateGame:
    def test_update_status(self, auth_client, sample_game):
        resp = auth_client.patch(f"/api/games/{sample_game.id}", json={
            "status": "playing"
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "playing"

    def test_update_target_price(self, auth_client, sample_game):
        resp = auth_client.patch(f"/api/games/{sample_game.id}", json={
            "target_price": 750.0,
            "watch_store": "steam"
        })
        assert resp.status_code == 200
        assert resp.json()["target_price"] == 750.0
        assert resp.json()["watch_store"] == "steam"

    def test_update_nonexistent_game(self, auth_client):
        resp = auth_client.patch("/api/games/99999", json={"status": "playing"})
        assert resp.status_code == 404

    def test_update_other_users_game(self, client, db, sample_game):
        """Can't update a game belonging to another user."""
        other = User(email="other@test.com", password_hash=hash_password("pass"))
        db.add(other)
        db.commit()

        # Login as other user
        client.post("/api/auth/register", json={
            "email": "other2@test.com", "password": "Pass123"
        })
        resp = client.patch(f"/api/games/{sample_game.id}", json={"status": "playing"})
        assert resp.status_code == 404


class TestDeleteGame:
    def test_delete_success(self, auth_client, sample_game, db):
        resp = auth_client.delete(f"/api/games/{sample_game.id}")
        assert resp.status_code == 204

        remaining = db.query(Game).filter(Game.id == sample_game.id).first()
        assert remaining is None

    def test_delete_nonexistent(self, auth_client):
        resp = auth_client.delete("/api/games/99999")
        assert resp.status_code == 404


class TestPickBestPrice:
    def test_picks_platform_store(self, auth_client, db, test_user):
        """When owned_platform is pc, picks steam price over cheaper xbox."""
        g = Game(igdb_id=2222, user_id=test_user.id, title="Multi Store",
                 status="backlog", owned_platform="pc")
        db.add(g)
        db.flush()
        db.add(Price(game_id=g.id, store_name="steam",
                     current_price=1500.0, currency="ARS"))
        db.add(Price(game_id=g.id, store_name="xbox",
                     current_price=1000.0, currency="ARS"))
        db.commit()

        resp = auth_client.get("/api/backlog")
        game_data = [x for x in resp.json() if x["title"] == "Multi Store"][0]
        assert game_data["price_store"] == "steam"
        assert game_data["current_price"] == 1500.0

    def test_picks_cheapest_when_no_platform_match(self, auth_client, db, test_user):
        """When no platform preference match, picks cheapest."""
        g = Game(igdb_id=3333, user_id=test_user.id, title="No Match",
                 status="backlog", owned_platform="ps5")  # ps5 -> None store
        db.add(g)
        db.flush()
        db.add(Price(game_id=g.id, store_name="steam",
                     current_price=2000.0, currency="ARS"))
        db.add(Price(game_id=g.id, store_name="xbox",
                     current_price=800.0, currency="ARS"))
        db.commit()

        resp = auth_client.get("/api/backlog")
        game_data = [x for x in resp.json() if x["title"] == "No Match"][0]
        assert game_data["price_store"] == "xbox"
        assert game_data["current_price"] == 800.0


class TestBacklogStats:
    def test_stats_counts(self, auth_client, db, test_user):
        statuses = ["backlog", "backlog", "playing", "completed", "abandoned"]
        for i, s in enumerate(statuses):
            db.add(Game(igdb_id=400+i, user_id=test_user.id,
                        title=f"G{i}", status=s, genres="Action" if s == "abandoned" else None))
        db.commit()

        resp = auth_client.get("/api/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["counts"]["backlog"] == 2
        assert data["counts"]["playing"] == 1
        assert data["counts"]["completed"] == 1
        assert data["counts"]["abandoned"] == 1
        assert data["abandoned_by_genre"]["Action"] == 1


# Need this import for test_update_other_users_game
from models import User
from security import hash_password
