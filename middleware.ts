import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv();

const strictLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
});

const aiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

const adminLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
});

const noindexRoutes = ["/admin", "/dashboard", "/settings", "/profile"];

function getIp(req: NextRequest) {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function checkRateLimit(req: NextRequest, pathname: string) {
  const ip = getIp(req);

  if (pathname.startsWith("/api/ai-image")) {
    return aiLimiter.limit(`ai:${ip}`);
  }

  const strictRoutes = [
    "/login",
    "/signup",
    "/api/contact",
    "/api/checkout",
    "/api/select",
  ];

  const isStrict = strictRoutes.some((route) => pathname.startsWith(route));

  if (isStrict) {
    return strictLimiter.limit(`strict:${ip}:${pathname}`);
  }

  if (pathname.startsWith("/admin")) {
    return adminLimiter.limit(`admin:${ip}`);
  }

  return { success: true };
}

function applySeoHeaders(res: NextResponse, pathname: string) {
  const shouldNoindex = noindexRoutes.some((route) => pathname.startsWith(route));

  if (shouldNoindex) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const rateLimit = await checkRateLimit(req, pathname);

  if (!rateLimit.success) {
    return new NextResponse("Too many requests", {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  if (
    pathname === "/dashboard/design" ||
    pathname.startsWith("/dashboard/design/")
  ) {
    return applySeoHeaders(NextResponse.next(), pathname);
  }

  let res = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });

          res = NextResponse.next({
            request: req,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedRoutes = ["/dashboard", "/admin", "/settings", "/profile"];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);

    return applySeoHeaders(NextResponse.redirect(loginUrl), pathname);
  }

  if (pathname === "/login" && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return applySeoHeaders(NextResponse.redirect(new URL("/login", req.url)), pathname);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return applySeoHeaders(NextResponse.redirect(new URL("/dashboard", req.url)), pathname);
    }
  }

  return applySeoHeaders(res, pathname);
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/profile/:path*",
    "/api/contact/:path*",
    "/api/checkout/:path*",
    "/api/select/:path*",
    "/api/ai-image/:path*",
  ],
};
