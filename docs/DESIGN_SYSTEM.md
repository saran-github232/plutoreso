# PlutoReso Design System

> Phase 2 foundation. Tokens live in `frontend/src/index.css` (`@theme`); components consume the
> Tailwind utilities generated from those tokens. The baseline rules are defined by
> [`MASTER-GUIDE.md`](MASTER-GUIDE.md) (§6 design direction, §37 honesty rules, §40 performance,
> §41 accessibility). Nothing here overrides the Master Guide.

## Design philosophy

Premium but restrained: **trust, clarity, conversion confidence**. Mobile-first (Meta Ads traffic),
honest content (no fake scarcity, testimonials, or invented numbers), accessible by default,
fast on mid-range phones. If a choice adds visual noise, it is wrong.

## Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display / headings | **Sora Variable** (`font-display`) | Geometric, modern, techy |
| Body / UI | **Inter Variable** (`font-sans`) | Highly readable at small sizes |

- Both are **self-hosted** via `@fontsource-variable` — no external font CDN; Vite emits
  unicode-range subsets so browsers fetch only the files they need.
- Scale (Tailwind): hero `text-4xl → sm:text-5xl → lg:text-6xl`; page title `text-3xl/4xl`;
  section title `text-2xl/3xl`; card title `text-base`; body `text-base leading-7`;
  support `text-sm leading-6`; meta/labels `text-xs uppercase tracking-wider`.
- Weights: 400/500 body, 600/700 headings, buttons and badges. Headings use `tracking-tight`.

## Color tokens (`@theme` → utilities)

| Token | Value | Utility example |
| --- | --- | --- |
| `--color-primary-50…950` | Indigo ramp (#eef2ff → #1e1b4b) | `bg-primary-600` |
| `--color-background` | #f8fafc | `bg-background` |
| `--color-surface` / `--color-surface-raised` | #ffffff | `bg-surface` |
| `--color-foreground` | #0f172a | `text-foreground` |
| `--color-muted-foreground` | #475569 | `text-muted-foreground` |
| `--color-subtle-foreground` | #64748b | `text-subtle-foreground` |
| `--color-border` / `--color-border-strong` | #e2e8f0 / #cbd5e1 | `border-border` |
| `--color-input` | #cbd5e1 | `border-input` |
| `--color-focus` | #4f46e5 | global focus ring |
| `--color-success` (+`-soft`, `-foreground`) | #059669 / #ecfdf5 / #065f46 | `text-success` |
| `--color-warning` (+`-soft`, `-foreground`) | #d97706 / #fffbeb / #92400e | `text-warning-foreground` |
| `--color-danger` (+`-soft`, `-foreground`) | #dc2626 / #fef2f2 / #991b1b | `bg-danger` |
| `--color-whatsapp` | #25d366 | `text-whatsapp` |

Contrast rules: body and muted text ≥ 7:1 on surfaces; subtle text ≥ 4.5:1 (meta only); feedback
`*-foreground` tokens are darkened to hold AA on their `*-soft` backgrounds. Neutrals use Tailwind's
built-in `slate` scale. Dark surfaces (hero, footer) use `slate-950` with white/slate text.

## Spacing & layout

- **Container:** `Container` → `max-w-6xl` (72rem), padding `px-4 sm:px-6 lg:px-8`.
- **Section rhythm:** `py-14 sm:py-16 lg:py-20` (the `Section` primitive enforces it).
- **Cards:** `p-4 sm:p-5`; **grids:** `gap-4 sm:gap-5 lg:gap-6`.
- **Breakpoints (Tailwind defaults, mobile-first):** `sm` 640 (large mobile) · `md` 768 (tablet)
  · `lg` 1024 (laptop) · `xl` 1280 (desktop) · `2xl` 1536 (large desktop).

## Radii, borders, shadows

- Radii: `rounded-lg` controls · `rounded-xl` cards/surfaces · `rounded-2xl` feature panels ·
  `rounded-full` pills/badges.
- Borders: hairline `border-border`; emphasized `border-border-strong`; inputs `border-input`.
- Shadows: `shadow-card` (rest) → `shadow-card-hover` (hover lift) · `shadow-drawer` (overlays) ·
  Tailwind `shadow-sm` on primary buttons. Shadows stay subtle — no glow stacks.

## Motion

- Durations 150–200ms, `ease-out`. Hover lift: `-translate-y-0.5` on cards; active: `scale-[0.98]`
  on buttons. Entrance keyframes: `animate-overlay-in`, `animate-drawer-in`, `animate-toast-in`.
- **Global `prefers-reduced-motion` rule** disables animations, transitions, and smooth scrolling.
- No animation libraries. Motion never blocks interaction.

## Component conventions (`src/components/ui/`)

- **Buttons:** variants `primary · secondary · outline · ghost · destructive · outlineInverse`
  (the last one is for dark surfaces); sizes `sm · md · lg`; states hover/active/focus/disabled/
  `loading` (spinner + `aria-busy`). Router links styled as buttons via `buttonClasses()`.
- **IconButton:** `aria-label` required at the type level.
- **Badges:** `neutral · primary · success · warning · danger · discount (solid, on media) · inverse`.
- **Cards:** `Card` primitive; interactive cards lift on hover.
- **Product card:** media (image or branded gradient + `Package` icon), name link, 2-line
  description, first-benefit highlight, `PriceDisplay`, "View details" + "Add to cart" CTAs.
  Pure props — no data-source coupling.
- **Product grid:** 1 col → 2 (`sm`) → 3 (`lg`) → 4 (`xl`); loading renders `ProductCardSkeleton`.
- **Forms:** `FormField` render-prop wires label/hint/error (`aria-describedby`, `aria-invalid`,
  `role="alert"`); native `Input`, `Textarea`, `Select`, `Checkbox` (accent-styled).
- **States:** `Skeleton`, `EmptyState`, `ErrorState` (uses the Master Guide §42 customer message),
  `Toast` (`role="status"`, 4s auto-dismiss).
- **Drawer:** Escape/overlay close, body scroll lock, focus moves to close button.
- **Section:** eyebrow/title/description/action layout with `aria-labelledby`.

## Icons, images, responsive principles

- **Icons:** `lucide-react` only (one consistent stroke system, tree-shaken). Decorative icons get
  `aria-hidden="true"`; icon-only controls get text labels via `aria-label`.
- **Images:** `loading="lazy"`, `decoding="async"`, `object-cover` in 4:3 media; meaningful alt
  text for products; branded gradient placeholder when no image exists.
- **Responsive:** design at 360px first; nav collapses to a drawer under `md`; tap targets ≥ 40px
  (`h-10`); no horizontal overflow; grid collapses gracefully.

## Data boundary

UI components receive data via props. The `Product` type (`src/types/product.ts`) is the
storefront projection of the Master Guide §3 product model. Sample products live only in
`src/data/mock-products.ts`, are clearly marked, and are replaced by the backend catalog in later
phases — they are never part of the product system.

