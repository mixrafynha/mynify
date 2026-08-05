import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "pub-32be62cb2f1f47048c590acdfa322022.r2.dev",
]);

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  if (sourceUrl.protocol !== "https:" || !ALLOWED_HOSTS.has(sourceUrl.hostname)) {
    return NextResponse.json({ error: "Image host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*" },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream image returned ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ error: "Upstream content is not an image" }, { status: 415 });
    }

    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength === 0) {
      return NextResponse.json({ error: "Upstream image is empty" }, { status: 502 });
    }

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Image proxy failed" },
      { status: 502 },
    );
  }
}
