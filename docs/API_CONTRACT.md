# PlutoReso — API Contract

> Canonical request/response contract for the PlutoReso backend API.
> Phase 7 scope: **Authentication + Admin Product Management + Public Storefront
> Catalog + Cart & Checkout**. Payment endpoints are Phase 8.

---

## Conventions

- **Base URL:** `/api` (backend); frontend calls via `VITE_API_URL`.
- **Content-Type:** `application/json` for all POST bodies.
- **Auth:** Session cookie (`plutoreso_session`, HttpOnly). Frontend sends `credentials: "include"`.
- **Success envelope:** Resource-shaped JSON (no `{ success: true }` wrapper).
- **Error envelope:** `{ "error": { "message": "..." } }` (never stack traces or SQL).
- **HTTP codes:** 200 success · 201 created · 400 bad input · 401 unauthenticated · 403 forbidden · 404 not found · 409 conflict · 429 rate-limited · 500 server error · 503 catalog unavailable (DB not configured).

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

## Public Storefront Catalog (Phase 6)

Unauthenticated, read-only endpoints that power the storefront. **No session
required; no cookies consumed.** Only **active** products and **active**
categories are ever returned — status filtering is server-enforced and cannot
be overridden from the client. Responses are customer-safe DTOs: they never
include `drive_folder_id`, admin metadata, sessions, or internal fields.

### `GET /api/products`

Query (all optional): `page` (default 1) · `perPage` (default 12, max 50) ·
`category` (category slug) · `search` (name/description, max 200) · `sort`
(`newest|price-asc|price-desc|name`, default `newest`) · `featured`
(`true|false`) · `bestSeller` (`true|false`).

**200 Response:**

```json
{
  "products": [
    {
      "id": "uuid", "name": "...", "slug": "...",
      "short_description": "...", "price_minor": 19900,
      "compare_at_price_minor": 29900, "currency": "INR",
      "category": { "id": "uuid", "name": "...", "slug": "..." },
      "primary_image": { "id": "uuid", "media_type": "image", "url": "...", "alt_text": "..." },
      "is_featured": true, "is_best_seller": false
    }
  ],
  "pagination": { "page": 1, "perPage": 12, "total": 42, "totalPages": 4 }
}
```

**400:** invalid query (bad slug shape, out-of-range page, unknown sort).
**503:** database not configured (graceful storefront error state).

### `GET /api/products/:slug`

SEO-friendly lookup by product slug.

**200 Response:** `{ "product": { ...card fields, "full_description", "features": [],
"benefits": [], "preview_content", "media": [...], "seo_title", "seo_description" } }`

**404:** unknown slug or non-active product (identical response — no
existence leak for inactive/archived products). **400:** malformed slug.
**503:** database not configured.

### `GET /api/categories`

**200 Response:** `{ "categories": [{ "id", "name", "slug", "description",
"sort_order" }] }` — active categories in `sort_order` sequence (empty array
is valid). **503:** database not configured.

---

## Admin Product Management (Phase 5)

All endpoints below require an authenticated, active admin session
(`requireAdmin`, session cookie + `credentials: "include"`). `owner` and
`admin` roles may manage the catalog. Unauthenticated → **401**.

Money is integer minor units (paise) at the API boundary (`price_minor`).
The admin form collects rupees and converts at the boundary. Raw Google Drive
folder URLs are never stored — the backend validates/extracts the folder ID
and persists only `products.drive_folder_id`.

### `GET /api/admin/products`

Query: `page` (default 1) · `perPage` (default 20, max 100) · `status`
(`active|inactive|archived`) · `categoryId` (uuid) · `search` (name/slug) ·
`sort` (`name|price|created|updated|sort_order`) · `order` (`asc|desc`).

**200 Response:**

```json
{
  "products": [{ "id": "uuid", "name": "...", "slug": "...", "price_minor": 19900, "status": "active" }],
  "pagination": { "page": 1, "perPage": 20, "total": 42, "totalPages": 3 }
}
```

### `POST /api/admin/products`

**201 Response:** `{ "product": { ... } }` (returns the final slug — auto-suffixed
`-2`, `-3`, … when the requested slug is taken).

**400:** validation failure (bad slug, negative price, bad status, unknown
category, malformed Drive folder URL). **409:** not used on create (auto-suffix).

### `GET /api/admin/products/:id`

**200:** `{ "product": { ... } }`. **400:** invalid UUID. **404:** not found.

### `PATCH /api/admin/products/:id`

Partial field update (name, slug, descriptions, prices, category, features,
benefits, preview, `drive_folder_url`, flags, sort order, SEO).

**200:** `{ "product": { ... } }`. **400:** validation failure.
**404:** not found. **409:** slug changed to another product's slug.

### `PATCH /api/admin/products/:id/status`

Body: `{ "status": "active" | "inactive" | "archived" }`.

**200:** `{ "product": { ... } }`. **400:** invalid status. **404:** not found.

### `DELETE /api/admin/products/:id`

Soft archive — sets `status = "archived"` (no hard delete; preserves
restrictive `order_items` references).

**200:** `{ "product": { "id": "uuid", "status": "archived" } }`.
**404:** not found.

### Product media

- `GET /api/admin/products/:id/media` → **200** `{ "media": [...] }`
- `POST /api/admin/products/:id/media` → **201** `{ "media": { ... } }`
  (body: `media_type` in `image|video|preview`, `url`, `alt_text`, `sort_order`)
- `PATCH /api/admin/products/:id/media/:mediaId` → **200** `{ "media": { ... } }`
- `DELETE /api/admin/products/:id/media/:mediaId` → **204** (no body)

**400:** invalid type/URL. **404:** product or media not found.

### Categories

- `GET /api/admin/categories` → **200** `{ "categories": [...] }`
- `POST /api/admin/categories` → **201** `{ "category": { ... } }`
  (slug auto-suffixed on conflict)
- `PATCH /api/admin/categories/:id` → **200** `{ "category": { ... } }`
  (**409** when the slug is changed to another category's slug)

No category hard-delete endpoint exists in Phase 5.

---

## Cart & Checkout (Phase 7)

Public, no-auth endpoints. The browser is **never** trusted for money — the server re-reads active products from the database and computes all totals in integer minor units (paise).

### `POST /api/checkout/validate`

Revalidates a client cart against authoritative DB prices. Used by the cart page to flag unavailable items and detect price changes.

**Body:**
```json
{ "items": [{ "product_id": "uuid", "quantity": 1 }] }
```

`quantity` is clamped to 1 (digital products = one license per purchase). Duplicate product IDs are merged server-side.

**200 Response:**
```json
{
  "cart": {
    "currency": "INR",
    "items": [{ "product_id": "uuid", "product_name": "...", "product_slug": "...", "unit_price_minor": 19900, "compare_at_price_minor": null, "currency": "INR", "image_url": "..." }],
    "unavailable_product_ids": [],
    "subtotal_minor": 19900
  }
}
```

`unavailable_product_ids` lists IDs that are inactive/archived/unknown. `subtotal_minor` is the authoritative total from DB prices.

**400:** validation failure. **503:** database unavailable.

---

### `POST /api/checkout/prepare`

Creates a PENDING, payment-ready order. The order is never marked PAID — Phase 8 (Razorpay) owns that transition.

**Body:**
```json
{
  "items": [{ "product_id": "uuid", "quantity": 1 }],
  "customer": { "name": "...", "email": "...", "phone": "..." },
  "client_request_id": "uuid"
}
```

`client_request_id` is an optional idempotency key — when supplied, a recent PENDING order for the same customer with the same product set (within 24 hours) is returned instead of creating a duplicate.

**201 Response:**
```json
{
  "order": {
    "order_number": "PLT-2026-000042",
    "status": "PENDING",
    "currency": "INR",
    "subtotal_minor": 19900,
    "discount_minor": 0,
    "total_minor": 19900,
    "items": [{ "product_id": "uuid", "product_name": "...", "product_slug": "...", "unit_price_minor": 19900, "compare_at_price_minor": null, "quantity": 1, "line_total_minor": 19900 }],
    "created_at": "..."
  }
}
```

**400:** validation failure. **409:** some items unavailable (includes `unavailable_product_ids`). **503:** database unavailable.

## Future Phases (not yet implemented)

These endpoints are **not yet implemented** and are documented here as the planned contract:

| Method | Path | Phase |
|---|---|---|
| POST | `/api/payments/create-order` | 8 |
| POST | `/api/payments/verify` | 8 |
| POST | `/api/webhooks/razorpay` | 8 |
| POST | `/api/auth/customer/*` | 9 |
| GET/POST/PATCH/DELETE | `/api/admin/products` | 5 IMPLEMENTED |
| GET/POST/PATCH | `/api/admin/categories` | 5 IMPLEMENTED |
| POST | `/api/checkout/validate` | 7 IMPLEMENTED |
| POST | `/api/checkout/prepare` | 7 IMPLEMENTED |

---
_Maintained alongside implementation. Phase 7 scope: auth + health + admin product management + public storefront catalog + cart & checkout._
