# Testing & Verification

> Baseline: [`docs/MASTER-GUIDE.md`](MASTER-GUIDE.md) §51. Actual verification results per phase are
> recorded in [`PROJECT_STATUS.md`](../PROJECT_STATUS.md) and [`handoffs/`](handoffs/).

## Current state

There is **no automated test suite yet** — Phase 1 is foundation-only, and per phase discipline
tests arrive with the features they cover (Master Guide §51). Do not mistake this for a gap in the
foundation: lint, typecheck, build, and runtime checks below are the Phase 1 quality gates.

## Phase 1 verification commands (from repo root)

```bash
npm install            # workspaces: frontend + backend
npm run lint           # ESLint, both workspaces
npm run typecheck      # TypeScript strict, both workspaces
npm run build          # backend tsc build → backend/dist, frontend tsc+vite build → frontend/dist
```

Runtime checks:

- Backend: `npm run dev:backend` (or `npm run build && npm run start`) →
  `GET http://localhost:4000/api/health` must return HTTP 200 JSON with `status: "ok"`.
- Frontend: `npm run dev:frontend` → `http://localhost:5173` must render the app shell;
  the System status card should show **Connected** when the backend is running.

## Manual UI checks (Phase 1)

- Layout at mobile / tablet / desktop widths, no horizontal overflow, working navigation,
  visible keyboard focus states, no console errors.
- Note: automated browser testing is not part of Phase 1; a human browser session should confirm
  the visual checks above.

## Future test strategy (per Master Guide §51)

| Area | Coverage to add with its feature phase |
| --- | --- |
| Products | Create, edit, archive, activate, deactivate |
| Cart | Add, remove, pricing, discounts, coupon, persistence |
| Payments | Success, failure, cancellation; duplicate webhook; invalid webhook/payment signatures |
| Delivery | Correct product access; unauthorized/wrong-product access blocked; invalid entitlement handled |
| Admin | Login, logout, unauthorized access, session expiry, permission checks |
