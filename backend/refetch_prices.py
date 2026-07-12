"""
Script one-shot: re-fetchea precios de todos los juegos existentes usando ITAD.
Reemplaza los precios viejos de CheapShark (USD) por datos frescos de ITAD
(multi-tienda, moneda real por tienda).

Uso:
  cd nexus/backend
  PYTHONIOENCODING=utf-8 .venv/Scripts/python.exe refetch_prices.py
"""
import asyncio
import sys
from database import SessionLocal, engine
from models import Game, Price
from services import itad

async def refetch_all():
    db = SessionLocal()
    try:
        games = db.query(Game).all()
        print(f"Juegos en DB: {len(games)}")

        for game in games:
            print(f"\n→ {game.title} (id={game.id})")

            try:
                stores = await itad.get_prices(game.title)
            except Exception as e:
                print(f"  ✗ Error ITAD: {e}")
                continue

            if not stores:
                print("  — Sin datos en ITAD")
                continue

            # Borrar precios viejos
            old_count = db.query(Price).filter(Price.game_id == game.id).delete()
            if old_count:
                print(f"  Borrados {old_count} precio(s) viejo(s)")

            # Insertar nuevos
            for store_key, sd in stores.items():
                if sd.get("current") is None:
                    continue
                db.add(Price(
                    game_id=game.id,
                    store_name=store_key,
                    current_price=sd["current"],
                    lowest_price=sd.get("lowest"),
                    currency=sd.get("currency", "USD"),
                ))
                print(f"  + {store_key}: {sd.get('currency','?')} {sd['current']}"
                      f" (low: {sd.get('lowest', '—')})")

            db.commit()

        print("\n✓ Refetch completo.")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(refetch_all())
