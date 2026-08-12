"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Loading from "@/app/loading";

const LOADING_API_ROUTES = [
  "/api/cart",
  "/api/products",
  "/api/products/",
  "/api/product-colors",
  "/api/product-variants",
  "/api/product-availability",
  "/api/checkout/availability",
  "/api/profiles",
  "/api/settings",
  "/api/orders",
  "/api/Contact",
  "/api/dashboard",
  "/api/admin/",
];

const EXCLUDED_LOADING_ROUTES = [
  "/api/ai-image",
];

const LOADING_PAGE_ROUTES = [
  "/dashboard/product/",
];

function getPathname(url: string) {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

function shouldShowLoading(url: string) {
  const pathname = getPathname(url);

  const isExcluded = EXCLUDED_LOADING_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isExcluded) return false;

  return LOADING_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

function shouldShowPageLoading(pathname: string) {
  return LOADING_PAGE_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
}

export default function ApiLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [activeRequests, setActiveRequests] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (!shouldShowLoading(url)) {
        return originalFetch(input, init);
      }

      setActiveRequests((count) => count + 1);

      try {
        return await originalFetch(input, init);
      } finally {
        setActiveRequests((count) => Math.max(count - 1, 0));
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    setPageLoading(false);
  }, [pathname]);

  useEffect(() => {
    if (!pageLoading) return;

    const timeout = window.setTimeout(() => {
      setPageLoading(false);
    }, 25000);

    return () => window.clearTimeout(timeout);
  }, [pageLoading]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      if (!shouldShowPageLoading(url.pathname)) return;

      setPageLoading(true);
    };

    window.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <>
      {children}
      {(activeRequests > 0 || pageLoading) && <Loading />}
    </>
  );
}
