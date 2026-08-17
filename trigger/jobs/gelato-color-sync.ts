import { task } from "@trigger.dev/sdk/v3";
import { getServiceSupabase } from "../shared/supabase";
import { processGelatoColorSyncJob } from "@/lib/gelato/color-sync";

type Payload = {
  productId: string;
  jobId: string;
  dryRun: boolean;
};

export const gelatoColorSync = task({
  id: "gelato-color-sync",
  maxDuration: 1800,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 60_000,
  },
  run: async (payload: Payload) => {
    if (!payload.productId) throw new Error("Missing productId.");
    if (!payload.jobId) throw new Error("Missing jobId.");

    const supabase = getServiceSupabase();
    const { data: job, error } = await supabase
      .from("gelato_color_sync_jobs")
      .select("id, product_id, dry_run, status")
      .eq("id", payload.jobId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!job) throw new Error("Color sync job not found.");
    if (String(job.product_id) !== String(payload.productId)) {
      throw new Error("Color sync job does not belong to the requested product.");
    }
    if (Boolean(job.dry_run) !== Boolean(payload.dryRun)) {
      throw new Error("Color sync job dry_run flag does not match the requested execution mode.");
    }

    return await processGelatoColorSyncJob(payload.jobId);
  },
});
