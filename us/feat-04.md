# US-FEAT-04: Alerta de bundle/pack

> **Epic:** Features · **Prioridad:** P2 · **Estado impl:** ❌ No existe  
> **Dependencias:** HUNT-01 (price watches), HUNT-03 (historial de precios para calcular ahorro)  
> **Bloquea:** —

## Historia

**Como** jugador  
**quiero** recibir una alerta cuando 2 o más juegos de mi wishlist aparezcan juntos en un bundle o pack  
**para** aprovechar combos y ahorrar plata en vez de comprar por separado.

---

## Criterios de Aceptación

### AC-1: Detectar bundle con juegos de la wishlist
```gherkin
Dado que tengo "Hollow Knight" y "Celeste" en mi wishlist
  Y ambos aparecen en un bundle de Steam ("Indie Bundle")
Cuando el job de watches evalúa bundles
Entonces se genera una alerta de tipo "bundle_deal"
  Y la alerta incluye nombre del bundle, precio, y juegos incluidos
```

### AC-2: Mostrar ahorro calculado
```gherkin
Dado que el bundle cuesta $2.500
  Y los juegos individuales suman $4.300 (precios actuales)
Cuando veo la alerta de bundle
Entonces veo "Ahorrás $1.800 (42%)" calculado como suma individual - precio bundle
  Y los montos se muestran con clase .font-num
```

### AC-3: Badge en cards de wishlist
```gherkin
Dado que un juego de mi wishlist está incluido en un bundle detectado
Cuando veo la WishlistView
Entonces la card del juego muestra un badge "En bundle"
  Y al hacer click en el badge veo el detalle del bundle
```

### AC-4: Mínimo 2 juegos para alertar
```gherkin
Dado que solo 1 juego de mi wishlist está en un bundle
Cuando el job evalúa bundles
Entonces NO se genera alerta (no es relevante con 1 solo juego)
```

### AC-5: No duplicar alertas de bundle
```gherkin
Dado que ya recibí una alerta por el "Indie Bundle"
Cuando el job vuelve a correr y el bundle sigue activo
Entonces NO se genera una alerta duplicada
  Y la alerta existente se mantiene visible
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | 2 juegos de wishlist en mismo bundle | HK + Celeste en Indie Bundle $2.500 | Alerta bundle_deal con ahorro calculado |
| 2 | Happy | 3 juegos de wishlist en mismo bundle | HK + Celeste + Tunic en bundle $3.000 | Alerta con los 3 juegos y ahorro mayor |
| 3 | Happy | Badge visible en WishlistView | Juego en bundle activo | Card muestra badge "En bundle" clickeable |
| 4 | Sad | Solo 1 juego de wishlist en bundle | Solo Celeste en el bundle | Sin alerta (requiere 2+) |
| 5 | Sad | ITAD no devuelve datos de bundles | API sin endpoint o error | Log de warning, sin crash, sin alerta |
| 6 | Sad | Bundle expirado | Bundle ya no está disponible | Alerta se marca como expirada, badge desaparece |
| 7 | Edge | Juego en wishlist y en backlog | HK en wishlist + Celeste en backlog (ya comprado) | Solo cuenta juegos de wishlist para el match |
| 8 | Edge | Precio individual no disponible para calcular ahorro | 1 juego sin precio actual conocido | Ahorro se muestra como "~$X+" (parcial) |
| 9 | Edge | Bundle con juegos que el usuario ya tiene | 2 de 3 juegos del bundle ya comprados | Solo alerta si 2+ de wishlist; los comprados no cuentan |
| 10 | Border | Wishlist vacía | Sin juegos en wishlist | Job no evalúa bundles (skip) |
| 11 | Border | Bundle con precio = 0 (giveaway) | Bundle gratis | Alerta con ahorro = suma de precios individuales |
| 12 | Border | 10 juegos de wishlist en 1 bundle | Bundle grande con muchos matches | Alerta incluye todos los juegos, ahorro total |

---

## Edge / Border Cases
- Solo se evalúan juegos en wishlist, no en backlog (ya los tiene).
- Si ITAD no provee datos de bundles, el feature queda inactivo sin romper nada (graceful degradation).
- El ahorro se calcula con precios actuales de cada juego (current_price de price_hub). Si falta algún precio, se muestra ahorro parcial con indicador "~".
- Bundles expirados: la alerta se marca como expirada y el badge desaparece de las cards.
- No generar alertas duplicadas para el mismo bundle. Usar bundle_id (o hash de nombre + tienda) como dedup key.
- El alert_type "bundle_deal" es nuevo y se suma a los existentes ("target_reached", "historical_low") del sistema de alertas de HUNT-01.
- Si el bundle incluye juegos que no están en la DB de Nexus (juegos desconocidos), ignorarlos para el match.

---

## Fuente de datos

```
ITAD API — bundles endpoint (si disponible):
  GET /v01/deals/list/?key={KEY}&country=AR&...
  
  Alternativa: scrapear bundle data del feed de ITAD
  o usar /v02/game/bundles/ por juego individual.
  
  Evaluar disponibilidad real antes de implementar.
  Si ITAD no soporta bundles en su API actual,
  documentar como limitación y considerar alternativas.
```

---

## Flujo UX propuesto

```
AlertsView — alerta tipo bundle_deal:
┌──────────────────────────────────────────────────┐
│  🎁 Bundle detectado                             │
│                                                  │
│  "Indie Bundle" en Steam                         │
│  Incluye de tu wishlist:                         │
│   · Hollow Knight                                │
│   · Celeste                                      │
│                                                  │
│  Precio bundle:     $2.500  (.font-num)          │
│  Individual total:  $4.300                       │
│  Ahorrás:           $1.800 (42%)  (--positive)   │
│                                                  │
│  [Ver en Steam]                                  │
└──────────────────────────────────────────────────┘

WishlistView — badge en GameCard:
┌──────────────────────────────────────────┐
│ ┌──────┐ Hollow Knight    [En bundle]    │
│ │cover │ Steam: $3.500                   │
│ │      │ eShop: $4.100                   │
│ └──────┘                                 │
└──────────────────────────────────────────┘
```

> Nota: el emoji de regalo es solo ilustrativo del wireframe. En la implementación real,
> usar un icono SVG acorde al design system (no emoji como icono — ver feedback-ui-patterns).

---

## Estado
- Implementado: No
- Prioridad: P2
- Esfuerzo: M (3-4 horas)
- Depende de: HUNT-01, HUNT-03
