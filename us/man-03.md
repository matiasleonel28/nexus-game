# US-MAN-03: Cambiar el estado de un juego

> **Epic:** Manager · **Prioridad:** P0 · **Estado impl:** ✅ Completo  
> **Dependencias:** MAN-01

## Historia

**Como** jugador  
**quiero** marcar un juego como Jugando / Completado / Abandonado en un click  
**para** reflejar mi progreso real sin fricción.

---

## Criterios de Aceptación

### AC-1: Cambio de estado desde card
```gherkin
Dado que tengo un juego en "Pendiente"
Cuando hago click en el selector de estado y elijo "Jugando"
Entonces el estado se actualiza inmediatamente (optimistic UI)
  Y el juego se mueve al tab "Jugando"
```

### AC-2: Transiciones válidas
```gherkin
Dado cualquier juego en la biblioteca
Cuando cambio su estado
Entonces cualquier transición es válida (no hay máquina de estados rígida)
  Pendiente → Jugando → Completado es el happy path
  Pero Completado → Jugando (rejugar) también es válido
```

### AC-3: Feedback visual
```gherkin
Dado que cambié el estado de un juego
Cuando la UI se actualiza
Entonces veo feedback sutil (el card desaparece del tab actual con animación)
  Y aparece en el tab correspondiente
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Pendiente → Jugando | Card se mueve a tab Jugando |
| 2 | Happy | Jugando → Completado | Card se mueve a Completado |
| 3 | Happy | Completado → Jugando (rejugar) | Permitido, vuelve a Jugando |
| 4 | Sad | Backend falla al actualizar | UI revierte (rollback optimistic) + toast error |
| 5 | Edge | Cambiar estado mientras hay filtros activos | El juego desaparece de la vista filtrada actual |
| 6 | Edge | Cambiar estado desde wishlist a pendiente | Transición válida (pasa de wishlist a biblioteca) |
| 7 | Border | Click doble rápido en distinto estado | Solo se procesa el último |

---

## Flujo UX

```
GameCard:
┌──────────────────────────────────────┐
│ ┌──────┐ Hollow Knight    PC         │
│ │cover │ [Pendiente ▾]              │
│ │      │  ┌─────────────────┐       │
│ └──────┘  │ ● Pendiente     │       │
│           │ ○ Jugando       │       │
│           │ ○ Completado    │       │
│           │ ○ Abandonado    │       │
│           └─────────────────┘       │
└──────────────────────────────────────┘
```

El selector es inline, sin modal. Un click = un cambio.
