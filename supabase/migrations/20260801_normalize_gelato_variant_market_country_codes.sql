with country_code_map(country_name, iso_code) as (
  values
    ('france', 'FR'),
    ('portugal', 'PT'),
    ('spain', 'ES'),
    ('germany', 'DE'),
    ('italy', 'IT'),
    ('belgium', 'BE'),
    ('netherlands', 'NL'),
    ('luxembourg', 'LU'),
    ('austria', 'AT'),
    ('switzerland', 'CH'),
    ('ireland', 'IE'),
    ('poland', 'PL'),
    ('czechia', 'CZ'),
    ('czech republic', 'CZ'),
    ('denmark', 'DK'),
    ('sweden', 'SE'),
    ('norway', 'NO'),
    ('finland', 'FI'),
    ('united kingdom', 'GB'),
    ('uk', 'GB'),
    ('great britain', 'GB'),
    ('united states', 'US'),
    ('united states of america', 'US'),
    ('usa', 'US'),
    ('canada', 'CA'),
    ('australia', 'AU'),
    ('new zealand', 'NZ'),
    ('brazil', 'BR'),
    ('mexico', 'MX'),
    ('japan', 'JP'),
    ('south korea', 'KR'),
    ('korea', 'KR'),
    ('singapore', 'SG')
),
mapped_markets as (
  select
    markets.id,
    map.iso_code
  from public.gelato_variant_markets markets
  join country_code_map map
    on lower(trim(replace(replace(markets.country_code, '_', ' '), '-', ' '))) = map.country_name
)
delete from public.gelato_variant_markets markets
using mapped_markets mapped
where markets.id = mapped.id
  and exists (
    select 1
    from public.gelato_variant_markets existing
    where existing.product_variant_id = markets.product_variant_id
      and existing.country_code = mapped.iso_code
      and existing.currency = markets.currency
      and existing.quantity = markets.quantity
      and existing.id <> markets.id
  );

with country_code_map(country_name, iso_code) as (
  values
    ('france', 'FR'),
    ('portugal', 'PT'),
    ('spain', 'ES'),
    ('germany', 'DE'),
    ('italy', 'IT'),
    ('belgium', 'BE'),
    ('netherlands', 'NL'),
    ('luxembourg', 'LU'),
    ('austria', 'AT'),
    ('switzerland', 'CH'),
    ('ireland', 'IE'),
    ('poland', 'PL'),
    ('czechia', 'CZ'),
    ('czech republic', 'CZ'),
    ('denmark', 'DK'),
    ('sweden', 'SE'),
    ('norway', 'NO'),
    ('finland', 'FI'),
    ('united kingdom', 'GB'),
    ('uk', 'GB'),
    ('great britain', 'GB'),
    ('united states', 'US'),
    ('united states of america', 'US'),
    ('usa', 'US'),
    ('canada', 'CA'),
    ('australia', 'AU'),
    ('new zealand', 'NZ'),
    ('brazil', 'BR'),
    ('mexico', 'MX'),
    ('japan', 'JP'),
    ('south korea', 'KR'),
    ('korea', 'KR'),
    ('singapore', 'SG')
)
update public.gelato_variant_markets markets
set
  country_code = map.iso_code,
  updated_at = now()
from country_code_map map
where lower(trim(replace(replace(markets.country_code, '_', ' '), '-', ' '))) = map.country_name;
