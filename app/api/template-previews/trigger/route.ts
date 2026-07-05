import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TemplatePreviewPayload = {
  templateId?: string;
  label?: string;
  category?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TemplatePreviewPayload;
    const templateId = String(body.templateId || "").trim();

    if (!templateId) {
      return NextResponse.json({ ok: false, error: "Missing templateId" }, { status: 400 });
    }

    await tasks.trigger("generate-template-preview", {
      templateId,
      label: body.label ?? null,
      category: body.category ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("template preview trigger failed", error);
    return NextResponse.json({ ok: false, error: "Failed to trigger template preview" }, { status: 500 });
  }
}
