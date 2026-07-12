"""
Combina las fuentes de precio del Hunter para un juego concreto:
  - ITAD  -> steam / xbox (por título)
  - Nintendo -> eshop (por nsuid cacheado en el juego)

Devuelve el mismo formato normalizado que consume el frontend:
{ "steam": {...}, "xbox": {...}, "eshop": {...} }
"""
from services import itad, nintendo
from models import PriceHistory
from datetime import datetime, timezone

async def get_game_prices(game, db=None) -> dict:
    stores: dict = {}

    # Steam + Xbox vía ITAD (por título)
    try:
        stores = await itad.get_prices(game.title)
    except Exception:
        stores = {}

    # eShop vía Nintendo (si el juego tiene nsuid resuelto)
    nsuid = getattr(game, "eshop_nsuid", None)
    if nsuid:
        try:
            eshop = await nintendo.get_eshop_price(nsuid)
            if eshop:
                stores["eshop"] = eshop
        except Exception:
            pass

    if db:
        # Check if we already recorded a price today
        today = datetime.now(timezone.utc).date()
        existing = db.query(PriceHistory).filter(PriceHistory.game_id == game.id).all()
        existing_today = {h.store_name for h in existing if h.recorded_at.date() == today}

        for store_name, price_data in stores.items():
            if store_name not in existing_today and price_data.get("current") is not None:
                db.add(PriceHistory(
                    game_id=game.id,
                    store_name=store_name,
                    price=price_data["current"],
                    currency=price_data.get("currency", "ARS")
                ))
        db.commit()

    return stores
