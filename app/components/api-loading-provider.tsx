"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Loading, { getLoadingSubtitle, getLoadingText } from "@/app/loading";

const LOADING_API_ROUTES = [
  "/api/products",
  "/api/products/",
  "/api/product-colors",
  "/api/product-variants",
  "/api/profiles",
  "/api/settings",
  "/api/orders",
  "/api/contact",
  "/api/dashboard",
  "/api/admin/",
];

const EXCLUDED_LOADING_ROUTES = ["/api/ai-image"];

function getPathname(url: string) {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}

function shouldShowLoading(url: string) {
  const pathname = getPathname(url);

  if (EXCLUDED_LOADING_ROUTES.some((route) => pathname.startsWith(route))) {
    return false;
  }

  return LOADING_API_ROUTES.some((route) => pathname.startsWith(route));
}

function getLoadingCopy(input: RequestInfo | URL, init?: RequestInit) {
  const method = String(init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const pathname = getPathname(url).toLowerCase();

  if (pathname.startsWith("/api/user-products/save-design")) {
    return { label: "Saving design", subtitle: "Syncing your artwork" };
  }

  if (pathname.startsWith("/api/designs/save")) {
    return { label: "Saving design", subtitle: "Keeping your work safe" };
  }

  if (pathname.startsWith("/api/checkout/draft-order")) {
    return { label: "Preparing checkout", subtitle: "Checking your order" };
  }

  if (pathname.startsWith("/api/checkout")) {
    return { label: "Processing checkout", subtitle: "Finalizing your order" };
  }

  if (pathname.startsWith("/api/cart") && method === "POST") {
    return { label: "Updating cart", subtitle: "Saving your cart changes" };
  }

  if (pathname.startsWith("/api/cart")) {
    return { label: "Loading cart", subtitle: "Fetching your items" };
  }

  if (pathname.startsWith("/api/products")) {
    return { label: "Loading products", subtitle: "Fetching catalog data" };
  }

  if (pathname.startsWith("/api/profiles")) {
    return { label: "Loading profile", subtitle: "Syncing account data" };
  }

  if (pathname.startsWith("/api/settings")) {
    return { label: "Saving settings", subtitle: "Updating preferences" };
  }

  if (pathname.startsWith("/api/orders")) {
    return { label: "Loading orders", subtitle: "Fetching your history" };
  }

  if (pathname.startsWith("/api/admin/gelato-sync/family/process")) {
    return { label: "Processing sync", subtitle: "Running family sync" };
  }

  if (pathname.startsWith("/api/admin/gelato-sync/family/start")) {
    return { label: "Starting sync", subtitle: "Queueing gelato work" };
  }

  if (pathname.startsWith("/api/admin/")) {
    return { label: "Loading admin", subtitle: "Fetching workspace data" };
  }

  if (pathname.startsWith("/api/contact")) {
    return { label: "Loading contact", subtitle: "Fetching contact content" };
  }

  return { label: "Loading", subtitle: "Please wait" };
}

export default function ApiLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const [booted, setBooted] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [loadingCopy, setLoadingCopy] = useState({ label: "Loading", subtitle: "Please wait" });
  const activeRequestsRef = useRef(0);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPathnameRef = useRef(pathname);
  const routeLoadingActiveRef = useRef(false);

  useEffect(() => {
    const bootTimer = window.setTimeout(() => {
      setBooted(true);
    }, 120);

    const originalFetch = window.fetch;

    const clearLoadingTimer = () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };

    const clearRouteTimer = () => {
      if (routeTimerRef.current) {
        clearTimeout(routeTimerRef.current);
        routeTimerRef.current = null;
      }
    };

    const scheduleLoading = () => {
      if (loadingTimerRef.current || activeRequestsRef.current > 0 || routeLoadingActiveRef.current) return;

      loadingTimerRef.current = setTimeout(() => {
        loadingTimerRef.current = null;
        if (activeRequestsRef.current > 0 || routeLoadingActiveRef.current) {
          setShowLoading(true);
        }
      }, 60);
    };

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

      if (activeRequestsRef.current === 0) {
        setLoadingCopy(getLoadingCopy(input, init));
      }

      activeRequestsRef.current += 1;
      if (activeRequestsRef.current === 1) scheduleLoading();

      try {
        return await originalFetch(input, init);
      } finally {
        activeRequestsRef.current = Math.max(activeRequestsRef.current - 1, 0);

        if (activeRequestsRef.current === 0) {
          clearLoadingTimer();
          setShowLoading(false);
          setLoadingCopy({ label: "Loading", subtitle: "Please wait" });
        }
      }
    };

    return () => {
      window.clearTimeout(bootTimer);
      clearLoadingTimer();
      clearRouteTimer();
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) return;

    previousPathnameRef.current = pathname;
    routeLoadingActiveRef.current = true;
    setLoadingCopy({ label: getLoadingText(pathname), subtitle: getLoadingSubtitle(pathname) });
    setShowLoading(true);

    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
    }

    routeTimerRef.current = setTimeout(() => {
      routeTimerRef.current = null;
      routeLoadingActiveRef.current = false;

      if (activeRequestsRef.current === 0) {
        setShowLoading(false);
        setLoadingCopy({ label: "Loading", subtitle: "Please wait" });
      }
    }, 420);

    return () => {
      if (routeTimerRef.current) {
        clearTimeout(routeTimerRef.current);
        routeTimerRef.current = null;
      }
    };
  }, [pathname]);

  return (
    <>
      {children}
      {booted && showLoading && (
        <Loading pathname={pathname} label={loadingCopy.label} subtitle={loadingCopy.subtitle} />
      )}
    </>
  );
}
