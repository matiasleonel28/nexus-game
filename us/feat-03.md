# US-FEAT-03: Racha y streak de juego

> **Epic:** Features · **Prioridad:** P2 · **Estado impl:** ❌ No existe  
> **Dependencias:** MAN-05 (hours_played tracking)  
> **Bloquea:** FEAT-01 (gamificación consume streak como input de puntos)

## Historia

**Como** jugador  
**quiero** ver mi racha de días consecutivos jugando y un resumen mensual de logros  
**para** mantener el hábito sin presión, con un recordatorio sutil de mi progreso.

---

## Criterios de Aceptación

### AC-1: Calcular racha de días consecutivos
```gherkin
Dado que actualicé hours_played en cualquier juego hoy
  Y ayer también lo hice
Cuando veo el Dashboard
Entonces veo "Llevás 2 días jugando" con el contador de racha
  Y la racha se basa en last_activity_date del modelo User
```

### AC-2: Reset de racha a las 48h
```gherkin
Dado que mi última actividad fue hace más de 48 horas
Cuando veo el Dashboard
Entonces la racha se reinicia a 0
  Y no veo mensaje de culpa ni penalización
```

### AC-3: Resumen mensual
```gherkin
Dado que completé 3 juegos este mes (estado cambió a "Completado")
Cuando veo el resumen mensual en el Dashboard
Entonces veo "Completaste 3 juegos en julio"
  Y veo las horas totales jugadas en el mes
```

### AC-4: Badge sutil en Dashboard
```gherkin
Dado que tengo una racha activa de 5 días
Cuando veo el Dashboard
Entonces veo un badge discreto con el número de días
  Y el badge usa --accent (ámbar) sin animaciones agresivas
  Y NO es un popup ni modal (solo un indicador en la UI)
```

### AC-5: Registrar actividad automáticamente
```gherkin
Dado que edito hours_played de cualquier juego vía PUT /backlog/{id}
Cuando el backend procesa la actualización
Entonces se actualiza last_activity_date = fecha actual en el User
  Y se recalcula el streak_count
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | 5 días consecutivos con actividad | Actividad cada día por 5 días | "Llevás 5 días jugando" |
| 2 | Happy | Completar 3 juegos en un mes | 3 cambios de estado a Completado en julio | "Completaste 3 juegos en julio" |
| 3 | Happy | Primer día de actividad | Primera vez que actualiza hours_played | "Llevás 1 día jugando" |
| 4 | Sad | Sin actividad por 48h | last_activity hace 49 horas | Racha = 0, sin mensaje de culpa |
| 5 | Sad | Usuario nuevo sin actividad | Nunca actualizó hours_played | Sin badge de racha (no mostrar "0 días") |
| 6 | Sad | Mes sin completar ningún juego | 0 juegos completados en el mes | Resumen muestra horas jugadas pero sin línea de completados |
| 7 | Edge | Actividad a las 23:59 y luego a las 00:01 | 2 minutos de diferencia, días distintos | Cuenta como 2 días consecutivos (correcto) |
| 8 | Edge | Actividad a las 23:59 y luego a las 23:59 del día siguiente+1 | ~48h justas | Racha se mantiene (umbral es >48h, no >=48h) |
| 9 | Edge | Zona horaria Argentina (UTC-3) | Actividad a medianoche AR | Se usa hora AR para el corte de día |
| 10 | Border | Racha de 365 días | Un año jugando todos los días | Se muestra el número sin límite |
| 11 | Border | Actualizar hours_played dos veces en el mismo día | Dos ediciones en la misma fecha | Cuenta como 1 día (no duplica) |
| 12 | Border | Cambiar estado a Completado sin haber actualizado horas | Solo cambio de estado, hours_played = 0 | Cuenta como actividad (cambio de estado = interacción) |

---

## Edge / Border Cases
- La racha se resetea a las 48h (no 24h) porque la vida pasa: turnos largos, viajes, días malos. Nexus no es Duolingo.
- El corte de "día" se calcula en UTC-3 (Argentina), no UTC.
- Si el usuario actualiza hours_played varias veces en el mismo día, solo cuenta como 1 día de actividad.
- El resumen mensual considera el mes calendario (1ro al último día), no 30 días rolling.
- Cambiar el estado de un juego (a cualquier estado) también cuenta como actividad, no solo editar horas.
- El badge de racha no aparece si streak_count = 0 (evitar "Llevás 0 días" que es deprimente).
- La gamificación (FEAT-01) puede dar puntos bonus por rachas largas, pero eso se implementa en FEAT-01, no acá.

---

## Modelo propuesto (cambios en User)

```python
# models.py — agregar a User:
last_activity_date = Column(Date, nullable=True)
streak_count = Column(Integer, default=0)
```

---

## Flujo UX propuesto

```
Dashboard — badge de racha (esquina superior):
┌──────────────────────────────────────────────┐
│  Mi biblioteca               🔥 5 días       │
│                                              │
│  [Jugando] [Pendiente] [Completado] [...]    │
│  ...                                         │
├──────────────────────────────────────────────┤
│  Julio 2026                                  │
│  Completaste 3 juegos · 42h jugadas          │
└──────────────────────────────────────────────┘
```

> Nota: el emoji de fuego es solo ilustrativo del wireframe. En la implementación real,
> usar un icono SVG acorde al design system (no emoji como icono — ver feedback-ui-patterns).

---

## Estado
- Implementado: No
- Prioridad: P2
- Esfuerzo: M (3-4 horas)
- Depende de: MAN-05
