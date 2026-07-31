create or replace function public.claim_gelato_sync_job_items(
  target_job_id uuid,
  batch_size integer
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
  with claimed as (
    select
      i.id,
      i.gelato_product_uid,
      i.attempts,
      i.position
    from public.gelato_sync_job_items i
    where i.job_id = target_job_id
      and i.status = 'pending'
    order by i.position asc
    for update skip locked
    limit greatest(batch_size, 0)
  )
  update public.gelato_sync_job_items i
  set
    status = 'processing',
    started_at = now(),
    updated_at = now()
  from claimed
  where i.id = claimed.id
  returning i.id, i.gelato_product_uid, i.attempts, i.position;
end;
$$;
