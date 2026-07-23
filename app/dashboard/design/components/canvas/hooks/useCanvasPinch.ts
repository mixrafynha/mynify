"use client";

import { useCallback, useEffect, useRef } from "react";

function distance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function useCanvasPinch({
  zoom,
  onZoomChange,
  minZoom = 0.4,
  maxZoom = 2,
  onZoomEnd,
}: {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  onZoomEnd?: (zoom: number) => void;
}) {
  const rafRef = useRef<number | null>(null);
  const pointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const lastZoomRef = useRef(zoom);

  useEffect(() => {
    if (!pinchRef.current) lastZoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    pointersRef.current.clear();
    pinchRef.current = null;
  }, []);

  const isMobileTouch = useCallback((e: React.PointerEvent) => {
    return e.pointerType === "touch" && typeof window !== "undefined" && window.innerWidth < 1024;
  }, []);

  const handlePinchDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isMobileTouch(e)) return;

      pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

      if (pointersRef.current.size === 2) {
        const [a, b] = Array.from(pointersRef.current.values());
        pinchRef.current = { distance: distance(a, b), zoom };
      }
    },
    [isMobileTouch, zoom]
  );

  const handlePinchMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;

      pointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
      if (pointersRef.current.size !== 2 || !pinchRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!pinchRef.current || pointersRef.current.size !== 2) return;
        const points = pointersRef.current.values();
        const a = points.next().value;
        const b = points.next().value;
        if (!a || !b) return;
        const ratio = distance(a, b) / Math.max(1, pinchRef.current.distance);
        const nextZoom = clamp(pinchRef.current.zoom * ratio, minZoom, maxZoom);
        lastZoomRef.current = nextZoom;
        onZoomChange(nextZoom);
      });
    },
    [maxZoom, minZoom, onZoomChange]
  );

  const handlePinchEnd = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2 && pinchRef.current) {
      pinchRef.current = null;
      onZoomEnd?.(lastZoomRef.current);
    }
  }, [onZoomEnd]);

  return { handlePinchDown, handlePinchMove, handlePinchEnd };
}
