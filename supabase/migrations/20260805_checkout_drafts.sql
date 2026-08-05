create table if not exists public.checkout_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cart_item_ids uuid[] not null default '{}',
  idempotency_key text not null unique,
  status text not null default 'draft',
  gelato_draft_order_id text,
  selected_shipping_method jsonb not null default '{}'::jsonb,
  shipping_address jsonb not null default '{}'::jsonb,
  subtotal numeric(12,2) not null default 0,
  shipping_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'EUR',
  gelato_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checkout_drafts_user_id_idx on public.checkout_drafts (user_id);
create index if not exists checkout_drafts_status_idx on public.checkout_drafts (status);
