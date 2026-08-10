-- OPTIONAL / MANUAL: removes only legacy regional availability snapshots.
-- It does not alter schema, rows, pricing fields, or gelato_attributes.printPricing.

update public.product_colors
set gelato_attributes = coalesce(gelato_attributes, '{}'::jsonb)
  - 'countries'
  - 'notSupportedCountries'
where gelato_attributes ?| array['countries', 'notSupportedCountries'];

update public.product_variants
set gelato_attributes = coalesce(gelato_attributes, '{}'::jsonb)
  - 'countries'
  - 'notSupportedCountries'
where gelato_attributes ?| array['countries', 'notSupportedCountries'];
