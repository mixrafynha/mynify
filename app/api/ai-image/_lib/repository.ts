import { APP_PENDING_STATES, type GenerationRow, type ServiceSupabase } from "./types";
import { RECONCILE_MIN_INTERVAL_MS } from "./config";

export async function loadGenerationById(
  serviceSupabase: ServiceSupabase,
  generationId: string,
  userId?: string,
) {
  let query = serviceSupabase
    .from("user_generated_images")
    .select("*")
    .eq("generation_id", generationId);

  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.maybeSingle<GenerationRow>();
  if (error) throw error;
  return data;
}

export async function loadGenerationByRowId(serviceSupabase: ServiceSupabase, rowId: string) {
  const { data, error } = await serviceSupabase
    .from("user_generated_images")
    .select("*")
    .eq("id", rowId)
    .maybeSingle<GenerationRow>();
  if (error) throw error;
  return data;
}

export async function loadGenerationForWebhook(
  serviceSupabase: ServiceSupabase,
  generationId: string | null,
  predictionId: string | null,
) {
  if (generationId) {
    const byGeneration = await loadGenerationById(serviceSupabase, generationId);
    if (byGeneration) return byGeneration;
  }

  if (!predictionId) return null;
  const { data, error } = await serviceSupabase
    .from("user_generated_images")
    .select("*")
    .eq("prediction_id", predictionId)
    .maybeSingle<GenerationRow>();
  if (error) throw error;
  return data;
}

export async function listPendingGenerations(serviceSupabase: ServiceSupabase, userId: string) {
  const { data, error } = await serviceSupabase
    .from("user_generated_images")
    .select("*")
    .eq("user_id", userId)
    .eq("is_saved", false)
    .in("status", [...APP_PENDING_STATES, "pending"])
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data || []) as GenerationRow[];
}

export async function updateGeneration(
  serviceSupabase: ServiceSupabase,
  rowId: string,
  patch: Record<string, unknown>,
) {
  const { data, error } = await serviceSupabase
    .from("user_generated_images")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", rowId)
    .select("*")
    .single<GenerationRow>();
  if (error) throw error;
  return data;
}

export async function claimReconciliation(serviceSupabase: ServiceSupabase, row: GenerationRow) {
  const cutoff = new Date(Date.now() - RECONCILE_MIN_INTERVAL_MS).toISOString();
  const now = new Date().toISOString();
  const { data, error } = await serviceSupabase
    .from("user_generated_images")
    .update({ last_reconciled_at: now, updated_at: now })
    .eq("id", row.id)
    .or(`last_reconciled_at.is.null,last_reconciled_at.lt.${cutoff}`)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function claimFinalization(
  serviceSupabase: ServiceSupabase,
  row: GenerationRow,
  leaseSeconds: number,
) {
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + leaseSeconds * 1000).toISOString();
  const nowIso = now.toISOString();

  const { data, error } = await serviceSupabase
    .from("user_generated_images")
    .update({
      status: "finalizing",
      finalization_lock_until: leaseUntil,
      finalization_attempts: (row.finalization_attempts || 0) + 1,
      updated_at: nowIso,
    })
    .eq("id", row.id)
    .neq("status", "completed")
    .or(`finalization_lock_until.is.null,finalization_lock_until.lt.${nowIso}`)
    .select("*")
    .maybeSingle<GenerationRow>();
  if (error) throw error;
  return data;
}

export async function releaseFinalization(
  serviceSupabase: ServiceSupabase,
  rowId: string,
  errorMessage?: string,
) {
  const { error } = await serviceSupabase
    .from("user_generated_images")
    .update({
      status: "processing",
      finalization_lock_until: null,
      error_message: errorMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", rowId)
    .neq("status", "completed");
  if (error) throw error;
}

export function toResponseRow(row: GenerationRow | null) {
  if (!row) return null;
  return {
    generationId: row.generation_id,
    predictionId: row.prediction_id,
    status: row.status,
    replicateStatus: row.replicate_status,
    imageUrl: row.image_url,
    outputUrl: row.output_url,
    error: row.error_message,
    prompt: row.prompt,
    originalPrompt: row.original_prompt,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
