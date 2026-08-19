export const MAX_BODY_BYTES = 16 * 1024;
export const RECONCILE_MIN_INTERVAL_MS = 20_000;
export const FINALIZATION_LEASE_SECONDS = 300;

export const JSON_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export function getEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

let aiImageWebhookConfigValidated = false;

export function validateAiImageWebhookConfig() {
  if (aiImageWebhookConfigValidated) return true;
  aiImageWebhookConfigValidated = true;

  const secret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[AI_WEBHOOK_CONFIG_ERROR]", {
      missing: ["REPLICATE_WEBHOOK_SECRET"],
    });
    return false;
  }

  return true;
}

export function getReplicateWebhookSecret() {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[AI_WEBHOOK_CONFIG_ERROR]", {
      missing: ["REPLICATE_WEBHOOK_SECRET"],
    });
    return null;
  }
  return secret.replace(/^whsec_/, "");
}

export function getBaseUrl(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const appProductionUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (appProductionUrl) return appProductionUrl;
  if (appUrl) return appUrl;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return new URL(req.url).origin;
}

export function getProductionWebhookBaseUrl(req: Request) {
  const appProductionUrl = process.env.APP_URL?.replace(/\/$/, "");
  if (appProductionUrl) return appProductionUrl;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (appUrl && !process.env.VERCEL_URL) return appUrl;

  return "https://www.ryfio.com";
}
