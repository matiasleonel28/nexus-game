import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID     = os.getenv("IGDB_CLIENT_ID")
CLIENT_SECRET = os.getenv("IGDB_CLIENT_SECRET")

# IGDB requiere un token de Twitch que expira
# En producción guardarías esto en cache/Redis, acá lo pedimos fresco
async def _get_token() -> str:
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id":     CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type":    "client_credentials",
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(url, params=params) as r:
            data = await r.json()
            return data["access_token"]


async def search_igdb(query: str) -> list[dict]:
    token = await _get_token()

    headers = {
        "Client-ID":     CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }

    # Apicalypse: lenguaje propio de IGDB para los queries
    body = f"""
        fields name, cover.url, platforms.name,
               first_release_date, game_modes.name,
               multiplayer_modes.*;
        search "{query}";
        limit 10;
    """

    # IDs de plataformas en IGDB (fijos, no cambian)
    PLATFORM_MAP = {
        6:   "PC",
        48:  "PS4",
        167: "PS5",
        130: "Switch",
        # Switch 2: verificar ID cuando salga oficialmente
    }

    COOP_MODE_ID = 3   # game_modes: 1=Single, 2=Multi, 3=Coop, 4=Split, 6=Online

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.igdb.com/v4/games",
            headers=headers,
            data=body
        ) as r:
            games = await r.json()

    results = []
    for g in games:
        platforms = [
            PLATFORM_MAP[p["id"]]
            for p in g.get("platforms", [])
            if p["id"] in PLATFORM_MAP
        ]

        mode_ids  = [m["id"] for m in g.get("game_modes", [])]
        has_coop  = COOP_MODE_ID in mode_ids

        cover_url = g.get("cover", {}).get("url")   # viene como //images.igdb.com/...

        results.append({
            "igdb_id":      g["id"],
            "title":        g["name"],
            "cover_url":    cover_url,
            "platforms":    platforms,
            "has_coop":     has_coop,
            "release_date": g.get("first_release_date"),  # viene en UNIX timestamp
        })

    return results