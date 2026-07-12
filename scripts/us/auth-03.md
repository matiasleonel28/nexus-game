*   **As a** registered player,
*   **I want to** reset my password if I forget it,
*   **so that** I can regain access to my account.

**Scenarios:**
*   A user on the login page clicks a "Forgot Password?" link.
*   The user is taken to a page where they enter their registered email address.
*   The system sends an email with a unique, time-sensitive password reset link.
*   The user clicks the link, is taken to a new page, and can set a new password.

**Acceptance Criteria:**
*   [ ] A "Forgot Password?" link exists on the `LoginPage`.
*   [ ] A `/forgot-password` page exists to submit an email.
*   [ ] A backend endpoint `POST /api/auth/forgot-password` receives the email, generates a unique reset token, and triggers an email (simulated in development).
*   [ ] A `/reset-password/:token` page allows the user to enter and confirm a new password.
*   [ ] A backend endpoint `POST /api/auth/reset-password` validates the token and updates the user's password hash.
*   [ ] Upon successful reset, the user is notified and can log in with their new password.

**Edge Cases:**
*   The user enters an email that is not registered.
*   The reset token is invalid or has expired.
*   The new passwords entered do not match.