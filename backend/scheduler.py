import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from database import SessionLocal
from models import Game
from services.watches import evaluate_watches

def check_releases():
    """
    Corre todos los días a las 9am.
    Busca juegos en wishlist que se lancen en los próximos 7 días.
    """
    db = SessionLocal()
    try:
        today = datetime.utcnow()
        in_7_days = today + timedelta(days=7)

        upcoming = db.query(Game).filter(
            Game.status == "wishlist",
            Game.release_date != None,
            Game.release_date >= today,
            Game.release_date <= in_7_days,
        ).all()

        for game in upcoming:
            days_left = (game.release_date - today).days
            # Por ahora lo loguea — podés reemplazar esto con
            # un mensaje de Telegram, un email, lo que quieras
            print(f"🔔 ALERTA: '{game.title}' sale en {days_left} días ({game.release_date.date()})")

    finally:
        db.close()


def check_price_watches():
    """Corre a diario: evalúa los juegos vigilados y dispara alertas de precio."""
    db = SessionLocal()
    try:
        created = asyncio.run(evaluate_watches(db))
        if created:
            print(f"🔔 Hunter: {len(created)} alerta(s) de precio nueva(s)")
    finally:
        db.close()


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        check_releases,
        trigger="cron",
        hour=9,
        minute=0,
        id="release_checker"
    )
    scheduler.add_job(
        check_price_watches,
        trigger="cron",
        hour=3,
        minute=0,
        id="price_watcher"
    )
    scheduler.start()
    print("✅ Scheduler iniciado — lanzamientos (9am) y precios del Hunter (3am)")