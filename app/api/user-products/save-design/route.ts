import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createSupabaseServer } from "@/lib/supabase-server";
import { addSavedDesignToCart } from "./cart";
import {
  buildUserProductSavePayload,
  getBaseProduct,
  isUuid,
} from "./save-design-payload";
import { queueDesignAssetJobs } from "./queue-design-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function containsInlineImageData(value: unknown) {
  const serialized = JSON.stringify(value).toLowerCase();

  return (
    serialized.includes("data:image") ||
    serialized.includes("base64,") ||
    serialized.includes("blob:") ||
    /[a-z0-9+/=]{200000,}/i.test(serialized)
  );
}

async function createCookieSupabaseServer() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Ignore cookie writes in contexts where Next exposes read-only cookies.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // Ignore cookie writes in contexts where Next exposes read-only cookies.
        }
      },
    },
  });
}

async function getAuthenticatedSupabase(req: Request) {
  // First keep the existing project helper path. If it is already correct in a
  // deployment, this preserves the current behavior.
  const projectSupabase = createSupabaseServer();
  const projectAuth = await projectSupabase.auth.getUser();

  if (!projectAuth.error && projectAuth.data.user) {
    return { supabase: projectSupabase, user: projectAuth.data.user };
  }

  // In this route the observed failure is 401 even after browser login. That
  // usually means the API helper is not reading Next cookies correctly. Build a
  // request-scoped Supabase client from the actual route cookies.
  const cookieSupabase = await createCookieSupabaseServer();
  const cookieAuth = await cookieSupabase.auth.getUser();

  if (!cookieAuth.error && cookieAuth.data.user) {
    return { supabase: cookieSupabase, user: cookieAuth.data.user };
  }

  // Optional fallback for clients that explicitly send Authorization: Bearer.
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (bearerToken) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const bearerSupabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    });
    const bearerAuth = await bearerSupabase.auth.getUser();

    if (!bearerAuth.error && bearerAuth.data.user) {
      return { supabase: bearerSupabase, user: bearerAuth.data.user };
    }
  }

  console.error("SAVE_DESIGN_AUTH_ERROR", {
    projectAuthError: projectAuth.error?.message ?? null,
    cookieAuthError: cookieAuth.error?.message ?? null,
    hasCookieHeader: Boolean(req.headers.get("cookie")),
    hasAuthorizationHeader: Boolean(authHeader),
  });

  return { supabase: cookieSupabase, user: null };
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (containsInlineImageData(body)) {
      return NextResponse.json(
        { error: "Invalid save payload: inline image data is not allowed." },
        { status: 400 },
      );
    }

    const { supabase, user } = await getAuthenticatedSupabase(req);

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    // Keep save-design tolerant of editor versions that pass product/variant
    // identifiers through query params instead of the JSON payload.
    const searchParams = new URL(req.url).searchParams;
    const queryBackfill: Record<string, string> = {};
    [
      "productId",
      "product_id",
      "baseProductId",
      "base_product_id",
      "variantId",
      "variant_id",
      "selectedVariantId",
      "sku",
      "size",
      "selectedSize",
      "gelatoProductUid",
      "gelato_product_uid",
      "productUid",
      "product_uid",
      "gelatoVariantUid",
      "gelato_variant_uid",
    ].forEach((key) => {
      const value = searchParams.get(key);
      if (value && (body[key] === undefined || body[key] === null || body[key] === "")) {
        queryBackfill[key] = value;
      }
    });

    Object.assign(body, queryBackfill);

    const baseProductId =
      body.baseProductId ||
      body.base_product_id ||
      body.productId ||
      body.product_id;

    if (!baseProductId) {
      return NextResponse.json(
        { error: "Base product ID missing" },
        { status: 400 },
      );
    }

    const { baseProduct, productError } = await getBaseProduct({
      supabase,
      baseProductId: String(baseProductId),
    });

    if (productError || !baseProduct) {
      console.error("PRODUCT ERROR:", productError);

      return NextResponse.json(
        { error: "Base product not found" },
        { status: 404 },
      );
    }

    const designId = isUuid(body.designId || body.id)
      ? String(body.designId || body.id)
      : crypto.randomUUID();

    const savePayload = await buildUserProductSavePayload({
      body,
      userId: user.id,
      designId,
      baseProduct,
    });

    const { data: userProduct, error: saveError } = await supabase
      .from("user_products")
      .upsert(savePayload, {
        onConflict: "id",
      })
      .select()
      .single();

    if (saveError) {
      console.error("USER PRODUCT SAVE ERROR:", saveError);

      return NextResponse.json(
        { error: saveError.message },
        { status: 500 },
      );
    }

    let backgroundJobs: Awaited<ReturnType<typeof queueDesignAssetJobs>> | null = null;
    try {
      backgroundJobs = await queueDesignAssetJobs({
        userProductId: userProduct.id,
        designData: userProduct.design_data,
      });
    } catch (queueError) {
      // Save must remain JSON-only and must never fail because Trigger.dev/R2 is down.
      // The product row is already persisted with pending asset status.
      console.error("DESIGN_ASSET_QUEUE_ERROR", queueError);
    }

    const shouldAddToCart = body.addToCart !== false;
    let cartItem = null;
    let cartMode: "extended" | "basic" | null = null;

    if (shouldAddToCart) {
      const cartResult = await addSavedDesignToCart({
        supabase,
        userId: user.id,
        userProduct,
        body,
      });

      if (cartResult.error) {
        console.error("CART INSERT ERROR:", cartResult.error);

        return NextResponse.json(
          {
            error: cartResult.error.message || "Design saved but cart insert failed",
            designId: userProduct.id,
            product: userProduct,
          },
          { status: 500 },
        );
      }

      cartItem = cartResult.data;
      cartMode = cartResult.mode;
    }

    return NextResponse.json({
      success: true,
      designId: userProduct.id,
      product: userProduct,
      cartItem,
      cartMode,
      backgroundJobs,
      redirectTo: "/cart",
    });
  } catch (error) {
    console.error("Erro ao guardar produto com design:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao guardar produto com design",
      },
      { status: 500 },
    );
  }
}
