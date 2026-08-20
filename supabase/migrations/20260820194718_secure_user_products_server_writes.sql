-- user_products is readable by its owner through RLS, but all mutations are
-- server-owned. Deploy the application changes that use service_role before
-- applying this migration to production.

alter table public.user_products enable row level security;

drop policy if exists "Users can insert own products" on public.user_products;
drop policy if exists "Users can insert their products" on public.user_products;
drop policy if exists "Users can update own products" on public.user_products;
drop policy if exists "Users can read own products" on public.user_products;

create policy "Users can read own products"
on public.user_products
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all privileges on table public.user_products from anon;
revoke all privileges on table public.user_products from authenticated;

grant select on table public.user_products to authenticated;
grant select, insert, update, delete on table public.user_products to service_role;
