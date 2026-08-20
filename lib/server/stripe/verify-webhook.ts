import Stripe from "stripe";

export const MAX_STRIPE_WEBHOOK_BYTES = 1024 * 1024;

export type StripeWebhookErrorCode =
  | "WEBHOOK_SECRET_MISSING"
  | "WEBHOOK_BODY_TOO_LARGE"
  | "WEBHOOK_SIGNATURE_MISSING"
  | "WEBHOOK_SIGNATURE_INVALID";

export class StripeWebhookError extends Error {
  constructor(
    public readonly code: StripeWebhookErrorCode,
    public readonly status: number,
  ) {
    super(code);
    this.name = "StripeWebhookError";
  }
}

export async function verifyStripeWebhookRequest(args: {
  request: Request;
  webhookSecret: string | undefined;
  stripe: Stripe;
}) {
  const secret = args.webhookSecret?.trim();
  if (!secret) {
    throw new StripeWebhookError("WEBHOOK_SECRET_MISSING", 500);
  }

  const contentLength = Number(args.request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_STRIPE_WEBHOOK_BYTES) {
    throw new StripeWebhookError("WEBHOOK_BODY_TOO_LARGE", 413);
  }

  const signature = args.request.headers.get("stripe-signature");
  if (!signature) {
    throw new StripeWebhookError("WEBHOOK_SIGNATURE_MISSING", 400);
  }

  const rawBody = await args.request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_STRIPE_WEBHOOK_BYTES) {
    throw new StripeWebhookError("WEBHOOK_BODY_TOO_LARGE", 413);
  }

  try {
    return args.stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    throw new StripeWebhookError("WEBHOOK_SIGNATURE_INVALID", 400);
  }
}
