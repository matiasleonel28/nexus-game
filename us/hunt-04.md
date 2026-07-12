# US-HUNT-04: Forzar refresco de precio

> **Epic:** Hunter · **Prioridad:** P2 · **Estado impl:** ⚠️ Parcial  
> **Dependencias:** HUNT-01

## Historia

**Como** jugador impaciente  
**quiero** refrescar el precio de un juego manualmente  
**para** no esperar al job diario de las 3am.

---

## Criterios de Aceptación

### AC-1: Refresh manual
```gherkin
Dado que tengo un juego con watch activo
Cuando presiono "Actualizar precio"
Entonces se consulta ITAD/Nintendo ignorando el TTL de 24h
  Y el precio se actualiza al instante en la UI
  Y se agrega un nuevo registro a price_history
```

### AC-2: Feedback de carga
```gherkin
Dado que presioné "Actualizar precio"
Cuando la consulta está en curso
Entonces veo un spinner/loading en el botón
  Y el botón queda deshabilitado hasta que termine
```

### AC-3: Rate limiting
```gherkin
Dado que acabo de hacer un refresh manual
Cuando intento otro refresh antes de 5 minutos
Entonces veo "Esperá 5 minutos para actualizar de nuevo"
  Y el request no se envía
```

### AC-4: Error de fuente
```gherkin
Dado que ITAD está caído
Cuando intento refresh manual
Entonces veo "No se pudo actualizar. Último precio de hace X"
  Y el precio anterior se mantiene
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Refresh exitoso | Precio actualizado + historial nuevo |
| 2 | Sad | ITAD caído | Error graceful con último precio |
| 3 | Sad | Rate limited (refresh < 5min) | Mensaje de espera |
| 4 | Edge | Juego sin watch (solo en biblioteca) | Botón de refresh no aparece |
| 5 | Edge | Precio no cambió desde último check | Se actualiza captured_at pero precio igual |
| 6 | Border | Refresh de juego eShop sin nsuid resuelto | Error "Primero resolvé el link del eShop" |

---

## Gap actual
- Existe `GET /hunter/prices` (búsqueda por título) pero no `POST /prices/{id}/refresh` (refresh por game_id con bypass TTL).
- No hay rate limiting en el backend.
