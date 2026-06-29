import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const noindexRoutes = ["/admin", "/dashboard", "/settings", "/profile"];

function applySeoHeaders(res: NextResponse, pathname: string) {
  const shouldNoindex = noindexRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (shouldNoindex) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname === "/dashboard/design" ||
    pathname.startsWith("/dashboard/design/") ||
    pathname === "/dashboard/create" ||
    pathname.startsWith("/dashboard/create/")
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

let user = null;

try {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  user = authUser;
} catch (error: any) {
  if (error?.code === "refresh_token_not_found") {
    const cleanRes = NextResponse.redirect(new URL("/login", req.url));

    req.cookies.getAll().forEach((cookie) => {
      if (cookie.name.includes("supabase") || cookie.name.includes("sb-")) {
        cleanRes.cookies.delete(cookie.name);
      }
    });

    return applySeoHeaders(cleanRes, pathname);
  }

  throw error;
}

  const protectedRoutes = ["/dashboard", "/admin", "/settings", "/profile"];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname + search);

    return applySeoHeaders(NextResponse.redirect(loginUrl), pathname);
  }

  if ((pathname === "/login" || pathname === "/signup") && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!user) {
      return applySeoHeaders(
        NextResponse.redirect(new URL("/login", req.url)),
        pathname
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return applySeoHeaders(
        NextResponse.redirect(new URL("/dashboard", req.url)),
        pathname
      );
    }
  }

  return applySeoHeaders(res, pathname);
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/auth/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/settings/:path*",
    "/profile/:path*",
  ],
};