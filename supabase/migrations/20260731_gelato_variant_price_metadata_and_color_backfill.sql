alter table public.product_variants
  add column if not exists price_currency text,
  add column if not exists price_country text,
  add column if not exists price_source text,
  add column if not exists price_last_synced_at timestamp with time zone;

update public.product_colors
set color_hex = case lower(coalesce(gelato_color_key, regexp_replace(color, '[^a-zA-Z0-9]+', '-', 'g')))
  when 'white' then '#FFFFFF'
  when 'black' then '#111111'
  when 'ash' then '#B7B7B7'
  when 'azalea' then '#EFA6C8'
  when 'cardinal-red' then '#8A1538'
  when 'carolina-blue' then '#7BAFD4'
  when 'daisy' then '#F4D942'
  when 'dark-heather' then '#3F4448'
  when 'forest-green' then '#1F4D36'
  when 'garnet' then '#6F263D'
  when 'gold' then '#F2B705'
  when 'graphite-heather' then '#555B5E'
  when 'heliconia' then '#DB3E78'
  when 'irish-green' then '#00A86B'
  when 'kiwi' then '#8DB600'
  when 'light-blue' then '#A7C7E7'
  when 'light-pink' then '#F6C1D0'
  when 'maroon' then '#7F1D1D'
  when 'military-green' then '#4B5320'
  when 'natural' then '#E8DFCA'
  when 'navy' then '#1F2A44'
  when 'orange' then '#F97316'
  when 'red' then '#DC2626'
  when 'sand' then '#CBB994'
  when 'sport-grey' then '#A7A9AC'
  else '#9CA3AF'
end
where lower(coalesce(color_hex, '')) in ('', '#ccc', '#cccccc', '#c0c0c0');

with preferred_market as (
  select distinct on (product_variant_id)
    product_variant_id,
    product_price,
    currency,
    country_code,
    price_checked_at
  from public.gelato_variant_markets
  where country_code = 'FR'
    and quantity = 1
    and product_price is not null
  order by product_variant_id, currency asc, updated_at desc
)
update public.product_variants pv
set
  price = preferred_market.product_price,
  price_currency = preferred_market.currency,
  price_country = preferred_market.country_code,
  price_source = 'gelato_variant_markets',
  price_last_synced_at = coalesce(preferred_market.price_checked_at, now())
from preferred_market
where preferred_market.product_variant_id = pv.id;
