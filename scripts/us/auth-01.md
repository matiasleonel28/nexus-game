*   **As a** player,
*   **I want to** register and log in to the application with my email and password,
*   **so that** my game library and alerts are secure and private.

**Scenarios:**
*   A new user arrives at the application and sees a login/register screen.
*   An existing user opens the app and can enter their credentials.
*   A user forgets their password (future functionality, to be considered).

**Acceptance Criteria:**
*   [ ] A Login page (`/login`) and a Register page (`/register`) exist.
*   [ ] The frontend sends the credentials to the `POST /api/auth/login` endpoint.
*   [ ] If the login is successful, the `access_token` and `refresh_token` are stored securely on the client (e.g., `localStorage` or `sessionStorage`).
*   [ ] The Axios client is intercepted to attach the `Authorization: Bearer <token>` to all subsequent requests.
*   [ ] If a request fails with a 401, the system attempts to use the `refresh_token` to get a new `access_token`. If this also fails, the user is redirected to `/login`.
*   [ ] The `DEV_NO_AUTH=1` environment variable is no longer necessary for the frontend's normal operation.

**Edge Cases:**
*   The user enters an email with an invalid format.
*   The user enters an incorrect password.
*   The backend API is unavailable during the login attempt.