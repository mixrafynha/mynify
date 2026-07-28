alter table public.gelato_catalog_sync_state
  add column if not exists product_uid text;

create index if not exists gelato_catalog_sync_state_product_uid_idx
  on public.gelato_catalog_sync_state (product_uid)
  where product_uid is not null;
