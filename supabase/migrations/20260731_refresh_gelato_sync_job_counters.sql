create or replace function public.refresh_gelato_sync_job_counters(target_job_id uuid)
returns table (
  total_items bigint,
  completed_items bigint,
  failed_items bigint,
  pending_items bigint,
  processing_items bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_completed bigint;
  v_failed bigint;
  v_pending bigint;
  v_processing bigint;
begin
  select
    count(*)::bigint,
    count(*) filter (where status = 'completed')::bigint,
    count(*) filter (where status = 'failed')::bigint,
    count(*) filter (where status = 'pending')::bigint,
    count(*) filter (where status = 'processing')::bigint
  into
    v_total,
    v_completed,
    v_failed,
    v_pending,
    v_processing
  from public.gelato_sync_job_items
  where job_id = target_job_id;

  update public.gelato_sync_jobs
  set
    total_variants = v_total,
    processed_variants = v_completed + v_failed,
    successful_variants = v_completed,
    failed_variants = v_failed,
    updated_at = now()
  where id = target_job_id;

  return query
  select
    v_total,
    v_completed,
    v_failed,
    v_pending,
    v_processing;
end;
$$;
