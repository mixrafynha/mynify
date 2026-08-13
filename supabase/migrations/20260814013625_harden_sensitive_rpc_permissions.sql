-- Harden sensitive SECURITY DEFINER RPCs so they cannot be called directly
-- from browser, guest, or normal authenticated Supabase clients.

alter function public.grant_ai_credits(uuid, integer, text, text, jsonb)
  set search_path = public;
alter function public.increment_ai_credits(uuid, integer)
  set search_path = public;
alter function public.consume_ai_credit(uuid, integer)
  set search_path = public;
alter function public.claim_gelato_sync_job_items(integer, uuid)
  set search_path = public, pg_temp;

revoke execute on function public.grant_ai_credits(uuid, integer, text, text, jsonb)
  from public;
revoke execute on function public.grant_ai_credits(uuid, integer, text, text, jsonb)
  from anon;
revoke execute on function public.grant_ai_credits(uuid, integer, text, text, jsonb)
  from authenticated;
grant execute on function public.grant_ai_credits(uuid, integer, text, text, jsonb)
  to service_role;

revoke execute on function public.increment_ai_credits(uuid, integer)
  from public;
revoke execute on function public.increment_ai_credits(uuid, integer)
  from anon;
revoke execute on function public.increment_ai_credits(uuid, integer)
  from authenticated;
grant execute on function public.increment_ai_credits(uuid, integer)
  to service_role;

revoke execute on function public.consume_ai_credit(uuid, integer)
  from public;
revoke execute on function public.consume_ai_credit(uuid, integer)
  from anon;
revoke execute on function public.consume_ai_credit(uuid, integer)
  from authenticated;
grant execute on function public.consume_ai_credit(uuid, integer)
  to service_role;

revoke execute on function public.claim_gelato_sync_job_items(integer, uuid)
  from public;
revoke execute on function public.claim_gelato_sync_job_items(integer, uuid)
  from anon;
revoke execute on function public.claim_gelato_sync_job_items(integer, uuid)
  from authenticated;
grant execute on function public.claim_gelato_sync_job_items(integer, uuid)
  to service_role;
