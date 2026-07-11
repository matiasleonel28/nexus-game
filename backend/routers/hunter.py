"""
Módulo Hunter — precios y ofertas (Steam / eShop / Xbox) vía IsThereAnyDeal.

Expone consulta de precios, vigilancias (watches) y alertas de precio.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from routers.auth import get_current_user
from models import User, Alert, Game
from schemas import AlertResponse
from services import itad, nintendo
from services.prices_hub import get_game_prices
from services.watches import evaluate_watches

router = APIRouter()


class ResolveEshopRequest(BaseModel):
    game_id: int
    url: str


@router.get("/hunter/prices")
async def hunter_prices(title: str, current_user: User = Depends(get_current_user)):
    """Precio actual + mínimo histórico por tienda para un título (en ARS)."""
    try:
        data = await itad.get_prices(title)
    except itad.ITADError as e:
        raise HTTPException(status_code=503, detail=str(e))
    return {"title": title, "stores": data}


@router.get("/hunter/raw")
async def hunter_raw(title: str, current_user: User = Depends(get_current_user)):
    """Diagnóstico: respuestas crudas de ITAD para verificar el parseo."""
    try:
        return await itad.get_raw(title)
    except itad.ITADError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.get("/hunter/game/{game_id}/prices")
async def hunter_game_prices(game_id: int,
                             db: Session = Depends(get_db),
                             current_user: User = Depends(get_current_user)):
    """Precios combinados (Steam/Xbox vía ITAD + eShop vía Nintendo) de un juego."""
    game = db.query(Game).filter(Game.id == game_id,
                                 Game.user_id == current_user.id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")
    return {"title": game.title, "stores": await get_game_prices(game)}


@router.post("/hunter/eshop/resolve")
async def hunter_eshop_resolve(body: ResolveEshopRequest,
                               db: Session = Depends(get_db),
                               current_user: User = Depends(get_current_user)):
    """Extrae el nsuid del link del eShop US y lo cachea en el juego."""
    game = db.query(Game).filter(Game.id == body.game_id,
                                 Game.user_id == current_user.id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Juego no encontrado")

    nsuid = await nintendo.extract_nsuid(body.url)
    if not nsuid:
        raise HTTPException(status_code=422,
                            detail="No pude encontrar el nsuid en esa página. ¿Es un link de un juego del eShop de EE.UU.?")

    game.eshop_nsuid = nsuid
    db.commit()
    price = await nintendo.get_eshop_price(nsuid)
    return {"nsuid": nsuid, "eshop": price}


@router.post("/hunter/evaluate")
async def hunter_evaluate(db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    """Revisa ahora todos los juegos vigilados y dispara alertas nuevas."""
    created = await evaluate_watches(db)
    return {"nuevas_alertas": len(created)}


@router.get("/hunter/alerts", response_model=list[AlertResponse])
def hunter_alerts(unread: bool = False,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    """Feed de alertas disparadas (más recientes primero)."""
    q = db.query(Alert).filter(Alert.user_id == current_user.id)
    if unread:
        q = q.filter(Alert.is_read == False)   # noqa: E712
    alerts = q.order_by(Alert.triggered_at.desc()).all()
    return [
        AlertResponse(
            id=a.id, game_id=a.game_id,
            title=a.game.title if a.game else "(juego eliminado)",
            store=a.store, alert_type=a.alert_type, price=a.price,
            is_read=a.is_read, triggered_at=a.triggered_at,
        )
        for a in alerts
    ]


@router.post("/hunter/alerts/{alert_id}/read")
def hunter_alert_read(alert_id: int,
                      db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    """Marca una alerta como leída."""
    alert = db.query(Alert).filter(Alert.id == alert_id,
                                   Alert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alert.is_read = True
    db.commit()
    return {"ok": True}
