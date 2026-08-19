alter table public.user_generated_images
  add column if not exists generation_id uuid,
  add column if not exists idempotency_key text,
  add column if not exists prediction_id text,
  add column if not exists status text not null default 'completed',
  add column if not exists replicate_status text,
  add column if not exists original_prompt text,
  add column if not exists output_url text,
  add column if not exists error_message text,
  add column if not exists credit_reserved_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists webhook_processed_at timestamptz,
  add column if not exists credit_refunded_at timestamptz,
  add column if not exists request_payload jsonb,
  add column if not exists replicate_prediction jsonb,
  add column if not exists replicate_output jsonb;

update public.user_generated_images
set status = coalesce(status, case when is_saved then 'completed' else 'pending' end)
where status is null;

create unique index if not exists user_generated_images_generation_id_key
  on public.user_generated_images (generation_id)
  where generation_id is not null;

create unique index if not exists user_generated_images_idempotency_key_key
  on public.user_generated_images (idempotency_key)
  where idempotency_key is not null;

create unique index if not exists user_generated_images_prediction_id_key
  on public.user_generated_images (prediction_id)
  where prediction_id is not null;

create index if not exists user_generated_images_user_status_idx
  on public.user_generated_images (user_id, status, created_at desc);
