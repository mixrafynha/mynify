create table if not exists public.checkout_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cart_item_ids uuid[] not null default '{}',
  idempotency_key text not null unique,
  status text not null default 'draft',
  gelato_draft_order_id text null,
  order_reference_id text null,
  selected_shipping_method jsonb not null default '{}'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  subtotal numeric(12,2) not null default 0,
  shipping_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  gelato_response jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checkout_drafts_user_id_idx
  on public.checkout_drafts(user_id);
create index if not exists checkout_drafts_status_idx
  on public.checkout_drafts(status);
create index if not exists checkout_drafts_gelato_id_idx
  on public.checkout_drafts(gelato_draft_order_id);

alter table public.checkout_drafts enable row level security;

drop policy if exists "Users can view own checkout drafts" on public.checkout_drafts;
create policy "Users can view own checkout drafts"
on public.checkout_drafts for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own checkout drafts" on public.checkout_drafts;
drop policy if exists "Users can update own checkout drafts" on public.checkout_drafts;

revoke all on table public.checkout_drafts from anon;
revoke insert, update, delete, truncate, references, trigger
on table public.checkout_drafts from authenticated;
grant select on table public.checkout_drafts to authenticated;
grant select, insert, update, delete on table public.checkout_drafts to service_role;
