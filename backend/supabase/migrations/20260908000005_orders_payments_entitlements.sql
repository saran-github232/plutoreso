-- Phase 3 · 0005 — Orders, order_items, payments, entitlements, coupon_redemptions
-- (Master Guide §10–§15).

-- Human-readable order numbers (never bare UUIDs), e.g. PLT-2026-001234.
-- A DB-side sequence default keeps generation deterministic and collision-free.
create sequence order_number_seq start 1000;

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('PLT-' || to_char(now(), 'YYYY') || '-' ||
             lpad(nextval('order_number_seq')::text, 6, '0')),
  customer_id uuid not null references customers (id),
  status order_status not null default 'PENDING',
  -- Money: integer minor units (paise). Enforced invariant: total = subtotal - discount.
  subtotal_minor integer not null check (subtotal_minor >= 0),
  discount_minor integer not null default 0 check (discount_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  check (discount_minor <= subtotal_minor),
  check (total_minor = subtotal_minor - discount_minor),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  coupon_id uuid references coupons (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_customer_idx on orders (customer_id);
create index orders_created_idx on orders (created_at desc);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  -- NO ACTION (default): products referenced by historical orders cannot be
  -- hard-deleted — they are archived via products.status (Master Guide §19).
  product_id uuid not null references products (id),
  -- Purchase-time snapshots so later product edits never rewrite history.
  product_name_snapshot text not null,
  product_slug_snapshot text not null,
  unit_price_minor integer not null check (unit_price_minor >= 0),
  compare_at_price_minor integer
    check (compare_at_price_minor is null or compare_at_price_minor >= 0),
  -- Digital products default to quantity 1; the schema still supports future
  -- licensing/multi-seat rules via quantity (Master Guide §10).
  quantity integer not null default 1 check (quantity >= 1),
  line_discount_minor integer not null default 0 check (line_discount_minor >= 0),
  line_total_minor integer not null check (line_total_minor >= 0),
  check (line_total_minor = unit_price_minor * quantity - line_discount_minor),
  created_at timestamptz not null default now(),
  -- One row per product per order; extra units are quantity, not duplicate rows.
  unique (order_id, product_id)
);

create index order_items_order_idx on order_items (order_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id),
  provider text not null default 'razorpay' check (provider in ('razorpay')),
  -- Provider identifiers get partial unique indexes: idempotent lookups for the
  -- future verification/webhook phases; NULL-safe until those phases run.
  provider_order_id text,
  provider_payment_id text,
  status payment_status not null default 'created',
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  -- Non-sensitive metadata only (e.g. 'upi', 'card'). NEVER card data/PANs —
  -- none are ever received from the provider anyway.
  method text,
  error_code text,
  error_description text,
  raw_metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_provider_order_uidx
  on payments (provider, provider_order_id) where provider_order_id is not null;
create unique index payments_provider_payment_uidx
  on payments (provider, provider_payment_id) where provider_payment_id is not null;
create index payments_order_idx on payments (order_id);

create table entitlements (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id),
  order_id uuid not null references orders (id),
  product_id uuid not null references products (id),
  status entitlement_status not null default 'active',
  -- granted_at is written ONLY by the backend after server-side payment
  -- verification (Phase 10). Nothing grants entitlements before that.
  granted_at timestamptz,
  revoked_at timestamptz,
  check (revoked_at is null or (granted_at is not null and revoked_at >= granted_at)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One entitlement per (order, product): the database itself makes webhook
  -- retries and fulfilment idempotent (Master Guide §13).
  unique (order_id, product_id)
);

create index entitlements_customer_idx on entitlements (customer_id);
create index entitlements_product_idx on entitlements (product_id);

create table coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons (id),
  order_id uuid not null references orders (id) on delete cascade,
  customer_id uuid not null references customers (id),
  discount_minor integer not null check (discount_minor >= 0),
  created_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

create index coupon_redemptions_coupon_idx on coupon_redemptions (coupon_id);
create index coupon_redemptions_customer_idx on coupon_redemptions (customer_id);
