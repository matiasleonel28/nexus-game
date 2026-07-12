# US-INFRA-03: Limpieza de codigo muerto y fixes menores

## Historia
Como jugador, quiero que la app no tenga codigo muerto ni bugs cosmeticos para que funcione de forma mas limpia y profesional.

## Criterios de Aceptacion

### AC-1: Eliminar campo has_splitscreen del modelo Game
```gherkin
Dado que el campo Game.has_splitscreen existe en models.py
Cuando se elimina el campo y se corre la app
Entonces ningun endpoint ni vista falla por la ausencia del campo
```

### AC-2: Corregir rama else muerta en recommend.py
```gherkin
Dado que las lineas 53-57 de recommend.py tienen un else identico al if
Cuando se reemplaza la logica duplicada por la rama correcta
Entonces la recomendacion produce resultados distintos segun la condicion
```

### AC-3: Eliminar endpoint de debug GET /hunter/raw
```gherkin
Dado que existe el endpoint GET /hunter/raw sin consumidor en el frontend
Cuando se elimina la ruta del router
Entonces una request a GET /hunter/raw devuelve 404
Y no se exponen datos crudos del hunter
```

### AC-4: Corregir placeholder de GameCard a espanol
```gherkin
Dado que GameCard.jsx muestra "No Cover" cuando no hay imagen
Cuando se actualiza el texto
Entonces el placeholder muestra "Sin Caratula"
```

### AC-5: Agregar .font-num a displays de descuento
```gherkin
Dado que los porcentajes de descuento en HunterView y WishlistView no usan .font-num
Cuando se agrega la clase font-num a los 3 elementos de descuento
Entonces los numeros se renderizan con font-variant-numeric: tabular-nums
Y los porcentajes no saltan de ancho al cambiar de valor
```

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Game sin has_splitscreen funciona | GET /game/123 | 200 OK, respuesta sin campo has_splitscreen |
| 2 | Happy | Recommend con condicion verdadera | Usuario con >10 juegos | Recomendacion basada en la rama correcta del if |
| 3 | Happy | Recommend con condicion falsa | Usuario con <3 juegos | Recomendacion basada en la rama else (distinta al if) |
| 4 | Happy | Endpoint debug eliminado | GET /hunter/raw | 404 Not Found |
| 5 | Happy | Placeholder en espanol | GameCard sin imagen de portada | Muestra "Sin Caratula" |
| 6 | Happy | Descuentos con font-num | HunterView con deal -75% | Numero renderizado con tabular-nums |
| 7 | Sad | Migracion pendiente | Campo eliminado sin migracion | Alembic detecta el cambio pendiente |
| 8 | Sad | Busqueda por has_splitscreen | Filtro inexistente en query | Error controlado, no 500 |

## Edge / Border Cases
- Si algun seed o fixture referencia has_splitscreen, hay que limpiarlo tambien.
- Verificar que ningun test unitario mockea has_splitscreen.
- El placeholder "Sin Caratula" debe respetar el encoding UTF-8 (la u con dieresis en "Caratula" -> Caratula es sin tilde, pero "Caratula" se escribe "Caratula" en argentino tambien; mantener "Sin Caratula" sin acentos raros).
- El endpoint /hunter/raw podria estar documentado en algun lado (Postman, CLAUDE.md); limpiar referencias.

## Estado
- Implementado: No
- Prioridad: P1
- Esfuerzo: S
- Depende de: -
