# US-FEAT-06: Permiso para abandonar (micro-copy motivacional)

> **Epic:** Features · **Prioridad:** P1 · **Estado impl:** No  
> **Dependencias:** MAN-03 (cambio de estado), MAN-05 (hours_played)

## Historia

**Como** jugador  
**quiero** que al abandonar un juego la app me diga algo copado en vez de solo cambiar el estado  
**para** no sentir culpa y validar que mi tiempo vale mas que forzar un juego que no me copa.

---

## Criterios de Aceptacion

### AC-1: Modal motivacional al abandonar
```gherkin
Dado que cambio el estado de un juego a "Abandonado"
Cuando confirmo la accion
Entonces aparece un modal con micro-copy motivacional
  Ej: "Abandonar no es perder. Le dedicaste 8h a este juego y ya sabes que no es para vos. Tu tiempo vale mas."
  Y si el juego tiene hours_played, el mensaje incluye las horas reales
  Y si no tiene hours_played, el mensaje omite la referencia a horas
```

### AC-2: Campo opcional "Por que lo dejaste"
```gherkin
Dado que veo el modal de abandono
Cuando quiero explicar por que lo dejo
Entonces hay un campo de texto opcional con placeholder "Por que lo dejaste? (opcional)"
  Y puedo escribir texto libre (max 500 caracteres)
  Y al confirmar, el texto se guarda como abandon_reason en el modelo Game
  Y si dejo el campo vacio, se guarda null (no string vacio)
```

### AC-3: Persistencia de abandon_reason
```gherkin
Dado que guarde un abandon_reason al abandonar un juego
Cuando veo el detalle del juego en estado "Abandonado"
Entonces puedo ver la razon que escribi
  Y el campo abandon_reason es nullable (string o null) en el modelo Game
```

### AC-4: Variedad en el micro-copy
```gherkin
Dado que abandono multiples juegos
Cuando veo el modal cada vez
Entonces el mensaje motivacional rota entre al menos 5 variantes
  Y todas mantienen un tono calido, validador, argentino
  Y ninguna juzga ni usa tono infantil
```

### AC-5: No mostrar modal si vuelvo atras
```gherkin
Dado que cambio el estado de un juego a "Abandonado"
Cuando veo el modal motivacional
  Y decido cancelar (boton "Cancelar" o cerrar modal)
Entonces el estado NO se cambia
  Y no se guarda ningun abandon_reason
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Abandonar juego con 15h jugadas | status -> abandoned, hours_played=15 | Modal con "Le dedicaste 15h..." + campo razon |
| 2 | Happy | Abandonar juego sin horas registradas | status -> abandoned, hours_played=null | Modal sin mencion de horas, texto generico motivacional |
| 3 | Happy | Escribir razon de abandono | abandon_reason="El combate se volvio repetitivo" | Razon guardada en DB, visible en detalle |
| 4 | Happy | Abandonar sin escribir razon | abandon_reason dejado vacio | Se guarda null, modal cierra ok |
| 5 | Sad | Cancelar el modal de abandono | Click en Cancelar | Estado no cambia, sigue en estado anterior |
| 6 | Sad | Backend falla al guardar | Error 500 en PATCH | Rollback optimistic, toast de error, modal se cierra |
| 7 | Edge | Abandonar juego ya abandonado (re-abandonar) | Status ya es "Abandonado" | No deberia aparecer la opcion (ya esta abandonado) |
| 8 | Edge | Abandonar y luego volver a "Jugando" | Abandoned -> Jugando | Permitido, abandon_reason se conserva (no se borra) |
| 9 | Edge | Texto con 500 caracteres exactos | abandon_reason de 500 chars | Se acepta, se guarda completo |
| 10 | Border | Texto con 501+ caracteres | abandon_reason > 500 chars | Frontend trunca o bloquea, validacion en backend tambien |

---

## Edge / Border Cases

- **Multiples abandonos del mismo juego:** si un jugador abandona, vuelve a jugar y vuelve a abandonar, el abandon_reason se sobreescribe con el nuevo. No se guarda historial de razones (MVP simple).
- **Micro-copy con horas decimales:** si hours_played es 0.5, mostrar "media hora" en vez de "0.5h". Si es < 1h, adaptar el copy ("Le diste una oportunidad rapida").
- **Tono argentino:** usar voseo ("vos sabes", "dedicaste"), sin lunfardo excesivo. El tono es el de un amigo que te banca, no un coach motivacional.
- **Accesibilidad:** el modal debe ser accesible con teclado (focus trap, Escape para cerrar, Enter para confirmar).
- **Animacion:** el modal aparece con fade suave (200ms), no blocky. Al confirmar, la card se anima igual que cualquier cambio de estado (AC-3 de MAN-03).

---

## Micro-copy propuesto (variantes)

1. "Abandonar no es perder. Le dedicaste {hours}h a este juego y ya sabes que no es para vos. Tu tiempo vale mas."
2. "No todos los juegos son para todos. Reconocer eso es de jugador inteligente."
3. "Listo, lo soltas. {hours}h bien invertidas en descubrir lo que te gusta y lo que no."
4. "Mejor dejarlo que forzarlo. Tu backlog te lo va a agradecer."
5. "Un juego menos en la lista, mas claridad sobre lo que realmente queres jugar."

(Si no hay hours_played, las variantes 1 y 3 se reemplazan por versiones sin horas.)

---

## Notas tecnicas

- **Backend:** agregar campo `abandon_reason` (String, nullable) al modelo `Game` en `models.py`. Migracion Alembic.
- **Frontend:** modal en `GameCard.jsx` que intercepta el cambio a "Abandonado" antes de ejecutar el PATCH.
- **Esfuerzo estimado:** S (2-3 horas).

## Estado
- Implementado: No
- Prioridad: P1
- Esfuerzo: S
- Depende de: MAN-03, MAN-05
