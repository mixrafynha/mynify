import { NextRequest, NextResponse } from "next/server";
import { getDurableRateLimiter, getTrustedRequestIp } from "@/lib/server/rate-limit";
import {
  defaultImageProxyFetch,
  handleImageProxyRequest,
  imageProxyCacheControl,
  imageProxyRateLimitConfig,
} from "./security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const imageProxyRateLimiter = getDurableRateLimiter(imageProxyRateLimitConfig());

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url")?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  const result = await handleImageProxyRequest(request, rawUrl, {
    fetchImage: defaultImageProxyFetch,
    rateLimit: (identifier) => imageProxyRateLimiter.limit(identifier),
    requestIp: getTrustedRequestIp,
    now: Date.now,
  });

  if (result.ok) {
    const image = result.image;
    return new NextResponse(new Uint8Array(image.buffer), {
      status: 200,
      headers: {
        "Content-Type": image.contentType,
        "Cache-Control": imageProxyCacheControl(),
        "Content-Length": String(image.buffer.byteLength),
        "X-Ryfio-Image-Proxy-Cache": result.cacheStatus,
      },
    });
  }

  return NextResponse.json(result.body, { status: result.status });
}
