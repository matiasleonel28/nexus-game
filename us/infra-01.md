# US-INFRA-01: Migración de modelo DB (Game monolítico → normalizado)

> **Epic:** Infraestructura · **Prioridad:** P0 → **Rebajada a P2**  · **Estado impl:** ❌ No existe  
> **Dependencias:** Ninguna  
> **Nota:** El HANDOFF.md documenta que un intento de normalización (LibraryEntry) fue revertido.  
> **Decisión del usuario:** Cada usuario tiene sus propios juegos como registros separados en Game (con user_id). No se comparte catálogo. La normalización queda como mejora futura, no bloqueante.

## Historia

**Como** desarrollador  
**quiero** migrar el modelo de datos de Game monolítico al esquema normalizado de la spec  
**para** desbloquear multi-watch, historial de precios, y métricas de valor real.

---

## Alcance de la migración

### Esquema actual (herencia de Game-manager)
```
games (user_id, igdb_id, status, target_price, watch_store, ...)
game_prices (game_id, store_name, current_price, lowest_price)
game_platforms (game_id, platform_name)
alerts (user_id, game_id, ...)
```

### Esquema objetivo (spec)
```
games (igdb_id, title, ...) → catálogo compartido, SIN user_id
library_entries (user_id, game_id, platform, status, hours_played, enjoyment)
price_watches (user_id, game_id, store, target_price, is_active)
price_history (game_id, store, current_price, lowest_price_ever, captured_at)
alerts (user_id, game_id, store, type, price_at_trigger, is_read)
```

---

## Criterios de Aceptación

### AC-1: Alembic inicializado
```gherkin
Dado que el proyecto no tiene migraciones
Cuando corro `alembic init` y creo la migración inicial
Entonces tengo un baseline del esquema actual
```

### AC-2: Migración de datos
```gherkin
Dado que tengo juegos en el modelo viejo
Cuando corro la migración
Entonces:
  - games pierde user_id, se deduplicar por igdb_id
  - se crean library_entries con la relación user↔game+platform+status
  - game.target_price/watch_store → price_watches
  - game_prices → price_history (con captured_at = updated_at)
  - alerts se actualizan con las FK correctas
```

### AC-3: Campos nuevos
```gherkin
Dado el esquema nuevo
Entonces library_entries tiene: hours_played (REAL, default 0), enjoyment (INT 1-5, nullable)
  Y games tiene: has_crossplay (BOOLEAN, default false)
  Y users tiene: region (TEXT, default 'AR'), currency (TEXT, default 'ARS')
```

### AC-4: Rollback seguro
```gherkin
Dado que la migración puede fallar
Cuando corro `alembic downgrade`
Entonces vuelvo al esquema anterior sin pérdida de datos
```

### AC-5: Routers actualizados
```gherkin
Dado el esquema nuevo
Cuando los routers (backlog, wishlist, hunter) se actualizan
Entonces usan library_entries y price_watches en lugar de Game directo
  Y los endpoints mantienen la misma interfaz REST (sin breaking changes para el frontend)
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Migración con 20 juegos existentes | Datos correctos en tablas nuevas |
| 2 | Happy | Rollback | Vuelve al esquema anterior |
| 3 | Sad | Juego duplicado (mismo igdb_id, distinto user — solo hay 1 user) | Se deduplicar sin error |
| 4 | Edge | Juego con target_price pero sin watch_store | Se crea watch con store inferida de owned_platform |
| 5 | Edge | Juego con status "wishlist" | Se crea library_entry con status "pendiente" + price_watch |
| 6 | Border | DB vacía | Migración crea tablas nuevas sin datos |

---

## Orden de ejecución sugerido
1. Instalar Alembic y configurar
2. Crear migración baseline del esquema actual
3. Crear migración de transformación → esquema nuevo
4. Actualizar models.py, schemas.py
5. Actualizar routers (backlog, wishlist, hunter, search)
6. Actualizar frontend API clients si cambian los responses
7. Test E2E del flujo completo

## Riesgo
- **Alto**: si se pierde data en la migración. Mitigación: backup de games.db antes de correr.
- **Medio**: los routers cambian mucho internamente. Mitigación: mantener interfaz REST igual.
