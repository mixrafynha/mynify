import { NextResponse } from "next/server";
import { getAuthenticatedSupabase } from "../auth";
import { uploadBufferToR2 } from "../r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function previewKey(userProductId: string, side: "front" | "back") {
  return `user-products/${userProductId}/mockups/${side}.webp`;
}

function parseMockups(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch (error) {
      console.error("[preview] failed", error);
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseDesignData(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch (error) {
      console.error("[canvas-preview] failed", error);
      return {};
    }
  }

  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function isFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

async function fileToBuffer(file: File | null) {
  if (!file) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.length ? buffer : null;
}

export async function POST(req: Request) {
  try {
    console.info("[mockup-preview] request received");
    const { supabase, user } = await getAuthenticatedSupabase(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const userProductId = String(formData.get("userProductId") || "").trim();

    if (!userProductId) {
      return NextResponse.json({ error: "userProductId is required" }, { status: 400 });
    }

    console.info("[mockup-preview] authenticated", {
      userProductId,
      userId: user.id,
    });
    console.info("[mockup-preview] form parsed", {
      userProductId,
    });

    const { data: userProduct, error: productError } = await supabase
      .from("user_products")
      .select("id, user_id, mockups, design_data")
      .eq("id", userProductId)
      .eq("user_id", user.id)
      .single<{ id: string; user_id: string; mockups: Record<string, unknown> | string | null; design_data: Record<string, unknown> | string | null }>();

    if (productError || !userProduct) {
      console.error("[mockup-preview] user_product lookup failed", productError);
      return NextResponse.json({ error: "Saved design not found" }, { status: 404 });
    }

    const frontEntry = formData.get("front");
    const backEntry = formData.get("back");
    const frontFile = isFile(frontEntry) ? frontEntry : null;
    const backFile = isFile(backEntry) ? backEntry : null;

    if (!frontFile && !backFile) {
      return NextResponse.json({ error: "At least one preview file is required" }, { status: 400 });
    }

    console.info("[mockup-preview] front received", {
      userProductId,
      hasFront: Boolean(frontFile),
      frontType: frontFile?.type ?? null,
      frontSize: frontFile?.size ?? null,
    });

    console.info("[mockup-preview] back received", {
      userProductId,
      hasBack: Boolean(backFile),
      backType: backFile?.type ?? null,
      backSize: backFile?.size ?? null,
    });

    const frontBuffer = await fileToBuffer(frontFile);
    const backBuffer = await fileToBuffer(backFile);

    let frontUpload: { url: string | null; key?: string | null } | null = null;
    let backUpload: { url: string | null; key?: string | null } | null = null;

    if (frontBuffer) {
      try {
        frontUpload = await uploadBufferToR2({
          buffer: frontBuffer,
          contentType: frontFile?.type || "image/webp",
          key: previewKey(userProductId, "front"),
        });
        console.info("[mockup-preview] R2 upload completed", {
          userProductId,
          side: "front",
          frontUrl: frontUpload?.url ?? null,
        });
      } catch (error) {
        console.error("[mockup-preview] front upload failed", error);
        return NextResponse.json({ error: "Front preview upload failed" }, { status: 500 });
      }
    }

    if (backBuffer) {
      try {
        backUpload = await uploadBufferToR2({
          buffer: backBuffer,
          contentType: backFile?.type || "image/webp",
          key: previewKey(userProductId, "back"),
        });
        console.info("[mockup-preview] R2 upload completed", {
          userProductId,
          side: "back",
          backUrl: backUpload?.url ?? null,
        });
      } catch (error) {
        console.error("[mockup-preview] back upload failed", error);
        return NextResponse.json({ error: "Back preview upload failed" }, { status: 500 });
      }
    }

    console.info("[mockup-preview] front uploaded", {
      userProductId,
      frontUrl: frontUpload?.url ?? null,
    });

    console.info("[mockup-preview] back uploaded", {
      userProductId,
      backUrl: backUpload?.url ?? null,
    });

    const currentMockups = parseMockups(userProduct.mockups);
    const currentDesignData = parseDesignData(userProduct.design_data);
    const currentSides =
      currentDesignData.sides && typeof currentDesignData.sides === "object" && !Array.isArray(currentDesignData.sides)
        ? (currentDesignData.sides as Record<string, unknown>)
        : {};
    const currentFront =
      currentSides.front && typeof currentSides.front === "object" && !Array.isArray(currentSides.front)
        ? (currentSides.front as Record<string, unknown>)
        : {};
    const currentBack =
      currentSides.back && typeof currentSides.back === "object" && !Array.isArray(currentSides.back)
        ? (currentSides.back as Record<string, unknown>)
        : {};

    const nextMockups = {
      ...currentMockups,
      ...(frontUpload?.url
        ? { front: frontUpload.url }
        : {}),
      ...(backUpload?.url
        ? { back: backUpload.url }
        : {}),
    };
    const nextDesignData = {
      ...currentDesignData,
      sides: {
        ...currentSides,
        front: {
          ...currentFront,
          ...(frontUpload?.url
            ? {
                mockupUrl: frontUpload.url,
                designImageUrl: frontUpload.url,
              }
            : {}),
        },
        back: {
          ...currentBack,
          ...(backUpload?.url
            ? {
                mockupUrl: backUpload.url,
                designImageUrl: backUpload.url,
              }
            : {}),
        },
      },
    };

    const { data: updated, error: updateError } = await supabase
      .from("user_products")
      .update({
        mockups: nextMockups,
        design_data: nextDesignData,
        ...(frontUpload?.url ? { design_image_url: frontUpload.url } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userProductId)
      .eq("user_id", user.id)
      .select("id, mockups, design_data")
      .single<{ id: string; mockups: Record<string, unknown> | string | null; design_data: Record<string, unknown> | string | null }>();

    if (updateError || !updated) {
      console.error("[mockup-preview] user_product update failed", updateError);
      return NextResponse.json({ error: "Preview persistence failed" }, { status: 500 });
    }

    console.info("[mockup-preview] Supabase update completed", {
      userProductId,
      frontUrl: frontUpload?.url ?? null,
      backUrl: backUpload?.url ?? null,
    });

    let updatedCartItems = 0;
    if (frontUpload?.url) {
      const { data: updatedCartRows } = await supabase
        .from("cart_items")
        .update({
          image: frontUpload.url,
          mockup_url: frontUpload.url,
        })
        .eq("user_id", user.id)
        .eq("user_product_id", userProductId)
        .select("id");

      updatedCartItems = Array.isArray(updatedCartRows) ? updatedCartRows.length : 0;
    }

    console.info("[mockup-preview] cart_items updated", {
      userProductId,
      cartItemsUpdated: updatedCartItems,
    });

    console.info("[mockup-preview] completed", {
      userProductId,
      front: nextMockups.front ?? null,
      back: nextMockups.back ?? null,
    });

    const responsePayload = {
      success: true,
      frontUrl: frontUpload?.url ?? null,
      backUrl: backUpload?.url ?? null,
      mockups: parseMockups(updated.mockups),
      designData: parseDesignData(updated.design_data),
    };

    console.info("[mockup-preview] response sent", {
      userProductId,
      httpStatus: 200,
      frontUrl: responsePayload.frontUrl,
      backUrl: responsePayload.backUrl,
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("[mockup-preview] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save preview mockups" },
      { status: 500 },
    );
  }
}
