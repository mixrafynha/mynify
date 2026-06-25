-- Required for custom POD designs in cart_items.
-- Run this once in Supabase SQL editor before testing Save -> Cart.

alter table public.cart_items
add column if not exists user_product_id uuid null references public.user_products(id) on delete cascade,
add column if not exists design_id uuid null references public.user_products(id) on delete cascade,
add column if not exists variant_id uuid null,
add column if not exists selected_color jsonb null,
add column if not exists selected_variant jsonb null,
add column if not exists mockup_url text null,
add column if not exists item_type text null default 'product';

create index if not exists cart_items_user_product_id_idx
on public.cart_items(user_product_id);

create index if not exists cart_items_design_id_idx
on public.cart_items(design_id);

create index if not exists cart_items_user_design_idx
on public.cart_items(user_id, design_id);

create index if not exists cart_items_variant_id_idx
on public.cart_items(variant_id);
