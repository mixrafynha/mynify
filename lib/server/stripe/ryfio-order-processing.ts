export type RyfioOrderClaimResult = "acquired" | "busy" | "completed";

export class RyfioOrderWebhookError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "RyfioOrderWebhookError";
  }
}

export type GelatoConversionResult = {
  alreadyOrdered: boolean;
  body: Record<string, unknown> | null;
  status: number;
};

export function validateRyfioOrderRelations(input: {
  expectedOrderId: string;
  expectedUserId: string;
  expectedCheckoutDraftId: string;
  expectedStripeSessionId: string;
  metadataGelatoDraftOrderId: string | null;
  order: {
    id: string;
    user_id: string | null;
    checkout_draft_id: string | null;
    stripe_session_id: string | null;
    gelato_draft_order_id: string | null;
  };
  draft: {
    id: string;
    user_id: string;
    gelato_draft_order_id: string | null;
  };
}) {
  if (
    input.order.id !== input.expectedOrderId ||
    input.order.user_id !== input.expectedUserId ||
    input.draft.user_id !== input.expectedUserId ||
    input.order.checkout_draft_id !== input.expectedCheckoutDraftId ||
    input.draft.id !== input.expectedCheckoutDraftId
  ) {
    throw new RyfioOrderWebhookError("ORDER_CHECKOUT_DRAFT_MISMATCH");
  }

  if (input.order.stripe_session_id !== input.expectedStripeSessionId) {
    throw new RyfioOrderWebhookError("ORDER_STRIPE_SESSION_MISMATCH");
  }

  const gelatoDraftOrderId = String(
    input.draft.gelato_draft_order_id ?? "",
  ).trim();
  if (!gelatoDraftOrderId) {
    throw new RyfioOrderWebhookError("GELATO_DRAFT_ORDER_ID_MISSING");
  }

  const relatedGelatoIds = [
    input.order.gelato_draft_order_id,
    input.metadataGelatoDraftOrderId,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  if (relatedGelatoIds.some((value) => value !== gelatoDraftOrderId)) {
    throw new RyfioOrderWebhookError("GELATO_DRAFT_ORDER_MISMATCH");
  }

  return { gelatoDraftOrderId };
}

type RyfioOrderWorkflowDependencies = {
  claim: () => Promise<RyfioOrderClaimResult>;
  convertGelatoDraft: () => Promise<GelatoConversionResult>;
  updateOrder: (gelatoResult: GelatoConversionResult) => Promise<void>;
  updateDraft: () => Promise<void>;
  clearPurchasedCartItems: () => Promise<void>;
  completeClaim: () => Promise<boolean>;
  releaseClaim: () => Promise<void>;
};

export async function runRyfioOrderWorkflow(
  dependencies: RyfioOrderWorkflowDependencies,
) {
  const claimResult = await dependencies.claim();

  if (claimResult === "completed") {
    return { alreadyCompleted: true, gelatoResult: null };
  }

  if (claimResult === "busy") {
    throw new RyfioOrderWebhookError("RYFIO_ORDER_WEBHOOK_BUSY");
  }

  try {
    const gelatoResult = await dependencies.convertGelatoDraft();
    await dependencies.updateOrder(gelatoResult);
    await dependencies.updateDraft();
    await dependencies.clearPurchasedCartItems();

    if (!(await dependencies.completeClaim())) {
      throw new RyfioOrderWebhookError("RYFIO_ORDER_WEBHOOK_CLAIM_LOST");
    }

    return { alreadyCompleted: false, gelatoResult };
  } catch (error) {
    await dependencies.releaseClaim();
    throw error;
  }
}

function parseGelatoBody(text: string): Record<string, unknown> | null {
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function assertGelatoReference(
  body: Record<string, unknown> | null,
  expectedOrderReferenceId: string | null,
) {
  if (!expectedOrderReferenceId) return;

  const actualReference =
    typeof body?.orderReferenceId === "string"
      ? body.orderReferenceId.trim()
      : "";

  if (actualReference !== expectedOrderReferenceId) {
    throw new RyfioOrderWebhookError("GELATO_ORDER_REFERENCE_MISMATCH");
  }
}

export async function ensureGelatoDraftConverted(input: {
  gelatoDraftOrderId: string;
  expectedOrderReferenceId: string | null;
  apiKey: string;
  fetchImpl?: typeof fetch;
}): Promise<GelatoConversionResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const url = `https://order.gelatoapis.com/v4/orders/${encodeURIComponent(input.gelatoDraftOrderId)}`;
  const headers = { "X-API-KEY": input.apiKey };

  // Reconcile first. A retry after a successful conversion must never send a
  // second production transition.
  const initialGetResponse = await fetchImpl(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const initialGetBody = parseGelatoBody(await initialGetResponse.text());

  if (initialGetResponse.ok) {
    assertGelatoReference(initialGetBody, input.expectedOrderReferenceId);

    if (initialGetBody?.orderType === "order") {
      return {
        alreadyOrdered: true,
        body: initialGetBody,
        status: initialGetResponse.status,
      };
    }

    if (initialGetBody?.orderType !== "draft") {
      throw new RyfioOrderWebhookError("GELATO_ORDER_STATE_INVALID");
    }
  }

  const patchResponse = await fetchImpl(url, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderType: "order" }),
    cache: "no-store",
  });
  const patchText = await patchResponse.text();
  const patchBody = parseGelatoBody(patchText);

  if (patchResponse.ok) {
    assertGelatoReference(patchBody, input.expectedOrderReferenceId);
    return {
      alreadyOrdered: false,
      body: patchBody,
      status: patchResponse.status,
    };
  }

  // The PATCH may have succeeded remotely while its response was lost, or a
  // concurrent caller may have completed the same draft transition.
  const recoveryGetResponse = await fetchImpl(url, {
    method: "GET",
    headers,
    cache: "no-store",
  });
  const recoveryText = await recoveryGetResponse.text();
  const recoveryBody = parseGelatoBody(recoveryText);

  if (recoveryGetResponse.ok && recoveryBody?.orderType === "order") {
    assertGelatoReference(recoveryBody, input.expectedOrderReferenceId);
    return {
      alreadyOrdered: true,
      body: recoveryBody,
      status: recoveryGetResponse.status,
    };
  }

  throw new Error(
    `Gelato draft conversion failed (${patchResponse.status}): ${patchText.slice(0, 500)}`,
  );
}
