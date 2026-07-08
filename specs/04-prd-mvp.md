# Nexus — Product Requirement Document (MVP)

> **Fase 1 · Spec-Driven Development** · Documento 4 de 4
> Estado: `DRAFT v0.1` · Alcance: Producto Mínimo Viable

---

## 1. Problema y propósito

El rumbo actual de la industria del gaming (FOMO, catálogos inflados, precios volátiles, backlogs infinitos) genera **desmotivación y fricción**. Las herramientas existentes empujan a *comprar y acumular más*, no a *jugar y disfrutar mejor*.

**Nexus** es una herramienta personal, minimalista y anti-fricción cuyo único objetivo es responder dos preguntas:

1. **"¿Qué juego arranco/sigo ahora?"** → Módulo **Manager**.
2. **"¿Cuándo conviene comprar ese juego que quiero?"** → Módulo **Hunter**.

Todo lo que no sirva directamente a esas dos preguntas queda fuera del MVP.

---

## 2. Usuario y contexto

- **Perfil:** jugador único (multi-usuario técnicamente soportado, pero el uso real es personal).
- **Plataformas priorizadas:** PC/Steam (principal), Switch 2 (exclusivos), Xbox (ecosistema).
- **PS5:** solo colección local/emulación — **sin** rastreo de precios.
- **Región/moneda:** Argentina / ARS.
- **Valores del producto:** tiempo invertido vs. disfrute, control de gastos, organización de sesiones cooperativas.

---

## 3. Objetivos y métricas de éxito del MVP

| Objetivo | Métrica de éxito |
|---|---|
| Reemplazar la planilla/memoria mental del backlog | 100% de los juegos activos cargados y con estado correcto |
| Decidir qué jugar sin fricción | Elegir juego para una sesión en < 30 s desde abrir la app |
| No volver a pagar de más | Al menos 1 compra hecha en/cerca del mínimo histórico gracias a una alerta |
| Filtrar noches co-op al instante | Ver todos los juegos coop jugables en 1 click |

---

## 4. Alcance del MVP

### ✅ Dentro (MVP)

**Manager**
- Buscar juegos (IGDB) y agregarlos a la biblioteca eligiendo plataforma.
- Estados: **Pendiente / Jugando / Completado / Abandonado**, cambiables en 1 click.
- Registrar `hours_played` y `enjoyment` (1–5) para el "valor real".
- Filtro rápido **Cooperativo** y **Crossplay**.
- Orden por: duración (asc/desc), $/hora, disfrute, recién agregado.
- Duración automática vía HowLongToBeat.

**Hunter**
- Crear *price watch* de un juego en Steam / eShop / Xbox con precio objetivo opcional.
- Refresco diario automático de precios (ITAD) + refresco manual.
- Ver precio actual, mínimo histórico y **curva de precio** por tienda.
- Alertas cuando: precio ≤ objetivo, o precio = mínimo histórico.
- Feed de alertas con badge de no leídas.

**Base**
- Login (email + password), preferencias región/moneda.
- Tema oscuro, funcional, minimalista.
- Export/import de biblioteca a JSON.

### ❌ Fuera (post-MVP)

Bot de Telegram · notificaciones push nativas/email · precios PS5 · sync multi-dispositivo · recomendaciones IA · listas compartidas/social · planificador de calendario de sesiones co-op (más allá del filtro).

---

## 5. Historias de usuario clave

> Formato: *Como [rol] quiero [acción] para [valor].* Criterios de aceptación en Gherkin resumido.

### Épica A — Manager (Backlog)

**US-01 · Agregar un juego a la biblioteca**
Como jugador quiero buscar un juego y agregarlo indicando la plataforma, para tener mi backlog centralizado.
- **Dado** que busco "Hollow Knight", **cuando** elijo un resultado y selecciono plataforma PC, **entonces** se crea la entrada con estado `pendiente` y el backend resuelve carátula, duración HLTB y flags coop automáticamente.
- **Y** si el juego+plataforma ya existe, se me avisa (409) en vez de duplicar.

**US-02 · Cambiar el estado de un juego**
Como jugador quiero marcar un juego como Jugando/Completado/Abandonado en un click, para reflejar mi realidad sin fricción.
- **Dado** un juego en `pendiente`, **cuando** toco "Jugando", **entonces** el estado cambia y el juego sube en la vista "Jugando".

**US-03 · Decidir qué jugar por tiempo disponible**
Como jugador con poco tiempo quiero ordenar mi backlog por duración ascendente, para elegir algo que pueda terminar este fin de semana.
- **Dado** el backlog en `pendiente`, **cuando** ordeno por `duration_asc`, **entonces** veo primero los juegos más cortos según HLTB.

**US-04 · Filtrar noche cooperativa**
Como jugador quiero filtrar juegos cooperativos (y crossplay) en un click, para organizar una sesión con amigos al instante.
- **Dado** mi backlog, **cuando** activo el filtro Coop, **entonces** solo veo juegos con `has_coop = true`.
- **Y** puedo combinar con Crossplay para jugar entre PC y Xbox.

**US-05 · Medir el valor real de lo jugado**
Como jugador quiero registrar horas jugadas y un puntaje de disfrute, para saber si mi tiempo/plata valió la pena.
- **Dado** un juego `completado`, **cuando** cargo 40 h y disfrute 5, **entonces** la app muestra disfrute/hora y (si hubo precio) $/hora.

### Épica B — Hunter (Ofertas)

**US-06 · Vigilar el precio de un juego**
Como jugador quiero suscribirme al precio de un juego en una tienda con un precio objetivo, para que me avise cuándo comprar.
- **Dado** un juego, **cuando** creo un watch en Steam con objetivo ARS 5.000, **entonces** se guarda y empieza a rastrearse en el job diario.
- **Y** no puedo crear watches en PS5 (no soportado).

**US-07 · Recibir alerta de oferta**
Como jugador quiero que me avise cuando el precio baja del objetivo o toca su mínimo histórico, para no perder la ventana ni comprar caro.
- **Dado** un watch con objetivo ARS 5.000, **cuando** el refresco detecta precio ARS 4.800, **entonces** se crea una alerta `target_reached` y aparece en el feed con badge.

**US-08 · Evaluar si un precio es realmente bueno**
Como jugador quiero ver la curva histórica y el mínimo histórico de un juego, para saber si "la oferta" es real o inflada.
- **Dado** un juego con watch, **cuando** abro su detalle, **entonces** veo precio actual, mínimo histórico, % de descuento y la curva por tienda.

**US-09 · Forzar un chequeo de precio**
Como jugador impaciente quiero refrescar el precio manualmente, para no esperar al job diario.
- **Dado** un juego, **cuando** toco "Actualizar precio", **entonces** se consulta ITAD ignorando el TTL y se actualiza al instante.

### Épica C — Base

**US-10 · Acceder a mi cuenta**
Como usuario quiero registrarme e iniciar sesión, para que mis datos estén protegidos y persistan.
- **Dado** que no tengo cuenta, **cuando** me registro con email/password, **entonces** puedo loguearme y ver mi biblioteca vacía con región AR / ARS por defecto.

**US-11 · No quedar preso de la herramienta**
Como usuario quiero exportar e importar mi biblioteca en JSON, para tener control total de mis datos.

---

## 6. Flujo principal (happy path)

```
1. Abrir Nexus (Tauri) → login.
2. Buscar juego → agregar a biblioteca (plataforma + estado).
3. ¿Aún no lo tengo? → crear price watch con objetivo.
4. Job diario refresca precios → dispara alertas.
5. Llega alerta "mínimo histórico" → compro → marco Pendiente.
6. Fin de semana: filtro duration_asc / Coop → elijo qué jugar → Jugando.
7. Termino → Completado + horas + disfrute → veo mi $/hora real.
```

---

## 7. Definición de "Terminado" (MVP)

- [ ] Backend FastAPI con todos los endpoints del doc 02 y auth JWT.
- [ ] Esquema del doc 03 migrado con Alembic.
- [ ] Integración ITAD (3 tiendas) + IGDB + HLTB + Steam Store funcionando con región AR.
- [ ] Scheduler diario de precios + evaluación de alertas.
- [ ] Frontend React con: biblioteca (filtros/orden), detalle de juego con curva de precio, feed de alertas, login.
- [ ] Empaquetado Tauri con el backend como sidecar y arranque de un click en Windows.
- [ ] Export/import JSON.
- [ ] Tests: happy path E2E (US-01 → US-07) + unit tests de servicios externos mockeados.

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| HowLongToBeat es scraping frágil | Duración faltante | Cache permanente; permitir edición manual de horas. |
| Cobertura ITAD de eShop/Xbox en región AR incompleta | Precios faltantes | Degradar con gracia (mostrar "sin dato") y validar Steam con Steam Store API. |
| Rate limits (IGDB 4 req/s, ITAD) | Throttling | Cache + backoff + no pedir precio en búsqueda. |
| Empaquetar FastAPI como sidecar en Windows | Bloqueo de release | Fallback: script de arranque local (backend + frontend) mientras se resuelve PyInstaller. |
| Switch 2 recién sale — IDs/metadata pobres en IGDB | Metadata incompleta | Permitir alta manual mínima (título + plataforma) sin depender de IGDB. |

---

## 9. Próximos pasos (Fase 2 — Diseño técnico detallado)

1. Validar cobertura real de ITAD para eShop/Xbox en región AR (spike técnico).
2. Definir el esquema Alembic inicial y la migración desde `Game-manager`.
3. Prototipo de UI (biblioteca + detalle con curva de precio).
4. Diseño del contrato de errores y del flujo de tokens JWT.
