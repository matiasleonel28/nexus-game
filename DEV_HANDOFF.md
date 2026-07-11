# Nexus — Dev Engineer Handoff

> Generado: 2026-07-10 · Fuente de verdad: `user_stories.json` + `us/*.md`  
> Repo: https://github.com/matiasleonel28/nexus-game  
> Companion docs: `CLAUDE.md` (manual técnico) · `HANDOFF.md` (estado/bugs) · `specs/` (SDD)

---

## Qué es Nexus

Sistema personal de gaming para un jugador argentino (Matu). Dos módulos:
- **Manager** — backlog multiplataforma (PC/Steam, Switch 2, Xbox, PS5 colección) con estados y foco en "valor real" (horas vs disfrute, $/hora).
- **Hunter** — monitor de precios/ofertas en Steam, eShop, Xbox Store. Región AR / ARS.

**Stack:** Python 3.13 + FastAPI + SQLAlchemy 2 + SQLite | React 19 + Vite + Tailwind 4 | JWT auth | APScheduler | IGDB + HLTB + ITAD + Nintendo API.

---

## Estado actual (qué funciona)

| Módulo | Estado |
|--------|--------|
| Auth (login/register/forgot/reset/refresh/logout) | ✅ Funciona. Cookies httpOnly + refresh token rotation. |
| Búsqueda IGDB + agregar a biblioteca/wishlist | ✅ Funciona. UniqueConstraint(igdb_id, user_id). |
| Dashboard con tabs por estado + filtros duración/sort | ✅ Funciona. |
| Cambiar estado / plataforma / eliminar juego | ✅ Funciona con ConfirmDialog. |
| Onboarding (horas/semana + tolerancia estrés) | ⚠️ Funciona pero UX y wording a mejorar. |
| Recomendación personalizada ("Sugerencia del día") | ⚠️ Funciona pero algoritmo básico (solo ordena por hltb_hours). |
| Stats charts (tasa finalización + géneros abandonados) | ⚠️ Funciona pero wording genérico. |
| Hunter (precios ITAD + Nintendo + alertas) | ⚠️ Parcial. No hay price_watches separados, no hay historial. |
| RegisterPage | ⚠️ En inglés (bug). |

---

## Las 24 User Stories — Ordenadas por prioridad de implementación

### FASE 1 — Quick wins (alto impacto, bajo esfuerzo)

Estas se pueden hacer en paralelo, no se bloquean entre sí.

#### 1. UX-04: Sistema de Toast (P1, NUEVO)
**Qué:** Componente Toast global para feedback de acciones.  
**Por qué:** Ahora cuando agregás un juego, el mensaje queda invisible. Bug de UX reportado.  
**AC clave:**
- Toast en esquina inferior derecha, auto-dismiss 4s (éxito), persistente (error)
- Stacking máximo 3, no bloqueante
- Integrar en: agregar juego, cambiar estado, eliminar, crear watch, errores API

**Archivos a tocar:** Crear `components/Toast.jsx` + `context/ToastContext.jsx`. Importar en `App.jsx`. Usar en `Dashboard.jsx`, `SearchView.jsx`, `WishlistView.jsx`, `AlertsView.jsx`.

**Estimación:** 2-3 horas.

---

#### 2. INFRA-02: Traducir RegisterPage a español (P1, BUG)
**Qué:** Todos los textos de `/register` en español.  
**AC clave:** Labels, placeholders, botones, mensajes de error — todo en español.

**Archivos a tocar:** `pages/RegisterPage.jsx` (solo textos).

**Estimación:** 30 min.

---

#### 3. UX-01: Mejorar Onboarding (P1, PARCIAL)
**Qué:** Mejorar las preguntas del onboarding y hacerlo editable desde perfil.  
**AC clave:**
- "Tolerancia al estrés" → "¿Qué tipo de experiencia buscás?" (Relajante / Equilibrada / Desafiante)
- Agregar pregunta: "¿Qué géneros te gustan?" (multi-select top genres de IGDB)
- Aparece solo 1 vez (ya implementado), pero debe ser editable desde una futura sección de perfil
- Opción "Más tarde" para skipear (vuelve en próximo login, máx 3 veces)

**Archivos a tocar:** `components/UserOnboarding.jsx`, `routers/auth.py` (PATCH /me), `models.py` (agregar `preferred_genres`), `schemas.py`.

**Estimación:** 3-4 horas.

---

### FASE 2 — Core features (el valor diferencial del producto)

#### 4. MAN-05: Valor real — horas jugadas + disfrute (P1, NUEVO)
**Qué:** Campos `hours_played` (float) y `enjoyment` (1-5) en el modelo Game.  
**Por qué:** Esta es LA métrica core del producto. Sin esto, Nexus es solo una lista.  
**AC clave:**
- Input numérico para horas en cards de juegos "playing"/"completed"/"abandoned"
- Selector de estrellas 1-5 para disfrute en "completed"/"abandoned"
- Métricas derivadas visibles: Disfrute/hora, $/hora real
- Los datos numéricos usan clase `.font-num` (Space Mono tabular)

**Archivos a tocar:**
- Backend: `models.py` (agregar `hours_played`, `enjoyment` a Game), `schemas.py` (UpdateGameRequest + GameResponse), `routers/backlog.py` (PATCH acepta los campos)
- Frontend: `components/GameCard.jsx` (inputs), `pages/Dashboard.jsx` (mostrar métricas)

**Estimación:** 4-5 horas.

---

#### 5. MAN-02: Completar filtros y sort (P0, PARCIAL)
**Qué:** Agregar lo que falta al sistema de filtros.  
**AC clave:**
- Sort `enjoyment_desc` (requiere MAN-05 primero)
- Sort `added_desc` (por fecha de agregado)
- Filtro coop en UI (existe en backend, no expuesto en Dashboard)
- Filtro crossplay (requiere `has_crossplay` en modelo)

**Archivos a tocar:**
- Backend: `models.py` (agregar `has_crossplay`), `routers/backlog.py` (sort cases + query param crossplay)
- Frontend: `pages/Dashboard.jsx` (exponer filtro coop y crossplay), `constants.js` (sort options)

**Estimación:** 3-4 horas. Depende de MAN-05 para sort enjoyment.

---

#### 6. UX-06: Filtros como dropdown/chips (P1, NUEVO)
**Qué:** Reemplazar underline tabs de estado por dropdown o chip buttons.  
**Por qué:** Los tabs no escalan y ocupan mucho espacio horizontal.  
**AC clave:**
- Dropdown o chips seleccionables para estado
- Chips activos visibles con "X" para desactivar
- Botón "Limpiar filtros"
- Responsive en mobile

**Archivos a tocar:** `pages/Dashboard.jsx` (reemplazar la sección de tabs).

**Estimación:** 2-3 horas.

---

#### 7. UX-02: Mejorar recomendación (P1, PARCIAL)
**Qué:** Hacer la recomendación más inteligente y transparente.  
**AC clave:**
- Mostrar POR QUÉ se sugiere cada juego ("Corto, ideal para tu tiempo" / "Género relajante")
- Rotación diaria (seed basada en fecha, no siempre el mismo top 3)
- Si no completó onboarding → CTA "Completá tu perfil" en vez de sugerencia
- Si 0 juegos en backlog → sección no aparece

**Archivos a tocar:**
- Backend: `services/recommend.py` (mejorar algoritmo, agregar campo `reason` al response)
- Frontend: `pages/Dashboard.jsx` (mostrar razón en la card de sugerencia)
- Schema: agregar `recommendation_reason` a GameResponse o crear RecommendationResponse

**Estimación:** 3-4 horas.

---

#### 8. UX-03: Mejorar Stats wording (P2, PARCIAL)
**Qué:** Renombrar títulos de los charts.  
**AC clave:**
- "Win Rate" → "Tasa de Finalización"
- "Géneros Más Frustrantes" → "Géneros que más abandonás"
- Considerar mover a sección/tab separada "Mis Stats"

**Archivos a tocar:** `components/StatsChart.jsx` (solo textos).

**Estimación:** 30 min.

---

### FASE 3 — Hunter avanzado

#### 9. HUNT-03: Curva histórica de precios (P1, NUEVO)
**Qué:** Tabla `price_history` + chart de precios por tienda.  
**AC clave:**
- Crear tabla `price_history` (game_id, store, price, lowest_ever, captured_at)
- Job diario guarda snapshot en price_history (no solo en game_prices)
- Chart con línea por tienda, hover para detalle
- Badge "Cerca del mínimo" si precio actual ≤ 110% del mínimo histórico

**Archivos a tocar:**
- Backend: `models.py` (PriceHistory), `scheduler.py` (guardar historial), nuevo endpoint `GET /prices/{game_id}/history`
- Frontend: Nuevo componente `PriceChart.jsx` (usar Recharts, ya está en deps), integrar en `WishlistView.jsx` o detalle de juego

**Estimación:** 6-8 horas (más compleja).

---

#### 10. HUNT-04: Refresh manual de precio (P2, PARCIAL)
**Qué:** Endpoint `POST /prices/{game_id}/refresh` con bypass de TTL.  
**AC clave:**
- Botón "Actualizar precio" en cards con watch
- Rate limit: 1 refresh cada 5 min por juego
- Spinner durante la consulta

**Archivos a tocar:**
- Backend: nuevo endpoint en `routers/hunter.py`
- Frontend: botón en `WishlistView.jsx` o `GameCard.jsx`

**Estimación:** 2-3 horas.

---

#### 11. UX-05: Oferta cruzada por plataforma (P1, NUEVO)
**Qué:** Avisar si un juego está de oferta en una tienda que el usuario posee pero no está vigilando.  
**AC clave:**
- Badge verde "En oferta en [tienda]: $X" en cards de wishlist/backlog
- Solo considera tiendas de las plataformas del usuario
- Clickeable para crear watch en esa tienda

**Archivos a tocar:**
- Backend: lógica en `services/watches.py` o nuevo servicio, extender response de backlog/wishlist
- Frontend: badge en `GameCard.jsx`

**Estimación:** 4-5 horas.

---

### FASE 4 — Base + Post-MVP

#### 12-13. BASE-01 (Export/Import) + BASE-02 (Perfil) — P2
#### 14. FEAT-01 (Gamificación) — P3, post-MVP
#### 15. INFRA-01 (Normalización DB) — P2, diferida

Estas quedan documentadas en `us/*.md` pero no son prioritarias ahora.

---

## Reglas para el dev

### Convenciones del proyecto
- **Toda la app en español.** Labels, mensajes, errores.
- **Design tokens CSS:** `--ink`, `--surface`, `--accent` (ámbar), `--positive` (verde), `--danger` (rojo). Nunca hex sueltos.
- **Tipografía:** Space Grotesk (UI) + Space Mono tabular (`.font-num` para horas/precios).
- **No emojis como iconos.** Usar SVG (Lucide/Heroicons).
- **API-first:** lógica en backend, frontend solo consume REST.

### Cómo correr
```bash
# Backend (desde backend/)
PYTHONIOENCODING=utf-8 DEV_NO_AUTH=1 .venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000

# Frontend (desde frontend/)
npm run dev
```

### Cómo validar
Cada US tiene AC en Gherkin y tabla de Scenarios en su archivo `us/*.md`. El QA (Matu) va a testear contra esos scenarios.

### Archivos clave
| Archivo | Qué es |
|---------|--------|
| `CLAUDE.md` | Manual técnico completo del proyecto |
| `HANDOFF.md` | Estado/bugs de la última sesión |
| `user_stories.json` | Índice de las 24 US con dependencias |
| `us/*.md` | Detalle de cada US (AC, Scenarios, Edge cases) |
| `specs/` | Specs del sistema (arquitectura, API, DB, PRD) |

---

## Orden sugerido de implementación

```
Sprint 1 (quick wins):     UX-04 → INFRA-02 → UX-03 wording
Sprint 2 (core value):     MAN-05 → MAN-02 → UX-06
Sprint 3 (personalización): UX-01 mejora → UX-02 mejora
Sprint 4 (hunter):          HUNT-03 → HUNT-04 → UX-05
Sprint 5 (base):            BASE-01 → BASE-02
```

Cada sprint es independiente del anterior salvo MAN-05 → MAN-02 (sort por disfrute necesita el campo).
