alter table public.user_generated_images
  add column if not exists original_storage_key text,
  add column if not exists background_removal_status text,
  add column if not exists background_removal_prediction_id text,
  add column if not exists background_removal_error text;

comment on column public.user_generated_images.original_storage_key is 'R2 key for the original FLUX output before background removal.';
comment on column public.user_generated_images.background_removal_status is 'Status of the optional Replicate background removal step.';
comment on column public.user_generated_images.background_removal_prediction_id is 'Replicate prediction id for the background removal step.';
comment on column public.user_generated_images.background_removal_error is 'Last background removal error message, if any.';
