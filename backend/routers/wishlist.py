from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import AddGameRequest, GameResponse
from routers.backlog import _to_response, _add_game_to_db
from models import Game, User
from routers.auth import get_current_user

router = APIRouter()

@router.get("/wishlist", response_model=list[GameResponse])
def get_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    games = db.query(Game).filter(
        Game.status.in_(["wishlist", "waiting_sale"]),
        Game.user_id == current_user.id
    ).order_by(Game.release_date).all()
    return [_to_response(g) for g in games]

@router.post("/wishlist", response_model=GameResponse)
async def add_to_wishlist(
    body: AddGameRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    game = await _add_game_to_db(body.igdb_id, "wishlist", db, current_user)
    return _to_response(game)