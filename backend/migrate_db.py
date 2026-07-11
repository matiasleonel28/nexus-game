"""
Script de migración manual para la DB existente (sin Alembic).
Aplica los cambios de schema del code review de forma segura.

Uso:
  cd nexus/backend
  .venv/Scripts/python.exe migrate_db.py
"""
from database import engine
from sqlalchemy import text, inspect
from models import Base


def migrate():
    insp = inspect(engine)
    existing_tables = insp.get_table_names()

    with engine.begin() as conn:
        # ── 1. alerts: renombrar 'type' → 'alert_type' ──────────────────────
        if 'alerts' in existing_tables:
            alert_cols = [c['name'] for c in insp.get_columns('alerts')]
            if 'type' in alert_cols and 'alert_type' not in alert_cols:
                print("Migrando alerts: 'type' → 'alert_type'...")
                conn.execute(text("ALTER TABLE alerts RENAME COLUMN type TO alert_type"))
                print("  ✓ OK")
            elif 'alert_type' in alert_cols:
                print("alerts.alert_type ya existe — skip")
            else:
                print("WARN: ni 'type' ni 'alert_type' en alerts")

        # ── 2. games: verificar columnas ─────────────────────────────────────
        if 'games' in existing_tables:
            game_cols = [c['name'] for c in insp.get_columns('games')]
            print(f"games columns: {game_cols}")

    # ── 3. Crear tablas nuevas (idempotente) ─────────────────────────────────
    print("Ejecutando create_all (idempotente)...")
    Base.metadata.create_all(bind=engine)
    print("  ✓ OK")

    # ── 4. Verificación final ─────────────────────────────────────────────────
    insp2 = inspect(engine)
    tables = insp2.get_table_names()
    print(f"\nTablas finales: {tables}")
    if 'alerts' in tables:
        print(f"alerts columns: {[c['name'] for c in insp2.get_columns('alerts')]}")
    if 'refresh_tokens' in tables:
        print(f"refresh_tokens columns: {[c['name'] for c in insp2.get_columns('refresh_tokens')]}")

    print("\n✓ Migración completada.")


if __name__ == "__main__":
    migrate()
