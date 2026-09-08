# PlutoReso

Production-ready digital-products e-commerce platform for India — INR pricing, Razorpay payments, Google Drive-based digital delivery.

> **Source of truth:** [`docs/MASTER-GUIDE.md`](docs/MASTER-GUIDE.md).
> Read it before making any architectural change. All business rules and architecture decisions are defined there.

## Current status

**Phase 2 — Frontend Architecture & Design System: complete.**

The repository now has a reusable premium design system, an application shell with responsive
navigation, a routing foundation, and a homepage structure built on clearly-marked sample data.
There are still no real products, payments, delivery, or admin features. See
[PROJECT_STATUS.md](PROJECT_STATUS.md) for the precise implemented / planned / not-implemented state.

## Technology stack

| Layer | Technology | Status |
| --- | --- | --- |
| Frontend | React 19 + Vite 6 + TypeScript + Tailwind CSS 4 (React Router, lucide icons, self-hosted Inter + Sora) | Design system + foundation pages |
| Backend | Node.js 22 + Express 5 + TypeScript | Foundation API only |
| Database | Supabase PostgreSQL | Planned (Phase 3) |
| Payments | Razorpay | Planned (Phase 8–9) |
| Digital storage | Google Drive behind a delivery/entitlement abstraction | Planned (Phase 10) |
| Frontend hosting | Vercel | Planned (deployment phase) |
| Backend hosting | Render | Planned (deployment phase) |
| Source control | GitHub | Remote setup pending (owner) |

## Repository structure

```text
plutoreso/
├── frontend/                 # React + Vite + TypeScript storefront (Vercel target)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Design-system primitives (Button, Card, ProductCard, …)
│   │   │   ├── layout/       # Header, Footer (application shell)
│   │   │   ├── home/         # Homepage sections (Hero, ValueProps, …)
│   │   │   └── SystemStatus  # Phase 1 backend-health card (dev utility page)
│   │   ├── layouts/          # SiteLayout (skip link → header → page → footer)
│   │   ├── pages/            # Route pages (Home, Products, Cart, placeholders, 404)
│   │   ├── lib/              # cn, money (INR formatting), api client, ScrollToTop
│   │   ├── types/            # Product type (storefront projection of Master Guide §3)
│   │   ├── config/           # Public site configuration (nav, WhatsApp boundary)
│   │   ├── data/             # Clearly-marked mock data (design preview only)
│   │   ├── App.tsx           # Route table
│   │   ├── main.tsx          # Router + providers + fonts
│   │   └── index.css         # Design-system tokens (@theme)
│   ├── .env.example          # PUBLIC env vars only
│   ├── vercel.json           # SPA rewrites (prepared for deployment phase)
│   └── package.json
├── backend/                  # Node + Express + TypeScript API (Render target)
│   ├── src/
│   │   ├── config/           # zod-validated environment configuration
│   │   ├── middleware/       # request logger, central error handler
│   │   ├── routes/           # /api/health (future mounts documented here)
│   │   ├── app.ts            # Express app factory (security pipeline)
│   │   └── index.ts          # server bootstrap + graceful shutdown
│   ├── .env.example          # Private env placeholder names only
│   └── package.json
├── docs/                     # MASTER-GUIDE.md + architecture/security/env/testing/deployment + handoffs/
├── .gitignore
├── package.json              # npm workspaces root
├── PROJECT_STATUS.md
└── README.md
```

## Prerequisites

- **Node.js >= 20.19** (Node 22 LTS recommended) and npm 10+.
- On this development machine, Node.js is provisioned as a portable runtime at
  `.tools/node-v22.20.0-win-x64` (gitignored). Either add that folder to your `PATH` or install
  Node.js normally — the project itself has no dependency on `.tools`.

## Getting started

```bash
# 1. Install dependencies (workspaces: frontend + backend)
npm install

# 2. Configure environment (placeholders only — no real secrets exist yet)
copy backend\.env.example backend\.env     # Windows
copy frontend\.env.example frontend\.env   # optional; has safe defaults

# 3. Run backend + frontend together
npm run dev
# Backend API:  http://localhost:4000  (health: http://localhost:4000/api/health)
# Frontend app: http://localhost:5173
```

## Available scripts (repo root)

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs backend API and frontend dev server together |
| `npm run dev:backend` | Backend only (tsx watch, port 4000) |
| `npm run dev:frontend` | Frontend only (Vite, port 5173) |
| `npm run build` | Type-checks and builds backend (`dist/`) and frontend (`dist/`) |
| `npm run lint` | ESLint for both workspaces |
| `npm run typecheck` | TypeScript checks for both workspaces |
| `npm run start` | Starts the built backend (`node dist/index.js`) |

## Environment variables

- `backend/.env.example` — private server-side configuration placeholder names only
  (`NODE_ENV`, `PORT`, `CLIENT_ORIGIN`; future phases add `DATABASE_URL`, `RAZORPAY_*`, etc.).
- `frontend/.env.example` — **public** configuration only (`VITE_API_URL`, optional
  `VITE_WHATSAPP_NUMBER`).
- **Never commit real `.env` files. Never place secrets in frontend env vars.**
  Details: [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md).

## Implementation status

### Implemented (Phase 1 — Project Foundation)

- Monorepo structure (npm workspaces): `frontend/`, `backend/`, `docs/`
- Frontend foundation: Vite + React + TypeScript + Tailwind, mobile-first accessible app shell,
  health-status card that checks the backend API
- Backend foundation: Express 5 app factory with security headers, CORS allowlist, request size
  limits, request logging, central error handling, validated env config, `/api/health`
- Tooling: ESLint (both workspaces), strict TypeScript configs, build scripts
- Documentation set + `.env.example` files + `.gitignore` (secrets excluded)

### Implemented (Phase 2 — Frontend Architecture & Design System)

- Design-system tokens (colors, semantic roles, typography pairing, spacing, radii, shadows,
  motion) centralized in `index.css` and documented in `docs/DESIGN_SYSTEM.md`
- Reusable UI primitives: Button system, IconButton, Badge, Card, Container, Section, Skeleton,
  EmptyState, ErrorState, PriceDisplay (INR via minor units), Divider, form controls
  (Input/Textarea/Select/Checkbox/FormField), Drawer, Toast, ProductCard + ProductGrid
- Routing foundation (React Router): home, catalog preview, product-detail placeholder, cart
  (empty state), about/FAQ/contact placeholders, policy placeholders, 404, system status
- Application shell: sticky header with desktop nav + mobile drawer, footer with future-ready
  link groups, accessible layout with skip link
- Homepage foundation per Master Guide §7 (honest content only — sample products clearly marked,
  no fake testimonials/numbers/scarcity)
- SPA rewrites prepared (`frontend/vercel.json`) for the deployment phase

### Planned (future phases — see Master Guide §50)

- Database schema and backend data layer (Supabase) — Phase 3
- Admin authentication and product management — Phases 4–5
- Storefront catalog and product pages — Phase 6
- Cart, checkout, Razorpay payments, webhook verification — Phases 7–9
- Entitlements and Google Drive delivery — Phase 10
- Bundles, coupons, email, SEO/analytics, hardening, deployment — Phases 11–18

### Not yet implemented

Everything in the "Planned" list above, including: products, cart, payments, admin panel,
authentication, entitlements, email, analytics, and deployment. No product data exists —
the owner will populate products via the Admin Panel in a later phase.

## Documentation

| Document | Purpose |
| --- | --- |
| [`docs/MASTER-GUIDE.md`](docs/MASTER-GUIDE.md) | Source of truth — all rules and architecture |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Design tokens, components, conventions |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Foundation architecture and boundaries |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Security model now and per future phase |
| [`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md) | Environment variable reference and rules |
| [`docs/TESTING.md`](docs/TESTING.md) | Verification commands and future test strategy |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Target hosting architecture (not yet deployed) |
| [`docs/handoffs/`](docs/handoffs/) | Per-phase handoff reports |
| [`PROJECT_STATUS.md`](PROJECT_STATUS.md) | Actual current project state |

