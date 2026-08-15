alter table public.product_colors
  add column if not exists gelato_color_data jsonb null,
  add column if not exists gelato_color_status text not null default 'pending',
  add column if not exists gelato_color_synced_at timestamptz null;

alter table public.product_colors
  alter column color_hex drop not null;

create table if not exists public.gelato_color_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  catalog_uid text not null,
  reference_product_uid text not null,
  dry_run boolean not null default true,
  status text not null default 'pending',
  total_items integer not null default 0,
  processed_items integer not null default 0,
  updated_items integer not null default 0,
  pending_items integer not null default 0,
  error_items integer not null default 0,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gelato_color_sync_job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.gelato_color_sync_jobs(id) on delete cascade,
  product_color_id uuid not null references public.product_colors(id) on delete cascade,
  product_variant_id uuid not null references public.product_variants(id) on delete cascade,
  gelato_product_uid text not null,
  position integer not null default 0,
  status text not null default 'pending',
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists gelato_color_sync_jobs_product_idx
  on public.gelato_color_sync_jobs (product_id, reference_product_uid, status);

create index if not exists gelato_color_sync_job_items_job_idx
  on public.gelato_color_sync_job_items (job_id, status, position);

