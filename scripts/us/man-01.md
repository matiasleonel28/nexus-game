*   **As a** player,
*   **I want to** search for any game and add it to my personal library, specifying which platform I own it on,
*   **so that** I can centralize my collection and backlog in one place.

**Scenarios:**
*   A player searches for "Cyberpunk 2077", finds it, and adds it as "PC".
*   A player searches for a lesser-known indie game and also finds it thanks to the IGDB database.

**Acceptance Criteria:**
*   [ ] The search page (`/search`) has a text field to search for games.
*   [ ] While typing, the `GET /api/search?q=...` endpoint is called.
*   [ ] The results show the cover art and title. They do not show HLTB or price (business rule).
*   [ ] Clicking "Add" on a result shows a platform selector (`PC`, `Switch 2`, `Xbox`, `PS5`).
*   [ ] Upon selecting a platform, `POST /api/library` is called with the `igdb_id` and `platform`.
*   [ ] The game immediately appears in the Dashboard view (`/`), with the default status "Pending".
*   [ ] The backend automatically enriches the game with HLTB data and flags (coop, crossplay).

**Edge Cases:**
*   The search returns no results.
*   The user tries to add a game + platform that already exists in their library (the API must return a `409 Conflict` and the UI should show a friendly message like "This game is already in your library").
*   The IGDB API is unresponsive or slow.