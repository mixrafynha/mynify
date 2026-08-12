"use client";

import { useSyncExternalStore } from "react";

export function useIsMobile() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};

      const media = window.matchMedia("(max-width: 767px)");
      const handler = () => onStoreChange();

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handler);
        return () => media.removeEventListener("change", handler);
      }

      media.addListener(handler);
      return () => media.removeListener(handler);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false
  );
}
