from howlongtobeatpy import HowLongToBeat

# Esta librería hace scraping de HLTB (no hay API oficial)
# Devuelve None si no encuentra el juego o si HLTB no tiene el dato

async def get_duration(title: str) -> dict:
    results = await HowLongToBeat().async_search(title)

    if not results:
        return {"main": None, "completionist": None}

    # Toma el resultado con mayor similitud al título buscado
    best = max(results, key=lambda r: r.similarity)

    return {
        "main":          best.main_story,       # horas de historia principal
        "completionist": best.completionist,    # horas para el 100%
    }