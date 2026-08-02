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
    } catch {
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
      .select("id, user_id, mockups")
      .eq("id", userProductId)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string; user_id: string; mockups: Record<string, unknown> | string | null }>();

    if (productError || !userProduct) {
      return NextResponse.json({ error: "Saved design not found" }, { status: 404 });
    }

    const frontBuffer = await fileToBuffer(formData.get("front") as File | null);
    if (!frontBuffer) {
      return NextResponse.json({ error: "front preview is required" }, { status: 400 });
    }

    const backBuffer = await fileToBuffer(formData.get("back") as File | null);

    let frontUpload;
    let backUpload = null;

    try {
      frontUpload = await uploadBufferToR2({
        buffer: frontBuffer,
        contentType: "image/webp",
        key: previewKey(userProductId, "front"),
      });
    } catch (error) {
      console.error("[editor-preview] Front upload failed", error);
      return NextResponse.json({ error: "Front preview upload failed" }, { status: 500 });
    }

    if (backBuffer) {
      try {
        backUpload = await uploadBufferToR2({
          buffer: backBuffer,
          contentType: "image/webp",
          key: previewKey(userProductId, "back"),
        });
      } catch (error) {
        console.error("[editor-preview] Back upload failed", error);
        return NextResponse.json({ error: "Back preview upload failed" }, { status: 500 });
      }
    }

    const currentMockups = parseMockups(userProduct.mockups);
    const nextMockups = {
      ...currentMockups,
      front: frontUpload.url,
      back: backUpload?.url ?? null,
    };

    const { data: updated, error: updateError } = await supabase
      .from("user_products")
      .update({
        mockups: nextMockups,
      })
      .eq("id", userProductId)
      .eq("user_id", user.id)
      .select("id, mockups")
      .single<{ id: string; mockups: Record<string, unknown> | string | null }>();

    if (updateError || !updated) {
      console.error("[editor-preview] mockups update failed", updateError);
      return NextResponse.json({ error: "Preview persistence failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userProductId,
      mockups: parseMockups(updated.mockups),
    });
  } catch (error) {
    console.error("[editor-preview] preview route failed", error);
    return NextResponse.json({ error: "Unable to save preview mockups" }, { status: 500 });
  }
}
