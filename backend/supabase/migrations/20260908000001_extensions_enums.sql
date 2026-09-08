-- Phase 3 · 0001 — Extensions and enum types
-- PlutoReso database foundation (docs/DATABASE.md, Master Guide §23).

-- gen_random_uuid() for primary keys.
create extension if not exists pgcrypto;

-- Case-insensitive emails/codes (admins, customers, coupons).
create extension if not exists citext;

-- Product lifecycle (Master Guide §19: create / activate / deactivate / archive).
create type product_status as enum ('active', 'inactive', 'archived');

-- Order lifecycle — exact states from Master Guide §14. Do not invent others.
create type order_status as enum (
  'PENDING',
  'PAYMENT_INITIATED',
  'PAID',
  'FULFILLED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
);

-- Payment lifecycle for the future Razorpay integration (Phases 8–9).
create type payment_status as enum (
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'partially_refunded'
);

-- Entitlement lifecycle (Master Guide §5, §15, §45).
create type entitlement_status as enum ('active', 'revoked', 'expired');

-- Shared trigger function: keeps updated_at current on every table that has it.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
