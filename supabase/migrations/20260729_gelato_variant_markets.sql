create table if not exists public.gelato_variant_markets (
  id uuid not null default gen_random_uuid(),
  product_variant_id uuid not null,
  country_code text not null,
  currency text not null default 'EUR'::text,
  is_available boolean not null default false,
  product_price numeric(12, 4),
  shipping_price numeric(12, 4),
  total_cost numeric(12, 4),
  quantity integer not null default 1,
  availability_source text,
  price_source text,
  fulfillment_country text,
  unavailable_reason text,
  price_checked_at timestamp with time zone,
  availability_checked_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint gelato_variant_markets_pkey primary key (id),
  constraint gelato_variant_markets_unique unique (
    product_variant_id,
    country_code,
    currency,
    quantity
  ),
  constraint gelato_variant_markets_product_variant_id_fkey foreign key (product_variant_id)
    references public.product_variants (id) on delete cascade,
  constraint gelato_variant_markets_country_format check ((country_code ~ '^[A-Z]{2}$'::text)),
  constraint gelato_variant_markets_currency_format check ((currency ~ '^[A-Z]{3}$'::text)),
  constraint gelato_variant_markets_quantity_positive check ((quantity > 0))
);

create index if not exists gelato_variant_markets_variant_idx
  on public.gelato_variant_markets using btree (product_variant_id);

create index if not exists gelato_variant_markets_country_available_idx
  on public.gelato_variant_markets using btree (country_code, is_available);

create index if not exists gelato_variant_markets_lookup_idx
  on public.gelato_variant_markets using btree (product_variant_id, country_code, currency);
