"use client";

import { STICKERS } from "../data";

export default function StickersPanel({
  createElement,
}: {
  createElement?: (element: any) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3 pb-7">
      {STICKERS.map((s, i) => (
        <button
          key={`${s}-${i}`}
          type="button"
          onClick={() =>
            createElement?.({
              type: "text",
              text: s,
              meta: {
                fontSize: 40,
                fontFamily: "Arial",
                color: "#ffffff",
                textShape: "straight",
              },
            })
          }
          className="flex min-h-[52px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-2xl shadow-sm transition hover:bg-violet-500/15 active:scale-95"
        >
          {s}
        </button>
      ))}
    </div>
  );
}