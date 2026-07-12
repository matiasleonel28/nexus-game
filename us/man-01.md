# US-MAN-01: Agregar un juego a la biblioteca

> **Epic:** Manager · **Prioridad:** P0 · **Estado impl:** ⚠️ Parcial  
> **Dependencias:** AUTH-01  
> **Bloquea:** MAN-02, MAN-03, MAN-04, MAN-05

## Historia

**Como** jugador  
**quiero** buscar un juego por nombre y agregarlo a mi biblioteca eligiendo plataforma  
**para** tener mi backlog centralizado en un solo lugar.

---

## Criterios de Aceptación

### AC-1: Búsqueda en IGDB
```gherkin
Dado que estoy en la vista de búsqueda
Cuando escribo "Hollow Knight" y presiono buscar
Entonces veo una lista de resultados con carátula, título, plataformas y flag coop
  Y NO veo precios ni horas HLTB (se resuelven al guardar)
```

### AC-2: Agregar a biblioteca
```gherkin
Dado que veo resultados de búsqueda
Cuando elijo un juego y selecciono plataforma "PC"
Entonces se crea la entrada con estado "pendiente"
  Y el backend resuelve automáticamente: carátula (alta res), duración HLTB, flags coop/crossplay
  Y el juego aparece en mi Dashboard
```

### AC-3: Selección de plataforma obligatoria
```gherkin
Dado que quiero agregar un juego
Cuando no selecciono ninguna plataforma
Entonces no puedo confirmar la acción
  Y veo indicación de que la plataforma es requerida
```

### AC-4: Detección de duplicados
```gherkin
Dado que tengo "Hollow Knight" en PC en mi biblioteca
Cuando intento agregar "Hollow Knight" en PC de nuevo
Entonces recibo error 409 "Ya tenés este juego en PC"
  Y NO se sobreescribe el estado existente
```

### AC-5: Mismo juego en distinta plataforma
```gherkin
Dado que tengo "Hollow Knight" en PC
Cuando agrego "Hollow Knight" en Switch 2
Entonces se crea una entrada separada (distinta plataforma = distinta entrada)
  Y veo ambas en mi Dashboard
```

---

## Scenarios

| # | Tipo | Escenario | Resultado esperado |
|---|------|-----------|-------------------|
| 1 | Happy | Buscar + elegir plataforma + agregar | Juego en Dashboard como "pendiente" |
| 2 | Happy | Agregar mismo juego en otra plataforma | Dos entradas separadas |
| 3 | Sad | Duplicado (mismo juego + misma plataforma) | Error 409, sin cambio |
| 4 | Sad | Búsqueda sin resultados | Mensaje "No se encontraron juegos" |
| 5 | Sad | IGDB no responde (timeout/503) | Error graceful "No se pudo buscar, intentá de nuevo" |
| 6 | Edge | Juego sin carátula en IGDB | Se muestra placeholder genérico |
| 7 | Edge | Juego sin duración HLTB | Campo hltb_main_hours queda null, se muestra "—" |
| 8 | Edge | Juego solo para PS5 | Se puede agregar a biblioteca (PS5 = colección), pero sin precios Hunter |
| 9 | Edge | HLTB tarda mucho (scraping frágil) | Timeout con fallback: juego se guarda sin duración, se reintenta después |
| 10 | Border | Título con caracteres unicode (日本語) | Búsqueda funciona, título se guarda correctamente |
| 11 | Border | Switch 2 recién salió — IGDB sin metadata completa | Permitir alta manual mínima (título + plataforma) sin IGDB |

---

## Estado actualizado (julio 2026)
- **UniqueConstraint(igdb_id, user_id)** implementada — duplicados dan 409 correctamente.
- **`genres`** se guarda desde IGDB como string CSV (nuevo campo).
- **Statuses renombrados**: backlog (antes "pendiente"), playing, completed, abandoned.
- **Plataformas expandidas**: pc, pc_xbox, pc_other, switch, switch2, xbox, ps5.
- **Falta `has_crossplay`** en el modelo.
- **Falta toast** de confirmación al agregar (el mensaje queda en zona no visible).

## Flujo UX propuesto

```
SearchView:
┌────────────────────────────────────────┐
│ 🔍 [Buscar juego...          ] [Buscar]│
├────────────────────────────────────────┤
│ ┌──────┐ Hollow Knight                 │
│ │cover │ PC · Switch · PS4             │
│ │      │ Coop: No                      │
│ └──────┘              [+ Agregar ▾]    │
│                       ┌──────────────┐ │
│                       │ ○ PC         │ │
│                       │ ○ Switch 2   │ │
│                       │ ○ Xbox       │ │
│                       │ ○ PS5        │ │
│                       │ [Confirmar]  │ │
│                       └──────────────┘ │
└────────────────────────────────────────┘
```
