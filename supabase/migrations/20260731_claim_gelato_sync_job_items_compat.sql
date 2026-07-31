create or replace function public.claim_gelato_sync_job_items(
  batch_size integer,
  target_job_id uuid
)
returns table (
  id uuid,
  gelato_product_uid text,
  attempts integer,
  position integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select *
  from public.claim_gelato_sync_job_items(target_job_id, batch_size);
end;
$$;
