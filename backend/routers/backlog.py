from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import asyncio
from datetime import datetime
from collections import Counter

from database import get_db
from models import Game, Platform, Price, User
from schemas import AddGameRequest, GameResponse, UpdateGameRequest, BacklogStatsResponse
from routers.auth import get_current_user
from services.igdb import PLATFORM_MAP, get_game_by_id as igdb_get_game_by_id
from services.hltb import get_duration
from services import itad

router = APIRouter(tags=["Backlog"])

LIBRARY_STATUSES = ["backlog", "playing", "completed", "abandoned"]

PLATFORM_TO_STORE = {
    "pc": "steam", "pc_xbox": "xbox", "pc_other": "steam",
    "switch": "eshop", "switch2": "eshop", "xbox": "xbox", "ps5": None,
}


def _pick_best_price(game: Game) -> Price | None:
    if not game.prices:
        return None
    if len(game.prices) == 1:
        return game.prices[0]
    preferred = PLATFORM_TO_STORE.get(game.owned_platform)
    if preferred:
        for p in game.prices:
            if p.store_name == preferred:
                return p
    return min(game.prices, key=lambda p: p.current_price if p.current_price is not None else float("inf"))


def _to_response(game: Game) -> GameResponse:
    price = _pick_best_price(game)
    current = price.current_price if price else None

    hours = game.hours_played
    cost_per_hour = None
    if hours and hours > 0 and current is not None:
        cost_per_hour = round(current / hours, 2)

    enjoyment_per_hour = None
    if hours and hours > 0 and game.enjoyment is not None:
        enjoyment_per_hour = round(game.enjoyment / hours, 3)

    return GameResponse(
        id=game.id,
        igdb_id=game.igdb_id,
        title=game.title,
        cover_url=game.cover_url,
        platforms=[p.platform_name for p in game.platforms],
        status=game.status,
        genres=game.genres,
        owned_platform=game.owned_platform,
        target_price=game.target_price,
        watch_store=game.watch_store,
        eshop_nsuid=game.eshop_nsuid,
        hltb_main_hours=game.hltb_main_hours,
        hltb_completionist_hours=game.hltb_completionist_hours,
        current_price=current,
        lowest_price=price.lowest_price if price else None,
        price_store=price.store_name if price else None,
        price_currency=price.currency if price else None,
        has_coop=game.has_coop,
        has_crossplay=game.has_crossplay or False,
        hours_played=game.hours_played,
        enjoyment=game.enjoyment,
        cost_per_hour=cost_per_hour,
        enjoyment_per_hour=enjoyment_per_hour,
        release_date=game.release_date,
    )


from services.recommend import get_recommendation

@router.get("/recommend", response_model=list[GameResponse])
def recommend_games(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_recommendation(db, current_user)

@router.get("/stats", response_model=BacklogStatsResponse)
def get_backlog_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    games = db.query(Game).filter(Game.user_id == current_user.id).all()
    counts = {s: 0 for s in LIBRARY_STATUSES}
    abandoned_by_genre = Counter()

    for g in games:
        if g.status in counts:
            counts[g.status] += 1
        
        if g.status == "abandoned" and g.genres:
            for genre in g.genres.split(","):
                abandoned_by_genre[genre.strip()] += 1

    return BacklogStatsResponse(
        counts=counts,
        abandoned_by_genre=dict(abandoned_by_genre)
    )


@router.get("/backlog", response_model=list[GameResponse])
def get_backlog(
    sort:      str  = "duration_asc",
    coop:      bool = False,
    crossplay: bool = False,
    status:    str | None = None,
    platform:  str | None = None,
    db:       Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.status.in_(LIBRARY_STATUSES),
    )
    if status:
        query = query.filter(Game.status == status)
    if platform:
        query = query.filter(Game.owned_platform == platform)
    if coop:
        query = query.filter(Game.has_coop == True)  # noqa: E712
    if crossplay:
        query = query.filter(Game.has_crossplay == True)  # noqa: E712

    games = query.all()

    def sort_key(g):
        best  = _pick_best_price(g)
        price = best.current_price if best and best.current_price is not None else 999
        hours = g.hltb_main_hours or 999
        if sort == "duration_asc":   return hours
        if sort == "duration_desc":  return -hours
        if sort == "price_asc":      return price
        if sort == "value_asc":
            return price / hours if hours and hours > 0 else float("inf")
        if sort == "enjoyment_desc":
            return (0 if g.enjoyment else 1, -(g.enjoyment or 0))
        if sort == "added_desc":
            return -(g.created_at.timestamp() if g.created_at else 0)
        return hours

    games.sort(key=sort_key)
    return [_to_response(g) for g in games]


async def _add_game_to_db(igdb_id: int, status: str, db: Session, current_user: User,
                          owned_platform: str | None = None) -> Game:
    existing = db.query(Game).filter(Game.igdb_id == igdb_id, Game.user_id == current_user.id).first()
    if existing:
        if status == existing.status:
            raise HTTPException(
                status_code=409,
                detail=f"'{existing.title}' ya está en tu biblioteca."
            )
        existing.status = status
        if owned_platform is not None:
            existing.owned_platform = owned_platform
        db.commit()
        return existing

    # Obtener datos del juego de IGDB (centralizado en services/igdb.py)
    g = await igdb_get_game_by_id(igdb_id)
    if not g:
        raise HTTPException(status_code=404, detail="Juego no encontrado en IGDB")

    platforms = [
        PLATFORM_MAP[p["id"]]
        for p in g.get("platforms", [])
        if p["id"] in PLATFORM_MAP
    ]

    mode_ids = [m["id"] for m in g.get("game_modes", [])]
    has_coop = 3 in mode_ids  # game_modes: 3=Coop

    genre_names = [gn.get("name") for gn in g.get("genres", []) if gn.get("name")]
    genres_str = ",".join(genre_names) if genre_names else None

    duration, stores = await asyncio.gather(
        get_duration(g["name"]),
        itad.get_prices(g["name"]),
    )

    game = Game(
        igdb_id=g["id"],
        user_id=current_user.id,
        title=g["name"],
        cover_url=g.get("cover", {}).get("url"),
        owned_platform=owned_platform,
        has_coop=has_coop,
        genres=genres_str,
        hltb_main_hours=duration["main"],
        hltb_completionist_hours=duration["completionist"],
        status=status,
        release_date=datetime.fromtimestamp(g["first_release_date"]) if g.get("first_release_date") else None,
    )
    db.add(game)
    db.flush()

    for p in platforms:
        db.add(Platform(game_id=game.id, platform_name=p))

    for store_key, sd in (stores or {}).items():
        if sd.get("current") is not None:
            db.add(Price(
                game_id=game.id,
                store_name=store_key,
                current_price=sd["current"],
                lowest_price=sd.get("lowest"),
                currency=sd.get("currency", "USD"),
            ))

    db.commit()
    db.refresh(game)
    return game


@router.post("/backlog", response_model=GameResponse, status_code=201)
async def add_to_backlog(
    body: AddGameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = await _add_game_to_db(body.igdb_id, "backlog", db, current_user,
                                 owned_platform=body.owned_platform)
    return _to_response(game)


@router.patch("/games/{game_id}", response_model=GameResponse)
def update_game(
    game_id: int,
    body: UpdateGameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(Game).filter(Game.id == game_id, Game.user_id == current_user.id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado en tu biblioteca")
    update_data = body.model_dump(exclude_unset=True)

    if "hours_played" in update_data:
        h = update_data["hours_played"]
        if h is not None and h < 0.1:
            raise HTTPException(status_code=422, detail="Ingresá al menos 0.1 horas")
    if "enjoyment" in update_data:
        e = update_data["enjoyment"]
        if e is not None and (e < 1 or e > 5):
            raise HTTPException(status_code=422, detail="El disfrute debe ser entre 1 y 5")

    for key, value in update_data.items():
        setattr(game, key, value)
    db.commit()
    db.refresh(game)
    return _to_response(game)


@router.delete("/games/{game_id}", status_code=204)
def delete_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = db.query(Game).filter(Game.id == game_id, Game.user_id == current_user.id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado en tu biblioteca")
    db.delete(game)
    db.commit()
    return None
