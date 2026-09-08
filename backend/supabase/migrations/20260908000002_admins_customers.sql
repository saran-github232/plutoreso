-- Phase 3 · 0002 — Admins and customers (Master Guide §22, §23).

create table admins (
  id uuid primary key default gen_random_uuid(),
  -- citext: case-insensitive uniqueness for the future login identity (Phase 4).
  email citext not null unique,
  name text not null,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  status text not null default 'active' check (status in ('active', 'disabled')),
  -- Nullable until Phase 4 (admin authentication) writes a bcrypt/argon2 hash.
  -- NEVER a plaintext password. NEVER expose this column through any API.
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table admins is
  'Admin accounts. Privileged data — never publicly readable (RLS default deny, 0007).';

create table customers (
  id uuid primary key default gen_random_uuid(),
  -- Uniqueness decision (documented in docs/DATABASE.md): one customer identity
  -- per case-insensitive email. Guest checkout will upsert customers by email;
  -- orders and entitlements hang off this identity. Phone is deliberately NOT
  -- unique (shared/family phones are a valid pattern in India).
  email citext not null unique,
  name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table customers is
  'Customer identities. Private data — backend-only access (RLS default deny, 0007).';
