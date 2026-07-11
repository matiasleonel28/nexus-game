"""
Adaptador de IsThereAnyDeal (ITAD) — fuente de precios del módulo Hunter.

Cubre Steam + Nintendo eShop + Xbox en una sola API, con precios en la moneda
de la región (country=AR -> ARS). Reemplaza a CheapShark (que solo daba Steam/USD).

Requiere ITAD_API_KEY en el .env (gratis en https://isthereanydeal.com/apps/new/).

NOTA: escrito contra la API v2 documentada. Las formas exactas de respuesta se
verifican/ajustan la primera vez que corre con una key real (ver /api/hunter/raw).
"""
import os
import aiohttp
from dotenv import load_dotenv

load_dotenv()

API_KEY  = os.getenv("ITAD_API_KEY")
BASE     = "https://api.isthereanydeal.com"
COUNTRY  = os.getenv("ITAD_COUNTRY", "AR")   # AR -> precios en ARS

# Timeout para todas las llamadas a ITAD
_TIMEOUT = aiohttp.ClientTimeout(total=10)


# Mapea el nombre de tienda que devuelve ITAD -> nuestras claves internas.
# Solo nos interesan estas tres (PS5 queda fuera del Hunter a propósito).
def _store_key(shop_name: str) -> str | None:
    n = (shop_name or "").lower()
    if "steam" in n:
        return "steam"
    if "nintendo" in n or "eshop" in n:
        return "eshop"
    if "xbox" in n or "microsoft" in n:
        return "xbox"
    return None


class ITADError(RuntimeError):
    pass


def _require_key():
    if not API_KEY:
        raise ITADError("Falta ITAD_API_KEY en el .env (https://isthereanydeal.com/apps/new/)")


async def lookup_id(title: str) -> str | None:
    """Devuelve el UUID interno de ITAD para un título, o None si no lo encuentra."""
    _require_key()
    url = f"{BASE}/games/lookup/v1"
    params = {"key": API_KEY, "title": title}
    async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
        async with session.get(url, params=params) as r:
            data = await r.json()
    if data and data.get("found"):
        return data.get("game", {}).get("id")
    return None


async def _prices_by_id(game_id: str) -> list[dict]:
    """Ofertas actuales por tienda para un UUID de ITAD (incluye no-ofertas)."""
    url = f"{BASE}/games/prices/v2"
    params = {"key": API_KEY, "country": COUNTRY, "nondeals": "true", "vouchers": "false"}
    async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
        async with session.post(url, params=params, json=[game_id]) as r:
            data = await r.json()
    if not data:
        return []
    return data[0].get("deals", []) if isinstance(data, list) else []


async def _history_lows_by_id(game_id: str) -> list[dict]:
    """Mínimo histórico por tienda para un UUID de ITAD."""
    url = f"{BASE}/games/storelow/v2"
    params = {"key": API_KEY, "country": COUNTRY}
    async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
        async with session.post(url, params=params, json=[game_id]) as r:
            data = await r.json()
    if not data:
        return []
    return data[0].get("lows", []) if isinstance(data, list) else []


async def get_prices(title: str) -> dict:
    """
    Precio actual + mínimo histórico por tienda (steam/eshop/xbox), en ARS.

    Cada oferta de ITAD ya trae `storeLow` (mínimo histórico en esa tienda)
    inline, así que alcanza con una sola llamada. Si hay varias ofertas para la
    misma tienda, nos quedamos con la más barata.

    Devuelve:
    {
      "steam": {"current": 3705.37, "lowest": 3472.8, "cut": 50,
                "regular": 7425.62, "currency": "ARS", "url": "..."},
      "eshop": {...},
      "xbox":  {...},
    }
    Las tiendas sin datos simplemente no aparecen.
    """
    _require_key()
    game_id = await lookup_id(title)
    if not game_id:
        return {}

    deals = await _prices_by_id(game_id)
    result: dict = {}

    for d in deals:
        key = _store_key(d.get("shop", {}).get("name", ""))
        if not key:
            continue
        price      = d.get("price") or {}
        store_low  = d.get("storeLow") or {}
        regular    = d.get("regular") or {}
        current    = price.get("amount")

        entry = {
            "current":  current,
            "currency": price.get("currency", "ARS"),
            "cut":      d.get("cut"),
            "regular":  regular.get("amount"),
            "lowest":   store_low.get("amount"),
            "url":      d.get("url"),
        }

        # si ya hay una oferta para esta tienda, quedarse con la más barata
        prev = result.get(key)
        if prev is None or (current is not None and prev.get("current") is not None
                            and current < prev["current"]):
            result[key] = entry

    return result


async def get_raw(title: str) -> dict:
    """Diagnóstico: devuelve las respuestas crudas para verificar/ajustar el parseo."""
    _require_key()
    game_id = await lookup_id(title)
    if not game_id:
        return {"found": False, "title": title}
    return {
        "found": True,
        "title": title,
        "itad_id": game_id,
        "deals": await _prices_by_id(game_id),
        "lows": await _history_lows_by_id(game_id),
    }
