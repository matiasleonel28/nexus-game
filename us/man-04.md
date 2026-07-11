# US-MAN-04: Filtrar noche cooperativa

> **Epic:** Manager · **Prioridad:** P1 · **Estado impl:** ⚠️ Parcial (falta crossplay)  
> **Dependencias:** MAN-01, MAN-02

## Historia

**Como** jugador  
**quiero** filtrar juegos cooperativos y crossplay en un click  
**para** organizar una sesión con amigos al instante.

---

## Criterios de Aceptación

### AC-1: Filtro coop
```gherkin
Dado que tengo juegos con has_coop = true y false
Cuando activo el toggle "Coop"
Entonces solo veo juegos cooperativos
```

### AC-2: Filtro crossplay
```gherkin
Dado que tengo juegos con has_crossplay = true
Cuando activo el toggle "Crossplay"
Entonces solo veo juegos que soportan crossplay
```

### AC-3: Combinación coop + crossplay
```gherkin
Dado que quiero jugar coop entre PC y Xbox
Cuando activo ambos toggles "Coop" y "Crossplay"
Entonces solo veo juegos que tienen AMBOS flags activos
```

### AC-4: Combinación con otros filtros
```gherkin
Dado que quiero coop en Xbox
Cuando activo "Coop" + filtro plataforma "Xbox"
Entonces solo veo juegos coop que tengo en Xbox
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Filtro coop activado | Solo juegos cooperativos |
| 2 | Happy | Coop + crossplay | Solo juegos coop con crossplay |
| 3 | Sad | Filtro coop sin resultados | "No tenés juegos coop" |
| 4 | Edge | Juego coop pero sin crossplay | Aparece con filtro coop solo, no con crossplay |
| 5 | Edge | IGDB no informa modo coop para un juego | has_coop = false por defecto, el usuario no puede editarlo aún |
| 6 | Border | Todos los juegos son coop | Filtro no cambia nada, todos se muestran |

---

## Gap actual
- **`has_crossplay` no existe en el modelo.** Necesita agregarse al modelo Game y resolverse desde IGDB al agregar.
- IGDB tiene `multiplayer_modes` con `onlinecoopmax` y `platform` — se puede inferir crossplay si hay coop online en más de una plataforma.
