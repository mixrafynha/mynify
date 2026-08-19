import { applyPredictionState } from "./finalize";
import { claimReconciliation } from "./repository";
import { getReplicatePrediction } from "./replicate";
import type { GenerationRow, ServiceSupabase } from "./types";

export async function reconcileWithReplicate(args: {
  req: Request;
  serviceSupabase: ServiceSupabase;
  row: GenerationRow;
  source: "post" | "webhook" | "poll";
  force?: boolean;
}) {
  const predictionId = args.row.prediction_id;
  if (!predictionId) return { status: args.row.status || "pending" };

  if (!args.force) {
    const claimed = await claimReconciliation(args.serviceSupabase, args.row);
    if (!claimed) return { status: args.row.status || "processing", throttled: true };
  }

  const prediction = await getReplicatePrediction(predictionId);
  return applyPredictionState({
    req: args.req,
    serviceSupabase: args.serviceSupabase,
    row: args.row,
    prediction,
    source: args.source,
  });
}
