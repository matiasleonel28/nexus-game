*   **As a** player,
*   **I want to** see a clear feed of alerts when a game I'm watching reaches my target price or a new historical low,
*   **so that** I don't miss a good deal and can buy with confidence.

**Scenarios:**
*   The daily scheduler job runs and detects that "Elden Ring" on Steam now costs ARS$ 14,999.
*   The system generates a `target_reached` type alert.
*   A player opens Nexus and sees an icon with a numeric badge for unread alerts.

**Acceptance Criteria:**
*   [ ] There is a section in the UI (`/alerts`) that calls `GET /api/hunter/alerts`.
*   [ ] A navigation icon shows a badge with the count of unread alerts (`is_read: false`).
*   [ ] Each alert in the feed shows the game title, the store, the price that triggered the alert, and the type (`target_reached` or `historical_low`).
*   [ ] Clicking on an alert marks it as read (`POST /api/hunter/alerts/{id}/read`) and the badge updates.
*   [ ] The system does not generate duplicate alerts for the same condition (e.g., if the price remains below the target, a new alert is not created every day).

**Edge Cases:**
*   A game is removed from the store. The "watch" should perhaps be deactivated or the user notified.
*   The ITAD API is down when the scheduler runs. The job should retry or log the failure, but it must not crash.