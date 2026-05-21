"use client";

import { useEffect, useState } from "react";
import Loading from "@/app/loading";

const LOADING_API_ROUTES = [
  "/api/products/by-type",
  "/api/profiles",
   "/api/contact",
   "/api/dashboard",
   "/api/product",
  // adiciona só as que quiseres
];
const EXCLUDED_LOADING_ROUTES = [
  "/api/ai-image",
  
];

function shouldShowLoading(url: string) {
  return LOADING_API_ROUTES.some((route) => url.includes(route));
}

export default function ApiLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeRequests, setActiveRequests] = useState(0);

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

  return (
    <>
      {children}
      {activeRequests > 0 && <Loading />}
    </>
  );
}
