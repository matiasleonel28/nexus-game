# Nexus — System Architecture & Tech Stack

> **Fase 1 · Spec-Driven Development** · Documento 1 de 4
> Estado: `DRAFT v0.1` · Última edición: 2026-07-08

---

## 1. Visión

**Nexus** es un sistema personal unificado que fusiona dos módulos:

- **Módulo 1 — Manager:** control del backlog multiplataforma (Steam / Switch 2 / Xbox) con estados claros y foco en el *valor real* del juego (tiempo invertido vs. disfrute, $/hora, sesiones cooperativas).
- **Módulo 2 — Hunter:** monitor de ofertas y fluctuación de precios estrictamente en **Steam, Nintendo eShop (Switch 2) y Xbox Store**.

### Principios de diseño (no negociables)

1. **API-First.** Toda la lógica de negocio vive en el backend. El shell de escritorio, y a futuro un bot de Telegram o cualquier cliente, solo consumen la misma API REST.
2. **Local-first, portable-later.** Arranca como app de escritorio con backend embebido (SQLite local). La misma API puede levantarse en un server sin reescribir nada.
3. **Minimalismo militante.** Cero fricción. Menos pantallas, menos clicks, más señal. Si una feature no ayuda a decidir *qué jugar* o *cuándo comprar*, no entra al MVP.
4. **Valor sobre novedad.** Las métricas que importan son horas, disfrute y gasto — no "lo nuevo".

---

## 2. Reutilización de proyectos existentes

Nexus **no arranca de cero**. Es la evolución de `Game-manager`, absorbiendo una técnica puntual de `game-hunter`.

| Origen | Qué se reutiliza | Qué se descarta |
|---|---|---|
| **`Game-manager`** (FastAPI + React/Vite/Tailwind + SQLite) | Toda la base: modelos `games`/`platforms`/`prices`, auth (email+password), routers de backlog/wishlist/search, integraciones IGDB + HowLongToBeat + CheapShark, scheduler APScheduler, tema oscuro (`#0b0d12` / acento `#ff4655`), lógica `$/hora`. | Nada estructural; se renombran estados y se extiende el modelo. |
| **`game-hunter`** (Node/Express + Vite) | **Solo la técnica** de consultar directo la Steam Store API (`storesearch`, región `AR`, precio en tienda real). | Todo el backend Express (no mantenemos dos backends en dos lenguajes). |

> **Decisión:** el backend de Nexus es **uno solo, en Python/FastAPI**. La técnica Steam-Store de `game-hunter` se reimplementa como un adaptador Python dentro del servicio de precios.

---

## 3. Stack tecnológico

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| **Shell de escritorio** | **Tauri 2** (Rust + WebView del SO) | Binario liviano (~10 MB vs ~150 MB de Electron), ícono nativo en Windows, bajo consumo de RAM. |
| **Frontend** | **React 18 + Vite + TypeScript + Tailwind CSS** | Ya es el stack de `Game-manager`. TS se agrega para robustez del contrato de API. Estética funcional/oscura ya definida. |
| **HTTP client** | Axios (con interceptores) | Reutilizado de `Game-manager`. |
| **Backend** | **Python 3.13 + FastAPI** | API-first, OpenAPI autogenerado (`/docs`), async nativo para llamadas a APIs externas. Reutilizado. |
| **ORM / DB** | **SQLAlchemy 2 + SQLite** | Suficiente para uso personal, cero servidor de DB, archivo único portable. Migrable a Postgres si se self-hostea. |
| **Migraciones** | **Alembic** | *Nuevo* — necesario porque el esquema va a evolucionar (SDD iterativo). |
| **Auth** | **JWT** (access + refresh) + `passlib`/`bcrypt` | Extiende la auth ya existente. |
| **Scheduler** | **APScheduler** | Jobs diarios de refresco de precios y evaluación de alertas. Reutilizado. |
| **Empaquetado backend** | **PyInstaller** → sidecar de Tauri | El backend se compila a un binario que Tauri lanza como *sidecar* al abrir la app. |
| **APIs externas** | IGDB · HowLongToBeat · **IsThereAnyDeal** · Steam Store | Ver §6. |

---

## 4. Reconciliación: "App de escritorio" + "Multi-usuario con login"

Combinación elegida = **Tauri sidecar con backend portable**. Se resuelve así:

```
┌──────────────────────── App de escritorio (Tauri) ────────────────────────┐
│                                                                            │
│   ┌─────────────────────┐        localhost:8787        ┌───────────────┐   │
│   │  Frontend (WebView) │  ──────── HTTP/JSON ───────▶ │  Backend       │   │
│   │  React + Vite + TW  │  ◀──────── JWT ────────────  │  FastAPI       │   │
│   └─────────────────────┘                              │  (sidecar)     │   │
│                                                         │                │   │
│                                                         │  SQLite ◀──────┼── nexus.db (local)
│                                                         │  APScheduler   │   │
│                                                         └───────┬────────┘   │
└─────────────────────────────────────────────────────────────── │ ──────────┘
                                                                   │
                                          ┌────────────────────────┼───────────────────────┐
                                          ▼            ▼            ▼            ▼
                                        IGDB      HowLongToBeat   ITAD     Steam Store API
                                     (metadata)   (duración)   (precios)   (precio AR exacto)
```

- **Por defecto:** el sidecar FastAPI escucha en `127.0.0.1:8787`, guarda en `nexus.db` local. El login existe pero corre local (útil si más de una persona usa la misma PC, y deja el sistema listo para hosting).
- **Modo self-hosted (futuro):** el frontend Tauri apunta su `baseURL` a un server remoto en vez del sidecar. **Cero cambios de código de negocio** gracias al diseño API-first.

> Los secretos de API (IGDB, ITAD) viven en el backend (`.env` local o keychain del SO), **nunca** en el frontend.

---

## 5. Componentes del backend

```
nexus-backend/
├── main.py               # FastAPI app + lifespan (crea tablas, arranca scheduler)
├── config.py             # settings desde .env (keys, región=AR, moneda=ARS)
├── database.py           # engine SQLAlchemy + session
├── models.py             # ORM (ver doc 03-database-schema)
├── schemas.py            # Pydantic (request/response)
├── security.py           # hashing + JWT
├── scheduler.py          # jobs: refresh_prices (diario), evaluate_alerts
├── routers/
│   ├── auth.py           # register / login / refresh / me
│   ├── search.py         # búsqueda IGDB + Steam Store
│   ├── library.py        # Módulo 1: backlog CRUD + estados + filtros coop
│   ├── watches.py        # Módulo 2: suscripciones de precio (price watches)
│   ├── prices.py         # histórico + refresh manual
│   └── alerts.py         # feed de alertas disparadas
└── services/             # adaptadores a APIs externas (1 archivo = 1 fuente)
    ├── igdb.py           # metadata + carátula + plataformas + flags coop
    ├── hltb.py           # duración (main / completionist)
    ├── itad.py           # NUEVO: precios Steam + eShop + Xbox (actual + mínimo histórico)
    └── steam_store.py    # NUEVO: precio exacto AR en tienda (técnica de game-hunter)
```

**Regla de servicios:** cada `services/*.py` expone funciones puras `async` que devuelven dicts normalizados. Los routers orquestan; los servicios no conocen la DB. Esto permite testear cada fuente aislada y cachear respuestas.

---

## 6. Integraciones externas

| Servicio | Uso en Nexus | Cobertura | Auth | Notas / límites |
|---|---|---|---|---|
| **IGDB** | Metadata canónica: título, carátula, fecha, plataformas, modos (coop/crossplay). | Todas | `CLIENT_ID` + `CLIENT_SECRET` (Twitch) | ~4 req/s. Carátulas sin protocolo (`//…t_thumb…`) → transformar a `t_cover_big`. |
| **HowLongToBeat** | Duración `main_story` y `completionist`. | Todas | Sin key (scraping vía `howlongtobeatpy`) | Frágil ante cambios del sitio; cachear agresivo. |
| **IsThereAnyDeal (ITAD)** | **Fuente primaria de precios**: actual + mínimo histórico por tienda. | **Steam + eShop + Xbox** ✅ | API key gratuita | Unifica el Hunter en una sola fuente. Región AR / moneda ARS. |
| **Steam Store API** | Precio **exacto en tienda AR** para juegos de PC (complementa/valida ITAD). | Solo Steam | Sin key | `storesearch?cc=AR&l=spanish`. Técnica portada de `game-hunter`. |

> **PS5:** queda como plataforma de **colección/local** (homebrew/emulación). Se puede taggear un juego como PS5 en la biblioteca, pero **no se rastrean precios de PS5** — no hay `price_watch` ni store PS5 en el Hunter. Decisión explícita del usuario.

### Flujo de refresco de precios (job diario)

```
scheduler (03:00 AR)
  └─ para cada price_watch activo:
       ├─ itad.get_prices(game, stores=[steam,eshop,xbox], region=AR)
       ├─ steam_store.get_price(game)      # solo si store incluye steam (validación)
       ├─ upsert en price_history
       └─ si current <= target_price  ó  current == lowest_ever:
            └─ crear alert  →  (futuro) push/Telegram
```

---

## 7. Requisitos no funcionales

- **Rendimiento de arranque:** app usable en < 2 s (SQLite local, sin round-trips de red en el primer render).
- **Modo offline:** la biblioteca (Manager) funciona 100% offline. El Hunter degrada con gracia: muestra el último precio cacheado con timestamp "actualizado hace X".
- **Rate limiting / caching:** metadata (IGDB/HLTB) se cachea por juego indefinidamente; precios con TTL de 24 h salvo refresh manual. Backoff exponencial ante 429.
- **Secretos:** solo en backend. `.env` fuera de control de versiones.
- **Observabilidad:** logs estructurados del scheduler (qué precios cambiaron, qué alertas dispararon).
- **Datos personales:** todo local por defecto; export/import de la biblioteca a JSON (evita lock-in).

---

## 8. Fuera de alcance (por ahora)

Bot de Telegram, notificaciones push nativas, sync multi-dispositivo, soporte de precios PS5, recomendaciones con IA. Todo esto es *post-MVP* y el diseño API-first no lo bloquea.
