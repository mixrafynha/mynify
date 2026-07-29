create table if not exists public.gelato_variant_prices (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_color_id uuid not null references public.product_colors(id) on delete cascade,
  gelato_product_uid text not null,
  gelato_variant_uid text,
  country_iso text not null,
  currency text not null,
  quantity integer not null,
  product_price numeric(12, 2) not null,
  raw_price numeric,
  page_count integer not null default -1,
  raw_payload jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists gelato_variant_prices_unique_idx
  on public.gelato_variant_prices (
    product_variant_id,
    country_iso,
    currency,
    quantity,
    page_count
  );

create index if not exists gelato_variant_prices_product_uid_idx
  on public.gelato_variant_prices (gelato_product_uid);

create table if not exists public.gelato_variant_shipping_methods (
  id uuid primary key default gen_random_uuid(),
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_color_id uuid not null references public.product_colors(id) on delete cascade,
  gelato_product_uid text not null,
  gelato_variant_uid text,
  country_iso text not null,
  shipment_method_uid text not null,
  shipment_method_name text,
  supports_tracking boolean,
  raw_payload jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists gelato_variant_shipping_methods_unique_idx
  on public.gelato_variant_shipping_methods (
    product_variant_id,
    country_iso,
    shipment_method_uid
  );

create index if not exists gelato_variant_shipping_methods_product_uid_idx
  on public.gelato_variant_shipping_methods (gelato_product_uid);
