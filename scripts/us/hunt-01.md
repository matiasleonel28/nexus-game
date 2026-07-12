*   **As a** player,
*   **I want to** add a game to my wishlist (watches) and set a target price,
*   **so that** the system notifies me automatically when it's the best time to buy it.

**Scenarios:**
*   A player wants "Elden Ring" for Steam but finds it expensive. They create a "watch" with a target price of ARS$ 15,000.
*   A player wants the next Zelda on the eShop but doesn't know its price. They create a "watch" with no target price, just to be notified when it reaches its historical low.

**Acceptance Criteria:**
*   [ ] From a game card (in search or library), there is an option to "Watch Price".
*   [ ] When activated, the store can be selected (`Steam`, `eShop`, `Xbox`). `PS5` cannot be selected.
*   [ ] There is an optional field for `target_price`.
*   [ ] Upon saving, `POST /api/watches` is called.
*   [ ] The watched game appears in a dedicated view (`/hunter` or `/wishlist`).
*   [ ] The watch view shows the current price, the target price, and the known historical low.

**Edge Cases:**
*   The user tries to watch a game in a store not covered by ITAD (e.g., a very small indie store). The system should inform that prices cannot be obtained.
*   The user tries to watch the same game in the same store twice (the API must return `409 Conflict`).