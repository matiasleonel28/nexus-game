*   **As a** player,
*   **I want to** filter and sort my library by different criteria like duration, co-op support, or my enjoyment,
*   **so that** I can quickly decide what to play based on the time I have or who I'm playing with.

**Scenarios:**
*   **Co-op Night:** A player has friends over. They filter by "Co-op" and "Crossplay" to see what they can play together between their PC and their friend's Xbox.
*   **Short Weekend:** A player only has a weekend. They sort their backlog by "Duration (ascending)" to find a game they can finish.
*   **Value Analysis:** A player sorts by `$/hour` to see which purchases have been the most cost-effective in terms of entertainment.

**Acceptance Criteria:**
*   [ ] The library view (`/`) has visible controls for filtering and sorting.
*   [ ] It's possible to filter by `status` (Pending, Playing, etc.), `platform`, `coop` (boolean), and `crossplay` (boolean).
*   [ ] It's possible to sort by `duration` (asc/desc), `enjoyment` (desc), `$/hour` (asc), and `date_added` (desc).
*   [ ] When applying a filter/sort, the UI calls the `GET /api/library` endpoint with the corresponding parameters (e.g., `?coop=true&sort=duration_asc`).
*   [ ] The sorting and filtering logic resides 100% in the backend. The frontend only renders the results.

**Edge Cases:**
*   A game has no HLTB data. It should appear at the end of the list when sorting by duration.
*   A game has no purchase price recorded. It should not appear when sorting by `$/hour`.
*   The combination of filters returns no results. The UI must show a clear message ("No games found with these filters").