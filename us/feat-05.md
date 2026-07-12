# US-FEAT-05: Predictor de ofertas

> **Epic:** Features · **Prioridad:** P2 · **Estado impl:** No  
> **Dependencias:** HUNT-03 (price_history + curva de precios)

## Historia

**Como** jugador  
**quiero** ver predicciones de cuando un juego va a estar en oferta  
**para** decidir si comprar ahora o esperar a la siguiente sale y ahorrar plata.

---

## Criterios de Aceptacion

### AC-1: Prediccion basada en historico
```gherkin
Dado que un juego en mi wishlist tiene historial de precios con al menos 2 ciclos de oferta
Cuando abro su card en WishlistView
Entonces veo una prediccion del tipo:
  "Elden Ring suele bajar en Steam Summer Sale (junio). Precio probable: ~$3.200 basado en historico"
  Y el precio probable se muestra con clase .font-num
```

### AC-2: Badge "Esperar" dentro de 60 dias
```gherkin
Dado que la prediccion indica una sale conocida dentro de los proximos 60 dias
Cuando veo la card del juego en la wishlist
Entonces aparece un badge "Esperar" con color --accent (ambar)
  Y el badge incluye tooltip con la fecha estimada y el precio probable
```

### AC-3: Sin datos suficientes para predecir
```gherkin
Dado que un juego tiene historial de precios pero sin patron estacional detectado
  O tiene menos de 2 ciclos de oferta registrados
Cuando veo la card del juego
Entonces NO se muestra prediccion
  Y no aparece ningun badge de espera
  Y la seccion de prediccion dice "Sin suficiente historial para predecir"
```

### AC-4: Endpoint de prediccion
```gherkin
Dado que consumo GET /hunter/game/{id}/prediction
Cuando el juego tiene historial suficiente
Entonces la respuesta incluye:
  - predicted_sale_name (ej: "Steam Summer Sale")
  - predicted_date_range (ej: "2026-06-25 a 2026-07-09")
  - predicted_price (precio estimado en ARS)
  - confidence ("alta" si 3+ ciclos, "media" si 2 ciclos)
  - should_wait (boolean, true si la sale esta a <= 60 dias)
```

### AC-5: Sales conocidas de Steam
```gherkin
Dado que el servicio price_predictor conoce las fechas tipicas de Steam:
  - Summer Sale: ultima semana de junio (~25 jun - 9 jul)
  - Autumn Sale: ultima semana de noviembre (~21-28 nov)
  - Winter Sale: tercera semana de diciembre (~19 dic - 2 ene)
  - Spring Sale: mediados de marzo (~13-20 mar)
Cuando analiza el historial de un juego
Entonces cruza las fechas de precios minimos con estas ventanas
  Y detecta en cuales sales el juego participo historicamente
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Juego con 3 Summer Sales registradas, estamos en mayo | game_id con historial jun 2024/2025/2026 | Badge "Esperar", prediccion Summer Sale junio, confidence alta |
| 2 | Happy | Juego con 2 Winter Sales, estamos en octubre | game_id con historial dic 2024/2025 | Badge "Esperar" (60 dias), prediccion Winter Sale diciembre |
| 3 | Happy | Juego con historial pero sale pasada hace 2 meses | game_id, ultima sale fue en marzo | Sin badge "Esperar", prediccion de proxima sale futura |
| 4 | Sad | Juego sin historial de precios | game_id sin price_history | 404 o respuesta con predicted: null, mensaje "sin historial" |
| 5 | Sad | Juego con historial pero sin patron (precios estables) | game_id, precio constante 12 meses | Sin prediccion, "sin patron estacional detectado" |
| 6 | Edge | Juego F2P (precio siempre 0) | game_id con precio $0 historico | Sin prediccion (no aplica) |
| 7 | Edge | Sale predicha para manana (dentro de 1 dia) | game_id, sale empieza manana | Badge "Esperar" con urgencia, tooltip "Empieza manana" |
| 8 | Edge | Juego solo en eShop (sin sales de Steam) | game_id solo con precios Nintendo | Sin prediccion de Steam sales, solo datos de eShop si hay patron |
| 9 | Border | Juego que participo en TODAS las sales de Steam | game_id con 4+ sales/anio | Prediccion de la sale mas cercana, confidence alta |
| 10 | Border | Fecha actual es durante una sale activa | game_id, estamos en Summer Sale | Sin badge "Esperar" (la sale ya esta activa), mostrar precio actual |

---

## Edge / Border Cases

- **Cambio de precio base:** si el publisher sube el precio base entre sales, la prediccion de precio debe basarse en el % de descuento historico aplicado al precio actual, no en el precio absoluto de la sale anterior.
- **Juego nuevo (< 1 anio en Steam):** no tiene suficientes ciclos. No predecir, mostrar "Juego reciente, sin historial suficiente".
- **Multiples tiendas:** si un juego tiene historial en Steam y Xbox, priorizar la tienda con mejor historial de descuentos. Mostrar prediccion por tienda si ambas tienen patron.
- **Sale cancelada o movida:** las fechas son estimadas. Incluir disclaimer "Fechas estimadas basadas en anios anteriores".
- **Timezone:** las fechas de sale se manejan en UTC. Al usuario se muestra la fecha sin hora (solo dia).
- **Juego delisted:** si el juego fue removido de la tienda entre sales, no predecir para esa tienda.

---

## Notas tecnicas

- **Backend:** nuevo servicio `services/price_predictor.py` con logica de deteccion de patrones estacionales.
- **Endpoint:** `GET /hunter/game/{id}/prediction` — requiere que el juego tenga `price_history` (HUNT-03).
- **Frontend:** badge/tooltip en `WishlistView.jsx`, integrado en la card de precio existente.
- **Esfuerzo estimado:** M (4-5 horas).

## Estado
- Implementado: No
- Prioridad: P2
- Esfuerzo: M
- Depende de: HUNT-03
