import type { SupabaseClient } from "@supabase/supabase-js";

export type ServiceSupabase = SupabaseClient<any, "public", any>;

export const APP_PENDING_STATES = [
  "credit_reserved",
  "queued",
  "starting",
  "processing",
  "finalizing",
  "replicate_prediction_created",
] as const;

export const APP_TERMINAL_STATES = ["completed", "failed", "canceled"] as const;
export const REPLICATE_TERMINAL_STATES = ["succeeded", "failed", "canceled"] as const;

export type GenerationRow = {
  id: string;
  user_id: string;
  generation_id: string | null;
  idempotency_key: string | null;
  prediction_id: string | null;
  prompt: string | null;
  original_prompt: string | null;
  image_url: string | null;
  storage_key: string | null;
  output_url: string | null;
  status: string | null;
  replicate_status: string | null;
  error_message: string | null;
  is_saved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  credit_reserved_at?: string | null;
  credit_refunded_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  canceled_at?: string | null;
  webhook_processed_at?: string | null;
  last_reconciled_at?: string | null;
  finalization_lock_until?: string | null;
  finalization_attempts?: number | null;
};

export type ReplicatePrediction = {
  id?: string;
  status?: string;
  output?: unknown;
  error?: unknown;
  detail?: unknown;
  [key: string]: unknown;
};

export type ReserveGenerationResult = {
  created: boolean;
  generation_row_id: string | null;
  generation_id: string | null;
  credits: number;
};
