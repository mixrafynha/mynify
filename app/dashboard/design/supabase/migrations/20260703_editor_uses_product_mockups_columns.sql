-- Product mockup configuration is now the source of truth.
-- Keep products focused on commerce/product data and link to product_mockups by mockup_key.

alter table public.products
add constraint products_mockup_key_fkey
foreign key (mockup_key)
references public.product_mockups(key)
on update cascade
on delete restrict;

create index if not exists products_mockup_key_idx
on public.products(mockup_key);

create index if not exists product_mockups_category_idx
on public.product_mockups(category);

-- Run this only after deploying the editor that reads product_mockups directly.
alter table public.products
  drop column if exists print_areas,
  drop column if exists safe_areas,
  drop column if exists print_sizes_mm,
  drop column if exists mockup_visual_scale;
