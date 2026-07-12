# US-INFRA-05: Notificaciones reales en check_releases

## Historia
Como jugador, quiero recibir alertas cuando un juego de mi wishlist est por salir, para no perderme ning lanzamiento importante.

## Criterios de Aceptacion

### AC-1: Crear alerta de lanzamiento proximo
```gherkin
Dado que el scheduler check_releases se ejecuta a las 9am
  Y un juego en mi wishlist tiene fecha de lanzamiento dentro de los proximos 7 dias
Cuando el job procesa ese juego
Entonces se crea un registro Alert con alert_type "release_soon"
  Y el campo message incluye el nombre del juego y la fecha de lanzamiento
  Y el campo user_id corresponde al dueno de la wishlist
```

### AC-2: Visualizar alerta en AlertsView
```gherkin
Dado que existen alertas de tipo "release_soon" para mi usuario
Cuando abro la vista de Alertas
Entonces veo las alertas de lanzamiento junto con las alertas de precio
  Y cada alerta muestra el nombre del juego, la fecha y un icono distintivo
```

### AC-3: Badge en navegacion
```gherkin
Dado que tengo alertas no leidas de tipo "release_soon"
Cuando veo el menu de navegacion
Entonces el item "Alertas" muestra un badge con la cantidad de alertas no leidas
  Y el badge se actualiza al marcar alertas como leidas
```

### AC-4: No duplicar alertas
```gherkin
Dado que ya existe una alerta "release_soon" para un juego y usuario
Cuando check_releases vuelve a ejecutarse
Entonces no se crea una alerta duplicada para el mismo juego
```

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Juego sale en 3 dias | wishlist con juego, release_date = hoy + 3 | Se crea Alert release_soon |
| 2 | Happy | Multiples juegos proximos | wishlist con 3 juegos, todos salen en <7 dias | Se crean 3 alertas distintas |
| 3 | Happy | Badge se muestra | 2 alertas no leidas | Badge muestra "2" |
| 4 | Sad | Juego sale en 15 dias | wishlist con juego, release_date = hoy + 15 | No se crea alerta |
| 5 | Sad | Juego sin fecha de lanzamiento | wishlist con juego, release_date = null | No se crea alerta |
| 6 | Sad | Wishlist vacia | usuario sin juegos en wishlist | No se crean alertas, job termina ok |
| 7 | Edge | Alerta ya existe | alerta previa para mismo juego/usuario | No se duplica |
| 8 | Edge | Juego sale hoy | release_date = hoy | Se crea alerta (dia 0 esta dentro de 7) |
| 9 | Edge | Juego salio ayer | release_date = hoy - 1 | No se crea alerta |

## Edge / Border Cases
- Juego con fecha de lanzamiento que cambia (se postpone): la alerta creada queda, no se borra automaticamente. Considerar limpiar alertas huerfanas.
- Zona horaria: check_releases corre a las 9am hora del servidor; si el usuario esta en otra zona horaria, el "dentro de 7 dias" puede diferir por un dia.
- Multiples usuarios con el mismo juego en wishlist: se crea una alerta por usuario.
- Si el job falla a mitad de ejecucion, las alertas ya creadas persisten (operacion no transaccional por diseno).

## Estado
- Implementado: No
- Prioridad: P2
- Esfuerzo: M
- Depende de: HUNT-02
