import { finalizePrediction } from "./finalize";
import { claimReconciliation, listStaleReconciliationGenerations } from "./repository";
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
  return finalizePrediction({
    req: args.req,
    serviceSupabase: args.serviceSupabase,
    row: args.row,
    prediction,
    source: args.source,
  });
}

export async function reconcileStaleGenerations(args: {
  req: Request;
  serviceSupabase: ServiceSupabase;
}) {
  const rows = await listStaleReconciliationGenerations(args.serviceSupabase);
  const results = [];

  for (const row of rows) {
    if (!row.prediction_id) continue;
    const prediction = await getReplicatePrediction(row.prediction_id);
    results.push(
      await finalizePrediction({
        req: args.req,
        serviceSupabase: args.serviceSupabase,
        row,
        prediction,
        source: "poll",
      }),
    );
  }

  return results;
}
