# PlutoReso — API Contract

> Canonical request/response contract for the PlutoReso backend API.
> Phase 4 scope: **Authentication** endpoints only. Product/order/payment endpoints are future phases.

---

## Conventions

- **Base URL:** `/api` (backend); frontend calls via `VITE_API_URL`.
- **Content-Type:** `application/json` for all POST bodies.
- **Auth:** Session cookie (`plutoreso_session`, HttpOnly). Frontend sends `credentials: "include"`.
- **Success envelope:** Resource-shaped JSON (no `{ success: true }` wrapper).
- **Error envelope:** `{ "error": { "message": "..." } }` (never stack traces or SQL).
- **HTTP codes:** 200 success · 400 bad input · 401 unauthenticated · 403 forbidden · 404 not found · 429 rate-limited · 500 server error.

---

## Authentication

### `POST /api/auth/login`

Establishes an authenticated admin session.

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Non-empty |

**200 Response:**
```json
{ "authenticated": true, "admin": { "id": "uuid", "email": "...", "name": "...", "role": "owner" } }
```
Sets cookie: `plutoreso_session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`

**401 Response (invalid email, wrong password, or inactive — same message for all):**
```json
{ "error": { "message": "Invalid email or password" } }
```

**400 Response (malformed input):**
```json
{ "error": { "message": "Invalid request body" } }
```

**429 Response (rate limit exceeded):**
```json
{ "error": { "message": "Too many login attempts. Please try again later." } }
```

---

### `POST /api/auth/logout`

Invalidates the current session. Idempotent (safe to call unauthenticated).

**200 Response:**
```json
{ "authenticated": false }
```
Clears cookie (sets `Max-Age=0` with the same attributes as the set cookie).

---

### `GET /api/auth/session`

Returns current authentication state. Called by the frontend on mount.

**200 Response (authenticated):**
```json
{ "authenticated": true, "admin": { "id": "uuid", "email": "...", "name": "...", "role": "admin" } }
```

**200 Response (unauthenticated):**
```json
{ "authenticated": false }
```

---

### `GET /api/admin/me`

Protected — requires a valid active session.

**200 Response:**
```json
{ "id": "uuid", "email": "...", "name": "...", "role": "owner", "status": "active", "last_login_at": "..." }
```

**401 Response (unauthenticated or inactive):**
```json
{ "error": { "message": "Authentication required" } }
```

---

## Health

### `GET /api/health`

Liveness probe (process health only).

**200 Response:**
```json
{ "status": "ok", "service": "plutoreso-backend", "environment": "production", "uptimeSeconds": 1234, "timestamp": "..." }
```

### `GET /api/health/db`

Database readiness probe (real `select 1` round-trip).

**200 Response:**
```json
{ "status": "ok", "database": "reachable", "latencyMs": 12, "timestamp": "..." }
```

**503 Response:**
```json
{ "status": "unavailable", "database": "not_configured", "timestamp": "..." }
```

---

## Future Phases (not yet implemented)

These endpoints are **not** part of Phase 4 and are documented here as the planned contract:

| Method | Path | Phase |
|---|---|---|
| GET | `/api/products` | 6 |
| GET | `/api/products/:slug` | 6 |
| POST | `/api/orders` | 7 |
| POST | `/api/payments/create-order` | 8 |
| POST | `/api/payments/verify` | 8 |
| POST | `/api/webhooks/razorpay` | 8 |
| POST | `/api/auth/customer/*` | 9 |
| GET/POST/PUT/DELETE | `/api/admin/products` | 5 |
| GET/POST | `/api/admin/categories` | 5 |

---
_Maintained alongside implementation. Phase 4 scope: auth + health only._
