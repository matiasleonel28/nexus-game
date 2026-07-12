# US-FEAT-10: Descubrimiento de juegos similares

> **Epic:** Features · **Prioridad:** P3 (post-MVP) · **Estado impl:** ❌ No existe  
> **Dependencias:** MAN-05 (enjoyment rating), HUNT-01 (precios para sugerencias)  
> **Esfuerzo:** M (4-5 horas)

## Historia

**Como** jugador que completó un juego con alto disfrute  
**quiero** ver juegos similares que ya tengo en mi backlog o que están en oferta  
**para** descubrir qué jugar después sin buscar manualmente.

---

## Criterios de Aceptación

### AC-1: Sugerir similares al completar con alto disfrute
```gherkin
Dado que marco un juego como "Completado" con enjoyment >= 4
Cuando se guarda el cambio de estado
Entonces aparece una card/sección "¿Te gustó {nombre}? Mirá estos:"
  Y muestra juegos similares divididos en:
  - "En tu backlog": juegos similares que ya tenés pendientes
  - "En oferta": juegos similares con precio actual rebajado
```

### AC-2: Endpoint de juegos similares
```gherkin
Dado que el frontend necesita la lista de similares
Cuando se llama a GET /games/{id}/similar
Entonces el backend:
  - Consulta IGDB por el campo similar_games del juego
  - Filtra los que coinciden en género/themes con el juego original
  - Cruza contra el backlog del usuario (marca "ya lo tenés")
  - Cruza contra wishlist del usuario (marca "en tu wishlist")
  - Consulta precios actuales via prices_hub para los que no tiene el usuario
  Y devuelve la lista ordenada por relevancia (match de género > precio bajo)
```

### AC-3: Acceso desde detalle del juego
```gherkin
Dado que quiero ver similares de un juego sin haberlo completado recién
Cuando abro el detalle de cualquier juego en mi biblioteca
Entonces hay una sección "Juegos similares" visible
  Y funciona igual que la sugerencia post-completado
  Y no requiere enjoyment mínimo (es consulta manual)
```

### AC-4: Card de juego similar con precio
```gherkin
Dado que un juego similar está en oferta
Cuando veo la card del juego sugerido
Entonces muestra:
  - Cover, nombre y plataformas disponibles
  - Precio actual con descuento (si aplica) en .font-num
  - Badge "En tu backlog" o "En tu wishlist" si corresponde
  - Botón para agregar a wishlist o backlog directamente
```

### AC-5: Sin similares disponibles
```gherkin
Dado que un juego no tiene similar_games en IGDB
  O ninguno de los similares tiene datos de precio
Cuando veo la sección de similares
Entonces se muestra "No encontramos juegos similares por ahora"
  Y la sección no ocupa espacio innecesario (se colapsa)
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Completar Hollow Knight con disfrute 5 | Estado -> Completado, enjoyment: 5 | Card con similares: Ori (en backlog), Blasphemous ($1.200 en Steam) |
| 2 | Happy | Ver similares desde detalle de juego | Click en sección "Similares" de cualquier juego | Lista de similares con precios y estado en biblioteca |
| 3 | Happy | Agregar sugerido a wishlist desde la card | Click "Agregar a wishlist" en Blasphemous | Se agrega a wishlist, badge cambia a "En tu wishlist" |
| 4 | Sad | Completar juego con disfrute 2 | Estado -> Completado, enjoyment: 2 | No se muestra la sugerencia post-completado (bajo disfrute) |
| 5 | Sad | Juego sin similar_games en IGDB | Juego indie sin datos de similares | Mensaje "No encontramos juegos similares" |
| 6 | Sad | IGDB devuelve error o timeout | Fallo en la consulta de similares | Sección oculta, sin error visible al usuario |
| 7 | Edge | Todos los similares ya están en el backlog | 5 similares, todos ya agregados | Se muestran con badge "Ya lo tenés", sin sección "En oferta" |
| 8 | Edge | Similar está en backlog Y en oferta con precio bajo | Ori en backlog + precio rebajado a $500 | Se muestra en "En tu backlog" con nota del precio actual |
| 9 | Edge | Juego similar de PS5 (sin precios en Nexus) | Similar solo disponible en PS5 | Se muestra sin precio (PS5 no tiene tracking de precios) |
| 10 | Border | Completar con enjoyment exactamente 4 (umbral) | Estado -> Completado, enjoyment: 4 | Se muestra la sugerencia (4 es >= 4) |
| 11 | Border | IGDB devuelve 50+ similares | Juego popular tipo Zelda | Se limitan a los 10 más relevantes por match de género |
| 12 | Border | Completar juego sin enjoyment registrado (null) | Completado sin cargar disfrute | No se muestra sugerencia post-completado (enjoyment es null, no >= 4) |

---

## Edge / Border Cases
- El campo `similar_games` de IGDB es una lista de IDs. Se necesita una segunda query a IGDB para obtener nombre, cover y géneros de cada similar.
- La relevancia se calcula por cantidad de géneros/themes en común con el juego original. Si hay empate, se priorizan los que están en oferta.
- Los precios se consultan en tiempo real via prices_hub (ITAD + Nintendo). Si el servicio de precios está caído, se muestran los similares sin precio.
- Si el juego similar ya fue completado o abandonado por el usuario, no se muestra en las sugerencias (solo pendientes o no-propios).
- La sugerencia post-completado es un one-shot: se muestra al cambiar estado, si el usuario la cierra no se vuelve a mostrar automáticamente. Puede acceder después desde el detalle del juego.
- El endpoint GET /games/{id}/similar debería cachear el resultado de IGDB por 24h para no repetir queries pesadas.
- Juegos con géneros muy genéricos (ej: "Adventure") pueden generar similares poco relevantes. Considerar ponderar themes por encima de genres para mejor precisión.

---

## Estado
- Implementado: No
- Prioridad: P3
- Esfuerzo: M (4-5 horas)
- Depende de: MAN-05, HUNT-01
