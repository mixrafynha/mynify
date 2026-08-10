-- OPTIONAL / MANUAL: removes only legacy gelatoPrices snapshots from product_variants.
-- It does not alter schema or touch gelato_attributes.printPricing.

update public.product_variants
set gelato_attributes = coalesce(gelato_attributes, '{}'::jsonb) - 'gelatoPrices'
where gelato_attributes ? 'gelatoPrices';
