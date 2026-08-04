import { NextResponse } from "next/server";
import { addSavedDesignToCart } from "./cart";
import {
  buildUserProductSavePayload,
  getBaseProduct,
  isUuid,
  uploadPreviewImageToR2,
} from "./save-design-payload";
import { getAuthenticatedSupabase } from "./auth";
import { queueDesignAssetJobs } from "./queue-design-assets";
import {
  normalizeSavedElements,
  resolveSavedDesignSides,
} from "./design-sides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INLINE_IMAGE_RE = /(?:data:image\/|base64,|blob:)/i;
const INLINE_SVG_RE = /^data:image\/svg\+xml(?:;charset=utf-8)?,/i;
const MAX_INLINE_SVG_CHARS = 120_000;

function shortUrl(field: string, value: unknown) {
  const url = typeof value === "string" && value.trim() ? value.trim() : null;
  if (!url) return { field, value: null };
  return {
    field,
    value: {
      start: url.slice(0, 80),
      end: url.slice(-30),
      length: url.length,
    },
  };
}

function normalizeMockupsRecord(value: unknown) {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
  const normalized = { ...record };
  const wrapperKeys = normalized.keys && typeof normalized.keys === "object" && !Array.isArray(normalized.keys)
    ? (normalized.keys as Record<string, unknown>)
    : null;

  if (wrapperKeys) {
    if (normalized.front === undefined && wrapperKeys.front !== undefined) normalized.front = wrapperKeys.front;
    if (normalized.back === undefined && wrapperKeys.back !== undefined) normalized.back = wrapperKeys.back;
  }

  delete normalized.keys;
  return normalized;
}

function containsInvalidInlineImage(value: unknown, path: string[] = []): boolean {
  if (typeof value === "string") {
    const pathKey = path[path.length - 1] || "";
    if (pathKey === "previewFrontDataUrl" || pathKey === "previewBackDataUrl") {
      return false;
    }
    if (!INLINE_IMAGE_RE.test(value)) return false;

    const trimmed = value.trim();
    return !(
      trimmed.length <= MAX_INLINE_SVG_CHARS &&
      INLINE_SVG_RE.test(trimmed) &&
      !/base64,/i.test(trimmed) &&
      !/blob:/i.test(trimmed)
    );
  }

  if (Array.isArray(value)) {
    return value.some((entry, index) => containsInvalidInlineImage(entry, [...path, String(index)]));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, entry]) =>
      containsInvalidInlineImage(entry, [...path, key]),
    );
  }

  return false;
}

export async function POST(req: Request) {
  const saveContext: {
    step:
      | "auth"
      | "payload"
      | "base-product"
      | "build-payload"
      | "upload-preview"
      | "persist-user-product"
      | "queue-assets"
      | "persist-job-state"
      | "cart";
    userProductId: string | null;
    designId: string | null;
  } = {
    step: "auth",
    userProductId: null,
    designId: null,
  };

  try {
    const { supabase, user } = await getAuthenticatedSupabase(req);

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    saveContext.step = "payload";
    const body = await req.json();
    const receivedDesignData = body?.design_data || body?.designData || {};
    const receivedSides = body?.sides || receivedDesignData?.sides || {};
    const receivedFront = receivedSides?.front || null;
    const receivedBack = receivedSides?.back || null;
    console.log("[save-design] received design structure", {
      topLevelKeys: receivedDesignData && typeof receivedDesignData === "object"
        ? Object.keys(receivedDesignData)
        : [],
      frontKeys: receivedFront && typeof receivedFront === "object" ? Object.keys(receivedFront) : [],
      backKeys: receivedBack && typeof receivedBack === "object" ? Object.keys(receivedBack) : [],
    });
    if (containsInvalidInlineImage(body)) {
      return NextResponse.json(
        { error: "Invalid save payload: inline image data is not allowed." },
        { status: 400 },
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

    saveContext.step = "base-product";
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
    saveContext.designId = designId;

    saveContext.step = "build-payload";
    const savePayload = await buildUserProductSavePayload({
      supabase,
      body,
      userId: user.id,
      designId,
      baseProduct,
    });

    const previewFrontDataUrl = typeof body.previewFrontDataUrl === "string" ? body.previewFrontDataUrl : null;
    const previewBackDataUrl = typeof body.previewBackDataUrl === "string" ? body.previewBackDataUrl : null;

    console.info("[checkout-preview:save-api] preview inputs", {
      previewFrontDataUrlExists: Boolean(previewFrontDataUrl),
      previewBackDataUrlExists: Boolean(previewBackDataUrl),
      previewFrontDataUrlSize: previewFrontDataUrl?.length ?? null,
      previewBackDataUrlSize: previewBackDataUrl?.length ?? null,
      front: shortUrl("previewFrontDataUrl", previewFrontDataUrl),
      back: shortUrl("previewBackDataUrl", previewBackDataUrl),
    });

    if (previewFrontDataUrl || previewBackDataUrl) {
      saveContext.step = "upload-preview";
      const currentMockups = savePayload.mockups && typeof savePayload.mockups === "object"
        ? normalizeMockupsRecord(savePayload.mockups)
        : {};

      const nextMockups: Record<string, unknown> = { ...currentMockups };
      console.info("[checkout-preview:database] mockups before upload", {
        mockupKeys: Object.keys(currentMockups),
      });

      if (previewFrontDataUrl) {
        const frontPreview = await uploadPreviewImageToR2({
          userId: user.id,
          designId,
          side: "front",
          dataUrl: previewFrontDataUrl,
        });
        console.info("[checkout-preview:save-api] front upload created", {
          url: shortUrl("frontPreview.url", frontPreview.url),
        });
        nextMockups.front = frontPreview.url ?? null;
        nextMockups.checkout_thumbnail_url = frontPreview.url ?? null;
        nextMockups.checkout_thumbnail_front_url = frontPreview.url ?? null;
        (savePayload as Record<string, any>).design_image_url = frontPreview.url ?? null;
      }

      if (previewBackDataUrl) {
        const backPreview = await uploadPreviewImageToR2({
          userId: user.id,
          designId,
          side: "back",
          dataUrl: previewBackDataUrl,
        });
        console.info("[checkout-preview:save-api] back upload created", {
          url: shortUrl("backPreview.url", backPreview.url),
        });
        nextMockups.back = backPreview.url ?? null;
        nextMockups.checkout_thumbnail_back_url = backPreview.url ?? null;
        nextMockups.checkout_thumbnail_back = backPreview.url ?? null;
      }

      (savePayload as Record<string, any>).mockups = nextMockups;
      console.info("[checkout-preview:database] mockups after upload", {
        mockupKeys: Object.keys(nextMockups),
      });
    }

    console.info("[save-design] started", {
      userProductId: null,
      designId,
      activeSide: body?.side ?? null,
    });

    saveContext.step = "persist-user-product";
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
    saveContext.userProductId = userProduct.id;
    const persistedMockups = normalizeMockupsRecord(userProduct.mockups);
    console.info("[checkout-preview:save-api] user_product update completed", {
      userProductId: userProduct.id,
      mockupKeys: Object.keys(persistedMockups),
      designImageUrl: shortUrl("design_image_url", userProduct.design_image_url),
    });
    console.info("[checkout-preview:database] persisted mockup keys", {
      userProductId: userProduct.id,
      keys: Object.keys(persistedMockups),
    });
    console.info("[checkout-preview:database] persisted front exists", {
      userProductId: userProduct.id,
      exists: Boolean(persistedMockups.front),
      front: shortUrl("front", persistedMockups.front),
    });
    console.info("[checkout-preview:database] persisted back exists", {
      userProductId: userProduct.id,
      exists: Boolean(persistedMockups.back),
      back: shortUrl("back", persistedMockups.back),
    });

    const currentDesignData = userProduct.design_data && typeof userProduct.design_data === "object"
      ? userProduct.design_data
      : {};
    const currentPrintFiles = userProduct.print_files && typeof userProduct.print_files === "object"
      ? userProduct.print_files
      : {};

    const savedFrontElements = (currentDesignData as Record<string, any>)?.sides?.front?.elements;
    const savedBackElements = (currentDesignData as Record<string, any>)?.sides?.back?.elements;
    const selectedSides = resolveSavedDesignSides({
      frontElements: savedFrontElements,
      backElements: savedBackElements,
    });
    console.log("[save-design] side detection", {
      frontHasDesign: selectedSides.includes("front"),
      backHasDesign: selectedSides.includes("back"),
      frontElementsCount: normalizeSavedElements(savedFrontElements).length,
      backElementsCount: normalizeSavedElements(savedBackElements).length,
      selectedSides,
    });

    console.info("[save-design] record persisted", {
      userProductId: userProduct.id,
      designId,
    });

    saveContext.step = "queue-assets";
    const backgroundJobs = await queueDesignAssetJobs({
      userProductId: userProduct.id,
      designData: userProduct.design_data,
      designFront: userProduct.design_front,
      designBack: userProduct.design_back,
    });

    if (backgroundJobs?.queued) {
      saveContext.step = "persist-job-state";
      const requestedAt = new Date().toISOString();
      const nextDesignData = {
        ...currentDesignData,
        printFileStatus: "processing",
        printFileRequestedAt: requestedAt,
        printFileRunId: backgroundJobs.printFileRunId ?? currentDesignData?.printFileRunId ?? null,
        production: {
          ...(currentDesignData as Record<string, any>).production || {},
          jobs: {
            ...((currentDesignData as Record<string, any>).production?.jobs || {}),
            printFile: {
              ...((currentDesignData as Record<string, any>).production?.jobs?.printFile || {}),
              status: "processing",
              requestedAt,
              runId: backgroundJobs.printFileRunId ?? null,
            },
          },
        },
      };
      const nextPrintFiles = {
        ...currentPrintFiles,
        status: backgroundJobs.printFileRunId ? "processing" : currentPrintFiles?.status ?? "pending",
        requested_at: backgroundJobs.printFileRunId ? requestedAt : currentPrintFiles?.requested_at ?? null,
        run_id: backgroundJobs.printFileRunId ?? currentPrintFiles?.run_id ?? null,
      };
      const nextMockups = normalizeMockupsRecord(userProduct.mockups);
      const persistedMockups = Object.fromEntries(
        Object.entries(nextMockups).filter(([, value]) => value !== null && value !== undefined && value !== ""),
      );

      console.info("[checkout-preview:database] persisted mockup keys", {
        userProductId: userProduct.id,
        keys: Object.keys(persistedMockups),
      });

      const { error: jobStateError } = await supabase
        .from("user_products")
        .update({
          design_data: nextDesignData,
          print_files: nextPrintFiles,
          mockups: Object.keys(persistedMockups).length ? persistedMockups : undefined,
        })
        .eq("id", userProduct.id);

      if (jobStateError) {
        throw new Error(`Failed to persist background job state: ${jobStateError.message}`);
      }
    }

    const shouldAddToCart = body.addToCart !== false;
    let cartItem = null;
    let cartMode: "extended" | "basic" | null = null;

    if (shouldAddToCart) {
      saveContext.step = "cart";
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
    console.error("[save-design] failed", {
      step: saveContext.step,
      userProductId: saveContext.userProductId,
      designId: saveContext.designId,
      error: error instanceof Error ? error.message : error,
    });
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
