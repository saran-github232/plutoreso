-- Phase 3 · 0003 — Catalog: categories, products, product_media (Master Guide §3–§5).

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- URL-safe slugs only: lowercase letters, digits, hyphens (Master Guide §36).
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text not null,
  full_description text,
  -- Money: integer minor units (paise for INR). Never floating point (docs/DATABASE.md).
  price_minor integer not null check (price_minor >= 0),
  compare_at_price_minor integer
    check (compare_at_price_minor is null or compare_at_price_minor >= 0),
  currency text not null default 'INR' check (currency ~ '^[A-Z]{3}$'),
  category_id uuid references categories (id) on delete set null,
  features jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  preview_content text,
  -- SERVER-ONLY: extracted Google Drive folder ID (Master Guide §4–§5).
  -- Populated later by the admin validation workflow (Phase 5/10); never exposed
  -- publicly. Delivery links are minted only by the backend entitlement layer.
  drive_folder_id text,
  status product_status not null default 'inactive',
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table products is
  'Product catalog. Soft lifecycle via status (active/inactive/archived): products referenced by historical orders are never hard-deleted (Master Guide §19).';

-- Storefront listing queries: active products in display order.
create index products_active_sort_idx on products (sort_order) where status = 'active';
create index products_category_idx on products (category_id);
create index products_featured_idx on products (sort_order)
  where status = 'active' and is_featured;
create index products_best_seller_idx on products (sort_order)
  where status = 'active' and is_best_seller;

create table product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  media_type text not null default 'image'
    check (media_type in ('image', 'video', 'preview')),
  -- PUBLIC presentation URL (e.g. an uploaded storefront asset). Deliberately a
  -- different concept from protected delivery content (products.drive_folder_id).
  -- Never store raw Drive delivery links here.
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_media_product_idx on product_media (product_id, sort_order);
