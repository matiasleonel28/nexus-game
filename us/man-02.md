# US-MAN-02: Organizar backlog con filtros y ordenamiento

> **Epic:** Manager · **Prioridad:** P0 · **Estado impl:** ⚠️ Parcial  
> **Dependencias:** MAN-01 (debe haber juegos en biblioteca)

## Historia

**Como** jugador con poco tiempo  
**quiero** filtrar y ordenar mi backlog por estado, plataforma, duración, coop y crossplay  
**para** decidir qué jugar en menos de 30 segundos.

---

## Criterios de Aceptación

### AC-1: Filtro por estado
```gherkin
Dado que tengo juegos en distintos estados
Cuando selecciono el tab/filtro "Jugando"
Entonces solo veo juegos con status = "jugando"
```

### AC-2: Filtro por plataforma
```gherkin
Dado que tengo juegos en PC, Switch 2 y Xbox
Cuando filtro por "PC"
Entonces solo veo juegos con owned_platform = "pc"
```

### AC-3: Filtro cooperativo
```gherkin
Dado que quiero armar noche coop
Cuando activo el filtro "Coop"
Entonces solo veo juegos con has_coop = true
  Y puedo combinar con filtro "Crossplay" para jugar entre PC y Xbox
```

### AC-4: Ordenamiento por duración
```gherkin
Dado que quiero algo cortito para el finde
Cuando ordeno por "Duración ↑"
Entonces veo primero los juegos más cortos según HLTB
  Y los juegos sin duración van al final
```

### AC-5: Ordenamiento por valor ($/hora)
```gherkin
Dado que quiero ver qué juego da más horas por peso
Cuando ordeno por "Valor ↑"
Entonces veo primero los juegos con menor $/hora (current_price / hltb_hours)
  Y los juegos sin precio o sin duración van al final
```

### AC-6: Ordenamiento por disfrute
```gherkin
Dado que quiero revisitar lo que más disfruté
Cuando ordeno por "Disfrute ↓"
Entonces veo primero los juegos con mayor puntaje de enjoyment (5→1)
  Y los juegos sin puntaje van al final
```

### AC-7: Ordenamiento por recién agregado
```gherkin
Dado que quiero ver mis últimas adquisiciones
Cuando ordeno por "Recientes"
Entonces veo primero los juegos agregados más recientemente (added_at desc)
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Filtro "Jugando" + sort "Duración ↑" | Juegos cortos que estoy jugando primero |
| 2 | Happy | Filtro "Coop" + "Crossplay" | Solo juegos coop crossplay |
| 3 | Happy | Tab "Pendiente" sin filtros | Todos los pendientes, orden default |
| 4 | Sad | Filtro activo sin resultados | "No tenés juegos que cumplan este filtro" |
| 5 | Edge | Todos los juegos sin duración HLTB + sort duration | Todos aparecen, orden por nombre como fallback |
| 6 | Edge | Combinar filtro plataforma + coop + sort valor | Los tres se aplican correctamente |
| 7 | Edge | Juego con precio 0 (free-to-play) | $/hora = 0, aparece primero en value_asc |
| 8 | Border | 0 juegos en biblioteca | Mensaje vacío con CTA "Buscá tu primer juego" |
| 9 | Border | 100+ juegos | Renderiza sin lag (virtual scroll o paginación futura) |

---

## Estado actualizado (julio 2026)
- **Filtro por duración implementado en frontend** (corta 0-10h / media 10-20h / larga +20h) — funciona como filter post-fetch.
- **Búsqueda en biblioteca** implementada (searchTerm en frontend).
- **Statuses renombrados**: backlog/playing/completed/abandoned.
- **Falta sort `enjoyment_desc`** y **`added_desc`** en el backend.
- **Falta filtro crossplay** (campo `has_crossplay` no existe en modelo).
- **Falta filtro coop en UI** (existe en backend pero no expuesto en Dashboard).
- **Vault feedback**: tabs de estado deberían ser dropdown/chips, no underline tabs (ver US-UX-06).

## Flujo UX propuesto

```
Dashboard:
┌─────────────────────────────────────────────────┐
│ [Pendiente] [Jugando] [Completado] [Abandonado] │  ← tabs por estado
├─────────────────────────────────────────────────┤
│ Filtros: [Plataforma ▾] [☐ Coop] [☐ Crossplay] │
│ Ordenar: [Duración ↑ ▾]                         │
├─────────────────────────────────────────────────┤
│ ┌──────┐ Celeste           PC   4.5h  ★★★★★    │
│ │cover │ Pendiente        $2.500  $556/h        │
│ └──────┘                                        │
│ ┌──────┐ Hades            PC   22h   ★★★★☆     │
│ │cover │ Pendiente       $4.200  $191/h         │
│ └──────┘                                        │
└─────────────────────────────────────────────────┘
```
