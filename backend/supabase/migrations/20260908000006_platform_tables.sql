-- Phase 3 · 0006 — Webhook events, testimonials, site settings, audit logs.

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('razorpay')),
  event_type text not null,
  -- Provider event id when the provider supplies one.
  external_event_id text,
  -- SHA-256 of the raw request body: the primary idempotency key, covering
  -- providers that do not send event ids. Same retry => same fingerprint.
  fingerprint text not null,
  payload jsonb not null,
  status text not null default 'received'
    check (status in ('received', 'processed', 'failed', 'skipped')),
  processed_at timestamptz,
  -- Safe failure description only — never provider credentials or signatures.
  error_message text,
  created_at timestamptz not null default now(),
  unique (provider, fingerprint)
);

create unique index webhook_events_external_uidx
  on webhook_events (provider, external_event_id) where external_event_id is not null;
create index webhook_events_unprocessed_idx on webhook_events (created_at)
  where status in ('received', 'failed');

comment on table webhook_events is
  'Raw webhook log for idempotent processing (Phase 9). Retries must never duplicate fulfilment.';

create table testimonials (
  id uuid primary key default gen_random_uuid(),
  -- Admin-controlled display data. NO fake rows are seeded (Master Guide §37).
  author_name text not null,
  content text not null,
  rating integer check (rating between 1 and 5),
  is_active boolean not null default false,
  sort_order integer not null default 0,
  customer_id uuid references customers (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table site_settings (
  key text primary key,
  value jsonb not null,
  description text,
  -- Admin-managed website configuration only. NEVER a secret vault —
  -- secrets live exclusively in backend environment variables (Master Guide §35).
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references admins (id) on delete set null,
  actor_type text not null default 'admin' check (actor_type in ('admin', 'system')),
  -- Dot-namespaced actions, e.g. 'admin.login', 'product.create', 'coupon.create'.
  action text not null,
  entity_type text,
  entity_id uuid,
  -- Structured, non-sensitive context. NEVER credentials or tokens.
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on audit_logs (actor_admin_id);
create index audit_logs_created_idx on audit_logs (created_at desc);
