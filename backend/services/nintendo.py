"""
Adaptador de precios de Nintendo eShop (ARS) para el Hunter.

ITAD casi no cubre eShop, así que para Nintendo usamos la API de precios propia
de Nintendo (gratis, sin key, estable): country=AR devuelve pesos nativos.

El único dato frágil es el nsuid de la región Américas (US). Se obtiene una vez
por juego con `extract_nsuid(url)` (scrape puntual de la página de producto del
eShop de EE.UU.) y se cachea en el juego. Ver specs/05-nintendo-integration.md.
"""
import re
from collections import Counter
import aiohttp

PRICE_API = "https://api.ec.nintendo.com/v1/price"

# nsuid: 14 dígitos que empiezan con 70 (Switch 7001..., Switch 2 7007..., etc.)
_NSUID_RE = re.compile(r"\b70\d{12}\b")
_HEADERS = {"User-Agent": "Mozilla/5.0"}


async def extract_nsuid(url: str) -> str | None:
    """
    Extrae el nsuid del juego desde su página de producto del eShop US.
    Heurística robusta: el nsuid del propio juego es, por lejos, el número
    14-dígitos que más se repite en la página (validado: en BOTW aparece 157
    veces vs. 13 del siguiente).
    """
    async with aiohttp.ClientSession(headers=_HEADERS) as session:
        async with session.get(url) as r:
            if r.status != 200:
                return None
            html = await r.text()

    found = _NSUID_RE.findall(html)
    if not found:
        return None
    return Counter(found).most_common(1)[0][0]


async def get_eshop_price(nsuid: str, country: str = "AR", lang: str = "es") -> dict | None:
    """
    Precio actual del eShop para un nsuid, en la moneda del país (AR -> ARS).
    Devuelve {current, currency, cut, regular, lowest} o None si no hay precio.
    `lowest` viene None: el mínimo histórico del eShop se auto-construye con
    price_history (Nintendo no lo provee).
    """
    params = {"country": country, "lang": lang, "ids": nsuid}
    async with aiohttp.ClientSession() as session:
        async with session.get(PRICE_API, params=params) as r:
            data = await r.json()

    prices = data.get("prices") or []
    if not prices:
        return None
    p = prices[0]
    if p.get("sales_status") in (None, "not_found"):
        return None

    reg = p.get("regular_price") or {}
    disc = p.get("discount_price")   # presente solo si está en oferta

    def _amount(block):
        raw = (block or {}).get("raw_value")
        try:
            return float(raw) if raw is not None else None
        except (TypeError, ValueError):
            return None

    regular = _amount(reg)
    if disc:
        current = _amount(disc)
        cut = round((1 - current / regular) * 100) if (current and regular) else None
    else:
        current = regular
        cut = 0

    return {
        "current":  current,
        "currency": reg.get("currency", "ARS"),
        "cut":      cut,
        "regular":  regular,
        "lowest":   None,
    }
