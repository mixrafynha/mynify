"use client";

import { useEffect, useState } from "react";
import Loading from "@/app/loading";

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

      const isApiRequest =
        url.startsWith("/api") ||
        url.includes("/api/") ||
        url.includes("/app/api/");

      if (!isApiRequest) {
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