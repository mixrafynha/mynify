create index if not exists product_colors_product_id_idx
  on public.product_colors (product_id);

create index if not exists product_variants_product_color_id_idx
  on public.product_variants (product_color_id);
