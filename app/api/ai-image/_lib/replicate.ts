import { getEnv } from "./config";
import { buildQualityPrompt } from "./prompt";
import type { ReplicatePrediction } from "./types";

export function normalizePredictionStatus(value: unknown) {
  const status = String(value || "").trim().toLowerCase();
  if (["queued", "starting", "processing", "succeeded", "failed", "canceled"].includes(status)) {
    return status;
  }
  return status || "unknown";
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const found = firstString(...value);
      if (found) return found;
    }
    if (value && typeof value === "object" && !(value instanceof ReadableStream)) {
      const record = value as Record<string, unknown>;
      const found = firstString(record.url, record.image, record.src, record.output);
      if (found) return found;
    }
  }
  return null;
}

export function extractOutputUrl(prediction: ReplicatePrediction) {
  return firstString(prediction?.output, prediction?.image, prediction?.images, prediction?.urls);
}

export async function createReplicatePrediction(args: {
  prompt: string;
  replicateWebhookUrl: string;
}) {
  const token = getEnv("REPLICATE_API_TOKEN");
  const model = process.env.REPLICATE_FLUX_MODEL || "black-forest-labs/flux-dev";
  const [owner, name] = model.split("/");
  if (!owner || !name) throw new Error("Invalid REPLICATE_FLUX_MODEL. Use owner/model.");

  const response = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt: buildQualityPrompt(args.prompt),
        aspect_ratio: "1:1",
        num_outputs: 1,
        output_format: "png",
        output_quality: 100,
        num_inference_steps: 40,
        guidance_scale: 5,
      },
      webhook: args.replicateWebhookUrl,
      webhook_events_filter: ["completed"],
    }),
  });

  const data = (await response.json().catch(() => null)) as ReplicatePrediction | null;
  if (!response.ok) {
    throw new Error(String(data?.detail || data?.error || `Replicate prediction failed (${response.status})`));
  }
  if (!data?.id) throw new Error("Replicate returned a prediction without an id");
  return data;
}

export async function getReplicatePrediction(predictionId: string) {
  const response = await fetch(`https://api.replicate.com/v1/predictions/${encodeURIComponent(predictionId)}`, {
    headers: { Authorization: `Bearer ${getEnv("REPLICATE_API_TOKEN")}` },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as ReplicatePrediction | null;
  if (!response.ok) {
    throw new Error(String(data?.detail || data?.error || `Could not reconcile prediction (${response.status})`));
  }
  if (!data) throw new Error("Replicate reconciliation returned an empty response");
  return data;
}
