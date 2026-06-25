"use client";

import { useCallback, useRef, useState } from "react";

export function useCanvasPan() {
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const startPan = useCallback(
    (e: React.PointerEvent) => {
      const isMiddleMouse = e.button === 1;
      const isSpaceDrag = e.button === 0 && (e.nativeEvent as any).shiftKey;
      const isTrackpadLike = e.pointerType === "mouse" && e.button === 0 && e.altKey;

      if (!isMiddleMouse && !isSpaceDrag && !isTrackpadLike) return;

      e.preventDefault();
      e.stopPropagation();

      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: panOffset.x,
        panY: panOffset.y,
      };
    },
    [panOffset.x, panOffset.y]
  );

  const onPanMove = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!panStartRef.current) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (!panStartRef.current) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      setPanOffset({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    });
  }, []);

  const endPan = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    panStartRef.current = null;
  }, []);

  const resetPan = useCallback(() => {
    setPanOffset({ x: 0, y: 0 });
  }, []);

  return { panOffset, startPan, onPanMove, endPan, resetPan };
}
