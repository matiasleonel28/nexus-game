# US-HUNT-02: Recibir y gestionar alertas de precio

> **Epic:** Hunter · **Prioridad:** P0 · **Estado impl:** ✅ Completo  
> **Dependencias:** HUNT-01 (debe existir al menos un watch)

## Historia

**Como** jugador  
**quiero** recibir alertas cuando el precio baja de mi objetivo o toca el mínimo histórico  
**para** no perder la ventana de compra ni pagar de más.

---

## Criterios de Aceptación

### AC-1: Alerta por precio objetivo alcanzado
```gherkin
Dado que tengo un watch con objetivo ARS 5.000
Cuando el job diario detecta precio ARS 4.800
Entonces se crea una alerta tipo "target_reached"
  Y aparece en el feed de alertas con badge de no leída
```

### AC-2: Alerta por mínimo histórico
```gherkin
Dado que tengo un watch con notify_on_historical_low = true
Cuando el precio iguala el mínimo histórico
Entonces se crea una alerta tipo "historical_low"
```

### AC-3: Feed de alertas
```gherkin
Dado que tengo alertas acumuladas
Cuando abro la vista de Alertas
Entonces veo las alertas más recientes primero
  Y las no leídas se distinguen visualmente
  Y el ícono de navegación muestra badge con conteo
```

### AC-4: Marcar como leída
```gherkin
Dado que tengo una alerta no leída
Cuando la marco como leída (click o botón)
Entonces el badge se actualiza
  Y la alerta cambia de estilo visual
```

### AC-5: No duplicar alertas
```gherkin
Dado que el precio sigue debajo del objetivo al día siguiente
Cuando el job se ejecuta de nuevo
Entonces NO se crea otra alerta (ya existe una target_reached reciente)
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Precio cae debajo del objetivo | Alerta target_reached en feed |
| 2 | Happy | Precio iguala mínimo histórico | Alerta historical_low en feed |
| 3 | Happy | Marcar alerta como leída | Badge se decrementa |
| 4 | Sad | Job falla (ITAD caído) | No se crean alertas falsas, se loguea el error |
| 5 | Edge | Precio = exactamente el objetivo | Se dispara alerta (≤ no <) |
| 6 | Edge | Precio sube después de una alerta | La alerta persiste, no se borra |
| 7 | Edge | Watch pausado | No se evalúa, no se crean alertas |
| 8 | Edge | Múltiples watches disparan alerta al mismo tiempo | Cada uno genera su propia alerta |
| 9 | Border | 50+ alertas acumuladas | Paginación o scroll sin lag |
| 10 | Border | Alerta de juego eliminado | Muestra "(juego eliminado)" como título |

---

## Flujo UX

```
AlertsView:
┌─────────────────────────────────────────────────┐
│ Alertas (3 nuevas)                              │
├─────────────────────────────────────────────────┤
│ 🔴 Hollow Knight — Steam          hace 2h       │
│    Precio objetivo alcanzado: $4.800             │
│    Tu objetivo: $5.000  ¡Ahorrás $200!          │
│                                    [Marcar leída]│
├─────────────────────────────────────────────────┤
│ 🔴 Celeste — eShop                hace 1d       │
│    Mínimo histórico: $2.100                      │
│                                    [Marcar leída]│
├─────────────────────────────────────────────────┤
│ ○ Hades — Steam                   hace 3d       │
│    Precio objetivo alcanzado: $3.500  (leída)    │
└─────────────────────────────────────────────────┘
```
