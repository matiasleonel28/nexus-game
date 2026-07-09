from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os   
import aiohttp  
import asyncio
from datetime import datetime
from services.igdb import _get_token as _get_igdb_token 
from database import get_db
from models import Game, Platform, Price, User
from schemas import AddGameRequest, GameResponse, UpdateStatusRequest
from services.igdb import search_igdb
from services.hltb import get_duration
from services.prices import get_price
from routers.auth import get_current_user

router = APIRouter()

# Estados de la biblioteca (juegos que tenés), separados de la wishlist.
LIBRARY_STATUSES = ["pendiente", "jugando", "completado", "abandonado"]

@router.get("/backlog", response_model=list[GameResponse])
def get_backlog(
    sort:     str  = "duration_asc",
    coop:     bool = False,
    status:   str | None = None,   # filtra por un estado puntual (pendiente/jugando/...)
    platform: str | None = None,   # filtra por plataforma propia (pc/switch2/xbox/ps5)
    db:       Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Devuelve los juegos de tu biblioteca (todos los estados salvo wishlist).
    El ordenamiento y el filtrado los hace el backend, no el frontend.
    """
    query = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.status.in_(LIBRARY_STATUSES),
    )

    if status:
        query = query.filter(Game.status == status)
    if platform:
        query = query.filter(Game.owned_platform == platform)
    if coop:
        query = query.filter(Game.has_coop == True)

    games = query.all()

    # Ordenamiento en Python (más flexible que en SQL para $/hora)
    def sort_key(g):
        price = g.prices[0].current_price if g.prices else 999
        hours = g.hltb_main_hours or 999

        if sort == "duration_asc":   return hours
        if sort == "duration_desc":  return -hours
        if sort == "price_asc":      return price
        if sort == "value_asc":      return price / hours   # $/hora

        return hours  # default

    games.sort(key=sort_key)

    return [_to_response(g) for g in games]


async def _add_game_to_db(igdb_id: int, status: str, db: Session, current_user: User,
                          owned_platform: str | None = None) -> Game:
    """Función compartida interna para agregar juegos en un estado específico"""
    # Si ya existe en DB, solo cambia el estado (y la plataforma si vino)
    existing = db.query(Game).filter(Game.igdb_id == igdb_id, Game.user_id == current_user.id).first()
    if existing:
        existing.status = status
        if owned_platform is not None:
            existing.owned_platform = owned_platform
        db.commit()
        return existing

    # Buscar en IGDB por ID exacto (no por texto)
    token = await _get_igdb_token()
    headers = {
        "Client-ID": os.getenv("IGDB_CLIENT_ID"),
        "Authorization": f"Bearer {token}",
    }
    igdb_body = f"""
        fields name, cover.url, platforms.name,
               first_release_date, game_modes.name,
               multiplayer_modes.*;
        where id = {igdb_id};
    """

    async with aiohttp.ClientSession() as session:
        async with session.post(
            "https://api.igdb.com/v4/games",
            headers=headers,
            data=igdb_body
        ) as r:
            results = await r.json()

    if not results:
        raise HTTPException(status_code=404, detail="Juego no encontrado en IGDB")

    g = results[0]

    PLATFORM_MAP = {6: "PC", 48: "PS4", 167: "PS5", 130: "Switch"}
    platforms = [
        PLATFORM_MAP[p["id"]]
        for p in g.get("platforms", [])
        if p["id"] in PLATFORM_MAP
    ]

    duration, price_data = await asyncio.gather(
        get_duration(g["name"]),
        get_price(g["name"]),
    )

    game = Game(
        igdb_id=                  g["id"],
        user_id=                  current_user.id,
        title=                    g["name"],
        cover_url=                g.get("cover", {}).get("url"),
        owned_platform=           owned_platform,
        has_coop=                 False,
        hltb_main_hours=          duration["main"],
        hltb_completionist_hours= duration["completionist"],
        status=                   status,
        release_date=             datetime.fromtimestamp(g["first_release_date"]) if g.get("first_release_date") else None,
    )
    db.add(game)
    db.flush()

    for p in platforms:
        db.add(Platform(game_id=game.id, platform_name=p))

    if price_data["current"]:
        db.add(Price(
            game_id=       game.id,
            store_name=    price_data["store"],
            current_price= price_data["current"],
            lowest_price=  price_data["lowest"],
        ))

    db.commit()
    db.refresh(game)
    return game

@router.post("/backlog", response_model=GameResponse)
async def add_to_backlog(
    body: AddGameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Al agregar a la biblioteca el estado inicial es "pendiente"
    game = await _add_game_to_db(body.igdb_id, "pendiente", db, current_user,
                                 owned_platform=body.owned_platform)
    return _to_response(game)

@router.patch("/games/{game_id}", response_model=GameResponse)
def update_game(
    game_id: int,
    body: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(Game).filter(Game.id == game_id, Game.user_id == current_user.id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")
    # Se actualiza solo lo que venga en el body
    if body.status is not None:
        game.status = body.status
    if body.owned_platform is not None:
        game.owned_platform = body.owned_platform
    if body.target_price is not None:
        game.target_price = body.target_price
    if body.watch_store is not None:
        game.watch_store = body.watch_store
    db.commit()
    return _to_response(game)


@router.delete("/games/{game_id}")
def delete_game(
    game_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(Game).filter(Game.id == game_id, Game.user_id == current_user.id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")
    db.delete(game)
    db.commit()
    return {"ok": True}


# Helper interno — convierte el objeto SQLAlchemy al schema de respuesta
def _to_response(game: Game) -> GameResponse:
    price = game.prices[0] if game.prices else None
    return GameResponse(
        id=                       game.id,
        igdb_id=                  game.igdb_id,
        title=                    game.title,
        cover_url=                game.cover_url,
        platforms=                [p.platform_name for p in game.platforms],
        status=                   game.status,
        owned_platform=           game.owned_platform,
        target_price=             game.target_price,
        watch_store=              game.watch_store,
        hltb_main_hours=          game.hltb_main_hours,
        hltb_completionist_hours= game.hltb_completionist_hours,
        current_price=            price.current_price if price else None,
        lowest_price=             price.lowest_price  if price else None,
        price_store=              price.store_name    if price else None,
        has_coop=                 game.has_coop,
        release_date=             game.release_date,
    )