import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { uploadBufferToR2 } from "../r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function previewKey(userProductId: string, side: "front" | "back") {
  return `user-products/${userProductId}/preview/${side}.webp`;
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

async function fileToBuffer(file: File | null) {
  if (!file) return null;
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.length ? buffer : null;
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const userProductId = String(formData.get("userProductId") || "").trim();

    if (!userProductId) {
      return NextResponse.json({ error: "userProductId is required" }, { status: 400 });
    }

    const { data: userProduct, error: productError } = await supabase
      .from("user_products")
      .select("id, user_id, mockups, design_data")
      .eq("id", userProductId)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string; user_id: string; mockups: Record<string, unknown> | string | null; design_data: Record<string, unknown> | string | null }>();

    if (productError || !userProduct) {
      return NextResponse.json({ error: "Saved design not found" }, { status: 404 });
    }

    const frontBuffer = await fileToBuffer(formData.get("front") as File | null);
    if (!frontBuffer) {
      return NextResponse.json({ error: "front preview is required" }, { status: 400 });
    }

    const backBuffer = await fileToBuffer(formData.get("back") as File | null);
    const sides = backBuffer ? ["front", "back"] : ["front"];

    let frontUpload;
    let backUpload = null;

    try {
      console.info("[canvas-preview] capture started", {
        userProductId,
        side: "front",
      });
      frontUpload = await uploadBufferToR2({
        buffer: frontBuffer,
        contentType: "image/webp",
        key: previewKey(userProductId, "front"),
      });
    } catch (error) {
      console.error("[canvas-preview] failed", error);
      return NextResponse.json({ error: "Front preview upload failed" }, { status: 500 });
    }
    console.info("[canvas-preview] capture completed", {
      userProductId,
      side: "front",
      hasBlob: true,
      blobSize: frontBuffer.length,
    });
    console.info("[canvas-preview] uploaded", {
      userProductId,
      side: "front",
      url: frontUpload.url,
    });

    if (backBuffer) {
      try {
        console.info("[canvas-preview] capture started", {
          userProductId,
          side: "back",
        });
        backUpload = await uploadBufferToR2({
          buffer: backBuffer,
          contentType: "image/webp",
          key: previewKey(userProductId, "back"),
        });
      } catch (error) {
        console.error("[canvas-preview] failed", error);
        return NextResponse.json({ error: "Back preview upload failed" }, { status: 500 });
      }
      console.info("[canvas-preview] capture completed", {
        userProductId,
        side: "back",
        hasBlob: true,
        blobSize: backBuffer.length,
      });
      console.info("[canvas-preview] uploaded", {
        userProductId,
        side: "back",
        url: backUpload.url,
      });
    }

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
      front: frontUpload.url,
      ...(backUpload?.url ? { back: backUpload.url } : {}),
    };
    const nextDesignData = {
      ...currentDesignData,
      sides: {
        ...currentSides,
        front: {
          ...currentFront,
          mockupUrl: frontUpload.url,
        },
        back: {
          ...currentBack,
          ...(backUpload?.url ? { mockupUrl: backUpload.url } : {}),
        },
      },
    };

    const { data: updated, error: updateError } = await supabase
      .from("user_products")
      .update({
        mockups: nextMockups,
        design_data: nextDesignData,
      })
      .eq("id", userProductId)
      .eq("user_id", user.id)
      .select("id, mockups, design_data")
      .single<{ id: string; mockups: Record<string, unknown> | string | null; design_data: Record<string, unknown> | string | null }>();

    if (updateError || !updated) {
      console.error("[canvas-preview] failed", updateError);
      return NextResponse.json({ error: "Preview persistence failed" }, { status: 500 });
    }

    if (frontUpload.url) {
      await supabase
        .from("cart_items")
        .update({
          image: frontUpload.url,
          mockup_url: frontUpload.url,
        })
        .or(`user_product_id.eq.${userProductId},design_id.eq.${userProductId}`);
    }

    console.info("[canvas-preview] persisted", {
      userProductId,
      front: nextMockups.front ?? null,
      back: nextMockups.back ?? null,
    });

    return NextResponse.json({
      success: true,
      userProductId,
      mockups: parseMockups(updated.mockups),
      designData: parseDesignData(updated.design_data),
    });
  } catch (error) {
    console.error("[canvas-preview] failed", error);
    return NextResponse.json({ error: "Unable to save preview mockups" }, { status: 500 });
  }
}
