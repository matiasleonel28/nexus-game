# US-HUNT-01: Vigilar el precio de un juego

> **Epic:** Hunter · **Prioridad:** P0 · **Estado impl:** ⚠️ Parcial (no hay tabla price_watches)  
> **Dependencias:** MAN-01 (juego debe existir en catálogo), INFRA-01 (migración DB)  
> **Bloquea:** HUNT-02, HUNT-03, HUNT-04

## Historia

**Como** jugador  
**quiero** suscribirme al precio de un juego en una tienda con un precio objetivo  
**para** que me avise cuándo conviene comprar.

---

## Criterios de Aceptación

### AC-1: Crear watch desde wishlist/biblioteca
```gherkin
Dado que tengo un juego en mi biblioteca o wishlist
Cuando creo un watch seleccionando tienda "Steam" y precio objetivo ARS 5.000
Entonces se guarda la suscripción como price_watch activo
  Y empieza a rastrearse en el job diario (3am AR)
```

### AC-2: Watch sin precio objetivo
```gherkin
Dado que quiero vigilar un juego pero no tengo un precio en mente
Cuando creo un watch sin precio objetivo (target_price = null)
Entonces solo me avisa cuando el precio toca su mínimo histórico
```

### AC-3: Multi-watch por juego
```gherkin
Dado que quiero comparar Steam vs eShop
Cuando creo watches en ambas tiendas para el mismo juego
Entonces tengo dos suscripciones independientes con distintos objetivos
```

### AC-4: PS5 excluido
```gherkin
Dado que quiero crear un watch
Cuando selecciono tienda "PS5"
Entonces la opción no está disponible (PS5 no es tienda soportada)
```

### AC-5: Duplicado
```gherkin
Dado que ya tengo un watch para "Hollow Knight" en Steam
Cuando intento crear otro watch para el mismo juego en Steam
Entonces recibo error 409 "Ya tenés un watch para este juego en Steam"
```

### AC-6: Pausar/reactivar watch
```gherkin
Dado que tengo un watch activo
Cuando lo pauso
Entonces el job diario lo ignora hasta que lo reactive
  Y se marca is_active = false
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Crear watch Steam con objetivo $5.000 | Watch activo, se evalúa en próximo job |
| 2 | Happy | Crear watch eShop sin objetivo | Watch activo, solo alerta por mínimo histórico |
| 3 | Happy | Watch en Steam + watch en eShop mismo juego | Dos watches independientes |
| 4 | Sad | Watch duplicado (mismo juego + tienda) | Error 409 |
| 5 | Sad | Watch en PS5 | Opción no disponible |
| 6 | Sad | Precio objetivo negativo | Validación: "El precio debe ser mayor a 0" |
| 7 | Edge | Juego sin nsuid para eShop | Se pide resolver el link US primero |
| 8 | Edge | Juego gratuito (F2P) | Se permite watch pero alerta puede ser inmediata si precio = 0 ≤ target |
| 9 | Edge | ITAD no tiene el juego | Watch se crea pero se marca como "sin datos" |
| 10 | Border | Precio objetivo = 0 | Validación: "El precio debe ser mayor a 0" |
| 11 | Border | Precio objetivo = 999.999 | Permitido (el usuario sabe lo que quiere) |

---

## Gap actual — CRITICO
- **No existe tabla `price_watches`.** El target_price y watch_store viven como columnas en Game, limitando a 1 watch por juego.
- **Requiere INFRA-01** (migración de modelo) para implementar correctamente.

## Flujo UX propuesto

```
WishlistView — acción en GameCard:
┌──────────────────────────────────────────┐
│ ┌──────┐ Hollow Knight                   │
│ │cover │ Steam: $8.500  (mín: $3.200)    │
│ │      │ eShop: $7.900  (mín: $4.100)    │
│ └──────┘                                 │
│   [Vigilar precio ▾]                     │
│   ┌──────────────────────────────────┐   │
│   │ Tienda:  [Steam ▾]              │   │
│   │ Objetivo: [$         ] ARS      │   │
│   │ ☑ Avisar mínimo histórico       │   │
│   │         [Crear watch]           │   │
│   └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```
