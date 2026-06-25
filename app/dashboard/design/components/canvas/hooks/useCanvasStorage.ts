"use client";

import { useEffect, useRef } from "react";

export function useCanvasStorage({
  storageKey,
  elements,
  setElements,
  safeArea,
  centerElementInSafeArea,
}: any) {
  const initializedRef = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setElements(parsed, { record: false });
          knownIdsRef.current = new Set(parsed.map((el: any) => el.id));
        }
      } else {
        knownIdsRef.current = new Set((Array.isArray(elements) ? elements : []).map((el: any) => el.id));
      }
    } catch {
      knownIdsRef.current = new Set((Array.isArray(elements) ? elements : []).map((el: any) => el.id));
    } finally {
      initializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!initializedRef.current || !Array.isArray(elements)) return;

    const hasNew = elements.some((el: any) => !knownIdsRef.current.has(el.id));
    if (!hasNew) return;

    setElements(
      (prev: any[]) =>
        (Array.isArray(prev) ? prev : []).map((el) => {
          if (knownIdsRef.current.has(el.id)) return el;
          knownIdsRef.current.add(el.id);

          return centerElementInSafeArea(
            {
              ...el,
              x: undefined,
              y: undefined,
              height: el.type === "text" ? undefined : el.height,
              meta: {
                ...(el.meta || {}),
                lineHeight: el.type === "text" ? el.meta?.lineHeight || 1.16 : el.meta?.lineHeight,
                insertedYOffset: 0,
              },
            },
            safeArea
          );
        }),
      { record: false }
    );
  }, [centerElementInSafeArea, elements, safeArea, setElements]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(() => {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(elements || []));
      } catch {}
    }, 180);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [storageKey, elements]);
}
