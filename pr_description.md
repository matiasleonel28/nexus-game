## Phase 1 — Security hardening (SEC-01 to SEC-06)

This PR implements Phase 1 security hardening as requested.

### Checklist of changes:
- [x] **SEC-01: Rate limiting**
  - Added `slowapi` dependency.
  - Implemented 60/min global limit and 5/min limit for auth endpoints (`/login`, `/register`, `/forgot-password`).
- [x] **SEC-02: CORS hardening**
  - Refactored `CORSMiddleware` to be environment-driven.
  - Development allows Vite dev server ports; Production strictly uses the `ALLOWED_ORIGINS` env var (no wildcards).
- [x] **SEC-03: Input validation**
  - Added `EmailStr` and `email-validator` for strict email validation.
  - Implemented `Field` constraints (minimum 8 chars for passwords, 1-5 range for enjoyment).
  - Used `Literal` types for statuses and platforms.
- [x] **SEC-04: HTTPS and secure headers**
  - Added custom middleware to enforce HTTPS in production via `X-Forwarded-Proto`.
  - Injected strict security headers (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`).
- [x] **SEC-06: Secrets management**
  - Standardized external API keys (IGDB, ITAD) to use `security._require_secret`.
  - Ensures startup validation of required env vars.
- [x] **SEC-05: Privacy policy and data protection**
  - Added `DELETE /api/auth/me` with cascading deletion across `Game`, `Alert`, and `RefreshToken`.
  - Added `GET /api/auth/me/export` for GDPR/data export compliance.
  - Added `PrivacyPolicy.jsx` in the frontend for transparency.
