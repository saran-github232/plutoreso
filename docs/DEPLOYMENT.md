# Deployment

> **Status: NOT DEPLOYED.** This document records the target architecture
> ([Master Guide §30–§34](MASTER-GUIDE.md)) for the deployment phase. Nothing is hosted yet.

## Target architecture

```text
Internet → Custom Domain (Hostinger, e.g. plutoreso.com / plutoreso.in)
         → Vercel (frontend)  ──HTTPS /api──▶  Render (backend)
                                                 ├──▶ Supabase PostgreSQL (Phase 3)
                                                 ├──▶ Razorpay (Phase 8–9)
                                                 └──▶ Google Drive delivery (Phase 10)
```

Customers always interact with the custom domain — never with the Render backend URL.

## Targets and commands

| Service | Setting | Value |
| --- | --- | --- |
| Vercel | Root Directory | `frontend` |
| Vercel | Build command | `npm run build` |
| Vercel | Output | `frontend/dist` |
| Vercel | Env vars | `VITE_API_URL` (public only) — see [`ENVIRONMENT.md`](ENVIRONMENT.md) |
| Vercel | SPA rewrites | `frontend/vercel.json` prepared (all paths → `/index.html`) |
| Render | Root Directory | `backend` |
| Render | Build command | `npm install && npm run build` |
| Render | Start command | `npm run start` (`node dist/index.js`) |
| Render | Health check path | `/api/health` |
| Render | Env vars | `NODE_ENV=production`, `CLIENT_ORIGIN=https://<domain>`, phase-appropriate secrets |

## Pre-launch obligations (Master Guide §52)

Domain connected, HTTPS active, policies published, webhook + payment signature verification,
test purchase, entitlement verified, email delivery, admin security, mobile/desktop testing, SEO,
analytics, Meta tracking, error logging, backups — all checked in the Master Guide's production
checklist before launch. None of these are done yet.
