# Nexus — Database Schema

> **Fase 1 · Spec-Driven Development** · Documento 3 de 4
> Estado: `DRAFT v0.1` · Motor: SQLite (SQLAlchemy 2) · Migraciones: Alembic

---

## 1. Decisión de modelo

**Relacional (SQLite).** Los datos son fuertemente relacionales (usuario → juegos → precios/plataformas/alertas) y las consultas del MVP son agregaciones y filtros por FK — territorio ideal de SQL. NoSQL no aporta nada aquí y complicaría los joins de "$/hora por juego con su último precio".

### Separación clave respecto a `Game-manager`

En `Game-manager`, un `Game` pertenecía directo a un `User` y el estado `wishlist` era un valor más del enum. En **Nexus** normalizamos para soportar los dos módulos limpiamente:

- **`games`** = catálogo canónico compartido (metadata de IGDB/HLTB), deduplicado por `igdb_id`. No pertenece a un usuario.
- **`library_entries`** = **Módulo 1 (Manager)**. La relación usuario↔juego con estado, plataforma poseída, horas y disfrute.
- **`price_watches`** = **Módulo 2 (Hunter)**. Suscripción a la fluctuación de precio de un juego en una tienda (independiente de si lo tenés en la biblioteca).
- **`price_history`** = serie temporal de precios por juego+tienda.
- **`alerts`** = eventos disparados (oferta objetivo / mínimo histórico / lanzamiento).

---

## 2. Diagrama entidad-relación

```
users ──1:N── library_entries ──N:1── games ──1:N── game_platforms
  │                                      │
  ├────1:N── price_watches ──N:1─────────┤
  │                                      │
  ├────1:N── alerts ──────────N:1────────┤
                                         └──1:N── price_history
```

---

## 3. Tablas

### `users`
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| id | INTEGER | PK | |
| email | TEXT | UNIQUE, NOT NULL, INDEX | |
| password_hash | TEXT | NOT NULL | bcrypt |
| region | TEXT | DEFAULT `'AR'` | región de tienda |
| currency | TEXT | DEFAULT `'ARS'` | moneda de precios |
| created_at | DATETIME | DEFAULT now | |

### `games` — catálogo canónico (compartido entre usuarios)
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| id | INTEGER | PK | |
| igdb_id | INTEGER | UNIQUE, NOT NULL, INDEX | dedup |
| title | TEXT | NOT NULL | |
| cover_url | TEXT | | URL cruda IGDB (`//…t_thumb…`) |
| release_date | DATETIME | | |
| hltb_main_hours | REAL | | historia principal |
| hltb_completionist_hours | REAL | | 100% |
| has_coop | BOOLEAN | DEFAULT 0 | cooperativo |
| has_splitscreen | BOOLEAN | DEFAULT 0 | pantalla dividida |
| has_crossplay | BOOLEAN | DEFAULT 0 | **NUEVO** — filtro crossplay |
| metadata_updated_at | DATETIME | | control de caché de metadata |

### `game_platforms`
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| id | INTEGER | PK | |
| game_id | INTEGER | FK → games.id, ON DELETE CASCADE | |
| platform | TEXT | NOT NULL | `pc` · `switch2` · `xbox` · `ps5` |

> `ps5` es válido como plataforma de **colección** pero excluido del Hunter (ver §5).

### `library_entries` — **Módulo 1 (Manager)**
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id, ON DELETE CASCADE | |
| game_id | INTEGER | FK → games.id, ON DELETE CASCADE | |
| platform | TEXT | NOT NULL | plataforma donde lo tenés/jugás |
| status | TEXT | NOT NULL, DEFAULT `'pendiente'` | `pendiente` · `jugando` · `completado` · `abandonado` |
| hours_played | REAL | DEFAULT 0 | tiempo invertido real |
| enjoyment | INTEGER | | disfrute 1–5 (para "valor real") |
| notes | TEXT | | |
| added_at | DATETIME | DEFAULT now | |
| updated_at | DATETIME | | |
| | | **UNIQUE(user_id, game_id, platform)** | evita duplicados |

### `price_watches` — **Módulo 2 (Hunter)**
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id, ON DELETE CASCADE | |
| game_id | INTEGER | FK → games.id, ON DELETE CASCADE | |
| store | TEXT | NOT NULL | `steam` · `eshop` · `xbox` |
| target_price | REAL | | precio objetivo; NULL = solo avisar mínimo histórico |
| notify_on_historical_low | BOOLEAN | DEFAULT 1 | |
| is_active | BOOLEAN | DEFAULT 1 | |
| created_at | DATETIME | DEFAULT now | |
| | | **UNIQUE(user_id, game_id, store)** | |
| | | **CHECK(store != 'ps5')** | Hunter no cubre PS5 |

### `price_history` — serie temporal
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| id | INTEGER | PK | |
| game_id | INTEGER | FK → games.id, ON DELETE CASCADE, INDEX | |
| store | TEXT | NOT NULL | `steam` · `eshop` · `xbox` |
| current_price | REAL | | precio en el momento de la captura |
| lowest_price_ever | REAL | | mínimo histórico reportado por ITAD |
| discount_pct | INTEGER | | % de descuento |
| currency | TEXT | DEFAULT `'ARS'` | |
| region | TEXT | DEFAULT `'AR'` | |
| source | TEXT | | `itad` · `steam_store` |
| captured_at | DATETIME | DEFAULT now, INDEX | |
| | | **INDEX(game_id, store, captured_at)** | consulta de última cotización + curva |

### `alerts` — eventos disparados
| Campo | Tipo | Constraints | Notas |
|---|---|---|---|
| id | INTEGER | PK | |
| user_id | INTEGER | FK → users.id, ON DELETE CASCADE | |
| game_id | INTEGER | FK → games.id, ON DELETE CASCADE | |
| store | TEXT | NOT NULL | |
| type | TEXT | NOT NULL | `target_reached` · `historical_low` · `release_soon` |
| price_at_trigger | REAL | | |
| triggered_at | DATETIME | DEFAULT now | |
| is_read | BOOLEAN | DEFAULT 0 | para el feed/badge de la UI |

---

## 4. Campos derivados (no se persisten; se calculan)

| Métrica | Fórmula | Dónde |
|---|---|---|
| **$/hora (compra)** | `current_price / hltb_main_hours` | ranking de wishlist/watches |
| **Disfrute/hora (retro)** | `enjoyment / hours_played` | análisis de "valor real" en biblioteca |
| **% desde mínimo histórico** | `(current_price - lowest_price_ever) / lowest_price_ever` | badge "¿es buen precio?" en el Hunter |

---

## 5. Reglas de integridad relevantes al dominio

1. **PS5 sin precios.** `price_watches` y `price_history` solo aceptan `steam`/`eshop`/`xbox`. PS5 vive únicamente como `game_platforms.platform = 'ps5'` en la biblioteca.
2. **Catálogo compartido, biblioteca por usuario.** Un mismo `game` puede estar en la biblioteca de varios usuarios con distinto estado; nunca se duplica la metadata.
3. **Cascadas.** Borrar un usuario borra sus entradas/watches/alerts, pero **no** toca `games` ni `price_history` (dato de valor global).

---

## 6. Migración desde `Game-manager`

El esquema viejo (`games` con `user_id` + `status='wishlist'`) migra así:
- `games` viejos → dividir en `games` (canónico) + `library_entries` (relación usuario).
- `status='wishlist'` → crear `price_watch` en vez de entrada de biblioteca (o entrada `pendiente` + watch, según intención).
- `game_prices` → semilla inicial de `price_history` con `captured_at = updated_at`.

Se implementa como una migración Alembic de datos en la Fase 2.
