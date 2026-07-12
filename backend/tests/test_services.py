"""
P1 — Tests unitarios de services (ITAD, Nintendo, HLTB, prices_hub).
Cobertura: parsing de precios, moneda ARS, descuentos, edge cases.
"""
import pytest
from unittest.mock import patch, AsyncMock, MagicMock

from services.itad import get_prices, lookup_id, _store_key, ITADError
from services.nintendo import get_eshop_price, extract_nsuid
from services.hltb import get_duration
from services.prices_hub import get_game_prices


class TestITADStoreKey:
    def test_steam(self):
        assert _store_key("Steam") == "steam"
        assert _store_key("steam store") == "steam"

    def test_xbox(self):
        assert _store_key("Xbox Store") == "xbox"
        assert _store_key("Microsoft Store") == "xbox"

    def test_nintendo(self):
        assert _store_key("Nintendo eShop") == "eshop"
        assert _store_key("Nintendo") == "eshop"

    def test_unknown_returns_none(self):
        assert _store_key("GOG") is None
        assert _store_key("Epic Games") is None
        assert _store_key("") is None
        assert _store_key(None) is None


class TestITADGetPrices:
    @patch("services.itad.API_KEY", "test-key")
    @patch("services.itad.lookup_id", new_callable=AsyncMock)
    @patch("services.itad._prices_by_id", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_parses_deals_correctly(self, mock_prices, mock_lookup):
        mock_lookup.return_value = "game-uuid-123"
        mock_prices.return_value = [
            {
                "shop": {"name": "Steam"},
                "price": {"amount": 3705.37, "currency": "ARS"},
                "regular": {"amount": 7425.62},
                "cut": 50,
                "storeLow": {"amount": 3472.8},
                "url": "https://store.steampowered.com/app/123",
            },
            {
                "shop": {"name": "Xbox Store"},
                "price": {"amount": 4000.0, "currency": "ARS"},
                "regular": {"amount": 8000.0},
                "cut": 50,
                "storeLow": {"amount": 3800.0},
                "url": "https://xbox.com/game/123",
            },
        ]

        result = await get_prices("The Witcher 3")

        assert "steam" in result
        assert result["steam"]["current"] == 3705.37
        assert result["steam"]["lowest"] == 3472.8
        assert result["steam"]["currency"] == "ARS"
        assert result["steam"]["cut"] == 50
        assert "xbox" in result
        assert result["xbox"]["current"] == 4000.0

    @patch("services.itad.API_KEY", "test-key")
    @patch("services.itad.lookup_id", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_game_not_found_returns_empty(self, mock_lookup):
        mock_lookup.return_value = None
        result = await get_prices("Nonexistent Game")
        assert result == {}

    @patch("services.itad.API_KEY", None)
    @pytest.mark.asyncio
    async def test_missing_api_key_raises(self):
        with pytest.raises(ITADError, match="Falta ITAD_API_KEY"):
            await get_prices("Any Game")

    @patch("services.itad.API_KEY", "test-key")
    @patch("services.itad.lookup_id", new_callable=AsyncMock)
    @patch("services.itad._prices_by_id", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_keeps_cheapest_per_store(self, mock_prices, mock_lookup):
        """Multiple deals from same store: keep the cheapest."""
        mock_lookup.return_value = "uuid"
        mock_prices.return_value = [
            {"shop": {"name": "Steam"}, "price": {"amount": 5000.0, "currency": "ARS"},
             "regular": {"amount": 10000.0}, "cut": 50, "storeLow": {"amount": 4000.0}, "url": ""},
            {"shop": {"name": "Steam"}, "price": {"amount": 3000.0, "currency": "ARS"},
             "regular": {"amount": 10000.0}, "cut": 70, "storeLow": {"amount": 2500.0}, "url": ""},
        ]

        result = await get_prices("Some Game")
        assert result["steam"]["current"] == 3000.0

    @patch("services.itad.API_KEY", "test-key")
    @patch("services.itad.lookup_id", new_callable=AsyncMock)
    @patch("services.itad._prices_by_id", new_callable=AsyncMock)
    @pytest.mark.asyncio
    async def test_ignores_unknown_stores(self, mock_prices, mock_lookup):
        mock_lookup.return_value = "uuid"
        mock_prices.return_value = [
            {"shop": {"name": "GOG"}, "price": {"amount": 100.0, "currency": "USD"},
             "regular": {"amount": 200.0}, "cut": 50, "storeLow": {"amount": 80.0}, "url": ""},
        ]
        result = await get_prices("GOG Only Game")
        assert result == {}


def _mock_aiohttp_json(response_data):
    """Helper: mock aiohttp ClientSession for JSON API calls (get → async ctx → .json())."""
    mock_resp = MagicMock()
    mock_resp.status = 200

    async def _json():
        return response_data
    mock_resp.json = _json

    mock_get_ctx = MagicMock()
    mock_get_ctx.__aenter__ = AsyncMock(return_value=mock_resp)
    mock_get_ctx.__aexit__ = AsyncMock(return_value=False)

    mock_session = MagicMock()
    mock_session.get.return_value = mock_get_ctx

    mock_session_ctx = MagicMock()
    mock_session_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_ctx.__aexit__ = AsyncMock(return_value=False)
    return mock_session_ctx


def _mock_aiohttp_text(text, status=200):
    """Helper: mock aiohttp ClientSession for text scraping (get → async ctx → .text())."""
    mock_resp = MagicMock()
    mock_resp.status = status

    async def _text():
        return text
    mock_resp.text = _text

    mock_get_ctx = MagicMock()
    mock_get_ctx.__aenter__ = AsyncMock(return_value=mock_resp)
    mock_get_ctx.__aexit__ = AsyncMock(return_value=False)

    mock_session = MagicMock()
    mock_session.get.return_value = mock_get_ctx

    mock_session_ctx = MagicMock()
    mock_session_ctx.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session_ctx.__aexit__ = AsyncMock(return_value=False)
    return mock_session_ctx


class TestNintendoEshopPrice:
    @pytest.mark.asyncio
    async def test_regular_price_no_discount(self):
        mock_response = {
            "prices": [{
                "title_id": 70010000000000,
                "sales_status": "onsale",
                "regular_price": {"amount": "$ 2000,00", "currency": "ARS", "raw_value": "2000.00"},
            }]
        }
        with patch("services.nintendo.aiohttp.ClientSession", return_value=_mock_aiohttp_json(mock_response)):
            result = await get_eshop_price("70010000000000")

        assert result is not None
        assert result["current"] == 2000.0
        assert result["regular"] == 2000.0
        assert result["cut"] == 0
        assert result["currency"] == "ARS"
        assert result["lowest"] is None

    @pytest.mark.asyncio
    async def test_with_discount(self):
        mock_response = {
            "prices": [{
                "title_id": 70010000000000,
                "sales_status": "onsale",
                "regular_price": {"amount": "$ 1000,00", "currency": "ARS", "raw_value": "1000.00"},
                "discount_price": {"amount": "$ 750,00", "currency": "ARS", "raw_value": "750.00",
                                   "start_datetime": "2023-01-01T00:00:00Z",
                                   "end_datetime": "2023-01-15T00:00:00Z"},
            }]
        }
        with patch("services.nintendo.aiohttp.ClientSession", return_value=_mock_aiohttp_json(mock_response)):
            result = await get_eshop_price("70010000000000")

        assert result["current"] == 750.0
        assert result["regular"] == 1000.0
        assert result["cut"] == 25

    @pytest.mark.asyncio
    async def test_not_found(self):
        mock_response = {"prices": [{"title_id": 70010000000000, "sales_status": "not_found"}]}
        with patch("services.nintendo.aiohttp.ClientSession", return_value=_mock_aiohttp_json(mock_response)):
            result = await get_eshop_price("70010000000000")
        assert result is None

    @pytest.mark.asyncio
    async def test_empty_prices(self):
        mock_response = {"prices": []}
        with patch("services.nintendo.aiohttp.ClientSession", return_value=_mock_aiohttp_json(mock_response)):
            result = await get_eshop_price("70010000000000")
        assert result is None


class TestNintendoExtractNsuid:
    @pytest.mark.asyncio
    async def test_extracts_most_common_nsuid(self):
        html = """
        <html><body>
        data-nsuid="70010000007708" data-nsuid="70010000007708"
        data-nsuid="70010000007708" other="70010000099999"
        </body></html>
        """
        with patch("services.nintendo.aiohttp.ClientSession", return_value=_mock_aiohttp_text(html)):
            result = await extract_nsuid("https://www.nintendo.com/us/store/products/hollow-knight-switch/")

        assert result == "70010000007708"

    @pytest.mark.asyncio
    async def test_no_nsuid_found(self):
        html = "<html><body>No game data here</body></html>"
        with patch("services.nintendo.aiohttp.ClientSession", return_value=_mock_aiohttp_text(html)):
            result = await extract_nsuid("https://www.nintendo.com/us/store/products/nothing/")
        assert result is None

    @pytest.mark.asyncio
    async def test_http_error_returns_none(self):
        with patch("services.nintendo.aiohttp.ClientSession", return_value=_mock_aiohttp_text("", status=404)):
            result = await extract_nsuid("https://www.nintendo.com/us/store/products/deleted/")
        assert result is None


class TestHLTB:
    @pytest.mark.asyncio
    @patch("services.hltb.HowLongToBeat")
    async def test_returns_duration(self, MockHLTB):
        mock_result = MagicMock()
        mock_result.main_story = 12.5
        mock_result.completionist = 45.0
        mock_result.similarity = 0.95

        mock_instance = MockHLTB.return_value
        mock_instance.async_search = AsyncMock(return_value=[mock_result])

        result = await get_duration("Hollow Knight")
        assert result["main"] == 12.5
        assert result["completionist"] == 45.0

    @pytest.mark.asyncio
    @patch("services.hltb.HowLongToBeat")
    async def test_no_results_returns_none(self, MockHLTB):
        mock_instance = MockHLTB.return_value
        mock_instance.async_search = AsyncMock(return_value=[])

        result = await get_duration("Obscure Indie Game")
        assert result["main"] is None
        assert result["completionist"] is None

    @pytest.mark.asyncio
    @patch("services.hltb.HowLongToBeat")
    async def test_timeout_returns_none(self, MockHLTB):
        mock_instance = MockHLTB.return_value
        mock_instance.async_search = AsyncMock(side_effect=Exception("timeout"))

        result = await get_duration("Slow Game")
        assert result["main"] is None
        assert result["completionist"] is None

    @pytest.mark.asyncio
    @patch("services.hltb.HowLongToBeat")
    async def test_picks_best_similarity(self, MockHLTB):
        results = [
            MagicMock(main_story=10.0, completionist=30.0, similarity=0.5),
            MagicMock(main_story=25.0, completionist=80.0, similarity=0.98),
            MagicMock(main_story=15.0, completionist=40.0, similarity=0.7),
        ]
        mock_instance = MockHLTB.return_value
        mock_instance.async_search = AsyncMock(return_value=results)

        result = await get_duration("Ambiguous Title")
        assert result["main"] == 25.0
        assert result["completionist"] == 80.0


class TestPricesHub:
    @pytest.mark.asyncio
    @patch("services.prices_hub.itad.get_prices", new_callable=AsyncMock)
    @patch("services.prices_hub.nintendo.get_eshop_price", new_callable=AsyncMock)
    async def test_combines_itad_and_nintendo(self, mock_nintendo, mock_itad):
        mock_itad.return_value = {
            "steam": {"current": 2000.0, "lowest": 1500.0, "currency": "ARS"},
            "xbox": {"current": 2500.0, "lowest": 2000.0, "currency": "ARS"},
        }
        mock_nintendo.return_value = {
            "current": 1800.0, "currency": "ARS", "cut": 10, "regular": 2000.0, "lowest": None
        }

        game = MagicMock()
        game.title = "Zelda TOTK"
        game.eshop_nsuid = "70010000007709"

        result = await get_game_prices(game)

        assert "steam" in result
        assert "xbox" in result
        assert "eshop" in result
        assert result["eshop"]["current"] == 1800.0

    @pytest.mark.asyncio
    @patch("services.prices_hub.itad.get_prices", new_callable=AsyncMock)
    async def test_no_nsuid_skips_nintendo(self, mock_itad):
        mock_itad.return_value = {"steam": {"current": 1000.0}}

        game = MagicMock()
        game.title = "PC Only Game"
        game.eshop_nsuid = None

        result = await get_game_prices(game)
        assert "steam" in result
        assert "eshop" not in result

    @pytest.mark.asyncio
    @patch("services.prices_hub.itad.get_prices", new_callable=AsyncMock)
    async def test_itad_failure_returns_empty(self, mock_itad):
        mock_itad.side_effect = Exception("API down")

        game = MagicMock()
        game.title = "Game"
        game.eshop_nsuid = None

        result = await get_game_prices(game)
        assert result == {}

    @pytest.mark.asyncio
    @patch("services.prices_hub.itad.get_prices", new_callable=AsyncMock)
    @patch("services.prices_hub.nintendo.get_eshop_price", new_callable=AsyncMock)
    async def test_nintendo_failure_keeps_itad(self, mock_nintendo, mock_itad):
        mock_itad.return_value = {"steam": {"current": 500.0}}
        mock_nintendo.side_effect = Exception("Nintendo down")

        game = MagicMock()
        game.title = "Game"
        game.eshop_nsuid = "70010000001234"

        result = await get_game_prices(game)
        assert "steam" in result
        assert "eshop" not in result
