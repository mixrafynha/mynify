import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";
import { uploadBufferToR2 } from "../save-design/r2";
import {
  CheckoutThumbnailError,
  createCheckoutThumbnailPipeline,
  processCheckoutThumbnailDataUrl,
  type ThumbnailSide,
} from "./security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Mockups = Record<string, unknown>;
type AuthContext = NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>;
type OwnedUserProduct = { id: string; user_id: string; mockups: Mockups | string | null };

const checkoutThumbnailRateLimiter = getDurableRateLimiter({
  namespace: "checkout-thumbnail-upload",
  limit: 12,
  window: "1 m",
});

function parseJsonIfString(value: unknown): Mockups {
  if (!value) return {};
  if (typeof value !== "string") {
    return typeof value === "object" && !Array.isArray(value) ? (value as Mockups) : {};
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Mockups) : {};
  } catch {
    return {};
  }
}

function statusObject(existing: Mockups) {
  const value = existing.checkout_thumbnail_status;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Mockups) : {};
}

function currentVersion(existing: Mockups) {
  const frontVersion = Number(existing.checkout_thumbnail_front_version);
  const backVersion = Number(existing.checkout_thumbnail_back_version);
  const version = Math.max(
    Number.isFinite(frontVersion) ? frontVersion : 0,
    Number.isFinite(backVersion) ? backVersion : 0,
  );
  return version > 0 ? version + 1 : 1;
}

function truncateId(value: string) {
  return value.slice(0, 8);
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase environment variables");

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {}
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  return error || !data.user ? null : { user: data.user, supabase };
}

async function persistThumbnail(args: {
  auth: AuthContext;
  ownedProduct: OwnedUserProduct;
  userProductId: string;
  side: ThumbnailSide;
  url: string;
}) {
  const { auth, ownedProduct, userProductId, side, url } = args;
  const mockups = parseJsonIfString(ownedProduct.mockups);
  const existingStatus = statusObject(mockups);
  const timestamp = new Date().toISOString();
  const nextVersion = currentVersion(mockups);
  const nextMockups = {
    ...mockups,
    checkout_thumbnail_url: side === "front" ? url : mockups.checkout_thumbnail_url ?? null,
    checkout_thumbnail_back_url: side === "back" ? url : mockups.checkout_thumbnail_back_url ?? null,
    checkout_thumbnail_status: { ...existingStatus, [side]: "ready" },
    checkout_thumbnail_front_version:
      side === "front" ? nextVersion : mockups.checkout_thumbnail_front_version ?? null,
    checkout_thumbnail_back_version:
      side === "back" ? nextVersion : mockups.checkout_thumbnail_back_version ?? null,
    checkout_thumbnail_front_source:
      side === "front" ? "editor" : mockups.checkout_thumbnail_front_source ?? null,
    checkout_thumbnail_back_source:
      side === "back" ? "editor" : mockups.checkout_thumbnail_back_source ?? null,
    checkout_thumbnail_front_updated_at:
      side === "front" ? timestamp : mockups.checkout_thumbnail_front_updated_at ?? null,
    checkout_thumbnail_back_updated_at:
      side === "back" ? timestamp : mockups.checkout_thumbnail_back_updated_at ?? null,
  };

  const serviceSupabase = createSupabaseAdmin();
  const { data: updated, error: updateError } = await serviceSupabase
    .from("user_products")
    .update({ mockups: nextMockups })
    .eq("id", userProductId)
    .eq("user_id", auth.user.id)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) {
    throw new CheckoutThumbnailError(500, "THUMBNAIL_PERSISTENCE_FAILED", "Unable to persist thumbnail");
  }

  const { error: cartError } = await auth.supabase
    .from("cart_items")
    .update({ image: url, mockup_url: url })
    .eq("user_id", auth.user.id)
    .or(`user_product_id.eq.${userProductId},design_id.eq.${userProductId}`);

  if (cartError) {
    console.warn("[checkout-thumbnail:cart-update-failed]", {
      userProductId,
      userId: truncateId(auth.user.id),
      errorCode: cartError.code ?? "unknown",
    });
  }
}

const pipeline = createCheckoutThumbnailPipeline<AuthContext, OwnedUserProduct>({
  authenticate: getAuthenticatedUser,
  authenticatedUserId: (auth) => auth.user.id,
  requestIp: getTrustedRequestIp,
  rateLimit: (identifier) => checkoutThumbnailRateLimiter.limit(identifier),
  loadOwnedProduct: async (auth, userProductId) => {
    const { data, error } = await auth.supabase
      .from("user_products")
      .select("id, user_id, mockups")
      .eq("id", userProductId)
      .eq("user_id", auth.user.id)
      .maybeSingle<OwnedUserProduct>();
    return error || !data ? null : data;
  },
  processImage: processCheckoutThumbnailDataUrl,
  upload: (args) =>
    uploadBufferToR2({
      ...args,
      cacheControl: "public, max-age=0, must-revalidate",
    }),
  persist: persistThumbnail,
});

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id")?.slice(0, 64) || crypto.randomUUID();
  const startedAt = Date.now();
  try {
    const result = await pipeline(req);
    console.info("[checkout-thumbnail:completed]", {
      requestId,
      userProductId: result.audit.userProductId,
      userId: truncateId(result.audit.userId),
      side: result.audit.side,
      format: result.audit.format,
      width: result.audit.width,
      height: result.audit.height,
      decodedBytes: result.audit.decodedBytes,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const controlled = error instanceof CheckoutThumbnailError;
    const status = controlled ? error.status : 500;
    const code = controlled ? error.code : "INTERNAL_ERROR";
    console.error("[checkout-thumbnail:failed]", {
      requestId,
      errorCode: code,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { ok: false, code, error: controlled ? error.message : "Unable to upload checkout thumbnail" },
      { status },
    );
  }
}
