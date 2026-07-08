# Nexus — API Specification (OpenAPI 3.1)

> **Fase 1 · Spec-Driven Development** · Documento 2 de 4
> Estado: `DRAFT v0.1` · Esbozo de endpoints. El contrato final lo autogenera FastAPI en `/docs`.

---

## 1. Convenciones

- Base URL: `http://127.0.0.1:8787/api` (sidecar local) — configurable a server remoto.
- Auth: `Authorization: Bearer <access_token>` (JWT) en todo salvo `/auth/register` y `/auth/login`.
- Errores: formato uniforme `{ "detail": "mensaje" }` con códigos HTTP estándar.
- Enums:
  - `status` (Manager): `pendiente` · `jugando` · `completado` · `abandonado`
  - `platform`: `pc` · `switch2` · `xbox` · `ps5`
  - `store` (Hunter): `steam` · `eshop` · `xbox`  *(nunca `ps5`)*
  - `alert.type`: `target_reached` · `historical_low` · `release_soon`

---

## 2. Mapa de endpoints

| Método | Ruta | Módulo | Descripción |
|---|---|---|---|
| POST | `/auth/register` | Auth | Crear cuenta |
| POST | `/auth/login` | Auth | Login → tokens |
| POST | `/auth/refresh` | Auth | Renovar access token |
| GET | `/auth/me` | Auth | Usuario actual + preferencias (región/moneda) |
| GET | `/search` | Manager | Buscar juegos (IGDB + Steam Store), sin guardar |
| GET | `/library` | Manager | Biblioteca con filtros y orden |
| POST | `/library` | Manager | Agregar juego a la biblioteca |
| PATCH | `/library/{id}` | Manager | Cambiar estado / horas / disfrute / notas |
| DELETE | `/library/{id}` | Manager | Quitar de la biblioteca |
| GET | `/watches` | Hunter | Listar suscripciones de precio |
| POST | `/watches` | Hunter | Crear watch (juego + tienda + precio objetivo) |
| PATCH | `/watches/{id}` | Hunter | Editar objetivo / activar-pausar |
| DELETE | `/watches/{id}` | Hunter | Eliminar watch |
| GET | `/prices/{game_id}` | Hunter | Precio actual + curva histórica por tienda |
| POST | `/prices/{game_id}/refresh` | Hunter | Forzar refresco de precio (bypass TTL) |
| GET | `/alerts` | Hunter | Feed de alertas disparadas |
| POST | `/alerts/{id}/read` | Hunter | Marcar alerta como leída |

---

## 3. Esbozo OpenAPI

```yaml
openapi: 3.1.0
info:
  title: Nexus API
  version: 0.1.0
  description: >
    API unificada del ecosistema de videojuegos personal. Módulo Manager
    (backlog) + Módulo Hunter (ofertas). API-first: consumida por el shell
    Tauri y, a futuro, otros clientes.
servers:
  - url: http://127.0.0.1:8787/api
    description: Sidecar local (Tauri)

security:
  - bearerAuth: []

paths:
  # ─────────────────────────── AUTH ───────────────────────────
  /auth/login:
    post:
      tags: [Auth]
      security: []
      summary: Login
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/Credentials' }
      responses:
        '200':
          description: Tokens emitidos
          content:
            application/json:
              schema: { $ref: '#/components/schemas/TokenPair' }
        '401': { description: Credenciales inválidas }

  # ────────────────────────── MANAGER ─────────────────────────
  /search:
    get:
      tags: [Manager]
      summary: Buscar juegos (IGDB + Steam Store). No persiste nada.
      parameters:
        - { name: q, in: query, required: true, schema: { type: string } }
      responses:
        '200':
          description: Resultados de búsqueda
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/SearchResult' }

  /library:
    get:
      tags: [Manager]
      summary: Biblioteca del usuario con filtros
      parameters:
        - name: status
          in: query
          schema: { type: string, enum: [pendiente, jugando, completado, abandonado] }
        - name: platform
          in: query
          schema: { type: string, enum: [pc, switch2, xbox, ps5] }
        - name: coop
          in: query
          description: Filtro rápido cooperativo
          schema: { type: boolean }
        - name: crossplay
          in: query
          schema: { type: boolean }
        - name: sort
          in: query
          schema:
            type: string
            enum: [duration_asc, duration_desc, value_asc, enjoyment_desc, added_desc]
      responses:
        '200':
          description: Entradas de biblioteca
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/LibraryEntry' }
    post:
      tags: [Manager]
      summary: Agregar juego a la biblioteca
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [igdb_id, platform]
              properties:
                igdb_id: { type: integer }
                platform: { type: string, enum: [pc, switch2, xbox, ps5] }
                status:   { type: string, enum: [pendiente, jugando, completado, abandonado], default: pendiente }
      responses:
        '201':
          description: Entrada creada (backend resuelve metadata IGDB/HLTB)
          content:
            application/json:
              schema: { $ref: '#/components/schemas/LibraryEntry' }
        '409': { description: Ya existe (user+game+platform) }

  /library/{id}:
    patch:
      tags: [Manager]
      summary: Actualizar estado / horas / disfrute / notas
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                status:       { type: string, enum: [pendiente, jugando, completado, abandonado] }
                hours_played: { type: number }
                enjoyment:    { type: integer, minimum: 1, maximum: 5 }
                notes:        { type: string }
      responses:
        '200': { description: Actualizado }
    delete:
      tags: [Manager]
      summary: Quitar de la biblioteca
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
      responses:
        '204': { description: Eliminado }

  # ─────────────────────────── HUNTER ─────────────────────────
  /watches:
    get:
      tags: [Hunter]
      summary: Listar suscripciones de precio
      responses:
        '200':
          description: Watches del usuario
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/PriceWatch' }
    post:
      tags: [Hunter]
      summary: Crear watch de precio
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [game_id, store]
              properties:
                game_id:      { type: integer }
                store:        { type: string, enum: [steam, eshop, xbox] }
                target_price: { type: number, nullable: true }
                notify_on_historical_low: { type: boolean, default: true }
      responses:
        '201':
          description: Watch creado
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PriceWatch' }

  /prices/{game_id}:
    get:
      tags: [Hunter]
      summary: Precio actual + curva histórica por tienda
      parameters:
        - { name: game_id, in: path, required: true, schema: { type: integer } }
        - name: store
          in: query
          schema: { type: string, enum: [steam, eshop, xbox] }
      responses:
        '200':
          description: Cotización + histórico
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PriceReport' }

  /prices/{game_id}/refresh:
    post:
      tags: [Hunter]
      summary: Forzar refresco de precio (ignora TTL de 24 h)
      parameters:
        - { name: game_id, in: path, required: true, schema: { type: integer } }
      responses:
        '202': { description: Refresco encolado/ejecutado }

  /alerts:
    get:
      tags: [Hunter]
      summary: Feed de alertas disparadas
      parameters:
        - { name: unread, in: query, schema: { type: boolean } }
      responses:
        '200':
          description: Alertas
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/Alert' }

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Credentials:
      type: object
      required: [email, password]
      properties:
        email:    { type: string, format: email }
        password: { type: string, format: password }

    TokenPair:
      type: object
      properties:
        access_token:  { type: string }
        refresh_token: { type: string }
        token_type:    { type: string, example: bearer }

    SearchResult:
      type: object
      properties:
        igdb_id:   { type: integer }
        title:     { type: string }
        cover_url: { type: string }
        platforms: { type: array, items: { type: string } }
        has_coop:  { type: boolean }
        # precio se resuelve al guardar / crear watch, no en la búsqueda

    LibraryEntry:
      type: object
      properties:
        id:           { type: integer }
        game_id:      { type: integer }
        igdb_id:      { type: integer }
        title:        { type: string }
        cover_url:    { type: string }
        platform:     { type: string }
        status:       { type: string }
        hours_played: { type: number }
        enjoyment:    { type: integer, nullable: true }
        hltb_main_hours: { type: number, nullable: true }
        has_coop:     { type: boolean }
        has_crossplay:{ type: boolean }
        value_per_hour: { type: number, nullable: true, description: 'current_price / hltb_main_hours' }

    PriceWatch:
      type: object
      properties:
        id:           { type: integer }
        game_id:      { type: integer }
        title:        { type: string }
        store:        { type: string }
        target_price: { type: number, nullable: true }
        current_price:{ type: number, nullable: true }
        lowest_price_ever: { type: number, nullable: true }
        is_active:    { type: boolean }

    PriceReport:
      type: object
      properties:
        game_id: { type: integer }
        store:   { type: string }
        current_price:     { type: number }
        lowest_price_ever: { type: number }
        discount_pct:      { type: integer }
        currency: { type: string, example: ARS }
        region:   { type: string, example: AR }
        history:
          type: array
          items:
            type: object
            properties:
              price:       { type: number }
              captured_at: { type: string, format: date-time }

    Alert:
      type: object
      properties:
        id:      { type: integer }
        game_id: { type: integer }
        title:   { type: string }
        store:   { type: string }
        type:    { type: string, enum: [target_reached, historical_low, release_soon] }
        price_at_trigger: { type: number }
        triggered_at:     { type: string, format: date-time }
        is_read: { type: boolean }
```

---

## 4. Notas de diseño del contrato

- **La búsqueda no trae precio.** El precio se resuelve al agregar a biblioteca o crear un watch, para no gastar llamadas a ITAD en cada tecleo (coherente con "sin fricción" y con los rate limits).
- **`value_per_hour` es derivado**, calculado por el backend al serializar — el frontend nunca hace esa cuenta.
- **Idempotencia:** `POST /library` y `POST /watches` devuelven `409` ante duplicados (respetan los `UNIQUE` del esquema) en vez de crear basura.
- **Paginación:** para el MVP personal el volumen es bajo; se difiere. Si la biblioteca crece, se agrega `limit`/`offset` sin romper el contrato.
