create table if not exists public.gelato_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  category text,
  subcategory text,
  quality text,
  manufacturer text,
  manufacturer_sku text,
  currency text not null default 'USD',
  target_price numeric(12, 2),
  markup_percent numeric(8, 4),
  markup_amount numeric(12, 2),
  priority integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gelato_pricing_rules_currency_format check ((currency ~ '^[A-Z]{3}$'::text)),
  constraint gelato_pricing_rules_has_price_strategy check (
    target_price is not null or markup_percent is not null or markup_amount is not null
  )
);

create index if not exists gelato_pricing_rules_lookup_idx
  on public.gelato_pricing_rules (
    active,
    currency,
    category,
    subcategory,
    quality,
    manufacturer,
    manufacturer_sku,
    priority
  );

create unique index if not exists gelato_pricing_rules_unique_idx
  on public.gelato_pricing_rules (
    currency,
    coalesce(category, ''),
    coalesce(subcategory, ''),
    coalesce(quality, ''),
    coalesce(manufacturer, ''),
    coalesce(manufacturer_sku, '')
  );

insert into public.gelato_pricing_rules (
  category,
  subcategory,
  quality,
  currency,
  target_price,
  priority
)
values
  ('t-shirt', null, null, 'USD', 29.99, 10),
  ('hoodie', null, null, 'USD', 49.99, 10),
  ('sweatshirt', null, null, 'USD', 44.99, 10),
  ('cap', null, null, 'USD', 24.99, 10),
  ('hat', null, null, 'USD', 24.99, 10),
  ('mug', null, null, 'USD', 14.99, 10),
  ('tote-bag', null, null, 'USD', 19.99, 10),
  ('phone-case', null, null, 'USD', 19.99, 10)
on conflict do nothing;

create table if not exists public.gelato_shipping_cost_rules (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  currency text not null default 'USD',
  shipping_price numeric(12, 2) not null,
  fulfillment_country text,
  active boolean not null default true,
  priority integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint gelato_shipping_cost_rules_country_format check ((country_code ~ '^[A-Z]{2}$'::text)),
  constraint gelato_shipping_cost_rules_currency_format check ((currency ~ '^[A-Z]{3}$'::text)),
  constraint gelato_shipping_cost_rules_shipping_positive check ((shipping_price >= 0))
);

create unique index if not exists gelato_shipping_cost_rules_unique_idx
  on public.gelato_shipping_cost_rules (country_code, currency);

create index if not exists gelato_shipping_cost_rules_lookup_idx
  on public.gelato_shipping_cost_rules (active, country_code, currency, priority);
