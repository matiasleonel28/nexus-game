"""
Motor del monitor de precios (Hunter).

Recorre los juegos con un precio objetivo (`target_price`) y consulta ITAD.
Genera una alerta cuando:
  - target_reached : el precio actual bajó del objetivo, o
  - historical_low : el precio actual tocó su mínimo histórico.

Evita duplicar: si ya existe una alerta NO leída del mismo juego/tienda/tipo,
no crea otra.
"""
from models import Game, Alert
from services.prices_hub import get_game_prices


async def evaluate_watches(db) -> list[Alert]:
    watched = db.query(Game).filter(Game.target_price.isnot(None)).all()
    created: list[Alert] = []

    for g in watched:
        store = g.watch_store or "steam"
        try:
            prices = await get_game_prices(g)   # steam/xbox (ITAD) + eshop (Nintendo)
        except Exception:
            continue   # sin red / juego no encontrado -> se salta

        p = prices.get(store)
        if not p or p.get("current") is None:
            continue

        current = p["current"]
        lowest = p.get("lowest")

        atype = None
        if g.target_price is not None and current <= g.target_price:
            atype = "target_reached"
        elif lowest is not None and current <= lowest * 1.001:
            atype = "historical_low"
        if not atype:
            continue

        # no duplicar una alerta que sigue sin leerse
        dup = db.query(Alert).filter(
            Alert.game_id == g.id,
            Alert.store == store,
            Alert.type == atype,
            Alert.is_read == False,   # noqa: E712
        ).first()
        if dup:
            continue

        alert = Alert(user_id=g.user_id, game_id=g.id, store=store,
                      type=atype, price=current)
        db.add(alert)
        created.append(alert)

    db.commit()
    return created
