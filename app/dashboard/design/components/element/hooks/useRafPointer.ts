"use client";

import { useCallback, useRef } from "react";

export function useRafPointer() {
  const rafRef = useRef<number | null>(null);

  const clearRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const schedule = useCallback(
    (callback: () => void) => {
      clearRaf();
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        callback();
      });
    },
    [clearRaf]
  );

  return { schedule, clearRaf };
}
