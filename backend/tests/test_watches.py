"""
P0 — Tests del evaluador de vigilancias (watches.py).
Cobertura: target_reached, historical_low, dedup de alertas, edge cases.
"""
import pytest
from unittest.mock import patch, AsyncMock
from datetime import datetime, timezone

from models import Game, Alert, User, Price
from security import hash_password
from services.watches import evaluate_watches


@pytest.fixture()
def watched_game(db):
    """Game with target_price set (being watched)."""
    user = User(email="watcher@test.com", password_hash=hash_password("pass"))
    db.add(user)
    db.flush()

    game = Game(
        igdb_id=9999,
        user_id=user.id,
        title="Celeste",
        status="wishlist",
        target_price=500.0,
        watch_store="steam",
    )
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@pytest.mark.asyncio
class TestEvaluateWatches:
    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_target_reached_creates_alert(self, mock_prices, db, watched_game):
        mock_prices.return_value = {
            "steam": {"current": 400.0, "lowest": 350.0}
        }
        alerts = await evaluate_watches(db)

        assert len(alerts) == 1
        assert alerts[0].alert_type == "target_reached"
        assert alerts[0].price == 400.0
        assert alerts[0].store == "steam"
        assert alerts[0].game_id == watched_game.id

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_target_exactly_equal(self, mock_prices, db, watched_game):
        """Price == target should trigger."""
        mock_prices.return_value = {
            "steam": {"current": 500.0, "lowest": 600.0}
        }
        alerts = await evaluate_watches(db)
        assert len(alerts) == 1
        assert alerts[0].alert_type == "target_reached"

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_historical_low_creates_alert(self, mock_prices, db, watched_game):
        """Price at historical low (but above target) triggers historical_low."""
        watched_game.target_price = 200.0  # Target very low, won't trigger
        db.commit()

        mock_prices.return_value = {
            "steam": {"current": 350.0, "lowest": 350.0}
        }
        alerts = await evaluate_watches(db)
        assert len(alerts) == 1
        assert alerts[0].alert_type == "historical_low"

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_historical_low_with_tolerance(self, mock_prices, db, watched_game):
        """Price within 0.1% of lowest still triggers (the 1.001 factor)."""
        watched_game.target_price = 100.0  # Won't trigger target_reached
        db.commit()

        mock_prices.return_value = {
            "steam": {"current": 350.3, "lowest": 350.0}
        }
        alerts = await evaluate_watches(db)
        assert len(alerts) == 1
        assert alerts[0].alert_type == "historical_low"

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_price_above_target_no_alert(self, mock_prices, db, watched_game):
        mock_prices.return_value = {
            "steam": {"current": 700.0, "lowest": 600.0}
        }
        alerts = await evaluate_watches(db)
        assert len(alerts) == 0

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_no_duplicate_unread_alerts(self, mock_prices, db, watched_game):
        """If an unread alert already exists for the same game/store/type, skip."""
        mock_prices.return_value = {
            "steam": {"current": 400.0, "lowest": 350.0}
        }
        # First evaluation creates alert
        await evaluate_watches(db)
        # Second evaluation should NOT create duplicate
        alerts = await evaluate_watches(db)
        assert len(alerts) == 0

        total = db.query(Alert).filter(Alert.game_id == watched_game.id).count()
        assert total == 1

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_creates_new_alert_after_read(self, mock_prices, db, watched_game):
        """Once the user reads the alert, a new one can be created."""
        mock_prices.return_value = {
            "steam": {"current": 400.0, "lowest": 350.0}
        }
        await evaluate_watches(db)

        # Mark as read
        alert = db.query(Alert).first()
        alert.is_read = True
        db.commit()

        # Now should create a new alert
        alerts = await evaluate_watches(db)
        assert len(alerts) == 1

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_api_error_skips_game(self, mock_prices, db, watched_game):
        """Network error doesn't crash the evaluator."""
        mock_prices.side_effect = Exception("Network timeout")
        alerts = await evaluate_watches(db)
        assert len(alerts) == 0

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_no_price_data_skips(self, mock_prices, db, watched_game):
        """Store not found in response skips the game."""
        mock_prices.return_value = {"xbox": {"current": 400.0, "lowest": 300.0}}
        alerts = await evaluate_watches(db)
        assert len(alerts) == 0

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_current_price_none_skips(self, mock_prices, db, watched_game):
        mock_prices.return_value = {"steam": {"current": None, "lowest": 300.0}}
        alerts = await evaluate_watches(db)
        assert len(alerts) == 0

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_default_store_is_steam(self, mock_prices, db, watched_game):
        """When watch_store is None, defaults to 'steam'."""
        watched_game.watch_store = None
        db.commit()

        mock_prices.return_value = {
            "steam": {"current": 300.0, "lowest": 350.0}
        }
        alerts = await evaluate_watches(db)
        assert len(alerts) == 1
        assert alerts[0].store == "steam"

    @patch("services.watches.get_game_prices", new_callable=AsyncMock)
    async def test_target_reached_takes_priority(self, mock_prices, db, watched_game):
        """When both conditions are true, target_reached wins (checked first)."""
        mock_prices.return_value = {
            "steam": {"current": 300.0, "lowest": 300.0}
        }
        alerts = await evaluate_watches(db)
        assert len(alerts) == 1
        assert alerts[0].alert_type == "target_reached"
