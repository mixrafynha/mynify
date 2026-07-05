"use client";

import { memo, useCallback, useRef } from "react";
import { Type } from "lucide-react";

const TEXT_INSERT_LOCK_MS = 220;

function MobileTextPanel({ onAddText }: { onAddText?: () => void }) {
  const lockedRef = useRef(false);

  const addText = useCallback(() => {
    if (!onAddText || lockedRef.current) return;
    lockedRef.current = true;
    onAddText();

    window.setTimeout(() => {
      lockedRef.current = false;
    }, TEXT_INSERT_LOCK_MS);
  }, [onAddText]);

  return (
    <div className="space-y-2 text-white" style={{ contain: "layout paint style" }}>
      <button
        type="button"
        onClick={addText}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-4 text-sm font-black text-white shadow-lg shadow-violet-950/20 active:scale-[0.99]"
      >
        <Type size={17} /> Add text
      </button>

      <div className="rounded-2xl border border-violet-300/15 bg-white/[0.045] px-3 py-2.5 text-center text-[11px] font-bold leading-snug text-violet-100/72">
        Tap your text on the canvas to change the font, color and style.
      </div>
    </div>
  );
}

export default memo(MobileTextPanel);
