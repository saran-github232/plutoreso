# Security

> Rules baseline: [`docs/MASTER-GUIDE.md`](MASTER-GUIDE.md) (§5, §11–13, §22, §25, §35, §48).
> This document records what is enforced **today** and what is planned per phase. Nothing here
> weakens the Master Guide.

## Implemented now (Phase 1)

- **No secrets in source.** `.gitignore` excludes `.env`/`.env.*` (`.env.example` allowed);
  only placeholder names are committed.
- **Environment boundaries.** Frontend receives only public configuration (`VITE_API_URL`).
  All current and future credentials are backend-only.
- **Fail-fast validated configuration** (zod): invalid/missing config aborts startup;
  `CLIENT_ORIGIN` is mandatory when `NODE_ENV=production` so CORS can never silently open up.
- **Security headers** via `helmet`; `x-powered-by` disabled.
- **CORS allowlist** — trusted origins only (defaults to local Vite origins in development).
- **Request size limits** — 100 kb JSON/urlencoded bodies.
- **No internal details to clients** — generic 5xx messages; stack traces never returned;
  error details logged server-side only.
- **Log hygiene** — request logger omits query strings so tokens/personal data in URLs are never logged.
- **Reverse-proxy aware** — `trust proxy` set for Render/Vercel-style deployments.
- **Public-only frontend configuration** (Phase 2) — the design system and sample data contain no
  secrets; the WhatsApp CTA reads an optional public `VITE_WHATSAPP_NUMBER` and renders an honest
  "coming soon" state when unset; no fake auth or payment UI exists anywhere.
- **No fake security** — no fake authentication, no fake payment success, no product data exists.
  Nothing is claimed secure that is not implemented.

## Deliberately not implemented yet (planned phases)

| Control | Phase | Notes |
| --- | --- | --- |
| Admin authentication/authorization | 4 | Password hashing, secure sessions/cookies, rate limiting, backend enforcement — frontend-only security is never acceptable. |
| Payment verification | 8 | Razorpay signature verification server-side; never trust frontend success. |
| Webhook security | 9 | Raw-body signature validation, idempotency, no duplicate fulfillment on retries. |
| Entitlement/access control | 10 | Digital delivery only after server-verified payment + entitlement check; no raw Drive URLs public. |
| Rate limiting / hardening | 14 | Per Master Guide §25 and §50. |
| CSRF protection | 4+ | Applied where applicable (cookie-based sessions). |

## Standing rules for all future phases

- Never commit secrets; never expose secrets to the frontend; never log sensitive data.
- Validate all input server-side; deny by default; authorization is always enforced in the backend.
- User-facing errors stay understandable; technical details go to logs.
