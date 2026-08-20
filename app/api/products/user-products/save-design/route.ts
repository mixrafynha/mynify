import { NextResponse } from "next/server";
import { POST as saveDesign } from "@/app/api/user-products/save-design/route";
import {
  parseBoundedJsonBody,
  readBoundedRequestBody,
  RequestBodyTooLargeError,
} from "@/lib/server/bounded-request-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 12 * 1024 * 1024;

// Preserve the legacy response contract while routing every mutation through
// the same authenticated, ownership-checked, server-owned save implementation.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    const rawBody = await readBoundedRequestBody(req, MAX_BODY_BYTES);
    const parsed: unknown = parseBoundedJsonBody(rawBody);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    body = parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: "Request body too large" }, { status: 413 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const headers = new Headers(req.headers);
  headers.delete("content-length");
  headers.set("content-type", "application/json");
  const forwardedBody = JSON.stringify({ ...body, addToCart: false });
  if (Buffer.byteLength(forwardedBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }
  const forwarded = new Request(req.url, {
    method: "POST",
    headers,
    body: forwardedBody,
  });
  const response = await saveDesign(forwarded);

  if (!response.ok) return response;

  const payload = await response.json();
  return NextResponse.json({
    ...payload,
    cartItem: null,
    cartMode: null,
    redirectTo: `/cart?designId=${payload.designId}`,
  });
}
