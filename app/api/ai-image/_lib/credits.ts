import type { GenerationRow, ReserveGenerationResult, ServiceSupabase } from "./types";

function safeInt(value: unknown, fallback = 0) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.floor(next);
}

export async function getCreditBalance(serviceSupabase: ServiceSupabase, userId: string) {
  const { data, error } = await serviceSupabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return Math.max(0, safeInt(data?.credits));
}

export async function reserveGenerationAndCredit(args: {
  serviceSupabase: ServiceSupabase;
  userId: string;
  generationId: string;
  idempotencyKey: string;
  prompt: string;
  originalPrompt: string;
  requestPayload: Record<string, unknown>;
}) {
  const { data, error } = await args.serviceSupabase.rpc("reserve_ai_generation_credit", {
    p_user_id: args.userId,
    p_generation_id: args.generationId,
    p_idempotency_key: args.idempotencyKey,
    p_prompt: args.prompt,
    p_original_prompt: args.originalPrompt,
    p_request_payload: args.requestPayload,
  });
  if (error) throw error;
  const result = (Array.isArray(data) ? data[0] : data) as ReserveGenerationResult | null;
  if (!result) throw new Error("reserve_ai_generation_credit returned no result");
  return {
    created: Boolean(result.created),
    rowId: result.generation_row_id,
    generationId: result.generation_id,
    credits: Math.max(0, safeInt(result.balance)),
  };
}

export async function refundGenerationCreditOnce(
  serviceSupabase: ServiceSupabase,
  generationRowId: string,
) {
  const { data, error } = await serviceSupabase.rpc("refund_ai_generation_credit_once", {
    p_generation_row_id: generationRowId,
  });
  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  return {
    refunded: Boolean(result?.refunded),
    credits: Math.max(0, safeInt(result?.balance)),
  };
}

export async function markFailedAfterRefund(
  serviceSupabase: ServiceSupabase,
  row: GenerationRow,
  message: string,
  replicateStatus = "failed",
) {
  const at = new Date().toISOString();
  const { error } = await serviceSupabase
    .from("user_generated_images")
    .update({
      status: "failed",
      replicate_status: replicateStatus,
      failed_at: at,
      error_message: message,
      updated_at: at,
    })
    .eq("id", row.id)
    .neq("status", "completed");
  if (error) throw error;
}
