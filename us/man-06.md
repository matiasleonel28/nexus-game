# US-MAN-06: Eliminar un juego de la biblioteca

> **Epic:** Manager · **Prioridad:** P1 · **Estado impl:** ✅ Completo (endpoint), ⚠️ Parcial (UX)  
> **Dependencias:** MAN-01

## Historia

**Como** jugador  
**quiero** eliminar un juego de mi biblioteca  
**para** limpiar entradas que agregué por error o que ya no me interesan.

---

## Criterios de Aceptación

### AC-1: Confirmación antes de eliminar
```gherkin
Dado que quiero eliminar un juego
Cuando presiono el botón de eliminar
Entonces aparece un ConfirmDialog "¿Eliminar Hollow Knight de tu biblioteca?"
  Y tiene botones "Cancelar" y "Eliminar" (rojo/--danger)
```

### AC-2: Eliminación en cascada
```gherkin
Dado que confirmo la eliminación
Cuando el backend procesa el DELETE
Entonces se eliminan: la entrada + sus plataformas + sus precios
  Y las alertas asociadas se conservan (referencia histórica)
  Y el juego desaparece de la vista con animación de salida
```

### AC-3: Deshacer (nice-to-have)
```gherkin
Dado que acabo de eliminar un juego
Cuando veo el toast de confirmación
Entonces tiene un botón "Deshacer" disponible por 5 segundos
  Y si lo presiono, el juego se restaura con sus datos originales
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Eliminar con confirmación | Juego desaparece, toast "Eliminado" |
| 2 | Sad | Cancelar eliminación | Nada cambia |
| 3 | Sad | Backend falla en DELETE | Error "No se pudo eliminar", juego persiste |
| 4 | Edge | Eliminar juego con watch activo | Watch también se elimina (cascade) |
| 5 | Edge | Eliminar último juego de la biblioteca | Vista vacía con CTA "Buscá tu primer juego" |
| 6 | Border | Double-click rápido en eliminar | Solo se envía un request |

---

## Notas
- El endpoint `DELETE /games/{id}` ya existe y funciona.
- Falta verificar que el `ConfirmDialog` se usa consistentemente.
