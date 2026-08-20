alter table public.stripe_processed_events
  add column if not exists order_id uuid,
  add column if not exists checkout_draft_id uuid,
  add column if not exists processing_token uuid,
  add column if not exists processing_started_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.stripe_processed_events
  drop constraint if exists stripe_processed_events_purchase_type_check;

alter table public.stripe_processed_events
  add constraint stripe_processed_events_purchase_type_check
  check (
    purchase_type is null
    or purchase_type in ('ai_credits', 'ryfio_order')
  );

-- Preserve completed normal-order events while giving them the new
-- session-level idempotency identity. Rows which cannot be proven complete are
-- intentionally left untouched so a retry can claim and repair them.
with completed_order_events as (
  select
    e.event_id,
    o.id as order_id,
    o.checkout_draft_id,
    row_number() over (
      partition by e.session_id
      order by e.processed_at asc, e.event_id asc
    ) as session_rank
  from public.stripe_processed_events e
  join public.orders o
    on o.stripe_session_id = e.session_id
  join public.checkout_drafts d
    on d.id = o.checkout_draft_id
   and d.user_id = o.user_id
  where e.purchase_type is null
    and o.payment_status = 'paid'
    and o.status = 'processing'
    and d.status = 'ordered'
    and not exists (
      select 1
      from unnest(d.cart_item_ids) as purchased_cart_item(id)
      join public.cart_items ci
        on ci.id = purchased_cart_item.id
       and ci.user_id = o.user_id
    )
)
update public.stripe_processed_events e
set
  purchase_type = 'ryfio_order',
  order_id = completed_order_events.order_id,
  checkout_draft_id = completed_order_events.checkout_draft_id,
  completed_at = coalesce(e.completed_at, e.processed_at)
from completed_order_events
where e.event_id = completed_order_events.event_id
  and completed_order_events.session_rank = 1;

create unique index if not exists stripe_processed_events_ryfio_order_session_uidx
  on public.stripe_processed_events (session_id)
  where purchase_type = 'ryfio_order';

create or replace function public.claim_ryfio_order_webhook(
  p_event_id text,
  p_event_type text,
  p_session_id text,
  p_order_id uuid,
  p_checkout_draft_id uuid,
  p_processing_token uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_event public.stripe_processed_events%rowtype;
begin
  if not exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and o.checkout_draft_id = p_checkout_draft_id
      and o.stripe_session_id = p_session_id
  ) then
    raise exception 'ORDER_DRAFT_SESSION_MISMATCH';
  end if;

  -- Upgrade a legacy event marker only when it is the exact same Stripe event.
  -- This also makes retries from deployments before this migration recoverable.
  update public.stripe_processed_events e
  set
    purchase_type = 'ryfio_order',
    session_id = p_session_id,
    order_id = p_order_id,
    checkout_draft_id = p_checkout_draft_id,
    processing_token = p_processing_token,
    processing_started_at = clock_timestamp()
  where e.event_id = p_event_id
    and e.purchase_type is null
    and not exists (
      select 1
      from public.stripe_processed_events existing
      where existing.session_id = p_session_id
        and existing.purchase_type = 'ryfio_order'
    );

  insert into public.stripe_processed_events (
    event_id,
    event_type,
    session_id,
    purchase_type,
    order_id,
    checkout_draft_id,
    processing_token,
    processing_started_at
  )
  values (
    p_event_id,
    p_event_type,
    p_session_id,
    'ryfio_order',
    p_order_id,
    p_checkout_draft_id,
    p_processing_token,
    clock_timestamp()
  )
  on conflict do nothing;

  select e.*
  into v_event
  from public.stripe_processed_events e
  where e.session_id = p_session_id
    and e.purchase_type = 'ryfio_order'
  for update;

  if not found then
    raise exception 'STRIPE_EVENT_ID_CONFLICT';
  end if;

  if v_event.order_id is distinct from p_order_id
     or v_event.checkout_draft_id is distinct from p_checkout_draft_id then
    raise exception 'ORDER_DRAFT_SESSION_MISMATCH';
  end if;

  if v_event.completed_at is not null then
    return 'completed';
  end if;

  if v_event.processing_token = p_processing_token
     or v_event.processing_token is null
     or v_event.processing_started_at is null
     or v_event.processing_started_at < clock_timestamp() - interval '10 minutes' then
    update public.stripe_processed_events e
    set
      event_type = p_event_type,
      processing_token = p_processing_token,
      processing_started_at = clock_timestamp()
    where e.session_id = p_session_id
      and e.purchase_type = 'ryfio_order';

    return 'acquired';
  end if;

  return 'busy';
end;
$$;

create or replace function public.complete_ryfio_order_webhook(
  p_session_id text,
  p_processing_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.stripe_processed_events e
  set
    completed_at = clock_timestamp(),
    processed_at = clock_timestamp(),
    processing_token = null,
    processing_started_at = null
  where e.session_id = p_session_id
    and e.purchase_type = 'ryfio_order'
    and e.processing_token = p_processing_token
    and e.completed_at is null;

  return found;
end;
$$;

create or replace function public.release_ryfio_order_webhook(
  p_session_id text,
  p_processing_token uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.stripe_processed_events e
  set
    processing_token = null,
    processing_started_at = null
  where e.session_id = p_session_id
    and e.purchase_type = 'ryfio_order'
    and e.processing_token = p_processing_token
    and e.completed_at is null;

  return found;
end;
$$;

revoke all on function public.claim_ryfio_order_webhook(text, text, text, uuid, uuid, uuid)
from public, anon, authenticated;
revoke all on function public.complete_ryfio_order_webhook(text, uuid)
from public, anon, authenticated;
revoke all on function public.release_ryfio_order_webhook(text, uuid)
from public, anon, authenticated;

grant execute on function public.claim_ryfio_order_webhook(text, text, text, uuid, uuid, uuid)
to service_role;
grant execute on function public.complete_ryfio_order_webhook(text, uuid)
to service_role;
grant execute on function public.release_ryfio_order_webhook(text, uuid)
to service_role;
