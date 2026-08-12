"use client";

import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const check = () => setIsMobile(media.matches);

    check();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", check);
      return () => media.removeEventListener("change", check);
    }

    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}
