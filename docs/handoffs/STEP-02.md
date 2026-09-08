# STEP-02: Frontend Architecture & Design System

**Phase:** 2 · **Date:** 2026-09-08 · **Agent:** 02 (Frontend Architecture & Design System Engineer)
**Source of truth:** `docs/MASTER-GUIDE.md` (read in full; unmodified)

## 1. Starting State

Phase 1 complete (commit `0d72da7`): npm-workspaces monorepo; frontend = Vite + React 19 + strict
TS + Tailwind 4 with a minimal shell (Header/Footer/HomePage + SystemStatus health card); backend =
Express 5 foundation with `/api/health`; docs set + STEP-01 handoff; clean git tree; portable
Node v22.20.0 runtime in gitignored `.tools/` (Node not installed system-wide on this machine).

## 2. Phase Objective

Establish the reusable premium frontend design system and application layout that later phases
build the real storefront on — tokens, typography, UI primitives, responsive shell, routing
foundation, homepage structure — without implementing e-commerce features, inventing business
data, or touching backend scope.

## 3. Implemented

- Centralized design tokens in `src/index.css` (`@theme`): full indigo primary ramp, semantic
  roles, feedback colors with AA-safe foreground tokens, radii/shadow tokens, motion keyframes;
  global focus-visible ring and prefers-reduced-motion handling; hero glow utility.
- Typography: self-hosted variable fonts (Sora display, Inter body) via @fontsource.
- 20 UI primitives (see §5), including a full button system and product card/grid foundations.
- Routing foundation (react-router-dom v7): 12 public routes + 404 with honest placeholders.
- Application shell: sticky responsive Header (desktop nav + mobile Drawer), Footer with
  future-ready link groups, SiteLayout (skip link → header → main → footer), ScrollToTop.
- Homepage foundation per Master Guide §7: Hero, value props, featured/best-seller showcases,
  bundles teaser, why-PlutoReso, honest social-proof placeholder, FAQ preview (native details),
  config-driven WhatsApp CTA.
- Catalog preview page (clearly-marked mock data), empty-cart state, 404, system-status page
  (Phase 1 health card preserved), placeholder pages for future content/policies.
- `frontend/vercel.json` SPA rewrites prepared for the future deployment phase.

## 4. Design System

Documented in `docs/DESIGN_SYSTEM.md`. Summary:
- **Colors:** primary indigo 50–950; semantic background #f8fafc, surface #ffffff, foreground
  #0f172a, muted-fg #475569, subtle-fg #64748b, border #e2e8f0, border-strong/input #cbd5e1,
  focus #4f46e5; success #059669 / warning #d97706 / danger #dc2626 each with `-soft` and
  darkened `-foreground` (AA); whatsapp #25d366. Neutrals: Tailwind slate. Dark: slate-950.
- **Typography:** Sora Variable (display) + Inter Variable (body), self-hosted; hero 4xl→6xl,
  section 2xl/3xl, card base, body base/7, support sm/6, meta xs uppercase.
- **Spacing:** container max-w-6xl with px-4/sm:px-6/lg:px-8; sections py-14→20; cards p-4/p-5;
  gaps 4→6. **Breakpoints:** sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536.
- **Radii:** lg controls · xl cards · 2xl panels · full pills. **Shadows:** card, card-hover,
  drawer (+ default sm on primary buttons).
- **Motion:** 150–200ms ease-out; hover lift −2px; button press scale .98; keyframe utilities
  animate-overlay-in/drawer-in/toast-in; global reduced-motion rule.
- **Conventions:** prop-driven components, tokens over magic values, one icon system (lucide),
  images lazy/async in 4:3 media with branded placeholder, honesty encoded in components.

## 5. Components Created

UI primitives (`src/components/ui/`): Button (+ button-styles recipe for links), IconButton,
Spinner, Badge, Card, Container, Section, Divider, Skeleton, EmptyState, ErrorState, PriceDisplay,
Input, Textarea, Select, Checkbox, FormField, Drawer, Toast (+ useToast), ProductCard
(+ ProductCardSkeleton), ProductGrid.
Shell/home: layout/Header, layout/Footer, layouts/SiteLayout, WhatsAppCta, home/{Hero, ValueProps,
ProductShowcaseSection, BundlesTeaser, WhyPlutoReso, SocialProofPlaceholder, FaqPreview}.
Support: lib/{cn, money, ScrollToTop}, types/product, config/site, data/mock-products.

## 6. Pages/Layout Created

- `layouts/SiteLayout` (public shell: skip link → header → main → footer)
- `pages/HomePage` (Master Guide §7 structure), `pages/ProductsPage` (catalog preview),
  `pages/ProductDetailPage` (honest placeholder), `pages/CartPage` (honest empty state),
  `pages/NotFoundPage`, `pages/SystemStatusPage` (Phase 1 health card preserved),
  `pages/PlaceholderPage` (renders /about, /faq, /contact, /privacy, /terms,
  /refund-policy, /delivery-policy with honest copy).

## 7. Files Created

frontend/src/: lib/{cn.ts, money.ts, ScrollToTop.tsx}, types/product.ts, config/site.ts,
data/mock-products.ts, components/ui/{button-styles.ts, Spinner.tsx, Button.tsx, IconButton.tsx,
Badge.tsx, Card.tsx, Container.tsx, Divider.tsx, Skeleton.tsx, Section.tsx, EmptyState.tsx,
ErrorState.tsx, PriceDisplay.tsx, Input.tsx, Textarea.tsx, Select.tsx, Checkbox.tsx, FormField.tsx,
useToast.ts, Toast.tsx, Drawer.tsx, ProductCard.tsx, ProductGrid.tsx}, components/layout/
{Header.tsx, Footer.tsx}, components/home/{Hero.tsx, ValueProps.tsx, ProductShowcaseSection.tsx,
BundlesTeaser.tsx, WhyPlutoReso.tsx, SocialProofPlaceholder.tsx, FaqPreview.tsx},
components/WhatsAppCta.tsx, layouts/SiteLayout.tsx, pages/{ProductsPage.tsx, ProductDetailPage.tsx,
CartPage.tsx, NotFoundPage.tsx, SystemStatusPage.tsx, PlaceholderPage.tsx}, frontend/vercel.json,
docs/DESIGN_SYSTEM.md, docs/handoffs/STEP-02.md

## 8. Files Modified

frontend/src/{index.css (design tokens rewrite), App.tsx (route table), main.tsx (router +
providers + font imports), vite-env.d.ts (+VITE_WHATSAPP_NUMBER), pages/HomePage.tsx (Phase 1
shell replaced)}, frontend/.env.example (+VITE_WHATSAPP_NUMBER), frontend/package.json (+4 deps),
README.md, PROJECT_STATUS.md, docs/{ARCHITECTURE.md, TESTING.md, SECURITY.md, DEPLOYMENT.md}

## 9. Files Deleted

frontend/src/components/Header.tsx and frontend/src/components/Footer.tsx — superseded by the
components/layout/ versions (functionality preserved there).

## 10. Dependencies Added

- `react-router-dom@^7.6.0` — minimal routing foundation required by this phase (§22).
- `lucide-react@^0.525.0` — one consistent, tree-shaken icon system (§19).
- `@fontsource-variable/inter@^5.2.5` + `@fontsource-variable/sora@^5.2.5` — premium typography
  pairing, self-hosted (no CDN), unicode-range subsets keep payloads small (§3, §17).

## 11. Architecture Changes

Frontend only; backend untouched. Additions: router-based multi-page SPA (BrowserRouter +
SiteLayout with Outlet), `components/ui` primitive layer with strict prop-driven data boundary
(`Product` type; mock data isolated and marked), toast context as the first shared UI state,
public site-config boundary (`config/site.ts` + optional `VITE_WHATSAPP_NUMBER`). Phase 1's
architecture (workspaces, backend pipeline, env boundaries, health endpoint) fully preserved;
Phase 1's shell components were replaced by the layout system (SystemStatus card moved to
`/system-status`).

## 12. Environment Variables

- `frontend/.env.example` adds `VITE_WHATSAPP_NUMBER` (optional, **public**, international format
  without "+"). Empty by default; the WhatsApp CTA renders a "coming soon" state when unset.
- `VITE_API_URL` unchanged. No secrets added anywhere.

## 13. Testing

- `npm install`: PASS (added 7 packages)
- `npm run lint`: PASS (backend + frontend, exit 0)
- `npm run typecheck`: PASS (backend + frontend, strict, exit 0)
- `npm run build`: PASS — frontend built (JS 277.27 kB → 86.07 kB gzip; CSS 39.40 kB → 8.23 kB
  gzip; fonts emitted as lazy unicode-range subsets); backend build unchanged, passing
- Backend regression: started `node dist/index.js` → `GET /api/health` → HTTP 200 JSON PASS
- Built frontend via `vite preview --port 4173`: `/` → 200 (contains PlutoReso markup + JS bundle
  reference), `/products` → 200, `/products/sample-content-creator-toolkit` → 200, `/cart` → 200
  (SPA fallback verified for deep links)

## 14. Responsive Verification

Not browser-tested — no interactive browser session was available in this environment. Verified
instead via: mobile-first CSS architecture (base styles at 360px, progressive breakpoints),
grid breakpoints (1→2→3→4 columns), drawer navigation below `md`, tap-target heights (h-10/h-12),
container/padding scales, and the passing production build + SPA routes. Recommended: a human
pass at 360 / 390 / 768 / 1024 / 1440 widths checking for overflow, contrast, and tap comfort.

## 15. Accessibility Verification

Code-level review confirmed: semantic landmarks (header/nav/main/footer/section/article), skip
link, heading hierarchy per page, aria-labelledby on sections, aria-expanded/aria-controls on the
menu button, role="dialog"/aria-modal drawer with Escape + focus handling, required `aria-label`
on icon-only controls (TS-enforced), FormField wiring (htmlFor/aria-describedby/aria-invalid/
role=alert), `aria-busy` loading, `sr-only` price context, visible global focus ring, AA-checked
text tokens, reduced-motion support. Not run: automated axe audit or screen-reader testing.

## 16. Known Issues

- No real-browser visual/a11y/performance testing performed (environment limitation) — see §14.
- Product detail, cart, policies, about/FAQ/contact are intentional placeholders until their phases.
- The Add to Cart CTA shows an honest toast explaining cart/checkout arrive later (no fake cart).
- Single light theme; dark surfaces (hero/footer) are fixed styling, not a dark mode.
- `eslint-plugin-react-refresh`-safe file split (button-styles.ts, useToast.ts) adds two tiny
  non-component modules — a deliberate convention to keep component files fast-refreshable.

## 17. Blockers

- None for Phase 3. Owner actions still pending from Phase 1: GitHub remote, WhatsApp number,
  real business content (policies, about) — all documented in PROJECT_STATUS.

## 18. Current Project State

Working now: premium design system + shell (desktop nav, mobile drawer, footer), 13 routes with
honest placeholders, homepage foundation with clearly-marked sample products, catalog preview
page with grid/cards/price display, empty-cart state, 404 page, `/system-status` dev page,
SPA-fallback-verified build. `install/lint/typecheck/build` all pass; backend unchanged and
healthy. No backend features, real products, payments, auth, or delivery exist (by design).

## 19. Next Phase

**Phase 3 — Database & Backend Foundation** (Supabase PostgreSQL schema + backend data layer,
per Master Guide §23/§50). Do NOT implement it until the owner provides the Phase 3 prompt.


