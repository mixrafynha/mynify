create unique index if not exists orders_checkout_draft_unique
  on public.orders (checkout_draft_id)
  where checkout_draft_id is not null;

create unique index if not exists orders_stripe_session_unique
  on public.orders (stripe_session_id)
  where stripe_session_id is not null;

create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key)
  where idempotency_key is not null;

create or replace function public.persist_checkout_order_with_items(
  p_order jsonb,
  p_order_items jsonb
)
returns table (
  id uuid,
  stripe_session_id text
)
language plpgsql
set search_path = public
as $$
declare
  v_order_id uuid;
  v_stripe_session_id text;
begin
  if nullif(p_order->>'checkout_draft_id', '') is null then
    raise exception 'checkout_draft_id is required';
  end if;

  if jsonb_typeof(p_order_items) is distinct from 'array' or jsonb_array_length(p_order_items) = 0 then
    raise exception 'order_items must be a non-empty array';
  end if;

  insert into public.orders (
    user_id,
    product_id,
    product_title,
    product_price,
    product_currency,
    title,
    price,
    currency,
    status,
    payment_status,
    gelato_status,
    checkout_draft_id,
    gelato_draft_order_id,
    subtotal,
    shipping_amount,
    total,
    shipping_address,
    shipping_method,
    idempotency_key,
    created_at,
    updated_at
  )
  values (
    (p_order->>'user_id')::uuid,
    nullif(p_order->>'product_id', '')::uuid,
    p_order->>'product_title',
    nullif(p_order->>'product_price', '')::numeric,
    p_order->>'product_currency',
    p_order->>'title',
    nullif(p_order->>'price', '')::numeric,
    p_order->>'currency',
    coalesce(p_order->>'status', 'pending'),
    coalesce(p_order->>'payment_status', 'pending'),
    p_order->>'gelato_status',
    (p_order->>'checkout_draft_id')::uuid,
    nullif(p_order->>'gelato_draft_order_id', ''),
    nullif(p_order->>'subtotal', '')::numeric,
    nullif(p_order->>'shipping_amount', '')::numeric,
    nullif(p_order->>'total', '')::numeric,
    coalesce(p_order->'shipping_address', '{}'::jsonb),
    coalesce(p_order->'shipping_method', '{}'::jsonb),
    nullif(p_order->>'idempotency_key', ''),
    coalesce(nullif(p_order->>'created_at', '')::timestamp, now()),
    coalesce(nullif(p_order->>'updated_at', '')::timestamp, now())
  )
  on conflict (checkout_draft_id) where checkout_draft_id is not null
  do update set
    user_id = excluded.user_id,
    product_id = excluded.product_id,
    product_title = excluded.product_title,
    product_price = excluded.product_price,
    product_currency = excluded.product_currency,
    title = excluded.title,
    price = excluded.price,
    currency = excluded.currency,
    status = excluded.status,
    payment_status = excluded.payment_status,
    gelato_status = excluded.gelato_status,
    gelato_draft_order_id = excluded.gelato_draft_order_id,
    subtotal = excluded.subtotal,
    shipping_amount = excluded.shipping_amount,
    total = excluded.total,
    shipping_address = excluded.shipping_address,
    shipping_method = excluded.shipping_method,
    idempotency_key = excluded.idempotency_key,
    updated_at = excluded.updated_at
  where public.orders.user_id = excluded.user_id
    and coalesce(public.orders.payment_status, 'pending') <> 'paid'
  returning public.orders.id, public.orders.stripe_session_id
  into v_order_id, v_stripe_session_id;

  if v_order_id is null then
    raise exception 'Unable to persist checkout order';
  end if;

  delete from public.order_items
  where order_id = v_order_id
    and user_id = (p_order->>'user_id')::uuid;

  insert into public.order_items (
    order_id,
    user_id,
    cart_item_id,
    user_product_id,
    product_id,
    variant_id,
    title,
    quantity,
    size,
    color,
    sku,
    unit_price,
    currency,
    image,
    mockup_front,
    mockup_back,
    gelato_product_uid
  )
  select
    v_order_id,
    (item->>'user_id')::uuid,
    nullif(item->>'cart_item_id', '')::uuid,
    nullif(item->>'user_product_id', '')::uuid,
    nullif(item->>'product_id', '')::uuid,
    nullif(item->>'variant_id', '')::uuid,
    item->>'title',
    coalesce(nullif(item->>'quantity', '')::integer, 1),
    nullif(item->>'size', ''),
    nullif(item->>'color', ''),
    nullif(item->>'sku', ''),
    nullif(item->>'unit_price', '')::numeric,
    coalesce(item->>'currency', 'EUR'),
    nullif(item->>'image', ''),
    nullif(item->>'mockup_front', ''),
    nullif(item->>'mockup_back', ''),
    nullif(item->>'gelato_product_uid', '')
  from jsonb_array_elements(p_order_items) as item;

  return query select v_order_id, v_stripe_session_id;
end;
$$;

revoke all on function public.persist_checkout_order_with_items(jsonb, jsonb) from public;
revoke all on function public.persist_checkout_order_with_items(jsonb, jsonb) from anon;
revoke all on function public.persist_checkout_order_with_items(jsonb, jsonb) from authenticated;
grant execute on function public.persist_checkout_order_with_items(jsonb, jsonb) to service_role;
