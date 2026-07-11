# Nexus — Manual del proyecto

> Fuente de verdad para cualquier modelo/persona que trabaje el proyecto.
> Si cambian comandos, convenciones o estructura, **se actualiza en el mismo commit**.

## Qué es y para quién

Sistema personal unificado de videojuegos para un jugador (Matu). Fusiona:
- **Manager** — backlog multiplataforma (PC/Steam, Switch 2, Xbox) con estados y
  foco en el valor real (tiempo vs. disfrute, $/hora, sesiones coop).
- **Hunter** — monitor de precios/ofertas (Steam, eShop, Xbox Store).

Región/moneda: Argentina / ARS. PS5 = solo colección (sin precios).
Specs completas en [`specs/`](specs/README.md).

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.13 + FastAPI + SQLAlchemy 2 + SQLite |
| Jobs | APScheduler (releases 9am, watches 3am) |
| Auth | JWT (`PyJWT`) + refresh tokens + `passlib`/`bcrypt` (bcrypt 4.0.1) |
| Frontend | React 19 + Vite + Tailwind 4 + Axios + React Router |
| APIs externas | IGDB (metadata), HowLongToBeat (duración), ITAD (precios Steam/Xbox ARS), Nintendo API (eShop ARS) |
| Tests | `pytest` (back) + Playwright (E2E front) |

## Cómo correr

### Backend
```bash
# 1. Navegar al directorio del backend y activar entorno virtual
cd backend

python -m venv .venv                    # Crear
.venv\Scripts\Activate.ps1              # Activar en PowerShell
# source .venv/Scripts/activate         # Activar en Git Bash / WSL

# 2. Instalar dependencias y configurar variables
pip install -r requirements.txt         # Instalar
cp .env.example .env                    # Crear .env y completar con tus claves de API

# 3. Levantar servidor (con bypass de login para desarrollo, desde la carpeta `backend/`)
# En Git Bash / WSL:
PYTHONIOENCODING=utf-8 DEV_NO_AUTH=1 .venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000
# En PowerShell:
$env:PYTHONIOENCODING="utf-8"; $env:DEV_NO_AUTH="1"; .venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000 # <-- Ejecutar desde la carpeta 'backend/'
```

> **`DEV_NO_AUTH=1`** saltea el login (usuario `dev@local`); sin esa variable,
> la API exige token JWT. **`PYTHONIOENCODING=utf-8`** evita crash por emojis
> del scheduler en Windows.

### Frontend (desde `frontend/`)
```bash
npm install
npm run dev                             # http://localhost:5173
```

## Estructura

```
nexus/
├── backend/
│   ├── main.py            app + lifespan (crea tablas, arranca scheduler)
│   ├── database.py        engine SQLAlchemy + sesión SQLite (games.db)
│   ├── models.py          ORM: User, Game, Platform, Price, Alert
│   ├── schemas.py         Pydantic (request/response)
│   ├── security.py        hashing + JWT (access, refresh, password-reset tokens)
│   ├── scheduler.py       jobs diarios (releases 9am, price watches 3am)
│   ├── routers/
│   │   ├── auth.py        login, register, refresh, forgot/reset-password, /me
│   │   ├── search.py      búsqueda IGDB
│   │   ├── backlog.py     CRUD biblioteca + wishlist
│   │   └── hunter.py      precios ITAD+Nintendo, alertas, evaluate
│   └── services/
│       ├── igdb.py        metadata de juegos
│       ├── hltb.py        duración HowLongToBeat
│       ├── itad.py        precios Steam/Xbox vía IsThereAnyDeal (ARS)
│       ├── nintendo.py    precios eShop vía api.ec.nintendo.com (ARS)
│       ├── prices_hub.py  combina ITAD + Nintendo por juego
│       └── watches.py     evaluador de vigilancias → genera Alert
├── frontend/
│   └── src/
│       ├── api/
│       │   ├── client.js     Axios con interceptor de refresh + mensajes humanos
│       │   ├── games.js      backlog/wishlist CRUD
│       │   └── hunter.js     precios, alertas, resolve eShop
│       ├── components/
│       │   ├── GameCard.jsx      tarjeta de juego (firma: horas HLTB en font-num)
│       │   └── ConfirmDialog.jsx modal de confirmación
│       ├── context/
│       │   ├── AuthContext.jsx       auth state (login/register/logout)
│       │   └── GameRefreshContext.jsx sincroniza backlog/wishlist
│       └── pages/
│           ├── LoginPage.jsx          login con "Recordarme"
│           ├── RegisterPage.jsx       registro
│           ├── ForgotPasswordPage.jsx solicitar reset
│           ├── ResetPasswordPage.jsx  nuevo password (con token)
│           ├── Dashboard.jsx          biblioteca con tabs por estado
│           ├── SearchView.jsx         búsqueda IGDB
│           ├── WishlistView.jsx       wishlist con precios y vigilancia
│           ├── HunterView.jsx         búsqueda de precios por título
│           └── AlertsView.jsx         feed de alertas de precio
├── specs/               especificaciones SDD
├── user_stories.json    índice de user stories
└── us/                  archivos .md de cada user story
```

## Auth — flujo completo

- **Backend**: JWT access token (60min) + refresh token (7 días) + password reset token (15min).
  Tres secrets separados (`SECRET_KEY`, `REFRESH_SECRET_KEY`, `PASSWORD_RESET_SECRET_KEY`).
  `DEV_NO_AUTH=1` → bypass total (crea `dev@local`).
- **Frontend**: `AuthContext` maneja estado. `client.js` intercepta 401 → intenta refresh →
  si falla, redirige a `/login`. Tokens en localStorage (si "Recordarme") o sessionStorage.
- **Endpoints**: `POST /api/auth/register`, `POST /api/auth/login` (form-data),
  `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/forgot-password`,
  `POST /api/auth/reset-password`.
- **Login usa form-data** (OAuth2PasswordRequestForm): el campo es `username` (no `email`),
  con `Content-Type: application/x-www-form-urlencoded`.

## Convenciones

- **API-first:** lógica de negocio en el backend; frontend solo consume REST.
- **Servicios:** una fuente externa = un archivo en `services/`.
- **Diseño "ledger del jugador":** tokens CSS en `src/index.css`:
  `--ink`, `--surface`, `--surface-2/3`, `--line`, `--text`, `--muted`,
  `--accent` (ámbar), `--positive` (verde ofertas), `--danger` (rojo destructivo).
  Siempre usar tokens (`bg-[var(--surface)]`), nunca hex sueltos.
- **Tipografía:** Space Grotesk (UI) + Space Mono (`.font-num` para horas/precios).
  Ámbar = valor; verde = ofertas; rojo = destructivo. Texto `--ink` sobre ámbar.
- **Carátulas IGDB:** sin protocolo + baja res. Convertir con `getHighResCover()`
  (agrega `https:` y cambia `t_thumb` → `t_cover_big`).
- **Regla de negocio:** en SearchView las horas HLTB y precios quedan ocultos;
  solo se muestran una vez guardado (Dashboard/Wishlist).
- **Errores HTTP:** consumir `src/api/client.js` (mensajes humanos en español).

## Hunter — fuentes de precio

- **ITAD** (`services/itad.py`): Steam + Xbox en ARS. Key en `.env` como `ITAD_API_KEY`.
- **Nintendo** (`services/nintendo.py`): eShop ARS vía `api.ec.nintendo.com/v1/price?country=AR`.
  nsuid se resuelve pegando link US del eShop (`POST /api/hunter/eshop/resolve`), se cachea
  en `games.eshop_nsuid`.
- **prices_hub.py**: combina ITAD (steam/xbox) + Nintendo (eshop) por juego.
- **watches.py**: evalúa `target_price` vs precio real → genera Alert (target_reached / historical_low).

## Estado / deuda conocida

- **Migraciones:** no hay Alembic. DB migrada a mano. Antes de cambiar esquema, sumar Alembic.
- **Precios backlog:** migrados a ITAD (multi-tienda, moneda real por tienda).
- **Discount eShop sin testear:** parsing de descuento Nintendo escrito pero sin prueba con juego rebajado real.
- **Tauri:** no implementado (corre como web local). Está en la spec.
