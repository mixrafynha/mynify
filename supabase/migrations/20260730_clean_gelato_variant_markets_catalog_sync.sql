drop table if exists public.gelato_shipping_cost_rules;
drop table if exists public.gelato_pricing_rules;

with ranked_markets as (
  select
    id,
    row_number() over (
      partition by product_variant_id, country_code
      order by
        is_available desc,
        price_checked_at desc nulls last,
        updated_at desc,
        created_at desc,
        id
    ) as market_rank
  from public.gelato_variant_markets
)
delete from public.gelato_variant_markets markets
using ranked_markets ranked
where markets.id = ranked.id
  and ranked.market_rank > 1;

alter table public.gelato_variant_markets
  drop constraint if exists gelato_variant_markets_unique;

drop index if exists public.gelato_variant_markets_lookup_idx;

alter table public.gelato_variant_markets
  drop column if exists shipping_price,
  drop column if exists total_cost,
  drop column if exists fulfillment_country;

create unique index if not exists gelato_variant_markets_variant_country_unique
  on public.gelato_variant_markets (product_variant_id, country_code);

create index if not exists gelato_variant_markets_lookup_idx
  on public.gelato_variant_markets (product_variant_id, country_code);
