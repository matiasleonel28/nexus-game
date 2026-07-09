"""
Combina las fuentes de precio del Hunter para un juego concreto:
  - ITAD  -> steam / xbox (por título)
  - Nintendo -> eshop (por nsuid cacheado en el juego)

Devuelve el mismo formato normalizado que consume el frontend:
{ "steam": {...}, "xbox": {...}, "eshop": {...} }
"""
from services import itad, nintendo


async def get_game_prices(game) -> dict:
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

    return stores
