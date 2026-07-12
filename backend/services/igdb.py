import aiohttp
import os
import time
import asyncio
from dotenv import load_dotenv
from security import _require_secret

load_dotenv()

CLIENT_ID     = _require_secret("IGDB_CLIENT_ID", "dev_igdb_client_id")
CLIENT_SECRET = _require_secret("IGDB_CLIENT_SECRET", "dev_igdb_client_secret")

# Timeout estándar para todas las llamadas a IGDB / Twitch
_TIMEOUT = aiohttp.ClientTimeout(total=10)

# IDs de plataformas en IGDB -> nuestro label interno
PLATFORM_MAP = {
    6:   "PC",
    48:  "PS4",
    167: "PS5",
    130: "Switch",
    508: "Switch 2",
    49:  "Xbox One",
    169: "Xbox Series",
}

# Solo mostramos juegos que salieron en alguna de estas plataformas
PLATFORM_IDS = tuple(PLATFORM_MAP.keys())

# ── Caché del token Twitch ────────────────────────────────────────────────────
# El token de Twitch dura ~60 días. Lo cacheamos en memoria y lo renovamos
# solo cuando está a menos de 60 segundos de expirar.
_token_cache: dict = {"token": None, "expires_at": 0.0}


async def _get_token() -> str:
    """
    Devuelve un token OAuth2 de Twitch válido.
    Lo renueva solo cuando expiró (caché en memoria).
    """
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type":    "client_credentials",
    }
    async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
        async with session.post(url, params=params) as r:
            if r.status != 200:
                raise RuntimeError(f"Error obteniendo token Twitch: HTTP {r.status}")
            data = await r.json()

    _token_cache["token"]      = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600)
    return _token_cache["token"]


def _build_headers(token: str) -> dict:
    return {
        "Client-ID":     CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }


# ── Búsqueda de juegos ────────────────────────────────────────────────────────

async def search_igdb(query: str) -> list[dict]:
    token   = await _get_token()
    headers = _build_headers(token)

    platform_filter = ",".join(str(pid) for pid in PLATFORM_IDS)
    body = f"""
        fields name, cover.url, platforms.name, genres.name,
               first_release_date, game_modes.name,
               multiplayer_modes.*;
        search "{query}";
        where platforms = ({platform_filter});
        limit 12;
    """

    COOP_MODE_ID = 3   # game_modes: 1=Single, 2=Multi, 3=Coop, 4=Split, 6=Online

    async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
        async with session.post(
            "https://api.igdb.com/v4/games",
            headers=headers,
            data=body
        ) as r:
            if r.status != 200:
                raise RuntimeError(f"IGDB search error: HTTP {r.status}")
            games = await r.json()

    results = []
    for g in games:
        platforms = sorted(set(
            PLATFORM_MAP[p["id"]]
            for p in g.get("platforms", [])
            if p["id"] in PLATFORM_MAP
        ))

        mode_ids = [m["id"] for m in g.get("game_modes", [])]
        has_coop = COOP_MODE_ID in mode_ids

        cover_url = g.get("cover", {}).get("url")   # viene como //images.igdb.com/...

        results.append({
            "igdb_id":      g["id"],
            "title":        g["name"],
            "cover_url":    cover_url,
            "platforms":    platforms,
            "has_coop":     has_coop,
            "release_date": g.get("first_release_date"),  # UNIX timestamp
        })

    return results


# ── Lookup por ID (usado en add_to_backlog) ───────────────────────────────────

async def get_game_by_id(igdb_id: int) -> dict | None:
    """
    Obtiene los datos completos de un juego por su IGDB ID.
    Devuelve el dict crudo de IGDB o None si no lo encuentra.
    Centraliza aquí la lógica de llamada para que backlog.py no construya
    headers IGDB directamente.
    """
    token   = await _get_token()
    headers = _build_headers(token)

    body = f"""
        fields name, cover.url, platforms.name, genres.name,
               first_release_date, game_modes.name,
               multiplayer_modes.*;
        where id = {igdb_id};
    """

    async with aiohttp.ClientSession(timeout=_TIMEOUT) as session:
        async with session.post(
            "https://api.igdb.com/v4/games",
            headers=headers,
            data=body
        ) as r:
            if r.status != 200:
                return None
            results = await r.json()

    if not isinstance(results, list) or len(results) == 0:
        return None
    return results[0]