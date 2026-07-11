*   **As a** new player,
*   **I want to** create an account using my email and a password,
*   **so that** I can access the application and save my personal game library.

**Scenarios:**
*   A new user navigates to the `/register` page from the login screen.
*   The user fills in their email and a secure password (with a confirmation field).
*   Upon successful registration, the user is automatically logged in and redirected to their dashboard.

**Acceptance Criteria:**
*   [ ] The `/register` page has fields for email, password, and password confirmation.
*   [ ] Client-side validation checks for a valid email format and that passwords match and meet the minimum length (e.g., 8 characters).
*   [ ] Submitting the form calls the `POST /api/auth/register` endpoint.
*   [ ] If registration is successful, the backend returns `access_token` and `refresh_token`.
*   [ ] The frontend securely stores the tokens, updates the application state to logged-in, and redirects the user to the main dashboard (`/`).
*   [ ] If the email is already in use, the backend returns a `400 Bad Request`, and the UI displays a clear error message.

**Edge Cases:**
*   The user enters an invalid email format.
*   The passwords do not match or are too short.
*   The backend API is unavailable during the registration attempt.