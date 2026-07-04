import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
  buildR2DesignKey,
  dataUrlToBuffer,
  isDataImage,
  type DesignSide,
} from "../image-utils";
import { uploadBufferToR2 } from "../r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sideValue(value: unknown): DesignSide {
  return value === "back" ? "back" : "front";
}

function safeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const dataUrl = body.dataUrl;

    if (!isDataImage(dataUrl)) {
      return NextResponse.json({ error: "Invalid production image" }, { status: 400 });
    }

    const side = sideValue(body.side);
    const designId = safeString(body.designId) || crypto.randomUUID();
    const { buffer, mimeType, extension, byteLength } = dataUrlToBuffer(dataUrl);
    const key = buildR2DesignKey({
      userId: user.id,
      designId,
      kind: "print",
      side,
      extension,
    });

    const uploaded = await uploadBufferToR2({
      key,
      buffer,
      contentType: mimeType,
    });

    return NextResponse.json({
      success: true,
      url: uploaded.url,
      fileUrl: uploaded.url,
      publicUrl: uploaded.url,
      key: uploaded.key,
      sizeBytes: byteLength,
    });
  } catch (error) {
    console.error("UPLOAD_PRODUCTION_FILE_ERROR", error);
    return NextResponse.json({ error: "Failed to upload production file" }, { status: 500 });
  }
}
