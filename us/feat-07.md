# US-FEAT-07: Modo coop night

> **Epic:** Features · **Prioridad:** P2 · **Estado impl:** No  
> **Dependencias:** MAN-04 (filtro coop), MAN-01 (backlog CRUD)

## Historia

**Como** jugador  
**quiero** armar una lista de juegos coop filtrada por cantidad de jugadores, tiempo disponible y mood  
**para** elegir rapido que jugar en una noche de coop con amigos y compartirles las opciones.

---

## Criterios de Aceptacion

### AC-1: Wizard de coop night
```gherkin
Dado que tengo juegos con has_coop=true en mi backlog
Cuando activo "Noche de coop" desde el Dashboard
Entonces se abre un wizard/modal con 3 preguntas:
  1. "Cuantos jugadores?" (selector numerico, 2-8)
  2. "Cuanto tiempo tienen?" (opciones: "1-2h", "3-4h", "Toda la noche")
  3. "Que onda prefieren?" (opciones: "Relajado", "Desafiante", "Lo que venga")
```

### AC-2: Lista filtrada de resultados
```gherkin
Dado que complete el wizard con players=4, tiempo="3-4h", mood="Relajado"
Cuando veo los resultados
Entonces Nexus muestra juegos de mi backlog que:
  - Tienen has_coop=true
  - Su duracion (main_story de HLTB) encaja en el rango de tiempo
  - Si mood="Relajado", prioriza generos como puzzle, platformer, party
  - Si mood="Desafiante", prioriza generos como souls-like, roguelike, strategy
  Y cada card muestra: nombre, cover, plataforma, duracion estimada por sesion
```

### AC-3: Link compartible sin auth
```gherkin
Dado que tengo una lista de coop night generada
Cuando hago click en "Compartir con amigos"
Entonces se genera un link unico /coop/{token}
  Y el token es un UUID (no expira por ahora, MVP)
  Y cualquier persona con el link puede ver la lista (read-only, sin login)
  Y la pagina compartida muestra los juegos con cover, nombre y plataforma
  Y NO muestra datos privados (precios, horas jugadas, estados)
```

### AC-4: Endpoint de coop night
```gherkin
Dado que consumo GET /backlog/coop-night?players=4&max_hours=4&mood=relajado
Cuando tengo juegos coop en mi backlog
Entonces la respuesta incluye una lista filtrada de juegos
  Y cada juego tiene: id, title, cover_url, platform, estimated_session_hours
  Y la lista esta ordenada por relevancia (mejor match primero)
```

### AC-5: Pagina compartida /coop/{token}
```gherkin
Dado que accedo a /coop/{token} sin estar logueado
Cuando el token es valido
Entonces veo la lista de juegos curada
  Y veo un titulo "Noche de coop de [username]"
  Y el diseno es limpio, mobile-friendly (los amigos van a abrirlo en el celu)
  Y no hay opciones de edicion ni navegacion a otras partes de Nexus
```

### AC-6: Token invalido
```gherkin
Dado que accedo a /coop/{token} con un token que no existe
Cuando la pagina carga
Entonces veo un mensaje amigable "Este link no existe o ya no esta disponible"
  Y no se expone informacion del sistema
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | 10 juegos coop, wizard completo | players=2, max_hours=2, mood=relajado | Lista filtrada de juegos cortos y relajados |
| 2 | Happy | Compartir link, amigo lo abre en celular | Token valido, acceso mobile | Pagina responsive con lista de juegos, sin login |
| 3 | Happy | Mood "Lo que venga" | mood=cualquiera | Todos los juegos coop sin filtro de genero |
| 4 | Sad | 0 juegos coop en backlog | Backlog sin has_coop=true | Mensaje "No tenes juegos coop. Agrega algunos a tu backlog." |
| 5 | Sad | Juegos coop pero ninguno matchea el filtro | players=8, max_hours=1 | "Ningun juego matchea estos filtros. Proba con filtros mas amplios." |
| 6 | Sad | Token invalido o expirado | /coop/uuid-inexistente | Pagina 404 amigable |
| 7 | Edge | Juego coop sin duracion HLTB | has_coop=true, main_story=null | Incluir en resultados pero sin estimacion de sesion |
| 8 | Edge | Toda la noche (sin limite de horas) | max_hours=null/"unlimited" | No filtrar por duracion, mostrar todos los coop |
| 9 | Edge | Backlog con 200+ juegos coop | Muchos juegos | Limitar resultados a top 20, ordenados por relevancia |
| 10 | Border | Juego con has_coop=true pero genero desconocido | genre=null | Incluir en resultados de mood="Lo que venga", excluir de relajado/desafiante |
| 11 | Border | Usuario no autenticado intenta crear coop night | Sin JWT | 401, redirigir a login |
| 12 | Border | Compartir multiples veces | Click en "Compartir" 3 veces | Mismo token si ya existe uno para esa configuracion, o nuevo token cada vez (definir) |

---

## Edge / Border Cases

- **Generos y mood:** la clasificacion "relajado" vs "desafiante" es una heuristica basada en generos de IGDB. Mantener un mapping simple en el backend (dict de genero -> mood). Si un juego tiene multiples generos, usar el primero.
- **Duracion por sesion:** para "Toda la noche" no filtrar por duracion. Para "1-2h" y "3-4h", comparar contra `main_story` de HLTB (no `completionist`). Si main_story > max_hours, excluir.
- **Juegos sin plataforma coop clara:** `has_coop` es un flag booleano. No distingue entre coop online y local por ahora. Considerar agregar esa distincion en una iteracion futura.
- **Limpieza de tokens:** MVP sin expiracion. Considerar un job futuro que limpie tokens > 30 dias.
- **Privacidad:** la pagina compartida NO debe exponer precios, estados, horas jugadas ni abandon_reason. Solo nombre, cover y plataforma.
- **Votacion de amigos:** mencionada en el brief pero fuera de scope para MVP. Considerar como extension futura (cada amigo clickea un "Me copa" en la pagina compartida).

---

## Flujo UX propuesto

```
Dashboard — boton "Noche de coop"
┌──────────────────────────────────────────────┐
│  Noche de coop                               │
│                                              │
│  Cuantos jugadores?      [  2  ] [+] [-]     │
│                                              │
│  Cuanto tiempo tienen?                       │
│  ( ) 1-2 horas                               │
│  (x) 3-4 horas                               │
│  ( ) Toda la noche                           │
│                                              │
│  Que onda prefieren?                         │
│  ( ) Relajado                                │
│  ( ) Desafiante                              │
│  (x) Lo que venga                            │
│                                              │
│  [Buscar juegos]                             │
└──────────────────────────────────────────────┘

Resultados:
┌──────────────────────────────────────────────┐
│  Para esta noche:                   [Compartir]│
├──────────────────────────────────────────────┤
│  ┌──────┐ Overcooked 2      Switch           │
│  │cover │ ~2h por sesion                     │
│  └──────┘                                    │
│  ┌──────┐ It Takes Two       PC              │
│  │cover │ ~3h por sesion                     │
│  └──────┘                                    │
│  ┌──────┐ Stardew Valley     PC              │
│  │cover │ Duracion libre                     │
│  └──────┘                                    │
└──────────────────────────────────────────────┘
```

---

## Notas tecnicas

- **Backend:** nuevo endpoint `GET /backlog/coop-night` con query params `players`, `max_hours`, `mood`. Nuevo modelo o tabla simple para tokens compartibles (uuid, user_id, game_ids, created_at). Endpoint publico `GET /coop/{token}` sin auth.
- **Frontend:** wizard/modal `CoopNight.jsx` en Dashboard. Pagina publica `/coop/{token}` con ruta sin AuthContext.
- **Esfuerzo estimado:** L (5-6 horas).

## Estado
- Implementado: No
- Prioridad: P2
- Esfuerzo: L
- Depende de: MAN-04, MAN-01
