"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

type MobilePanelShellProps = {
  title?: string;
  open?: boolean;
  onClose?: () => void;
  children: ReactNode;
  minHeight?: number;
  defaultHeight?: number;
  maxHeight?: number;
};

export default function MobilePanelShell({
  title,
  open = true,
  onClose,
  children,
  minHeight = 180,
  defaultHeight = 280,
  maxHeight,
}: MobilePanelShellProps) {
  const fallbackMax = typeof window !== "undefined" ? Math.round(window.innerHeight * 0.78) : 560;
  const safeMax = maxHeight ?? fallbackMax;
  const [height, setHeight] = useState(() => Math.min(defaultHeight, safeMax));
  const startY = useRef(0);
  const startHeight = useRef(height);

  const clamp = useCallback((value: number) => Math.max(minHeight, Math.min(safeMax, value)), [minHeight, safeMax]);

  const startDrag = useCallback((clientY: number) => {
    startY.current = clientY;
    startHeight.current = height;
  }, [height]);

  const moveDrag = useCallback((clientY: number) => {
    const delta = startY.current - clientY;
    setHeight(clamp(startHeight.current + delta));
  }, [clamp]);

  const style = useMemo(() => ({ height }), [height]);

  if (!open) return null;

  return (
    <section className="fixed inset-x-0 bottom-0 z-[90] mx-auto w-full max-w-md rounded-t-xl border border-slate-200 bg-white text-slate-950 md:static md:max-w-none md:rounded-xl" style={style}>
      <div
        className="flex h-7 touch-none items-center justify-center border-b border-slate-100"
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); startDrag(event.clientY); }}
        onPointerMove={(event) => { if (event.buttons) moveDrag(event.clientY); }}
      >
        <span className="h-1 w-9 rounded-full bg-slate-300" />
        <span className="sr-only">Drag panel</span>
      </div>
      <header className="flex h-8 items-center justify-between border-b border-slate-100 px-2.5">
        <p className="truncate text-xs font-black">{title}</p>
        {onClose && <button type="button" onClick={onClose} className="h-7 rounded-lg px-2 text-xs font-black text-slate-500">Close</button>}
      </header>
      <div className="h-[calc(100%-3.75rem)] overflow-y-auto px-2 py-2 [content-visibility:auto] [contain-intrinsic-size:320px]">
        {children}
      </div>
    </section>
  );
}
