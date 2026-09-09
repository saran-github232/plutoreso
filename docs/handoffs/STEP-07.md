# STEP-07: Cart & Checkout Foundation — COMPLETION HANDOFF (Phase 7 implemented)

> **Status: COMPLETE.** Implemented on top of Phase 6. Phase 7 commit is
> created after this handoff. No Phase 8 work started.

## 1. Starting State (verified by inspection)

- HEAD was `403ea1d` (Phase 6 storefront / product pages), branch `main`, clean tree.
- Phases 1–6 complete: foundation, design system, Supabase schema (17 tables,
  7 migrations, `pg` layer, RLS default-deny), admin auth, admin product
  management, public storefront catalog (active products only, customer-safe DTOs).
- Authoritative schema: `product_status` = `active|inactive|archived`;
  money in minor units (paise); `orders.status = PENDING|PAID|CANCELLED|REFUNDED`;
  `order_items` snapshots (name/slug/unit_price at checkout time); `customers`
  citext email unique index.
﻿

## 2. Phase 7 Objective (Master Guide §10, §25, §42)

Implement the complete **cart + checkout foundation** for the customer flow:

Products → Product Detail → Add to Cart → Cart → Checkout → Order preparation
/ creation foundation → Ready for Razorpay.

Payment (Razorpay) is intentionally **NOT** here — Phase 8 owns it.

## 3. Backend Implemented

### 3.1 Validation (`src/validation/checkout.schemas.ts`)

- `cartLineSchema` — product_id (uuid) + quantity (int, clamped to 1 per
  Master Guide §10 digital licensing: one license per purchase).
- `cartLinesSchema` — 1..20 lines.
- `validateCheckoutBodySchema` — `{ items }` for `/api/checkout/validate`.
- `prepareCheckoutBodySchema` — `{ items, customer: { name, email, phone? },
  client_request_id? }` for `/api/checkout/prepare`.
- `mergeCartItems()` — dedupes cart lines server-side, preserving request order,
  collapsing duplicate product IDs to a single line.

### 3.2 Repository (`src/repositories/checkout.repository.ts`)

- `getActiveProductsByIds(executor, productIds)` — authoritative active-only
  product projection read fresh from PostgreSQL, ordered by sort_order/name.
- `getPrimaryImageUrls(executor, productIds)` — primary image URL per product
  for cart display only.
- `upsertCustomerByEmail(executor, input)` — upserts customer by case-insensitive
  email (citext unique index); existing name/phone preserved when new value empty.
- `findRecentPendingOrderWithItems(executor, customerId, windowMinutes)` — finds
  a recent PENDING order for idempotency/dedupe.
- `createPendingOrderWithItems(executor, input)` — creates PENDING order plus
  item snapshots in the caller's transaction. **No payment row is created and
  the order is never marked PAID.**

### 3.3 DTOs (`src/controllers/public/checkout.dto.ts`)

- `toPublicOrder(order, items)` — customer-safe DTO (no drive_folder_id).
- `toPublicValidatedCart(products, requestedIds, primaryImageUrls)` —
  authoritative revalidation with `unavailable_product_ids`.
- `calculateSubtotalMinor(products)` — integer-only subtotal from DB prices.

### 3.4 Controller (`src/controllers/public/checkout.controller.ts`)

- `POST /api/checkout/validate` — revalidates a cart against active products.
- `POST /api/checkout/prepare` — creates the unpaid, payment-ready order:
  - Authoritative product read inside a transaction; rejects unavailable items (409).
  - Customer upsert. Idempotency via `client_request_id` (24h dedupe window).
  - Authoritative subtotal in integer minor units. PENDING order + snapshots.
  - **Never marks an order as PAID. Never creates a fake payment.**

### 3.5 Routes (`src/routes/checkout.routes.ts`) & Wiring (`src/routes/index.ts`)

- `checkoutRouter` mounted at `/api/checkout` with `POST /validate` and
  `POST /prepare`. Registered on the public API router.

## 4. Frontend Implemented

- **CartContext** (`src/context/CartContext.tsx`) — centralized cart state +
  versioned localStorage persistence. Business rules: one product once, browser
  never authoritative for money, no secrets/Drive IDs stored.
- **useCart** (`src/context/useCart.ts`) — Fast-Refresh-safe hook.
- **checkout client** (`src/lib/checkout.ts`) — `validateCart()` /
  `prepareCheckout()`; `CheckoutApiError` (safe messages).
- **CartPage** (`src/pages/CartPage.tsx`) — revalidates on load, price-change
  detection, remove/clear, subtotal, empty/error/loading states.
- **CheckoutPage** (`src/pages/CheckoutPage.tsx`) — name/email/phone form,
  client validation, creates PENDING order, order-confirmation screen. No money
  sent. Idempotency via `client_request_id` (sessionStorage).
- **ProductDetailPage** — real "Add to cart" replacing Phase 6 placeholder.
- **ProductCard** — reusable `onAddToCart` callback.
- **ProductsPage** / **ProductShowcaseSection** — add to cart from grid.
- **Header** — cart count badge + link.
- **App.tsx** — `/cart` and `/checkout` routes added.

## 5. Security & Money Safety

- **Frontend is NEVER authoritative for money.** Browser sends product IDs,
  quantity, checkout info only. Server loads authoritative data from PostgreSQL.
- **Server-authoritative pricing** — integer minor units (paise). ₹100 = 10000.
- **Never trust frontend** price/subtotal/total/currency/discount.
- **No drive_folder_id exposure** in cart/checkout responses.
- **No Razorpay** — Phase 8 only.
- **No fake payments.** Order is only ever PENDING.
- **Parameterized SQL**, safe error envelope, input validation (Zod).

## 6. Files Created / Modified

Created (backend): `validation/checkout.schemas.ts`,
`repositories/checkout.repository.ts`, `controllers/public/checkout.dto.ts`,
`controllers/public/checkout.controller.ts`, `routes/checkout.routes.ts`,
`tests/checkout.test.ts`. Created (frontend): `context/useCart.ts`,
`lib/checkout.ts`, `pages/CartPage.tsx`, `pages/CheckoutPage.tsx`.
Modified: `routes/index.ts`, `context/CartContext.tsx`, `main.tsx`, `App.tsx`,
`pages/ProductDetailPage.tsx`, `pages/ProductsPage.tsx`,
`components/home/ProductShowcaseSection.tsx`, `components/ui/ProductCard.tsx`,
`components/layout/Header.tsx`, `docs/API_CONTRACT.md`,
`docs/ARCHITECTURE.md`, `PROJECT_STATUS.md`, this handoff.
**No new dependencies, no new env vars, zero new migrations.**

## 7. Verification

- Backend `npx tsc --noEmit`: PASS (exit 0).
- Frontend `npx tsc -b`: PASS.
- `npm run lint` (both workspaces): PASS (exit 0).
- Backend `npx vitest run`: all existing tests (catalog/validation/auth) +
  new checkout tests pass.
- Runtime: `node dist/index.js` boots; `GET /api/health` → 200.
- Security: parameterized SQL; safe error envelope; no secrets/tokens/hashes in
  responses; no drive_folder_id leakage; no payment functionality.

## 8. Tests Written (`tests/checkout.test.ts`)

- **Validation schemas** — valid cart, invalid product_id, quantity > 1 rejected,
  empty cart rejected, too many lines rejected.
- **Customer validation** — valid customer, invalid email, name too short,
  phone too short.
- **Prepare body** — valid body, missing customer, extra fields rejected.
- **mergeCartItems** — dedupes preserving order, collapses duplicate product IDs.
- **calculateSubtotalMinor** — integer math, empty cart, ignores negative prices.
- **toPublicOrder** — DTO shape, no drive_folder_id leakage, items mapped.
- **toPublicValidatedCart** — authoritative revalidation, unavailable IDs,
  subtotal calculation.

## 9. Next Phase

**Phase 8 — Razorpay** (payment integration: Razorpay order creation, payment
verification, webhook handling, signature verification, payment callbacks,
payment success processing, order status transition PENDING → PAID).

Phase 7 ends here; nothing from Phase 8 implemented.

## 10. Continuation Point

Phase 7 commit: `feat: implement Phase 7 cart and checkout` on `main`.
Next agent: verify `git status` clean, read this handoff, start Phase 8.

