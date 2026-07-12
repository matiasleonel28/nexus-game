# US-HUNT-03: Ver curva histórica de precios

> **Epic:** Hunter · **Prioridad:** P1 · **Estado impl:** ❌ No existe  
> **Dependencias:** HUNT-01, INFRA-01 (tabla price_history)

## Historia

**Como** jugador  
**quiero** ver la curva histórica de precios y el mínimo histórico de un juego  
**para** saber si una "oferta" es real o inflada.

---

## Criterios de Aceptación

### AC-1: Precio actual + mínimo + descuento
```gherkin
Dado que abro el detalle de precio de un juego con watch
Cuando veo la sección Hunter
Entonces veo: precio actual, mínimo histórico, % de descuento actual
  Y los precios se muestran en ARS con clase .font-num
```

### AC-2: Curva por tienda
```gherkin
Dado que un juego tiene historial de precios en Steam y eShop
Cuando veo la curva
Entonces hay una línea por tienda con colores diferenciados
  Y puedo hacer hover para ver precio exacto + fecha
```

### AC-3: Badge "buen precio"
```gherkin
Dado que el precio actual está dentro del 10% del mínimo histórico
Cuando veo la card del juego
Entonces aparece un badge "Cerca del mínimo" en verde (--positive)
```

### AC-4: Sin datos suficientes
```gherkin
Dado que un juego tiene menos de 2 data points
Cuando intento ver la curva
Entonces veo "Todavía no hay suficiente historial" con el precio actual solo
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Juego con 30+ data points | Curva suave con hover interactivo |
| 2 | Happy | Precio actual = mínimo histórico | Badge verde "Mínimo histórico" |
| 3 | Sad | Sin historial (recién agregado) | Mensaje "sin historial" + precio actual |
| 4 | Edge | Precio actual > 2x mínimo | Sin badge (la "oferta" es inflada) |
| 5 | Edge | Juego F2P (precio siempre 0) | Curva plana en 0, sin badges |
| 6 | Edge | Solo una tienda tiene datos | Curva de una sola línea |
| 7 | Border | Historial de 2 años (700+ data points) | Chart con zoom o agrupación mensual |
| 8 | Border | Cambio de moneda en ITAD (ARS→USD) | Siempre mostrar en la moneda del data point, flag si hubo cambio |

---

## Gap actual — CRITICO
- **No existe tabla `price_history`.** Solo hay snapshots actuales en `game_prices`.
- **Requiere INFRA-01** para la serie temporal + el job diario que popule la tabla.
- El frontend necesita un chart library (Chart.js o similar).

## Flujo UX propuesto

```
Detalle de juego — sección Hunter:
┌──────────────────────────────────────────────┐
│ Hollow Knight — Precios                       │
├──────────────────────────────────────────────┤
│  Steam:  $4.800 ARS  ↓43%  [Cerca del mín]  │
│  Mínimo: $3.200 ARS (15 mar 2026)            │
│  eShop:  $7.900 ARS  ↓12%                    │
│  Mínimo: $4.100 ARS (22 dic 2025)            │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │ $10k ┤                                │  │
│  │      ┤     ╲  Steam                   │  │
│  │ $5k  ┤      ╲___╱╲___                 │  │
│  │      ┤         eShop ╲____            │  │
│  │ $0   ┤────────────────────────────────│  │
│  │      Ene    Mar    May    Jul         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```
