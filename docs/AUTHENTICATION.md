# PlutoReso — Authentication Architecture

> Phase 4 implementation. Server-side session authentication for PlutoReso administrators.
> Source of truth: `docs/MASTER-GUIDE.md` (§35, §42, §48).

---

## 1. Overview

PlutoReso uses **server-side session authentication** for administrators. The backend is the single source of truth for authorization — the frontend never declares itself authenticated.

| Concern | Implementation |
|---|---|
| Password hashing | **Argon2id** (memory-hard, OWASP-recommended) |
| Session storage | PostgreSQL `admin_sessions` table |
| Session token | 32-byte cryptographically random (Node `crypto.randomBytes`) |
| Token storage | Only `sha256(token)` stored in DB; raw token lives in an HttpOnly cookie |
| Cookie | HttpOnly, Secure (prod), SameSite=Lax, 7-day max-age |
| Rate limiting | `express-rate-limit` on `POST /api/auth/login` (15 req / 15 min / IP) |
| Authorization | Reusable `requireAdmin` middleware on every protected route |
| Audit | `audit_logs` rows for login success/failure, logout, bootstrap |

---

## 2. Database Schema

### `admins` table (Phase 3 + Phase 4 columns)

Phase 4 relies on these columns (some added via migration `20260908000008_admin_sessions.sql`):

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid PK | Admin identity |
| `email` | citext UNIQUE | Login identifier (case-insensitive) |
| `name` | text | Display name |
| `role` | text | `owner` or `admin` (check constraint) |
| `status` | text | `active` or `disabled` (check constraint) |
| `password_hash` | text | Argon2id hash (nullable until set) |
| `failed_login_attempts` | int | Brute-force counter (default 0) |
| `locked_until` | timestamptz | Account lockout timestamp |
| `last_login_at` | timestamptz | Last successful login |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Auto-updated via trigger |

### `admin_sessions` table (Phase 4)

```sql
CREATE TABLE admin_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,   -- sha256 of the raw token
  ip_address   inet,
  user_agent   text,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
```

**RLS:** Enabled (inherits Phase 3 default-deny). The backend connects as the table owner and bypasses RLS for session operations.

---

## 3. API Endpoints

---

## 4. Session & Cookie Security

| Attribute | Value | Rationale |
|---|---|---|
| `HttpOnly` | `true` | Inaccessible to JavaScript (XSS-resistant) |
| `Secure` | `true` in production | Never sent over plain HTTP |
| `SameSite` | `Lax` | CSRF-resistant while allowing top-level navigations |
| `Path` | `/` | Available to all routes |
| `Max-Age` | 7 days | Explicit expiration |
| Name | `plutoreso_session` | Opaque identifier |

**Session lifecycle:**
1. Login → raw 32-byte token generated; `sha256(token)` stored in `admin_sessions`; raw token set in cookie.
2. Each request → `requireAdmin` middleware hashes the cookie token, looks it up, checks expiry, verifies admin is active.
3. Logout → session row deleted; cookie cleared (same attributes as set, plus `expires_at` in the past).
4. Expiry → session is rejected even if the cookie is present. (A future cleanup job can prune expired rows.)

**Session fixation protection:** A new token is issued on every login; no session is reused across authentication events.

---

## 5. Authorization Model

### Middleware

```ts
import { requireAdmin } from "./auth/auth.middleware.js";

// Rejects unauthenticated/inactive requests with 401
router.get("/admin/me", requireAdmin, adminController.me);
```

`requireAdmin`:
1. Reads `plutoreso_session` cookie.
2. Hashes the token → looks up the session in PostgreSQL.
3. Checks the session is not expired.
4. Loads the admin → verifies `status === "active"`.
5. Attaches `{ id, email, name, role }` to `req.admin`.
6. Rejects with 401 on any failure.

### Roles

Phase 4 distinguishes two roles (`owner`, `admin`) but does not yet enforce role-based access control beyond "is an authenticated admin." The `requireAdmin` middleware is structured so a future `requireRole("owner")` can be added without rewriting authentication.

### Inactive admin handling

A disabled admin (`status = 'disabled'`) is rejected at the middleware level — even if they hold a previously valid session cookie. This enables immediate de-provisioning without waiting for session expiry.

---

## 6. Password Security

- **Hashing:** Argon2id via the `argon2` npm package (memory-hard, resistant to GPU/ASIC attacks).
- **Verification:** `argon2.verify(hash, password)` — constant-time comparison.
- **Minimum strength:** Passwords must be ≥ 8 characters (enforced at bootstrap and will be enforced at admin-creation time in Phase 5).
- **Storage:** Only the Argon2id string is stored. Plaintext passwords are never written to the database, logged, or printed.

---

## 7. Rate Limiting

`express-rate-limit` is applied to `POST /api/auth/login`:

| Limit | Window | Scope |
|---|---|---|

---

## 8. CORS & Credentials

The existing Phase 1 CORS configuration already allows credentials (`credentials: true`) and restricts origins to the configured allowlist (`CLIENT_ORIGIN`). Phase 4 preserves this:

- **Development:** `http://localhost:5173` (Vite dev server)
- **Production:** the deployed frontend origin (e.g. `https://plutoreso.com`)

The frontend API client sends `credentials: "include"` on auth requests so the cookie is included.

---

## 9. CSRF Considerations

- `SameSite=Lax` cookies are not sent on cross-origin POST requests, providing baseline CSRF protection.
- State-changing auth operations (login, logout) are POST requests requiring the cookie.
- The frontend does not read or write the session token — it is purely server-managed.

---

## 10. Audit Logging

The Phase 3 `audit_logs` table records authentication events:

| Event | Action stored |
|---|---|
| Successful login | `admin.login.success` |
| Failed login | `admin.login.failed` |
| Logout | `admin.logout` |
| Bootstrap/admin creation | `admin.created` |

Audit rows store the admin ID and a timestamp. **No passwords, tokens, or session cookies are ever written to audit logs.**

---

## 11. Admin Bootstrap

A controlled CLI mechanism creates the first administrator without hardcoding credentials:

```
node backend/scripts/bootstrap-admin.mjs
```

**Behavior:**
- Reads `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` from the environment (never committed).
- Hashes the password with Argon2id before storage.
- Refuses to overwrite an existing admin with the same email (safe against accidental re-runs).
- Requires `BOOTSTRAP_TOKEN` to match an env-configured value, preventing unauthorized invocation even if the script is exposed.
- Logs only the created admin's email — never the password.

**Production safety:** The bootstrap script is a server-side file, not an HTTP endpoint. It cannot be triggered by a network request. The owner runs it once during initial setup, then removes/unsets the bootstrap env vars.

---

## 12. Frontend Architecture

### Auth context (`frontend/src/context/`)

- `AuthContext` provides `{ admin, authenticated, loading, login, logout, refresh }`.
- `useAuth()` hook exposes the context to components.
- On mount, the context calls `GET /api/auth/session` to determine state.

### Routes

| Route | Behavior |
|---|---|
| `/admin/login` | Login form (email + password). Redirects to `/admin` if already authenticated. |
| `/admin` | Protected admin shell. Redirects to `/admin/login` if unauthenticated. |

### Route guard (`AdminRouteGuard`)

A UX-layer guard redirects unauthenticated users to `/admin/login`. **This is not a security boundary** — every admin API endpoint independently enforces authentication via `requireAdmin`.


---

## 13. Environment Variables

| Variable | Scope | Required | Purpose |
|---|---|---|---|
| `SESSION_SECRET` | SERVER-ONLY | Production | Signing secret for session integrity (defense-in-depth) |
| `BOOTSTRAP_TOKEN` | SERVER-ONLY | Bootstrap only | Guards the bootstrap script |
| `BOOTSTRAP_ADMIN_EMAIL` | SERVER-ONLY | Bootstrap only | Initial admin email (unset after use) |
| `BOOTSTRAP_ADMIN_PASSWORD` | SERVER-ONLY | Bootstrap only | Initial admin password (unset after use) |
| `CLIENT_ORIGIN` | SERVER-ONLY | Production | Allowed CORS origin (already present) |
| `DATABASE_URL` | SERVER-ONLY | Production | PostgreSQL connection (already present) |

No authentication secrets are exposed to the frontend. `SESSION_SECRET` has no fallback in production — the server fails fast if it is missing.

---

## 14. Testing

`backend/tests/auth.test.ts` (Vitest) covers:

- ✅ Valid credentials succeed
- ✅ Invalid password fails (generic 401)
- ✅ Unknown email fails (generic 401 — same message)
- ✅ Inactive admin is denied
- ✅ Malformed input is rejected (400)
- ✅ Session endpoint returns authenticated admin
- ✅ Unauthenticated session returns `{ authenticated: false }`
- ✅ Logout invalidates the session
- ✅ Protected endpoint returns 401 when unauthenticated
- ✅ Protected endpoint returns 200 when authenticated
- ✅ Password hashing round-trips correctly
- ✅ Argon2id verification rejects wrong passwords
- ✅ Rate limiter configuration is valid
- ✅ Session token generation produces unique tokens
- ✅ Cookie attributes are secure

Run: `npm run test --workspace backend`

---

## 15. Security Review

- ✅ No plaintext passwords stored or logged
- ✅ Argon2id (memory-hard) password hashing
- ✅ Only `sha256(token)` stored in DB — raw token lives only in the cookie
- ✅ HttpOnly, Secure, SameSite=Lax cookies
- ✅ Session expiration + revocation on logout
- ✅ Inactive admins denied even with valid sessions
- ✅ Generic auth-failure messages (no email enumeration)
- ✅ Rate limiting on login
- ✅ Server-side authorization on every protected route
- ✅ Frontend route guards are UX-only (not security)
- ✅ No credentials in source code or Git
- ✅ No fallback production secrets
- ✅ Audit logs contain no passwords/tokens

---

## 16. Known Limitations

- No automated session-expiry cleanup job (expired sessions are rejected on read; a future phase can prune them).
- Per-client RLS policies are deferred to phases with real browser clients (the backend connects as the table owner).
- No "remember me" vs. session-cookie distinction — all sessions use the same 7-day cookie.
- No multi-factor authentication (out of scope for Phase 4).

---

## 17. Future Phases

- **Phase 5:** Admin product management (protected by `requireAdmin`).
- **Phase 6+:** Customer-facing storefront (separate auth concerns).
- **Phase 15:** Automated test suite expansion.

---

_Implemented in Phase 4. See `docs/handoffs/STEP-04.md` for the implementation handoff._

### Login page

- Uses the Phase 2 design system (Button, Input, FormField, Card, Spinner).
- Accessible: labeled inputs, `type="password"`, visible focus states, `aria-busy` during submission.
- Safe errors: displays the generic backend message without revealing which field was wrong.
- No password is stored in `localStorage`/`sessionStorage`/React state.

| 15 requests | 15 minutes | Per IP address |

Exceeding the limit returns **429** with a safe error message. The limiter respects `trust proxy` (set to 1) so the client IP is correct behind Render/Vercel.


All endpoints are mounted under `/api`.

### `POST /api/auth/login`

Authenticates an admin and establishes a session.

**Request body (JSON):**
```json
{ "email": "owner@example.com", "password": "..." }
```

**Validation (Zod):** email must be a valid email format; password must be a non-empty string.

**Success (200):**
```json
{
  "authenticated": true,
  "admin": { "id": "...", "email": "...", "name": "...", "role": "owner" }
}
```
Sets the `plutoreso_session` cookie.

**Failure (401):** Generic message — does not reveal whether the email exists, the password was wrong, or the account is inactive:
```json
{ "error": { "message": "Invalid email or password" } }
```

**Rate limited:** 15 attempts per 15-minute window per IP. Returns 429 when exceeded.

### `POST /api/auth/logout`

Invalidates the current session and clears the cookie. Safe to call when unauthenticated (idempotent — returns 200).

**Success (200):**
```json
{ "authenticated": false }
```

### `GET /api/auth/session`

Returns the current authentication state. The frontend calls this on mount to determine whether to show the login page or the admin shell.

**Authenticated (200):**
```json
{
  "authenticated": true,
  "admin": { "id": "...", "email": "...", "name": "...", "role": "..." }
}
```

**Unauthenticated (200):**
```json
{ "authenticated": false }
```

### `GET /api/admin/me`

Protected endpoint proving authenticated access. Returns the same safe admin profile as `/session`.

- Unauthenticated → **401**
- Inactive admin → **401**
