import asyncio
from howlongtobeatpy import HowLongToBeat

# Esta librería hace scraping de HLTB (no hay API oficial).
# Timeout de 10s para que un scraping lento no cuelgue el add_to_backlog.

HLTB_TIMEOUT = 10  # segundos


async def get_duration(title: str) -> dict:
    """
    Busca la duración del juego en HowLongToBeat.
    Devuelve {main, completionist} en horas (float), o None si no se encuentra.
    """
    try:
        results = await asyncio.wait_for(
            HowLongToBeat().async_search(title),
            timeout=HLTB_TIMEOUT
        )
    except (asyncio.TimeoutError, Exception):
        # Si HLTB tarda demasiado o falla, el juego se agrega sin duración
        return {"main": None, "completionist": None}

    if not results:
        return {"main": None, "completionist": None}

    # Toma el resultado con mayor similitud al título buscado
    best = max(results, key=lambda r: r.similarity)

    return {
        "main":          best.main_story,       # horas de historia principal
        "completionist": best.completionist,    # horas para el 100%
    }