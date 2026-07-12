# US-FEAT-08: Wrap anual (resumen del año)

> **Epic:** Features · **Prioridad:** P3 (post-MVP) · **Estado impl:** ❌ No existe  
> **Dependencias:** MAN-05 (hours_played, enjoyment), UX-03 (infraestructura de stats)  
> **Esfuerzo:** L (6-8 horas)

## Historia

**Como** jugador  
**quiero** ver un resumen visual de mi año gaming (estilo Spotify Wrapped)  
**para** reflexionar sobre lo que jugué, cuánto disfruté y cuánto ahorré.

---

## Criterios de Aceptación

### AC-1: Generar wrap del año actual o pasado
```gherkin
Dado que tengo juegos con actividad registrada en 2026
Cuando accedo al wrap anual (desde perfil/stats o al cierre del año)
Entonces veo un resumen visual con:
  - Total de horas jugadas en el año
  - Juegos completados y abandonados
  - Dinero ahorrado en ofertas
  - Género más jugado
  - Mejor $/hora (juego con mejor relación precio/tiempo)
  - Juego más largo (por hours_played)
```

### AC-2: Endpoint de datos del wrap
```gherkin
Dado que el frontend necesita los datos agregados
Cuando se llama a GET /stats/yearly-wrap?year=2026
Entonces el backend devuelve un JSON con:
  - total_hours, games_completed, games_abandoned
  - money_saved (diferencia entre precio base y precio pagado en ofertas)
  - top_genre (género con más horas acumuladas)
  - best_value_game (mejor $/hora con enjoyment >= 3)
  - longest_game (mayor hours_played del año)
  Y cada campo incluye el dato crudo y un texto formateado en español
```

### AC-3: Presentación animada con cards
```gherkin
Dado que el wrap tiene datos calculados
Cuando se renderiza WrapView.jsx
Entonces se muestran cards animadas (fade/slide) una por sección
  Y se usan charts de Recharts para distribución de géneros y horas por mes
  Y los números usan clase .font-num (Space Mono tabular)
  Y los colores siguen los tokens del diseño (--accent para highlights, --positive para ahorro)
```

### AC-4: Exportar como imagen PNG
```gherkin
Dado que quiero compartir mi wrap
Cuando presiono el botón "Compartir" o "Exportar"
Entonces se genera un PNG del wrap completo via html2canvas
  Y se descarga automáticamente como "nexus-wrap-2026.png"
  Y la imagen incluye branding mínimo de Nexus (logo o nombre)
```

### AC-5: Estado vacío o datos insuficientes
```gherkin
Dado que no tengo juegos con horas registradas en el año solicitado
Cuando accedo al wrap
Entonces veo un mensaje "No hay suficientes datos para tu wrap de {año}"
  Y se sugiere registrar horas y disfrute en los juegos actuales
  Y no se muestra un wrap con ceros o datos sin sentido
```

### AC-6: Wrap de años anteriores
```gherkin
Dado que quiero ver mi resumen de un año pasado
Cuando selecciono otro año (ej: 2025) en el selector
Entonces se recalcula el wrap con los datos de ese período
  Y el parámetro year se envía al endpoint
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Año completo con 12 juegos completados, 3 abandonados, horas y disfrute cargados | year=2026, usuario con datos completos | Wrap completo con todas las secciones renderizadas y animadas |
| 2 | Happy | Exportar wrap como PNG | Click en "Compartir" | Descarga nexus-wrap-2026.png con contenido visual correcto |
| 3 | Happy | Consultar wrap de año anterior | year=2025 | Wrap con datos del 2025, distintos al 2026 |
| 4 | Sad | Año sin ningún juego registrado | year=2020 (sin datos) | Mensaje "No hay suficientes datos para tu wrap de 2020" |
| 5 | Sad | Año con juegos pero sin horas ni disfrute cargados | year=2026, 5 juegos sin hours_played | Wrap parcial: muestra completados/abandonados pero omite secciones de horas y $/hora |
| 6 | Sad | Año futuro solicitado | year=2028 | Validación: "No podés generar un wrap de un año que no pasó" |
| 7 | Edge | Solo 1 juego en todo el año | year=2026, 1 juego completado con 5h | Wrap válido pero simplificado (sin chart de géneros, "Tu único juego fue...") |
| 8 | Edge | Juegos sin precio de compra registrado | Juegos importados sin datos de precio | Sección "ahorro" se omite, resto del wrap funciona |
| 9 | Edge | Empate en género más jugado | RPG 50h, Metroidvania 50h | Se muestra uno de los dos (el primero alfabéticamente o ambos) |
| 10 | Border | Año en curso (diciembre vs enero) | year=2026 consultado en julio 2026 | Wrap parcial con datos hasta la fecha, label "wrap parcial (año en curso)" |
| 11 | Border | html2canvas falla en el export | Navegador sin soporte canvas | Toast de error "No se pudo exportar la imagen" sin crash |

---

## Edge / Border Cases
- Si el usuario tiene juegos en múltiples plataformas, el wrap agrega todo sin distinguir por plataforma (el resumen es cross-platform).
- El cálculo de "dinero ahorrado" solo cuenta juegos comprados durante ofertas donde se tenga el precio original y el precio pagado. Si no hay datos de precio, la sección se omite.
- El campo best_value_game solo considera juegos con enjoyment >= 3 para no premiar juegos baratos que no gustaron.
- Si html2canvas no puede renderizar charts de Recharts (SVG), considerar fallback con server-side rendering o captura alternativa.
- El wrap no incluye juegos en estado "Pendiente" (nunca se jugaron en el año).
- Juegos con 0 hours_played pero estado "Completado" se cuentan como completados pero no participan en métricas de horas.

---

## Estado
- Implementado: No
- Prioridad: P3
- Esfuerzo: L (6-8 horas)
- Depende de: MAN-05, UX-03
