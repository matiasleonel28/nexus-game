from fastapi import APIRouter, Depends
from schemas import SearchResult
from services.igdb import search_igdb
from datetime import datetime
from models import User
from routers.auth import get_current_user

router = APIRouter()

@router.get("/search", response_model=list[SearchResult])
async def search(q: str, current_user: User = Depends(get_current_user)):
    """
    Busca juegos en IGDB y devuelve los resultados.
    El frontend muestra esto sin guardar nada todavía.
    """
    raw = await search_igdb(q)

    results = []
    for g in raw:
        # IGDB manda el release_date como UNIX timestamp
        rd = None
        if g.get("release_date"):
            rd = datetime.fromtimestamp(g["release_date"])

        results.append(SearchResult(
            igdb_id=      g["igdb_id"],
            title=        g["title"],
            cover_url=    g["cover_url"],
            platforms=    g["platforms"],
            has_coop=     g["has_coop"],
            release_date= rd,
        ))

    return results