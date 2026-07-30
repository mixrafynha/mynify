alter table public.product_colors
  add column if not exists gelato_family_key text;

alter table public.product_variants
  add column if not exists gelato_family_key text;

create index if not exists product_colors_gelato_family_key_idx
  on public.product_colors (product_id, gelato_family_key);

create index if not exists product_variants_gelato_family_key_idx
  on public.product_variants (product_color_id, gelato_family_key);
