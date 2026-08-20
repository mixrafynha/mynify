import {
  resolveTrustedPrintFiles,
  type TrustedPrintFile,
} from "@/lib/server/trusted-print-files";

export type AvailabilityAccessResult =
  | { ok: true; userId: string }
  | {
      ok: false;
      status: 401 | 429 | 503;
      code: "AUTHENTICATION_REQUIRED" | "RATE_LIMITED" | "RATE_LIMIT_UNAVAILABLE";
      message: string;
    };

export async function authorizeAvailabilityRequest(args: {
  loadUserId: () => Promise<string | null>;
  consumeRateLimit: (key: string) => Promise<{ success: boolean }>;
  requestIp: string;
}): Promise<AvailabilityAccessResult> {
  const userId = await args.loadUserId().catch(() => null);
  if (!userId) {
    return {
      ok: false,
      status: 401,
      code: "AUTHENTICATION_REQUIRED",
      message: "Authentication is required to calculate checkout availability.",
    };
  }

  try {
    const rateLimit = await args.consumeRateLimit(`${userId}:${args.requestIp}`);
    if (!rateLimit.success) {
      return {
        ok: false,
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many shipping checks. Try again shortly.",
      };
    }
  } catch {
    return {
      ok: false,
      status: 503,
      code: "RATE_LIMIT_UNAVAILABLE",
      message: "Shipping availability is temporarily unavailable.",
    };
  }

  return { ok: true, userId };
}

export function resolveAvailabilityTrustedPrintFiles(args: {
  storedPrintFiles: Record<string, unknown> | null | undefined;
  browserPrintFiles?: unknown;
  userId: string;
  userProductId: string;
}): TrustedPrintFile[] {
  return resolveTrustedPrintFiles({
    printFiles: args.storedPrintFiles,
    userId: args.userId,
    userProductId: args.userProductId,
  });
}

type SafeQuoteLogItem = {
  itemReferenceId: string;
  productUid: string;
  quantity: number;
  printFiles: TrustedPrintFile[];
};

function trustedHostname(url: string) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function buildSafeAvailabilityQuoteLog(args: {
  requestId: string;
  userId: string;
  countryCode: string;
  items: SafeQuoteLogItem[];
}) {
  return {
    requestId: args.requestId,
    userIdSuffix: args.userId.slice(-8),
    countryCode: args.countryCode,
    itemsCount: args.items.length,
    items: args.items.map((item) => ({
      itemReferenceId: item.itemReferenceId,
      productUid: item.productUid,
      quantity: item.quantity,
      printFiles: item.printFiles.map((file) => ({
        type: file.type,
        hostname: trustedHostname(file.url),
      })),
    })),
  };
}
