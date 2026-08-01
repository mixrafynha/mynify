alter table public.products
add column if not exists profit_markup_percentage numeric not null default 30;

alter table public.products
drop constraint if exists products_profit_markup_percentage_check;

alter table public.products
add constraint products_profit_markup_percentage_check
check (
  profit_markup_percentage >= 0
  and profit_markup_percentage <= 500
);
