"""
Scheduler de tareas periódicas usando APScheduler AsyncIOScheduler.

Al usar AsyncIOScheduler en lugar de BackgroundScheduler:
- Las corutinas (async def) se ejecutan directamente en el event loop de uvicorn.
- No se necesita asyncio.run() desde un thread separado (evita conflictos).
- El scheduler comparte el event loop con FastAPI.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timezone, timedelta
from database import SessionLocal
from models import Game, RefreshToken

_scheduler: AsyncIOScheduler | None = None


async def check_releases():
    """
    Corre todos los días a las 9am.
    Busca juegos en wishlist que se lancen en los próximos 7 días.
    """
    db = SessionLocal()
    try:
        today    = datetime.now(timezone.utc)
        in_7_days = today + timedelta(days=7)

        upcoming = db.query(Game).filter(
            Game.status == "wishlist",
            Game.release_date.isnot(None),
            Game.release_date >= today,
            Game.release_date <= in_7_days,
        ).all()

        for game in upcoming:
            days_left = (game.release_date - today).days
            # Por ahora lo loguea — podés reemplazar con Telegram, email, etc.
            print(f"\U0001f514 ALERTA: '{game.title}' sale en {days_left} días ({game.release_date.date()})")

    finally:
        db.close()


async def check_price_watches():
    """Corre a diario: evalúa los juegos vigilados y dispara alertas de precio."""
    from services.watches import evaluate_watches  # import local para evitar circular
    db = SessionLocal()
    try:
        created = await evaluate_watches(db)
        if created:
            print(f"\U0001f514 Hunter: {len(created)} alerta(s) de precio nueva(s)")
    finally:
        db.close()


async def cleanup_expired_refresh_tokens():
    """
    Corre cada 24 horas: limpia refresh tokens expirados o revocados de la DB.
    Previene crecimiento indefinido de la tabla refresh_tokens.
    """
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc)
        deleted = db.query(RefreshToken).filter(
            (RefreshToken.expires_at < cutoff) | (RefreshToken.revoked == True)  # noqa: E712
        ).delete(synchronize_session=False)
        db.commit()
        if deleted:
            print(f"\U0001f9f9 Limpieza: {deleted} refresh token(s) expirado(s)/revocado(s) eliminado(s)")
    finally:
        db.close()


async def start_scheduler():
    global _scheduler
    _scheduler = AsyncIOScheduler()

    _scheduler.add_job(
        check_releases,
        trigger="cron",
        hour=9, minute=0,
        id="release_checker"
    )
    _scheduler.add_job(
        check_price_watches,
        trigger="cron",
        hour=3, minute=0,
        id="price_watcher"
    )
    _scheduler.add_job(
        cleanup_expired_refresh_tokens,
        trigger="cron",
        hour=4, minute=0,
        id="token_cleanup"
    )

    _scheduler.start()
    print("\u2705 Scheduler iniciado (AsyncIO) — lanzamientos (9am), precios (3am), limpieza tokens (4am)")


async def stop_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        print("\U0001f6d1 Scheduler detenido.")