# US-FEAT-02: Planificador semanal

> **Epic:** Features · **Prioridad:** P1 · **Estado impl:** ❌ No existe  
> **Dependencias:** MAN-05 (hours_played), UX-01 (available_hours_per_week)  
> **Bloquea:** —

## Historia

**Como** jugador  
**quiero** ver un plan semanal que distribuya mis juegos del backlog según mis horas disponibles  
**para** organizar mi tiempo de juego sin sentir que pierdo el foco.

---

## Criterios de Aceptación

### AC-1: Generar plan semanal automático
```gherkin
Dado que tengo available_hours_per_week configurado (ej: 10)
  Y tengo juegos en estado "Jugando" o "Pendiente" con hltb_main_hours
Cuando accedo al endpoint GET /backlog/weekly-plan
Entonces recibo un plan distribuido en días (Lunes a Domingo)
  Y cada día tiene juegos asignados con horas sugeridas
  Y el total planificado no excede available_hours_per_week
```

### AC-2: Considerar progreso actual
```gherkin
Dado que un juego tiene hltb_main_hours = 25 y hours_played = 20
Cuando se genera el plan
Entonces las horas restantes calculadas son 5 (25 - 20)
  Y el juego se prioriza por tener pocas horas restantes
```

### AC-3: Mostrar resumen de horas
```gherkin
Dado que se generó un plan semanal
Cuando veo el componente WeeklyPlanner
Entonces veo "Horas planificadas: 8 / 10 disponibles"
  Y las horas se muestran con clase .font-num (Space Mono tabular)
```

### AC-4: Drag-and-drop para ajustar
```gherkin
Dado que veo el plan semanal generado
Cuando arrastro un juego de "Martes" a "Jueves"
Entonces el juego se mueve al día destino
  Y los totales por día se recalculan
  Y el plan ajustado se persiste (PUT /backlog/weekly-plan)
```

### AC-5: Sin horas configuradas
```gherkin
Dado que no completé el onboarding (available_hours_per_week = null)
Cuando intento acceder al planificador
Entonces veo un mensaje "Configurá tus horas semanales en tu perfil"
  Y un link directo al onboarding/perfil
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | 10h disponibles, 3 juegos activos con horas restantes variadas | available=10, juegos con 3h, 5h, 15h restantes | Plan distribuido L-D, prioriza los de pocas horas |
| 2 | Happy | Juego casi terminado (2h restantes) | hltb=25, played=23 | "Lunes: terminar Celeste (2h restantes)" |
| 3 | Happy | Drag-and-drop de juego entre días | Mover Hades de martes a jueves | Juego movido, totales recalculados |
| 4 | Sad | Sin juegos en backlog activo | Backlog vacío (solo completados/abandonados) | "No tenés juegos activos para planificar" |
| 5 | Sad | Sin horas configuradas | available_hours_per_week = null | Redirige a configurar perfil |
| 6 | Sad | Horas disponibles = 0 | available_hours_per_week = 0 | "Configurá al menos 1 hora semanal" |
| 7 | Edge | Horas restantes > horas disponibles en toda la semana | 1 juego con 80h restantes, 10h/semana | Plan solo para esta semana (10h), sin forzar todo |
| 8 | Edge | Juego sin hltb_main_hours | hltb = null | Juego aparece pero sin estimación, se excluye del cálculo auto |
| 9 | Edge | Todos los juegos ya completados | hours_played >= hltb en todos | "No hay juegos pendientes de horas" |
| 10 | Border | hours_played > hltb_main_hours | played=30, hltb=25 | Horas restantes = 0, no se agenda (ya lo pasó) |
| 11 | Border | available_hours_per_week = 0.5 | 30 min semanales | Plan válido con bloques chicos |
| 12 | Border | 20 juegos activos, 5h disponibles | Muchos juegos, pocas horas | Solo los 2-3 de mayor prioridad, resto queda fuera |

---

## Edge / Border Cases
- Si el usuario tiene juegos en "Jugando" y en "Pendiente", priorizar "Jugando" (ya arrancó).
- Si hltb_main_hours no existe para un juego, mostrarlo aparte como "sin estimación" y no incluirlo en el cálculo automático de distribución.
- Si hours_played supera hltb_main_hours, no asignar horas negativas; tratarlo como "ya completado en tiempo".
- El plan es sugerido, no obligatorio. El usuario puede ignorarlo o reorganizarlo con drag-and-drop.
- Si available_hours_per_week cambia después de generar un plan, el próximo GET regenera con el valor nuevo.
- Días sin juegos asignados son válidos (no forzar actividad todos los días).

---

## Flujo UX propuesto

```
Dashboard — sección WeeklyPlanner:
┌────────────────────────────────────────────────────┐
│  Planificador semanal          8 / 10 h (.font-num)│
├────────┬────────┬────────┬────────┬────────────────┤
│ Lunes  │ Martes │ Miérc. │ Jueves │ Vier.          │
│        │        │        │        │                │
│ Celeste│ Hades  │ Hades  │(vacío) │ Tunic          │
│ 2h     │ 2h     │ 2h     │        │ 2h             │
│ TERMIN.│        │        │        │                │
├────────┴────────┴────────┴────────┴────────────────┤
│ Arrastrá juegos entre días para reorganizar        │
└────────────────────────────────────────────────────┘
```

---

## Estado
- Implementado: No
- Prioridad: P1
- Esfuerzo: L (6-8 horas)
- Depende de: MAN-05, UX-01
