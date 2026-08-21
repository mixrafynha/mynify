-- Atomically preserve the existing maximum of five saved AI images per user.
-- The application endpoint currently owns this fixed limit; profiles are not
-- consulted by the Save flow, so this migration deliberately keeps that
-- behavior unchanged.

create or replace function public.save_user_generated_image_atomic(
  p_user_id uuid,
  p_image_id uuid
)
returns table (
  result text,
  saved_count bigint,
  saved_limit integer,
  image jsonb
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_image public.user_generated_images%rowtype;
  v_saved_count bigint;
  v_saved_limit constant integer := 5;
begin
  if p_user_id is null or p_image_id is null then
    raise exception 'invalid_saved_image_request';
  end if;

  -- Serialize only Save operations for this user. A 64-bit key makes users
  -- independent while preventing phantom rows between COUNT and UPDATE.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text, 0)
  );

  select count(*)
    into v_saved_count
  from public.user_generated_images ugi
  where ugi.user_id = p_user_id
    and ugi.is_saved is true;

  select ugi.*
    into v_image
  from public.user_generated_images ugi
  where ugi.id = p_image_id
    and ugi.user_id = p_user_id;

  -- Check the owned row before the limit so simultaneous Saves of the same
  -- image remain idempotent after the first request reaches the limit.
  if found and v_image.is_saved is true then
    return query
      select 'already_saved', v_saved_count, v_saved_limit, null::jsonb;
    return;
  end if;

  if v_saved_count >= v_saved_limit then
    return query
      select 'limit_reached', v_saved_count, v_saved_limit, null::jsonb;
    return;
  end if;

  if v_image.id is null then
    return query
      select 'not_found', v_saved_count, v_saved_limit, null::jsonb;
    return;
  end if;

  update public.user_generated_images ugi
  set
    is_saved = true,
    saved_at = pg_catalog.clock_timestamp()
  where ugi.id = p_image_id
    and ugi.user_id = p_user_id
    and ugi.is_saved is false
  returning ugi.* into v_image;

  if not found then
    -- Defensive fallback: every writer using this RPC is serialized per user,
    -- and a concurrently saved identical row is still a successful no-op.
    select ugi.*
      into v_image
    from public.user_generated_images ugi
    where ugi.id = p_image_id
      and ugi.user_id = p_user_id;

    if found and v_image.is_saved is true then
      select count(*)
        into v_saved_count
      from public.user_generated_images ugi
      where ugi.user_id = p_user_id
        and ugi.is_saved is true;

      return query
        select 'already_saved', v_saved_count, v_saved_limit, null::jsonb;
      return;
    end if;

    return query
      select 'not_found', v_saved_count, v_saved_limit, null::jsonb;
    return;
  end if;

  v_saved_count := v_saved_count + 1;

  return query
    select
      'saved',
      v_saved_count,
      v_saved_limit,
      pg_catalog.jsonb_build_object(
        'id', v_image.id,
        'generation_id', v_image.generation_id,
        'prompt', v_image.prompt,
        'image_url', v_image.image_url,
        'storage_key', v_image.storage_key,
        'created_at', v_image.created_at,
        'original_image_url', v_image.original_image_url,
        'is_saved', v_image.is_saved,
        'saved_at', v_image.saved_at
      );
end;
$$;

revoke all on function public.save_user_generated_image_atomic(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.save_user_generated_image_atomic(uuid, uuid)
  to service_role;
