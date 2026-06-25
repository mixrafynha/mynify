"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

export interface GuideConfig {
  showVertical?: boolean;
  showHorizontal?: boolean;
  verticalPosition?: number;
  horizontalPosition?: number;
}

type Props = {
  logicalWidth: number;
  logicalHeight: number;
};

function finite(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number) {
  const safeMin = finite(min, 0);
  const safeMax = Math.max(safeMin, finite(max, safeMin));
  return Math.min(Math.max(finite(value, safeMin), safeMin), safeMax);
}

function CanvasGuides({ logicalWidth, logicalHeight }: Props) {
  const [guides, setGuides] = useState<GuideConfig | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<GuideConfig>).detail;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!detail || (!detail.showVertical && !detail.showHorizontal)) {
        setGuides(null);
        return;
      }

      setGuides(detail);
      timeoutRef.current = setTimeout(() => setGuides(null), 260);
    };

    window.addEventListener("guides", handler);

    return () => {
      window.removeEventListener("guides", handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const safeWidth = Math.max(1, finite(logicalWidth, 1));
  const safeHeight = Math.max(1, finite(logicalHeight, 1));

  const positions = useMemo(() => {
    if (!guides) return null;

    const vertical =
      guides.showVertical && guides.verticalPosition !== undefined
        ? (clamp(guides.verticalPosition, 0, safeWidth) / safeWidth) * 100
        : null;

    const horizontal =
      guides.showHorizontal && guides.horizontalPosition !== undefined
        ? (clamp(guides.horizontalPosition, 0, safeHeight) / safeHeight) * 100
        : null;

    return { vertical, horizontal };
  }, [guides, safeHeight, safeWidth]);

  if (!positions) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 999 }}
    >
      {positions.vertical !== null && (
        <div
          className="absolute top-0 h-full"
          style={{
            left: `${positions.vertical}%`,
            width: 0,
            borderLeft: "1.5px dashed #06b6d4",
            transform: "translateX(-0.75px)",
          }}
        />
      )}

      {positions.horizontal !== null && (
        <div
          className="absolute left-0 w-full"
          style={{
            top: `${positions.horizontal}%`,
            height: 0,
            borderTop: "1.5px dashed #06b6d4",
            transform: "translateY(-0.75px)",
          }}
        />
      )}
    </div>
  );
}

export default memo(CanvasGuides);
