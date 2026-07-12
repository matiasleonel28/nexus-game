# US-FEAT-01: Gamificación — Puntos por completar juegos

> **Epic:** Features · **Prioridad:** P3 (post-MVP) · **Estado impl:** ❌ No existe  
> **Dependencias:** MAN-03 (cambio de estado), MAN-05 (disfrute)

## Historia

**Como** jugador  
**quiero** ganar puntos o logros por completar juegos  
**para** sentir progreso y motivación para reducir mi backlog.

---

## Criterios de Aceptación

### AC-1: Puntos por completar
```gherkin
Dado que marco un juego como "Completado"
Cuando el estado se actualiza
Entonces gano puntos basados en:
  - Duración del juego (más horas = más puntos)
  - Disfrute registrado (bonus por alto disfrute)
  Y veo un toast con los puntos ganados
```

### AC-2: Nivel/rango del jugador
```gherkin
Dado que acumulo puntos
Cuando alcanzo ciertos umbrales
Entonces subo de nivel/rango visible en mi perfil
  Ej: Novato (0-100) → Veterano (100-500) → Leyenda (500+)
```

### AC-3: No penalizar abandono
```gherkin
Dado que abandono un juego
Cuando cambio su estado
Entonces NO pierdo puntos (la app no juzga, ayuda)
  Y opcionalmente gano puntos menores por "honestidad" (reconocer que no encaja)
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Completar juego de 40h con disfrute 5 | Puntos altos + toast |
| 2 | Happy | Completar juego corto (2h) | Puntos menores pero positivos |
| 3 | Edge | Completar y luego volver a "Jugando" | Puntos no se revocan |
| 4 | Border | 0 horas jugadas + completado | Puntos mínimos (base) |

---

## Notas
- **Post-MVP.** No implementar hasta que el core funcione.
- La gamificación debe motivar, no presionar. El espíritu de Nexus es anti-FOMO.
- Considerar que Matu es un jugador adulto — la gamificación debe ser sutil, no infantil.
