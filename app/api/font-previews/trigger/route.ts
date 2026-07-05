import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type FontPreviewPayload = {
  fontId?: string;
  family?: string;
  category?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FontPreviewPayload;
    const fontId = String(body.fontId || "").trim();

    if (!fontId) {
      return NextResponse.json({ ok: false, error: "Missing fontId" }, { status: 400 });
    }

    await tasks.trigger("generate-font-preview", {
      fontId,
      family: body.family ?? null,
      category: body.category ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("font preview trigger failed", error);
    return NextResponse.json({ ok: false, error: "Failed to trigger font preview" }, { status: 500 });
  }
}
