-- Atomically grant AI credits and claim the Stripe checkout/event.
-- Existing Ryfio order events keep using the same table with nullable AI fields.

alter table public.stripe_processed_events
  add column if not exists purchase_type text,
  add column if not exists user_id uuid,
  add column if not exists pack_id text,
  add column if not exists credits_added integer,
  add column if not exists stripe_price_id text;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'stripe_processed_events_purchase_type_check'
      and conrelid = 'public.stripe_processed_events'::pg_catalog.regclass
  ) then
    alter table public.stripe_processed_events
      add constraint stripe_processed_events_purchase_type_check
      check (purchase_type is null or purchase_type = 'ai_credits');
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'stripe_processed_events_credits_added_check'
      and conrelid = 'public.stripe_processed_events'::pg_catalog.regclass
  ) then
    alter table public.stripe_processed_events
      add constraint stripe_processed_events_credits_added_check
      check (credits_added is null or credits_added > 0);
  end if;
end
$$;

create unique index if not exists stripe_processed_events_ai_credit_session_uidx
  on public.stripe_processed_events (session_id)
  where purchase_type = 'ai_credits';

create or replace function public.process_ai_credit_purchase(
  p_event_id text,
  p_event_type text,
  p_session_id text,
  p_user_id uuid,
  p_pack_id text,
  p_stripe_price_id text
)
returns table (
  processed boolean,
  duplicate boolean,
  credits_added integer,
  balance integer,
  result_pack_id text
)
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_pack public.ai_credit_packs%rowtype;
  v_existing public.stripe_processed_events%rowtype;
  v_balance integer;
  v_inserted_event_id text;
begin
  if p_event_id is null
     or p_event_id !~ '^evt_[A-Za-z0-9_]+$'
     or pg_catalog.char_length(p_event_id) > 255
     or p_event_type <> 'checkout.session.completed'
     or p_session_id is null
     or p_session_id !~ '^cs_[A-Za-z0-9_]+$'
     or pg_catalog.char_length(p_session_id) > 255
     or p_user_id is null
     or p_pack_id is null
     or pg_catalog.char_length(p_pack_id) > 128
     or p_stripe_price_id is null
     or p_stripe_price_id !~ '^price_[A-Za-z0-9_]+$'
     or pg_catalog.char_length(p_stripe_price_id) > 255 then
    raise exception 'invalid_ai_credit_purchase';
  end if;

  -- Serialize all deliveries for the same Stripe Checkout Session. The
  -- partial unique index remains the database-level backstop.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_session_id, 0)
  );

  select e.*
    into v_existing
  from public.stripe_processed_events e
  where e.event_id = p_event_id
     or (e.purchase_type = 'ai_credits' and e.session_id = p_session_id)
  order by (e.event_id = p_event_id) desc
  limit 1;

  if found then
    -- Rows created by the previous webhook did not record purchase_type.
    -- Preserve their idempotency without granting a second time.
    if v_existing.purchase_type = 'ai_credits'
       and (
         v_existing.user_id is distinct from p_user_id
         or v_existing.pack_id is distinct from p_pack_id
         or v_existing.stripe_price_id is distinct from p_stripe_price_id
       ) then
      raise exception 'ai_credit_purchase_conflict';
    end if;

    select pr.credits
      into v_balance
    from public.profiles pr
    where pr.id = p_user_id;

    return query
      select
        false,
        true,
        v_existing.credits_added,
        v_balance,
        coalesce(v_existing.pack_id, p_pack_id);
    return;
  end if;

  select p.*
    into v_pack
  from public.ai_credit_packs p
  where p.id = p_pack_id
    and p.active is true;

  if not found
     or v_pack.credits is null
     or v_pack.credits <= 0
     or v_pack.stripe_price_id is distinct from p_stripe_price_id then
    raise exception 'invalid_or_inactive_ai_credit_pack';
  end if;

  select pr.credits
    into v_balance
  from public.profiles pr
  where pr.id = p_user_id
  for update;

  if not found then
    raise exception 'ai_credit_profile_not_found';
  end if;

  insert into public.stripe_processed_events (
    event_id,
    event_type,
    session_id,
    purchase_type,
    user_id,
    pack_id,
    credits_added,
    stripe_price_id
  )
  values (
    p_event_id,
    p_event_type,
    p_session_id,
    'ai_credits',
    p_user_id,
    v_pack.id,
    v_pack.credits,
    v_pack.stripe_price_id
  )
  on conflict do nothing
  returning event_id into v_inserted_event_id;

  if v_inserted_event_id is null then
    select e.*
      into v_existing
    from public.stripe_processed_events e
    where e.event_id = p_event_id
       or (e.purchase_type = 'ai_credits' and e.session_id = p_session_id)
    order by (e.event_id = p_event_id) desc
    limit 1;

    if not found then
      raise exception 'ai_credit_event_claim_failed';
    end if;

    if v_existing.purchase_type = 'ai_credits'
       and (
         v_existing.user_id is distinct from p_user_id
         or v_existing.pack_id is distinct from p_pack_id
         or v_existing.stripe_price_id is distinct from p_stripe_price_id
       ) then
      raise exception 'ai_credit_purchase_conflict';
    end if;

    return query
      select false, true, v_existing.credits_added, v_balance, v_existing.pack_id;
    return;
  end if;

  update public.profiles pr
  set credits = pr.credits + v_pack.credits
  where pr.id = p_user_id
  returning pr.credits into v_balance;

  if not found then
    raise exception 'ai_credit_profile_not_found';
  end if;

  return query
    select true, false, v_pack.credits, v_balance, v_pack.id;
end;
$function$;

revoke all on function public.process_ai_credit_purchase(
  text,
  text,
  text,
  uuid,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.process_ai_credit_purchase(
  text,
  text,
  text,
  uuid,
  text,
  text
) to service_role;
