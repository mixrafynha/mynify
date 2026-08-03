import { task } from "@trigger.dev/sdk/v3";
import { renderCheckoutThumbnailWebp, type DesignSide } from "../shared/design-renderer";
import { uploadR2Object } from "../shared/r2";
import { getServiceSupabase, USER_PRODUCTS_TABLE } from "../shared/supabase";

type Payload = {
  userProductId: string;
  side?: DesignSide;
  sides?: DesignSide[];
};

function parseJsonIfString<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value ?? fallback) as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function ensureDesignData(record: any) {
  const designData = parseJsonIfString<any>(record?.design_data, null);
  if (!designData || typeof designData !== "object") {
    throw new Error(`User product ${record?.id || "unknown"} has no design_data JSON`);
  }
  return designData;
}

function serializeError(error: unknown) {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function withThumbnailState(designData: any, patch: Record<string, unknown>) {
  return {
    ...designData,
    checkout_thumbnail_url:
      typeof patch.url === "string" ? patch.url : designData.checkout_thumbnail_url ?? null,
    checkoutThumbnailStatus: patch.status || designData.checkoutThumbnailStatus,
    backgroundJobs: {
      ...(designData.backgroundJobs || {}),
      checkoutThumbnail: patch.status || designData.backgroundJobs?.checkoutThumbnail,
    },
    production: {
      ...(designData.production || {}),
      jobs: {
        ...(designData.production?.jobs || {}),
        checkoutThumbnail: {
          ...(designData.production?.jobs?.checkoutThumbnail || {}),
          ...patch,
        },
      },
    },
  };
}

function sideUrlPatch(side: DesignSide | undefined, url: string, key: string) {
  if (side === "back") {
    return {
      back: url,
      checkout_thumbnail_back_url: url,
      checkout_thumbnail_back_key: key,
    };
  }

  return {
    front: url,
    checkout_thumbnail_front_url: url,
    checkout_thumbnail_front_key: key,
    checkout_thumbnail_url: url,
    checkout_thumbnail_key: key,
  };
}

function publicString(value: unknown) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}

export const generateCheckoutThumbnail = task({
  id: "generate-checkout-thumbnail",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5_000,
    maxTimeoutInMs: 60_000,
  },
  run: async (payload: Payload) => {
    if (!payload.userProductId) throw new Error("Missing userProductId");

    const sides = payload.sides?.length
      ? payload.sides
      : [payload.side || "front"];
    console.log("[design-assets] received job payload", {
      userProductId: payload.userProductId,
      sides,
    });

    const supabase = getServiceSupabase();
    const { data: record, error } = await supabase
      .from(USER_PRODUCTS_TABLE)
      .select("id, design_data, mockups")
      .eq("id", payload.userProductId)
      .maybeSingle();

    if (error) throw error;
    if (!record) throw new Error(`User product not found: ${payload.userProductId}`);

    const designData = ensureDesignData(record);
    const existingMockups = parseJsonIfString<any>(record?.mockups, {});

    await supabase
      .from(USER_PRODUCTS_TABLE)
      .update({
        design_data: withThumbnailState(designData, {
          status: "processing",
          error: null,
          updatedAt: new Date().toISOString(),
        }),
        mockups: {
          ...existingMockups,
          checkout_thumbnail_status: "processing",
          checkout_thumbnail_error: null,
        },
      })
      .eq("id", payload.userProductId);

    try {
      const sidePatch: Record<string, unknown> = {};
      const generated: Partial<Record<DesignSide, { url: string; key: string }>> = {};
      const sideErrors: Partial<Record<DesignSide, string>> = {};

      for (const side of sides) {
        try {
          const webp = await renderCheckoutThumbnailWebp({ designData, side, size: 1024 });
          const key = `user-products/${payload.userProductId}/checkout-thumbnail-${side}-${Date.now()}.webp`;
          const url = await uploadR2Object({ key, body: webp, contentType: "image/webp" });
          Object.assign(sidePatch, sideUrlPatch(side, url, key));
          generated[side] = { url, key };
        } catch (error) {
          sideErrors[side] = serializeError(error);
        }
      }

      const primary = generated.front || generated.back;
      const failedSides = Object.keys(sideErrors) as DesignSide[];
      const thumbnailStatus = primary
        ? (failedSides.length ? "partial" : "ready")
        : "failed";

      const nextMockups = {
        ...existingMockups,
        ...sidePatch,
        checkout_thumbnail_status: thumbnailStatus,
        checkout_thumbnail_error: failedSides.length ? sideErrors : null,
        checkout_thumbnail_width: 1024,
        checkout_thumbnail_height: 1024,
        checkout_thumbnail_format: "webp",
        updated_at: new Date().toISOString(),
      };

      const nextDesignData = withThumbnailState(designData, {
        status: thumbnailStatus,
        url: generated.front?.url ?? designData.checkout_thumbnail_url ?? existingMockups.checkout_thumbnail_url ?? generated.back?.url ?? null,
        key: primary?.key ?? null,
        width: 1024,
        height: 1024,
        format: "webp",
        sides,
        sideErrors,
        updatedAt: new Date().toISOString(),
        error: failedSides.length ? sideErrors : null,
      });

      const { error: updateError } = await supabase
        .from(USER_PRODUCTS_TABLE)
        .update({
          design_data: nextDesignData,
          mockups: nextMockups,
          ...(primary ? { design_image_url: primary.url } : {}),
        })
        .eq("id", payload.userProductId);

      if (updateError) throw updateError;

      if (primary) {
        const persistedCanvasFront = publicString(existingMockups.front);
        const persistedCanvasBack = publicString(existingMockups.back);
        const preferredCartImage =
          persistedCanvasFront ||
          persistedCanvasBack ||
          primary.url;
        const { error: cartUpdateError } = await supabase
          .from("cart_items")
          .update({ image: preferredCartImage, mockup_url: preferredCartImage })
          .or(`user_product_id.eq.${payload.userProductId},design_id.eq.${payload.userProductId}`);

        if (cartUpdateError) {
          console.warn("CHECKOUT_THUMBNAIL_CART_UPDATE_SKIPPED", cartUpdateError.message);
        }
      }

      if (!primary) {
        throw new Error(failedSides.map((side) => `${side}: ${sideErrors[side]}`).join("; "));
      }

      return { userProductId: payload.userProductId, generated, sideErrors };
    } catch (jobError) {
      const message = serializeError(jobError);
      await supabase
        .from(USER_PRODUCTS_TABLE)
        .update({
          design_data: withThumbnailState(designData, {
            status: "failed",
            error: message,
            updatedAt: new Date().toISOString(),
          }),
          mockups: {
            ...existingMockups,
            checkout_thumbnail_status: "failed",
            checkout_thumbnail_error: message,
            updated_at: new Date().toISOString(),
          },
        })
        .eq("id", payload.userProductId);
      throw jobError;
    }
  },
});
