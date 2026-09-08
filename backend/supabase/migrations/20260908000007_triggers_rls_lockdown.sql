-- Phase 3 · 0007 — updated_at triggers and RLS lockdown (Master Guide §23, §25).

-- Keep updated_at current on every table that has the column.
create trigger admins_set_updated_at before update on admins
  for each row execute function set_updated_at();
create trigger customers_set_updated_at before update on customers
  for each row execute function set_updated_at();
create trigger categories_set_updated_at before update on categories
  for each row execute function set_updated_at();
create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
create trigger coupons_set_updated_at before update on coupons
  for each row execute function set_updated_at();
create trigger bundle_rules_set_updated_at before update on bundle_rules
  for each row execute function set_updated_at();
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger payments_set_updated_at before update on payments
  for each row execute function set_updated_at();
create trigger entitlements_set_updated_at before update on entitlements
  for each row execute function set_updated_at();
create trigger testimonials_set_updated_at before update on testimonials
  for each row execute function set_updated_at();
create trigger site_settings_set_updated_at before update on site_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: enable EVERYWHERE, create ZERO policies (default deny).
--
-- Model (documented in docs/DATABASE.md §security):
-- - The Express backend connects server-side over Postgres (DATABASE_URL, a
--   privileged role) and bypasses RLS like any table owner. That credential is
--   SERVER-ONLY (Master Guide §35).
-- - anon/authenticated (Supabase PostgREST) get NO policies => they can neither
--   read nor write anything. No "allow all" policies are created to make
--   development easy.
-- - Per-client policies (customer sees own orders/entitlements, etc.) are
--   intentionally deferred to the phases that introduce those clients
--   (Phase 4+), so they can be designed against real access patterns.
-- ---------------------------------------------------------------------------

alter table admins enable row level security;
alter table customers enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_media enable row level security;
alter table coupons enable row level security;
alter table bundle_rules enable row level security;
alter table bundle_rule_products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table entitlements enable row level security;
alter table coupon_redemptions enable row level security;
alter table webhook_events enable row level security;
alter table testimonials enable row level security;
alter table site_settings enable row level security;
alter table audit_logs enable row level security;

-- Belt and braces: revoke the default table/sequence privileges Supabase grants
-- to browser-facing roles. (service_role bypasses RLS and remains for Supabase
-- tooling only; our backend does not use it.)
revoke all on admins, customers, categories, products, product_media,
  coupons, bundle_rules, bundle_rule_products, orders, order_items,
  payments, entitlements, coupon_redemptions, webhook_events,
  testimonials, site_settings, audit_logs
  from anon;
revoke all on admins, customers, categories, products, product_media,
  coupons, bundle_rules, bundle_rule_products, orders, order_items,
  payments, entitlements, coupon_redemptions, webhook_events,
  testimonials, site_settings, audit_logs
  from authenticated;
revoke all on sequence order_number_seq from anon;
revoke all on sequence order_number_seq from authenticated;
