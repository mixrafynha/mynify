"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";

type MobilePanelFrameProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  defaultHeight?: number;
};

const MIN_HEIGHT = 22;
const MAX_HEIGHT = 54;
const DEFAULT_HEIGHT = 32;

function clamp(value: number, min = MIN_HEIGHT, max = MAX_HEIGHT) {
  return Math.max(min, Math.min(max, value));
}

function readHeight(id?: string, fallback = DEFAULT_HEIGHT) {
  if (typeof window === "undefined" || !id) return fallback;
  const raw = window.localStorage.getItem(`ryfio-mobile-panel-height:${id}`);
  const value = raw ? Number(raw) : fallback;
  return Number.isFinite(value) ? clamp(value) : fallback;
}

export default function MobilePanelFrame({ id = "panel", children, className = "", defaultHeight = DEFAULT_HEIGHT }: MobilePanelFrameProps) {
  const [height, setHeight] = useState(() => readHeight(id, defaultHeight));
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const style = useMemo(() => ({ "--mobile-panel-height": `${height}dvh` } as CSSProperties), [height]);

  const saveHeight = (next: number) => {
    const value = clamp(next);
    setHeight(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`ryfio-mobile-panel-height:${id}`, String(value));
    }
  };

  return (
    <div className={`min-h-0 ${className}`} style={style} data-mobile-panel-frame="true">
      <div
        className="md:hidden sticky top-0 z-30 -mx-1 mb-1 flex h-4 touch-none select-none items-center justify-center rounded-t-lg bg-[#070817] active:cursor-grabbing"
        role="slider"
        aria-label="Resize panel"
        aria-valuemin={MIN_HEIGHT}
        aria-valuemax={MAX_HEIGHT}
        aria-valuenow={Math.round(height)}
        tabIndex={0}
        onPointerDown={(event) => {
          dragRef.current = { startY: event.clientY, startHeight: height };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return;
          const delta = dragRef.current.startY - event.clientY;
          const vh = typeof window === "undefined" ? 800 : Math.max(window.innerHeight, 1);
          saveHeight(dragRef.current.startHeight + (delta / vh) * 100);
        }}
        onPointerUp={(event) => {
          dragRef.current = null;
          try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
        }}
        onPointerCancel={() => { dragRef.current = null; }}
        onDoubleClick={() => saveHeight(DEFAULT_HEIGHT)}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") saveHeight(height + 4);
          if (event.key === "ArrowDown") saveHeight(height - 4);
          if (event.key === "Home") saveHeight(MIN_HEIGHT);
          if (event.key === "End") saveHeight(MAX_HEIGHT);
        }}
      >
        <span className="h-1 w-7 rounded-full bg-violet-300/45" />
      </div>
      <div className="max-h-[var(--mobile-panel-height)] overflow-y-auto overscroll-contain pr-0.5 md:max-h-none md:overflow-visible [content-visibility:auto] [contain-intrinsic-size:300px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}
