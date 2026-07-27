create table if not exists public.gelato_catalog_sync_state (
  product_id uuid primary key references public.products(id) on delete cascade,
  catalog_uid text not null,
  catalog_title text,
  sync_status text not null default 'idle',
  attribute_filters jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  synced_products_count integer not null default 0,
  synced_colors_count integer not null default 0,
  synced_variants_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.product_colors
  add column if not exists gelato_color_key text,
  add column if not exists gelato_attributes jsonb,
  add column if not exists gelato_sync_status text not null default 'active',
  add column if not exists gelato_last_seen_at timestamptz;

alter table public.product_variants
  add column if not exists gelato_product_uid text,
  add column if not exists gelato_variant_uid text,
  add column if not exists gelato_variant_key text,
  add column if not exists gelato_attributes jsonb,
  add column if not exists gelato_sync_status text not null default 'active',
  add column if not exists gelato_last_seen_at timestamptz;

create unique index if not exists product_colors_gelato_color_key_idx
  on public.product_colors (product_id, gelato_color_key)
  where gelato_color_key is not null;

create unique index if not exists product_variants_gelato_variant_key_idx
  on public.product_variants (product_color_id, gelato_variant_key)
  where gelato_variant_key is not null;

create index if not exists product_variants_gelato_product_uid_idx
  on public.product_variants (gelato_product_uid)
  where gelato_product_uid is not null;
