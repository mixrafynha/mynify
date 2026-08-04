import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PreviewFlowDebugPayload = {
  userProductId?: unknown;
  stage?: unknown;
  side?: unknown;
  nodeWidth?: unknown;
  nodeHeight?: unknown;
  blobSize?: unknown;
  blobType?: unknown;
  httpStatus?: unknown;
  error?: unknown;
  timestamp?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as PreviewFlowDebugPayload | null;

    const payload = {
      userProductId: asString(body?.userProductId),
      stage: asString(body?.stage),
      side: asString(body?.side),
      nodeWidth: asNumber(body?.nodeWidth),
      nodeHeight: asNumber(body?.nodeHeight),
      blobSize: asNumber(body?.blobSize),
      blobType: asString(body?.blobType),
      httpStatus: asNumber(body?.httpStatus),
      error: asString(body?.error),
      timestamp: asString(body?.timestamp) || new Date().toISOString(),
    };

    console.info("[debug-preview-flow]", payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[debug-preview-flow] failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
