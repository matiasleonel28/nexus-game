# US-MAN-05: Medir el valor real de lo jugado

> **Epic:** Manager · **Prioridad:** P1 · **Estado impl:** ❌ No existe  
> **Dependencias:** MAN-01, MAN-03  
> **Bloquea:** Métricas de valor en MAN-02 (sort por disfrute)

## Historia

**Como** jugador  
**quiero** registrar mis horas jugadas y un puntaje de disfrute (1–5)  
**para** saber si mi tiempo y plata valieron la pena.

---

## Criterios de Aceptación

### AC-1: Registrar horas jugadas
```gherkin
Dado que tengo un juego en cualquier estado (excepto pendiente)
Cuando edito el campo "Horas jugadas" e ingreso 40
Entonces el valor se guarda en hours_played
  Y se muestra con clase .font-num (Space Mono tabular)
```

### AC-2: Registrar disfrute
```gherkin
Dado que tengo un juego en estado "Completado" o "Abandonado"
Cuando selecciono un puntaje de disfrute del 1 al 5
Entonces el valor se guarda en enjoyment
  Y se refleja visualmente (estrellas o barra)
```

### AC-3: Métricas derivadas — Disfrute/hora
```gherkin
Dado que un juego tiene enjoyment = 5 y hours_played = 40
Cuando veo la card del juego
Entonces veo la métrica "Disfrute/hora" calculada (0.125)
  Y esta métrica se usa para el sort enjoyment_desc
```

### AC-4: Métricas derivadas — $/hora real
```gherkin
Dado que un juego tiene current_price = 4000 y hours_played = 40
Cuando veo la card del juego
Entonces veo "$/hora: $100" calculado por el backend
  Y esta métrica usa hours_played (real), no hltb_main_hours (estimado)
```

### AC-5: Horas jugadas solo para juegos activos
```gherkin
Dado que un juego está en "Pendiente"
Cuando veo su card
Entonces el campo horas jugadas no es editable (no tiene sentido aún)
  Y solo se muestra la estimación HLTB
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Completado + 40h + disfrute 5 | Métricas visibles: disfrute/h y $/h |
| 2 | Happy | Jugando + 10h, sin disfrute aún | Solo se ve horas, disfrute queda vacío |
| 3 | Sad | Horas = 0 | Validación: "Ingresá al menos 0.5 horas" |
| 4 | Sad | Disfrute fuera de rango (0 o 6) | Validación: solo 1–5 |
| 5 | Edge | Juego sin precio + con horas | $/hora no se muestra (no hay con qué calcular) |
| 6 | Edge | Juego con horas pero sin disfrute | Disfrute/hora no se calcula |
| 7 | Edge | Horas decimales (2.5h) | Permitido, guardado como Float |
| 8 | Border | 0.1 horas (6 minutos) | Permitido |
| 9 | Border | 10000 horas | Permitido pero se podría mostrar warning "¿Seguro?" |

---

## Gap actual — CRITICO
- **`hours_played` y `enjoyment` NO EXISTEN en el modelo Game.**
- La spec los pone en `library_entries`, no en `games`.
- Sin estos campos, la feature core del producto ("valor real") no funciona.
- **Requiere migración de DB (Alembic).**

## Flujo UX propuesto

```
GameCard expandida (estado Completado):
┌──────────────────────────────────────────┐
│ ┌──────┐ Hollow Knight    PC             │
│ │cover │ Completado                      │
│ │      │                                 │
│ └──────┘ HLTB: 25h (main)               │
│                                          │
│  Mis horas: [40    ] h     ← input num   │
│  Disfrute:  ★★★★★  (5/5)  ← click stars │
│                                          │
│  ─── Valor real ───                      │
│  Disfrute/hora: 0.13                     │
│  $/hora real:   $100                     │
│  $/hora HLTB:   $160  (estimado)         │
└──────────────────────────────────────────┘
```
