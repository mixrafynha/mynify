import { NextRequest, NextResponse } from "next/server";
import { fetchSafeRemoteImageBuffer } from "@/lib/server/safe-remote-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  try {
    const image = await fetchSafeRemoteImageBuffer(rawUrl);

    return new NextResponse(new Uint8Array(image.buffer), {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(image.buffer.byteLength),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }
}
