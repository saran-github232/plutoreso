# STEP-08: Razorpay Payment Integration — COMPLETION HANDOFF (Phase 8 implemented)

> **Status: COMPLETE.** Implemented on top of Phase 7. Phase 8 commit is
> created after this handoff. No Phase 9 work started.

## 1. Starting State (verified by inspection)

- HEAD was `f0a523b` (Phase 7 cart & checkout), branch `main`, clean tree.
- Phases 1–7 complete: foundation, design system, Supabase schema (17 tables,
  7 migrations, `pg` layer, RLS default-deny), admin auth, admin product
  management, public storefront catalog, cart + checkout foundation
  (centralized cart, `/api/checkout/validate`, `/api/checkout/prepare`,
  authoritative DB pricing, PENDING order creation, item snapshots).
- Phase 3 schema already contained the `payments` table (provider enum
  `razorpay`, `provider_order_id`, `status payment_status default 'created'`,
  integer `amount_minor`, partial unique index) and the `orders.status`
  enum value `PAYMENT_INITIATED` — **no migration was required** (see
  `docs/DATABASE.md` → Future migration notes).

## 2. Phase 8 Objective (Master Guide §54, §25, §42)

Implement the production-ready **Razorpay payment integration**:

PENDING local order → Razorpay order → Standard Checkout → browser result →
"submitted / awaiting verification". Server-side verification, webhooks, and
the PAID transition are **Phase 9** and are deliberately absent here.

## 3. Backend Implemented

### 3.1 Configuration (`src/config/env.ts`, `backend/.env.example`)

- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (server-only, optional locally,
  required in production). Payment endpoints return **503** when unset.
- Only the **Key ID** is ever returned to the frontend. The **Key Secret**
  is never logged, never returned by any endpoint, never committed.

### 3.2 Service (`src/services/razorpay.service.ts`)

- Isolates all Razorpay SDK usage: lazy client (`getRazorpayClient`),
  `isRazorpayConfigured()`, `createRazorpayOrder({ receipt, amountMinor,
  currency, notes })`.
- Error normalization: provider errors are mapped to a safe `RazorpayError`
  with a generic customer message (`code` preserved internally) — raw provider
  internals and credentials never reach the client or the logs.

### 3.3 Repository (`src/repositories/payment.repository.ts`)

- `getOrderWithItems(executor, orderId)` — loads the local order + items.
- `createPayment(...)` — inserts a `payments` row with `status = 'created'`.
- `findLatestPaymentForOrder(executor, orderId, status?)` — used for the
  idempotent retry path.
- `markOrderPaymentInitiated(executor, orderId)` — flips `orders.status` to
  `PAYMENT_INITIATED` (never PAID).
- `findPaymentByProviderOrderId` — retained helper for Phase 9 lookups.

### 3.4 Controller & DTO (`src/controllers/public/payment.controller.ts`,
`src/controllers/public/payment.dto.ts`)

- `POST /api/payments/razorpay/order` accepts **only** the local order UUID
  (`createRazorpayOrderBodySchema`, strict). Amount / currency / state are
  re-read from PostgreSQL — the browser never supplies money.
- Payable states: `PENDING` (first attempt) and `PAYMENT_INITIATED` (retry)
  via the exported `isOrderPayable(status)` helper. All other states → 409.
- Idempotency: if the local order already has a `created` payment, the
  recorded Razorpay order is returned (200) — **no second provider call**.
- Otherwise creates the Razorpay order (amount = `order.total_minor` integer
  paise, currency from the order), records the payment row, marks the order
  `PAYMENT_INITIATED`, and returns 201 with a safe DTO containing:
  `razorpay_order_id`, `amount_minor`, `currency`, `key_id`, `order_number`,
  `order_status`, `business_name`, `description`.
- `orders`/`payments` raw rows are never returned directly.

### 3.5 Routes (`src/routes/payment.routes.ts`, `src/routes/index.ts`)

- `paymentRouter` mounted at `/api/payments` with `POST /razorpay/order`.
  No webhook or verify route exists (Phase 9).

## 4. Frontend Implemented

- **`src/hooks/useRazorpayScript.ts`** — safe loader for
  `https://checkout.razorpay.com/v1/checkout.js`: no duplicate injection,
  handles already-loaded scripts, polling fallback, and a failure → `error`
  state with a usable error UI.
- **CheckoutPage** (`src/pages/CheckoutPage.tsx`):
  - Order creation step (Phase 7) now carries the local order **UUID** (`id`)
    on the `PublicOrder` DTO (see `checkout.dto.ts` / `lib/checkout.ts`).
  - **Pay securely** button (confirm step) calls
    `POST /api/payments/razorpay/order` with the server-authoritative config,
    then opens Razorpay Standard Checkout (`key`, `order_id`, `amount`,
    `currency`, `prefill` name/email/contact) — all values from the server
    response, never recomputed client-side.
  - Button prevents duplicate clicks (`submitting` state); modal dismiss and
    `payment.failed` are handled with honest "order still pending" copy.
  - Browser success callback shows **"Payment submitted — awaiting
    verification"** and does NOT clear the cart or claim payment success.
- **`src/lib/checkout.ts`** — `createRazorpayOrder(orderId)` client and
  `RazorpayOrderResponse` / `PaymentApiError` types; error mapping for
  503/404/409/network.
## 5. Security Model

- **Money security:** the browser sends only the order UUID. Amount, currency,
  and payable state come from PostgreSQL in integer minor units (paise). No
  client-supplied price/total/currency is ever used to create a Razorpay order.
- **Secret handling:** `RAZORPAY_KEY_SECRET` exists only in the backend
  environment. The frontend bundle, API responses, tests, logs, and docs never
  contain it. The frontend receives only `RAZORPAY_KEY_ID`.
- **Phase 9 boundary:** the browser's post-payment callback
  (`razorpay_payment_id` / `razorpay_order_id` / `razorpay_signature`) is
  treated as **NOT final**. No HMAC verification, no webhooks, no PAID
  transition, no entitlements, no Google Drive delivery exist in Phase 8.
- **No accidental scope:** there is no `verify`/`webhook` route, no
  `payment.captured` / `order.paid` handling, no `crypto.createHmac`
  signature check anywhere in the Phase 8 code.

## 6. Idempotency & Retry Behavior

| Scenario | Behavior |
| --- | --- |
| First pay click | Creates one Razorpay order + `payments` row (`created`); order → `PAYMENT_INITIATED`; 201 |
| Double click / reopened modal / page retry | Local order already has a `created` payment → **reuses** the same Razorpay order; 200; no provider call |
| Customer closes modal | `ondismiss` shows "order still pending"; customer can retry (same Razorpay order) |
| Payment failed in browser | `payment.failed` shows honest error; order stays payable for retry |
| Order already PAID / FAILED / CANCELLED / REFUNDED | 409 (not payable) |
| Razorpay unreachable / provider error | 502 with safe message; nothing persisted; retryable |

Abandoned orders stay `PENDING` / `PAYMENT_INITIATED`; Phase 9 webhooks and
reconciliation will be responsible for expiring or completing them.

## 7. Tests

`backend/tests/payment.test.ts` (14 tests, provider SDK fully mocked — no real
network calls):

- request schema: valid/missing/invalid/strict-extra-field order_id
- config gates: `isRazorpayConfigured`, unconfigured client → null
- `RazorpayError` shape (safe message + internal code)
- integer minor-unit money invariant (₹100 = 10000 paise)
- `isOrderPayable`: PENDING and PAYMENT_INITIATED allowed; PAID/FAILED/
  CANCELLED/REFUNDED/FULFILLED rejected
- Phase 9 boundary: no `/verify` or `/webhook` route definitions exist

Full backend suite: **112/112** (payment 14, checkout 31, catalog 12,
drive-url 19, validation 20, auth 16).

## 8. Verification Performed

| Check | Result |
| --- | --- |
| Backend `npx tsc --noEmit` | PASS (exit 0) |
| Frontend `npx tsc -b` | PASS (exit 0) |
| Backend / frontend `npm run lint` | PASS (exit 0) |
| Backend `npm run build` (tsc) | PASS (exit 0) |
| Frontend `npm run build` (tsc + vite) | PASS (JS ~350 kB → 103 kB gzip) |
| Backend `npm test` (vitest) | PASS — 112/112 |
| `git diff --check` | PASS (no whitespace errors) |
| Live Razorpay Test payment | NOT RUN — requires owner-provided Test Mode credentials |

## 9. Owner Actions

1. Create Razorpay Test Mode keys →
   Dashboard → Account & Settings → API Keys. Set `RAZORPAY_KEY_ID` and
   `RAZORPAY_KEY_SECRET` in `backend/.env` (or Render env). The Key Secret
   stays server-side.
2. Run an actual Test Mode payment end-to-end (Test Cards available in the
   Razorpay dashboard) once the Supabase database is connected.
3. Policy pages are still required before going live (Master Guide §28).

## 10. Phase 9 Boundary — Explicit Confirmation

Phase 8 does **not** implement:
- HMAC payment signature verification as final payment verification
- a Razorpay webhook endpoint or signature verification
- `payment.captured` / `order.paid` processing
- marking orders PAID
- entitlement creation
- Google Drive delivery

All of the above remain Phase 9 / Phase 10 work. The Phase 8 code and tests
explicitly assert these boundaries.