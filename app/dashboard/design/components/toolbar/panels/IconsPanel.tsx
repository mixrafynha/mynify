"use client";

import { ICONS } from "../data";

export default function IconsPanel({
  createElement,
}: {
  createElement?: (element: any) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-3 pb-7">
      {ICONS.map((icon, i) => (
        <button
          key={`${icon}-${i}`}
          type="button"
          onClick={() =>
            createElement?.({
              type: "text",
              text: icon,
              meta: {
                fontSize: 34,
                fontFamily: "Arial",
                color: "#ffffff",
                textShape: "straight",
              },
            })
          }
          className="flex min-h-[52px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-xl shadow-sm transition hover:bg-violet-500/15 active:scale-95"
        >
          {icon}
        </button>
      ))}
    </div>
  );
}