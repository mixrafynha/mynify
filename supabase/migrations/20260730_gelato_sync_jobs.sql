create table if not exists public.gelato_sync_jobs (
  id uuid not null default gen_random_uuid (),
  product_id uuid not null references public.products (id) on delete cascade,
  catalog_uid text not null,
  reference_product_uid text not null,
  family_key text not null,
  status text not null default 'pending',
  total_variants integer not null default 0,
  processed_variants integer not null default 0,
  successful_variants integer not null default 0,
  failed_variants integer not null default 0,
  current_item_uid text null,
  current_error text null,
  started_at timestamp with time zone null,
  last_processed_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint gelato_sync_jobs_pkey primary key (id)
);

create index if not exists gelato_sync_jobs_product_status_idx
  on public.gelato_sync_jobs (product_id, status);

create index if not exists gelato_sync_jobs_reference_idx
  on public.gelato_sync_jobs (reference_product_uid, status);

create table if not exists public.gelato_sync_job_items (
  id uuid not null default gen_random_uuid (),
  job_id uuid not null references public.gelato_sync_jobs (id) on delete cascade,
  gelato_product_uid text not null,
  color text null,
  size text null,
  position integer not null,
  status text not null default 'pending',
  attempts integer not null default 0,
  error text null,
  started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint gelato_sync_job_items_pkey primary key (id),
  constraint gelato_sync_job_items_job_position_unique unique (job_id, position)
);

create index if not exists gelato_sync_job_items_job_status_idx
  on public.gelato_sync_job_items (job_id, status, position);

create index if not exists gelato_sync_job_items_job_uid_idx
  on public.gelato_sync_job_items (job_id, gelato_product_uid);
