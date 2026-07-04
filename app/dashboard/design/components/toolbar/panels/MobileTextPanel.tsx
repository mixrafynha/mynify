"use client";

import { memo, useCallback, useRef } from "react";
import { Type } from "lucide-react";

type MobileTextPanelProps = {
  createElement?: (element: any) => void;
  onAddText?: () => void;
};

function buildDefaultTextElement() {
  const text = "RYFIO";

  return {
    type: "text",
    text,
    content: text,
    width: 220,
    height: 68,
    fontFamily: "Inter",
    fontSize: 42,
    fontWeight: 800,
    color: "#111111",
    meta: {
      fontFamily: "Inter",
      fontSize: 42,
      fontWeight: 800,
      color: "#111111",
      letterSpacing: 0,
      lineHeight: 1.15,
      textAlign: "center",
      textShape: "straight",
      opacity: 1,
      rotation: 0,
    },
  };
}

function MobileTextPanel({ createElement, onAddText }: MobileTextPanelProps) {
  const lockedRef = useRef(false);

  const addText = useCallback(() => {
    if (lockedRef.current) return;
    lockedRef.current = true;

    if (onAddText) onAddText();
    else createElement?.(buildDefaultTextElement());

    window.setTimeout(() => {
      lockedRef.current = false;
    }, 180);
  }, [createElement, onAddText]);

  return (
    <div className="flex h-full min-h-[92px] flex-col justify-center text-white">
      <button
        type="button"
        onClick={addText}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 text-sm font-black text-white shadow-lg shadow-violet-950/25 active:scale-[0.99]"
      >
        <Type size={17} /> Add text
      </button>
    </div>
  );
}

export default memo(MobileTextPanel);
