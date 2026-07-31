create unique index if not exists gelato_sync_job_items_job_uid_unique
  on public.gelato_sync_job_items (job_id, gelato_product_uid);
