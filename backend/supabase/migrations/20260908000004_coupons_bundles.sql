-- Phase 3 · 0004 — Coupons and configurable bundle rules (Master Guide §16).

create table coupons (
  id uuid primary key default gen_random_uuid(),
  -- citext: coupon codes are case-insensitive.
  code citext not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  -- percentage: 1–100 (%). fixed: integer minor units > 0.
  discount_value integer not null check (
    (discount_type = 'percentage' and discount_value between 1 and 100)
    or (discount_type = 'fixed' and discount_value > 0)
  ),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  max_redemptions_per_customer integer
    check (max_redemptions_per_customer is null or max_redemptions_per_customer > 0),
  min_order_amount_minor integer
    check (min_order_amount_minor is null or min_order_amount_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table coupons is
  'Coupon definitions only — the application engine arrives in a later phase. Codes are admin-configured, never hardcoded.';

create table bundle_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  -- Flexible, admin-configurable conditions (e.g. min trigger quantity).
  -- Deliberately schema-less here; validated at the application layer when the
  -- bundle engine is built. No hardcoded A+B+C=D logic (Master Guide §16).
  conditions jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bundle_rule_products (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references bundle_rules (id) on delete cascade,
  product_id uuid not null references products (id),
  role text not null check (role in ('trigger', 'bonus')),
  quantity integer not null default 1 check (quantity >= 1),
  unique (rule_id, product_id, role)
);

create index bundle_rule_products_rule_idx on bundle_rule_products (rule_id);
create index bundle_rule_products_product_idx on bundle_rule_products (product_id);
