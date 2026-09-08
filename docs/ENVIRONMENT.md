# Environment Variables

> Principles (Master Guide §12, §34, §35):
> - **Backend** = private secrets. **Frontend** = public configuration only.
> - Anything prefixed `VITE_` is embedded into the public JS bundle — **never** put secrets there.
> - Never commit `.env` / `.env.local`. Only safe placeholder names live in `.env.example` files.

## Local setup

```bash
copy backend\.env.example backend\.env      # required for non-default config only
copy frontend\.env.example frontend\.env    # optional — safe defaults built in
```

No real credentials exist or are required in Phase 1. Do not invent values.

## Backend — `backend/.env`

| Variable | Required now | Purpose | Status |
| --- | --- | --- | --- |
| `NODE_ENV` | No (default `development`) | `development` \| `test` \| `production` | Example only |
| `PORT` | No (default `4000`) | HTTP port the API listens on | Example only |
| `CLIENT_ORIGIN` | **Yes in production** | CORS allowlist origin(s), comma-separated; validated at startup | Example only |

Future backend variables (documented in `backend/.env.example`; do **not** create until their phase):

| Variable | Phase | Notes |
| --- | --- | --- |
| `DATABASE_URL` | 3 | Supabase PostgreSQL connection string |
| `SESSION_SECRET` | 4 | Admin session signing |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | 8 | Server-side only — never expose |
| `RAZORPAY_WEBHOOK_SECRET` | 9 | Server-side only |
| `GOOGLE_DRIVE_*` | 10 | Delivery credentials stay server-side |
| `EMAIL_*` / `SMTP_*` | 12 | Transactional email provider |

## Frontend — `frontend/.env`

| Variable | Required now | Purpose | Status |
| --- | --- | --- | --- |
| `VITE_API_URL` | No (default `http://localhost:4000`) | Public base URL of the backend API | Example only |

There are no other frontend variables, and there must never be secrets in this file.

## Production (when deployment phase arrives)

- **Render (backend):** `NODE_ENV=production`, `CLIENT_ORIGIN=https://<your-domain>` (platform
  provides `PORT`), plus phase-appropriate secrets at that time.
- **Vercel (frontend):** `VITE_API_URL=https://<api-domain>` (public value only).
- See [`DEPLOYMENT.md`](DEPLOYMENT.md) — deployment has not been performed yet.
