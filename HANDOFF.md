# Handoff — Nexus (julio 2026)

## ACCIÓN INMEDIATA: Revertir models.py y backlog.py

El modelo fue refactorizado (se creó `LibraryEntry` y Game perdió `user_id/status/owned_platform`).
**Esta refactorización es incorrecta y hay que revertirla.** Decisión del usuario: cada usuario
tiene sus propios juegos como registros separados en `Game` (con `user_id`). No se comparte catálogo.

### Qué está roto (code review findings):
1. **models.py**: `Game` perdió `user_id`, `status`, `owned_platform`, `target_price`, `watch_store` → todos los routers crashean
2. **backlog.py**: importa `from security import get_current_user` (no existe ahí, está en `routers/auth.py`)
3. **backlog.py**: importa `igdb.get_game_details()` y `hltb.get_game_duration()` (no existen, son `search_igdb` y `get_duration`)
4. **backlog.py**: `from services import igdb` falla — no hay `services/__init__.py`
5. **backlog.py**: perdió todos los query params (sort, status, platform, coop)
6. **client.js**: refresh interceptor solo busca en localStorage, pero register guarda en sessionStorage

### Cómo arreglar:
- **Revertir `models.py`** al esquema original: `Game` con `user_id`, `status`, `owned_platform`, `target_price`, `watch_store`, `eshop_nsuid`. Borrar `LibraryEntry`.
- **Revertir `backlog.py`** a la versión que funcionaba (commit `6a86927`): imports correctos (`from routers.auth import get_current_user`, `from services.igdb import search_igdb`), query params, `_add_game_to_db` con la lógica IGDB inline.
- **O mejor**: `git diff HEAD~3 -- backend/models.py backend/routers/backlog.py` para ver qué cambió y restaurar.

## Estado actual

Auth funciona (login/register/forgot-password/reset-password). Frontend levanta y muestra login.
Backend NO levanta por los imports rotos en backlog.py.

### Módulos
- **Auth**: login, register, forgot/reset password, refresh token ← FUNCIONA
- **Biblioteca/Buscar/Wishlist/Hunter/Alertas** ← ROTOS por el modelo roto

### Bugs de auth corregidos en esta sesión
1. `AuthProvider` export default vs named import
2. Doble `/api` en URLs del AuthContext
3. Import case-sensitive (`authcontext` vs `AuthContext`)
4. Login enviaba JSON pero backend espera form-data
5. Doble interceptor roto en client.js → reescrito
6. Faltaba ruta `/reset-password/:token`
7. Error handling no coincidía con formato del interceptor

## User Stories pendientes (ver `user_stories.json` + `us/`)

AUTH-01/02/03 implementadas (frontend). Quedan MAN-01, MAN-02, HUNT-01 y las demás.

## Deuda técnica
1. RegisterPage en inglés (resto de la app en español)
2. Emojis → SVG icons (📡🎯🔥⚠️✓)
3. No hay Alembic
4. font-num en AlertsView
5. Favicon default de Vite

## Cómo arrancar

```bash
# Backend (desde backend/)
PYTHONIOENCODING=utf-8 DEV_NO_AUTH=1 .venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000

# Frontend (desde frontend/)
npm run dev
```

## Repo: https://github.com/matiasleonel28/nexus-game

## Skills instaladas
- Emil Kowalski (4): animation-vocabulary, apple-design, emil-design-eng, review-animations
- ui-ux-pro-max (7): banner-design, brand, design, design-system, slides, ui-styling, ui-ux-pro-max
- huashu-design (1)
