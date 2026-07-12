# US-FEAT-09: Import desde plataformas (Steam/Xbox)

> **Epic:** Features · **Prioridad:** P3 (post-MVP) · **Estado impl:** ❌ No existe  
> **Dependencias:** MAN-01 (CRUD de juegos en backlog)  
> **Esfuerzo:** L (8-10 horas)

## Historia

**Como** jugador con una biblioteca grande en Steam o Xbox  
**quiero** importar mis juegos automáticamente desde esas plataformas  
**para** no tener que agregarlos uno por uno manualmente.

---

## Criterios de Aceptación

### AC-1: Importar biblioteca de Steam
```gherkin
Dado que tengo un perfil público de Steam
Cuando ingreso mi Steam ID (o URL de perfil) y presiono "Importar"
Entonces el backend consulta la Steam Web API (GetOwnedGames)
  Y obtiene la lista completa de juegos con horas jugadas
  Y matchea cada juego contra IGDB por nombre para obtener metadata (cover, géneros)
  Y me muestra la lista para revisión antes de confirmar
```

### AC-2: Importar biblioteca de Xbox
```gherkin
Dado que tengo un gamertag de Xbox
Cuando ingreso mi gamertag y presiono "Importar"
Entonces el backend consulta la API de Xbox (via xbl.io u OpenXBL)
  Y obtiene la lista de juegos con logros/tiempo
  Y matchea cada juego contra IGDB para metadata
  Y me muestra la lista para revisión antes de confirmar
```

### AC-3: Revisión antes de confirmar
```gherkin
Dado que la importación devolvió 85 juegos de Steam
Cuando veo la lista de revisión
Entonces puedo:
  - Ver cada juego con su cover, nombre y plataforma
  - Deseleccionar juegos que no quiero importar (ej: demos, betas)
  - Ver cuáles ya existen en mi backlog (marcados como "ya agregado")
  Y solo al presionar "Confirmar importación" se crean los juegos
```

### AC-4: Estado inicial de juegos importados
```gherkin
Dado que confirmo la importación de 60 juegos
Cuando se crean en el backend (POST /backlog/import/{platform})
Entonces cada juego se crea con estado "backlog" (pendiente)
  Y se registra la plataforma de origen (steam/xbox)
  Y los que ya existían en mi biblioteca se ignoran (sin duplicados)
  Y veo un toast "Se importaron 60 juegos a tu backlog"
```

### AC-5: Match fallido con IGDB
```gherkin
Dado que un juego de Steam no se encuentra en IGDB
Cuando se muestra en la lista de revisión
Entonces aparece marcado como "sin metadata" (sin cover ni género)
  Y se puede importar igual con el nombre original de Steam
  Y el usuario puede editarlo después desde el backlog
```

### AC-6: Perfil privado o credenciales inválidas
```gherkin
Dado que ingreso un Steam ID con perfil privado
Cuando intento importar
Entonces veo un error claro: "El perfil de Steam es privado. Cambiá la visibilidad a público en Configuración de Steam para poder importar."
  Y no se importa nada
```

---

## Scenarios

| # | Tipo | Escenario | Input | Expected |
|---|------|-----------|-------|----------|
| 1 | Happy | Import Steam con 85 juegos, perfil público | Steam ID válido, perfil público | Lista de 85 juegos para revisar, confirmar importa al backlog |
| 2 | Happy | Import Xbox con 30 juegos | Gamertag válido | Lista de 30 juegos para revisar con metadata de IGDB |
| 3 | Happy | Deseleccionar juegos antes de confirmar | 85 juegos, usuario desmarca 20 | Se importan 65, los 20 descartados no se crean |
| 4 | Sad | Steam ID inválido o inexistente | "abc123xyz" | Error: "No se encontró el perfil de Steam" |
| 5 | Sad | Perfil de Steam privado | Steam ID válido, perfil privado | Error explicando cómo cambiar visibilidad |
| 6 | Sad | API key de Steam no configurada en .env | STEAM_API_KEY ausente | Error 500 controlado: "Servicio de importación no disponible" |
| 7 | Edge | Usuario con 500+ juegos en Steam | Steam ID con biblioteca enorme | Importación paginada, sin timeout, progress bar visible |
| 8 | Edge | 40 de 85 juegos ya existen en el backlog | Import Steam con juegos duplicados | 40 marcados "ya agregado" (no seleccionables), 45 disponibles para importar |
| 9 | Edge | Juego de Steam sin match en IGDB | Juego indie muy oscuro | Se importa con nombre original, sin cover ni género, editable después |
| 10 | Edge | Import parcial (red cae a mitad) | Timeout en juego 43 de 85 | Se importan los primeros 42, toast con "Importación parcial: 42 de 85 juegos" |
| 11 | Border | Biblioteca de Steam vacía (cuenta nueva) | Steam ID válido, 0 juegos | Mensaje: "Tu biblioteca de Steam está vacía" |
| 12 | Border | Gamertag de Xbox con caracteres especiales | "xX_Player 1_Xx" | Se codifica correctamente para la API |

---

## Edge / Border Cases
- Nintendo no tiene API pública de biblioteca. No se soporta import de Switch/eShop. Se muestra un mensaje: "Nintendo no permite importar juegos automáticamente. Podés agregarlos desde la búsqueda."
- La Steam Web API requiere `STEAM_API_KEY` en `.env`. Si no está configurada, el botón de importar Steam se deshabilita con tooltip explicativo.
- Xbox requiere API key separada (`XBOX_API_KEY`). Mismo comportamiento si falta.
- El matching contra IGDB se hace por nombre exacto primero, luego fuzzy match. Si hay múltiples coincidencias, se toma la de mayor popularidad en IGDB.
- Las horas de Steam (`playtime_forever`) se pueden usar para pre-cargar `hours_played` si MAN-05 está implementado.
- Los juegos free-to-play se importan igual (no se filtran por precio).
- Si el usuario importa dos veces, la segunda vez todos los juegos aparecen como "ya agregado".
- Rate limiting: Steam API tiene límite de 100.000 requests/día. Xbox APIs (xbl.io) tienen plan gratuito limitado. Implementar retry con backoff.

---

## Notas técnicas
- **Backend:** nuevos archivos `services/steam_import.py` y `services/xbox_import.py`. Nuevo endpoint `POST /backlog/import/{platform}` en `routers/backlog.py`.
- **Frontend:** wizard de importación en `ImportView.jsx` o integrado en `SearchView.jsx`. Tres pasos: (1) ingresar ID/gamertag, (2) revisar lista, (3) confirmar.
- **Batch create:** el endpoint recibe un array de juegos y los crea en una transacción. Si uno falla, el resto sigue (soft errors).

---

## Estado
- Implementado: No
- Prioridad: P3
- Esfuerzo: L (8-10 horas)
- Depende de: MAN-01
