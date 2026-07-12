# Nexus — Dev Engineer Handoff

> Generated: 2026-07-12 · Source of truth: `user_stories.json` + `us/*.md`
> Repo: https://github.com/matiasleonel28/nexus-game
> Companion docs: `CLAUDE.md` (technical manual) · `HANDOFF.md` (state/bugs) · `specs/` (SDD)

---

## What is Nexus

Personal gaming system for one Argentine player (Matu). Two modules:
- **Manager** — multiplat backlog (PC/Steam, Switch 2, Xbox, PS5 collection) with statuses and focus on "real value" (hours vs enjoyment, $/hour).
- **Hunter** — price/deal monitor for Steam, eShop, Xbox Store. Region AR / ARS.

**Stack:** Python 3.13 + FastAPI + SQLAlchemy 2 + SQLite | React 19 + Vite + Tailwind 4 | JWT auth | APScheduler | IGDB + HLTB + ITAD + Nintendo API.

---

## Current state (what works)

| Module | Status |
|--------|--------|
| Auth (login/register/forgot/reset/refresh/logout) | Works. httpOnly cookies + refresh token rotation. |
| IGDB search + add to library/wishlist | Works. UniqueConstraint(igdb_id, user_id). |
| Dashboard with status tabs + duration filters/sort | Works. |
| Change status / platform / delete game | Works with ConfirmDialog. |
| Toast notifications | Works. Toast.jsx + ToastContext already implemented. |
| Onboarding (hours/week + stress tolerance) | Works but UX and wording need improvement (UX-01). |
| Personalized recommendation ("Daily pick") | Works but basic algorithm + dead code (UX-02). |
| Stats charts (completion rate + abandoned genres) | Works but generic wording (UX-03). |
| Hunter (ITAD + Nintendo prices + alerts) | Partial. No separate price_watches, no history. |
| RegisterPage | In English (bug INFRA-02). |

---

## All 40 User Stories — Ordered by priority

### SPRINT 1 — Quick wins + cleanup (high impact, low effort)

Can be done in parallel, no blocking between them (except UX-08 depends on UX-07). Estimated total: ~8-10 hours.

---

#### 1. INFRA-03: Dead code cleanup and minor fixes (P1, S)
**What:** Bundle of 5 small fixes that clean immediate tech debt.
**Changes:**
- `backend/models.py` — Delete `has_splitscreen` field from Game (never read or written)
- `backend/services/recommend.py` — Remove the `else` branch (~lines 53-57) that's an exact copy of the `if`
- `backend/routers/hunter.py` — Remove endpoint `GET /hunter/raw` (debug, no consumer, potential leak)
- `frontend/src/components/GameCard.jsx` — Change placeholder `"No+Cover"` → `"Sin+Caratula"`
- `frontend/src/pages/HunterView.jsx` line 117, `WishlistView.jsx` lines 203 and 214 — Add `.font-num` class to discount/price displays

**Estimate:** 2-3 hours.
**Full AC in:** `us/infra-03.md`

---

#### 2. INFRA-02: Translate RegisterPage to Spanish (P1, BUG)
**What:** All `/register` text in Spanish.

**Files to touch:** `frontend/src/pages/RegisterPage.jsx` (text only).

**Estimate:** 30 min.
**Full AC in:** `us/infra-02.md`

---

#### 3. UX-03: Improve Stats wording (P2, PARTIAL)
**What:** Rename chart titles.
- "Win Rate" → "Tasa de Finalización"
- "Most Frustrating Genres" → "Géneros que más abandonás"

**Files to touch:** `frontend/src/components/StatsChart.jsx` (text only).

**Estimate:** 30 min.
**Full AC in:** `us/ux-03.md`

---

#### 4. UX-07: Migrate hardcoded colors to design tokens (P1, NEW)
**What:** Replace Tailwind grays and hardcoded colors with project CSS vars.
**Mapping:**
- `text-gray-400/500/600` → `text-[var(--muted)]`
- `border-gray-700/800` → `border-[var(--line)]`
- `text-gray-200/300` → `text-[var(--text)]`
- `hover:bg-amber-400` → `hover:bg-[var(--accent)]`
- `border-red-900`, `bg-red-950/30`, `text-red-400` → equivalents with `var(--danger)`

**Files to touch (10):** NotFound.jsx, ForgotPasswordPage.jsx, ResetPasswordPage.jsx, HunterView.jsx, AlertsView.jsx, Dashboard.jsx, SearchView.jsx, WishlistView.jsx, GameCard.jsx, ConfirmDialog.jsx.

**Estimate:** 2-3 hours.
**Full AC in:** `us/ux-07.md`

---

#### 5. UX-08: Restyle NotFound.jsx (P1, NEW)
**What:** NotFound.jsx uses indigo/zinc palette — looks like a different app. Full restyle with design tokens.
**Why:** Only page that breaks the project's visual identity.

**Files to touch:** `frontend/src/pages/NotFound.jsx` (full restyle).
**Depends on:** UX-07 (or do them together).

**Estimate:** 30 min.
**Full AC in:** `us/ux-08.md`

---

#### 6. INFRA-04: Configure Alembic with real migrations (P1, NEW)
**What:** `alembic.ini` exists but no `versions/`. Set up Alembic to work.
**Why:** Blocks MAN-05 (add hours_played/enjoyment) and UX-01 (add preferred_genres). Without Alembic, every model change is manual and risky.

**Steps:**
1. Create `backend/alembic/env.py` pointing to `models.py:Base` and `database.py:engine`
2. Generate initial migration from current schema
3. Verify `alembic upgrade head` + `alembic downgrade -1`
4. Document workflow in `CLAUDE.md`

**Estimate:** 2-3 hours.
**Full AC in:** `us/infra-04.md`

---

### SPRINT 2 — Core features (the differentiator)

#### 7. MAN-05: Track real play value — hours + enjoyment (P1, NEW)
**What:** `hours_played` (float) and `enjoyment` (1-5) fields in Game model.
**Why:** This IS the core metric. Without it, Nexus is just a list.

**Files to touch:**
- Backend: `models.py` (add fields + Alembic migration), `schemas.py`, `routers/backlog.py`
- Frontend: `components/GameCard.jsx` (inputs), `pages/Dashboard.jsx` (derived metrics: enjoyment/hour, $/hour)
- Use `.font-num` on all numeric data

**Depends on:** INFRA-04 (Alembic).
**Estimate:** 4-5 hours.
**Full AC in:** `us/man-05.md`

---

#### 8. MAN-02: Complete filters and sorting (P0, PARTIAL)
**What:** Sort `enjoyment_desc`, sort `added_desc`, co-op filter in UI, crossplay filter.

**Files to touch:**
- Backend: `models.py` (add `has_crossplay`), `routers/backlog.py`
- Frontend: `pages/Dashboard.jsx`, `constants.js`

**Depends on:** MAN-05 (for enjoyment sort).
**Estimate:** 3-4 hours.
**Full AC in:** `us/man-02.md`

---

#### 9. UX-06: Filters as dropdown/chips (P1, NEW)
**What:** Replace underline status tabs with dropdown or chip buttons.

**Files to touch:** `pages/Dashboard.jsx`.
**Depends on:** MAN-02.
**Estimate:** 2-3 hours.
**Full AC in:** `us/ux-06.md`

---

### SPRINT 3 — Personalization

#### 10. UX-01: Improve Onboarding (P1, PARTIAL)
**What:** Better questions and make it editable.
- "Stress tolerance" → "What kind of experience are you looking for?" (Relaxing/Balanced/Challenging)
- Add: "What genres do you like?" (multi-select)
- "Later" option (returns on next login, max 3 times)

**Files to touch:** `components/UserOnboarding.jsx`, `routers/auth.py`, `models.py` (add `preferred_genres` + migration), `schemas.py`.
**Depends on:** INFRA-04 (Alembic).
**Estimate:** 3-4 hours.
**Full AC in:** `us/ux-01.md`

---

#### 11. UX-02: Improve recommendation (P1, PARTIAL)
**What:** Smarter and more transparent recommendation.
- Show WHY it's suggested ("Short, ideal for your time" / "Relaxing genre")
- Daily rotation (date-based seed)
- If onboarding not completed → CTA "Complete your profile"

**Files to touch:** `services/recommend.py`, `pages/Dashboard.jsx`, schemas.
**Depends on:** UX-01.
**Estimate:** 3-4 hours.
**Full AC in:** `us/ux-02.md`

---

### SPRINT 4 — Advanced Hunter

#### 12. HUNT-03: Historical price curve (P1, NEW)
**What:** `price_history` table + price chart by store.

**Files to touch:** `models.py` (PriceHistory + migration), `scheduler.py`, new endpoint, new `PriceChart.jsx`.
**Estimate:** 6-8 hours.
**Full AC in:** `us/hunt-03.md`

---

#### 13. HUNT-04: Manual price refresh (P2, PARTIAL)
**Estimate:** 2-3 hours. **AC in:** `us/hunt-04.md`

---

#### 14. UX-05: Cross-platform deal suggestions (P1, NEW)
**Estimate:** 4-5 hours. **AC in:** `us/ux-05.md`

---

#### 15. INFRA-05: Real notifications in check_releases (P2, NEW)
**What:** `check_releases` only prints to stdout. Create Alert records (alert_type: "release_soon") so they appear in AlertsView.

**Files to touch:** `scheduler.py`, potentially `AlertsView.jsx` (filter by type).
**Depends on:** HUNT-02.
**Estimate:** 2-3 hours.
**Full AC in:** `us/infra-05.md`

---

#### 16. HUNT-05: Integrate Steamcito (P2, NEW)
**What:** Steamcito as complementary Steam ARS price source.

**Files to touch:** Create `services/steamcito.py`, integrate in `prices_hub.py`.
**Depends on:** HUNT-01.
**Estimate:** 3-4 hours.
**Full AC in:** `us/hunt-05.md`

---

### SPRINT 5 — Post-MVP + improvements

#### 17. UX-09: Interactive progress chart (P2, NEW)
**Estimate:** 3-4 hours. **AC in:** `us/ux-09.md`

#### 18-19. BASE-01 (Export/Import) + BASE-02 (Preferences) — P2
**AC in:** `us/base-01.md`, `us/base-02.md`

#### 20. FEAT-01: Gamification — Points for completing games (P3)
**AC in:** `us/feat-01.md`

#### 21. INFRA-01: DB normalization — P2, deferred
**AC in:** `us/infra-01.md`

---

### SPRINT 6 — Advanced features

#### 22. FEAT-02: Weekly planner (P1, NEW)
**What:** Drag-and-drop weekly calendar to plan gaming sessions. Shows available hours per day (from onboarding) and lets the user assign backlog games to slots.
**Depends on:** MAN-05, UX-01.
**Estimate:** L (large).
**Full AC in:** `us/feat-02.md`

---

#### 23. FEAT-06: Permission to abandon — motivational micro-copy (P1, NEW)
**What:** When a user changes a game to "abandoned", show encouraging micro-copy ("Not every game is for everyone", "Your time is valuable"). Tracks abandon reasons optionally.
**Depends on:** MAN-03, MAN-05.
**Estimate:** S (small).
**Full AC in:** `us/feat-06.md`

---

#### 24. FEAT-03: Play streak tracking (P2, NEW)
**What:** Track consecutive days/weeks the user logs play sessions. Visual streak counter on Dashboard with motivational messages.
**Depends on:** MAN-05.
**Estimate:** M (medium).
**Full AC in:** `us/feat-03.md`

---

#### 25. FEAT-04: Bundle/pack price alert (P2, NEW)
**What:** Detect when games in the user's wishlist are available as a bundle/pack at a better price than individual purchases.
**Depends on:** HUNT-01, HUNT-03.
**Estimate:** M (medium).
**Full AC in:** `us/feat-04.md`

---

#### 26. FEAT-05: Sale predictor (P2, NEW)
**What:** Based on historical price data, predict when a game is likely to go on sale next (Steam seasonal sales, Nintendo Directs, etc).
**Depends on:** HUNT-03.
**Estimate:** M (medium).
**Full AC in:** `us/feat-05.md`

---

#### 27. FEAT-07: Co-op night mode (P2, NEW)
**What:** Dedicated view for planning co-op sessions. Filters library to co-op games, shows HLTB for co-op mode, and suggests games based on available time.
**Depends on:** MAN-04, MAN-01.
**Estimate:** L (large).
**Full AC in:** `us/feat-07.md`

---

### SPRINT 7 — Discovery & data

#### 28. FEAT-08: Annual wrap — year in review (P3, NEW)
**What:** Spotify Wrapped-style annual summary: games completed, hours played, money spent, favorite genres, best $/hour, etc.
**Depends on:** MAN-05, UX-03.
**Estimate:** L (large).
**Full AC in:** `us/feat-08.md`

---

#### 29. FEAT-09: Import from platforms — Steam/Xbox (P3, NEW)
**What:** Import existing game library from Steam (via Steam Web API) and Xbox (via Xbox API). Maps to IGDB entries.
**Depends on:** MAN-01.
**Estimate:** L (large).
**Full AC in:** `us/feat-09.md`

---

#### 30. FEAT-10: Similar games discovery (P3, NEW)
**What:** Based on games the user enjoyed most (high enjoyment score), recommend similar games they don't own yet using IGDB similar_games data.
**Depends on:** MAN-05, HUNT-01.
**Estimate:** M (medium).
**Full AC in:** `us/feat-10.md`

---

## Dev rules

### Project conventions
- **All app UI in Spanish.** Labels, messages, errors. Code/docs/issues in English.
- **CSS design tokens:** `--ink`, `--surface`, `--accent` (amber), `--positive` (green), `--danger` (red). Never loose hex or Tailwind grays.
- **Typography:** Space Grotesk (UI) + Space Mono tabular (`.font-num` for hours/prices/discounts).
- **No emojis as icons.** Use SVG (Lucide/Heroicons).
- **API-first:** logic in backend, frontend only consumes REST.
- **Toast already exists:** use `ToastContext` for action feedback (already implemented).
- **Alembic:** once configured (INFRA-04), every model change requires a migration.

### How to run
```bash
# Backend (from backend/)
PYTHONIOENCODING=utf-8 DEV_NO_AUTH=1 .venv/Scripts/python.exe -m uvicorn main:app --reload --port 8000

# Frontend (from frontend/)
npm run dev
```

### How to validate
Each US has Gherkin AC and Scenarios table in its `us/*.md` file. QA (Matu) will test against those scenarios.

### Key files
| File | What |
|------|------|
| `CLAUDE.md` | Complete technical manual |
| `HANDOFF.md` | Last session state/bugs |
| `user_stories.json` | Index of all 40 US with dependencies |
| `us/*.md` | Detail of each US (AC, Scenarios, Edge cases) |
| `specs/` | System specs (architecture, API, DB, PRD) |

---

## Suggested implementation order

```
Sprint 1 (quick wins):      INFRA-03 → INFRA-02 → UX-03 → UX-07 → UX-08 → INFRA-04
Sprint 2 (core value):      MAN-05 → MAN-02 → UX-06
Sprint 3 (personalization): UX-01 → UX-02
Sprint 4 (hunter):          HUNT-03 → HUNT-04 → UX-05 → INFRA-05 → HUNT-05
Sprint 5 (post-MVP):        UX-09 → BASE-01 → BASE-02 → FEAT-01 → INFRA-01
Sprint 6 (features):        FEAT-02 → FEAT-06 → FEAT-03 → FEAT-04 → FEAT-05 → FEAT-07
Sprint 7 (discovery):       FEAT-08 → FEAT-09 → FEAT-10
```

Key dependencies:
- INFRA-04 (Alembic) blocks MAN-05 and UX-01 (need migrations)
- MAN-05 blocks MAN-02 (enjoyment sort needs the field)
- UX-07 blocks UX-08 (NotFound depends on token migration)
- UX-01 blocks UX-02 (recommendation needs improved onboarding data)
- HUNT-03 blocks FEAT-04 and FEAT-05 (need price history data)
- MAN-05 blocks FEAT-02, FEAT-03, FEAT-06, FEAT-08, FEAT-10 (need hours/enjoyment)
