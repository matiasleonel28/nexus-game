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

@router.get("/backlog", response_model=list[GameResponse])
def get_backlog(
    sort:    str  = "duration_asc",
    coop:    bool = False,
    db:      Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Devuelve los juegos en backlog.
    El ordenamiento lo hace el backend, no el frontend.
    """
    query = db.query(Game).filter(Game.status == "backlog", Game.user_id == current_user.id)

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


async def _add_game_to_db(igdb_id: int, status: str, db: Session, current_user: User) -> Game:
    """Función compartida interna para agregar juegos en un estado específico"""
    # Si ya existe en DB, solo cambia el estado
    existing = db.query(Game).filter(Game.igdb_id == igdb_id, Game.user_id == current_user.id).first()
    if existing:
        existing.status = status
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
    game = await _add_game_to_db(body.igdb_id, "backlog", db, current_user)
    return _to_response(game)

@router.patch("/games/{game_id}", response_model=GameResponse)
def update_status(
    game_id: int, 
    body: UpdateStatusRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(Game).filter(Game.id == game_id, Game.user_id == current_user.id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")
    game.status = body.status
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
        hltb_main_hours=          game.hltb_main_hours,
        hltb_completionist_hours= game.hltb_completionist_hours,
        current_price=            price.current_price if price else None,
        lowest_price=             price.lowest_price  if price else None,
        price_store=              price.store_name    if price else None,
        has_coop=                 game.has_coop,
        release_date=             game.release_date,
    )