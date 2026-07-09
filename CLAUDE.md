# Nexus — Manual del proyecto

> Este archivo es la fuente de verdad para cualquier modelo/persona que trabaje
> el proyecto. Si cambian comandos, convenciones o estructura, **se actualiza
> en el mismo commit**. Un solo doc canónico — no cinco `.md` sueltos.

## Qué es y para quién

Sistema personal unificado de videojuegos, para un jugador (Matu). Fusiona:
- **Manager** — backlog multiplataforma (PC/Steam, Switch 2, Xbox) con estados y
  foco en el valor real (tiempo vs. disfrute, $/hora, sesiones coop).
- **Hunter** — monitor de precios/ofertas (Steam, eShop, Xbox Store).

Región/moneda objetivo: Argentina / ARS. PS5 = solo colección (sin precios).
La especificación completa vive en [`specs/`](specs/README.md).

## Primera cosa visible que prueba que funciona

Buscar un juego → agregarlo al backlog → verlo listado con su duración (HLTB).
Ese flujo vertical ya funciona hoy.

## Lo que la v1 NO hace (alcance escrito a propósito)

- Módulo Hunter ACTIVO (`services/itad.py` + `routers/hunter.py` + página
  `/hunter`). Precios reales en ARS vía IsThereAnyDeal con `ITAD_API_KEY`.
  Cobertura real observada: **Steam** confiable, **Xbox** cuando ITAD lo tiene
  (ej. Forza), **eShop (Nintendo) casi sin cobertura** (ej. Zelda no devuelve
  nada). Endpoints: `GET /api/hunter/prices?title=` y `/api/hunter/raw?title=`
  (diagnóstico). Los precios del backlog viejo aún vienen de CheapShark hasta
  migrar ese flujo a ITAD.
- Monitor de precios: los juegos tienen `target_price` + `watch_store`; el job
  `check_price_watches` (scheduler, 3am) y `POST /api/hunter/evaluate` (manual)
  evalúan y generan alertas (`target_reached` / `historical_low`, sin duplicar).
  Alertas: `GET /api/hunter/alerts`, `POST /api/hunter/alerts/{id}/read`. En el
  front: se vigila desde la Wishlist (precio objetivo + tienda) y se ven en
  `/alertas`. Motor en `services/watches.py`.
- eShop (Nintendo) integrado aparte de ITAD: `services/nintendo.py` (precio ARS
  vía api.ec.nintendo.com con `country=AR`) + `services/prices_hub.py` (combina
  ITAD steam/xbox + Nintendo eshop por juego). El nsuid US se resuelve pegando
  el link del eShop de EE.UU. (`POST /api/hunter/eshop/resolve`) y se cachea en
  `games.eshop_nsuid`. Precios combinados: `GET /api/hunter/game/{id}/prices`.
  Detalle y razones en `specs/05-nintendo-integration.md`.
- No es app Tauri todavía (corre como web local). Tauri está en la spec.
- Sin bot de Telegram, sin push, sin sync multi-dispositivo, sin IA.
- Sin precios de PS5.
- El frontend todavía no tiene pantalla de login (ver "Estado / deuda").

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.13 + FastAPI + SQLAlchemy 2 + SQLite |
| Jobs | APScheduler |
| Auth | JWT (`PyJWT`) + `passlib`/`bcrypt` (bcrypt pineado a 4.0.1) |
| Frontend | React 19 + Vite + Tailwind 4 + Axios + React Router |
| APIs externas | IGDB (metadata), HowLongToBeat (duración), CheapShark (precios PC) |
| Tests | `pytest` (back) + Playwright (E2E front) |

## Cómo correr

### Backend (desde `backend/`)
```bash
python -m venv .venv
source .venv/Scripts/activate          # Windows / Git Bash
pip install -r requirements.txt
cp .env.example .env                    # completá IGDB_CLIENT_ID/SECRET

# Levantar (con bypass de login para desarrollo + salida UTF-8 en Windows):
PYTHONIOENCODING=utf-8 DEV_NO_AUTH=1 uvicorn main:app --reload --port 8000
# API: http://localhost:8000  ·  Docs: http://localhost:8000/docs

pytest                                  # tests
```

> **Nota Windows:** `PYTHONIOENCODING=utf-8` evita el crash por los emojis en
> los `print()` del scheduler. `DEV_NO_AUTH=1` saltea el login (usuario
> `dev@local`); sin esa variable, la API exige token JWT normal.

### Frontend (desde `frontend/`)
```bash
npm install
npm run dev                             # http://localhost:5173
npm run build
npm run lint
npx playwright test                     # E2E flujo feliz
```

## Estructura

```
nexus/
├── backend/          FastAPI: API REST, DB, scheduler, servicios externos
│   ├── main.py         app + lifespan (crea tablas, arranca scheduler)
│   ├── database.py     engine SQLAlchemy + sesión SQLite (games.db)
│   ├── models.py       ORM: User, Game, Platform, Price
│   ├── schemas.py      Pydantic (request/response)
│   ├── security.py     hashing + JWT
│   ├── scheduler.py    job diario de alertas de lanzamiento
│   ├── routers/        endpoints: auth, search, backlog, wishlist
│   └── services/       1 archivo por fuente externa: igdb, hltb, prices
├── frontend/         React + Vite + Tailwind (consume la API REST)
│   └── src/
│       ├── api/          client Axios + funciones de endpoints
│       ├── components/   GameCard, etc.
│       ├── context/      GameRefreshContext (sincroniza backlog/wishlist)
│       └── pages/        Dashboard, SearchView, WishlistView, NotFound
└── specs/            Especificación SDD (arquitectura, API, DB, PRD)
```

## Convenciones

- **API-first:** toda la lógica de negocio en el backend; el frontend solo
  consume REST. El ordenamiento del backlog lo hace el backend, no la UI.
- **Servicios:** una fuente externa = un archivo en `services/`.
- **UI (sistema de diseño "ledger del jugador"):** tokens como CSS vars en
  `src/index.css` (`--ink`, `--surface`, `--surface-2/3`, `--line`, `--text`,
  `--muted`, `--accent` ámbar, `--positive`, `--danger`). Usar siempre los
  tokens vía `bg-[var(--surface)]` etc., no hex sueltos. Tipografías: **Space
  Grotesk** (UI) + **Space Mono** para datos numéricos (clase `.font-num`, que
  es el elemento firma: horas/precios en mono tabular). Ámbar = valor; verde
  solo para ofertas; rojo solo destructivo. Texto oscuro (`--ink`) sobre ámbar.
- **Carátulas IGDB:** vienen sin protocolo y en baja resolución. Usar
  `buildCoverUrl` (agrega `https:` y cambia `t_thumb` → `t_cover_big`).
- **Regla de negocio:** en `SearchView` las horas HLTB y los precios quedan
  ocultos; solo se muestran una vez el juego está guardado (Dashboard/Wishlist).
- **Errores HTTP:** consumir siempre `src/api/client.js` (mensajes humanos).

## Estado / deuda conocida

- **Desajuste auth ↔ frontend:** el backend exige JWT en todos los endpoints,
  pero el frontend no tiene login ni manda `Authorization`. Hoy funciona vía
  `DEV_NO_AUTH=1`. Deuda: agregar login + interceptor de token en el front.
- **Migraciones:** no hay Alembic. La DB `games.db` se migró a mano para tener
  `users.password_hash` y `games.user_id`. Antes de cambiar el esquema, sumar
  Alembic (ver `specs/03-database-schema.md`).
- El salto a ITAD (3 tiendas, ARS), Tauri y el módulo Hunter completo está
  documentado en `specs/` y es el próximo trabajo grande.
