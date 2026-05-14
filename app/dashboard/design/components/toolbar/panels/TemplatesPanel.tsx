"use client";

import { Crown } from "lucide-react";
import { TEMPLATES } from "../data";

export default function TemplatesPanel({
  createElement,
}: {
  createElement?: (element: any) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 pb-7">
      {TEMPLATES.map((t, i) => (
        <button
          key={`${t.text}-${i}`}
          type="button"
          onClick={() =>
            createElement?.({
              type: "text",
              text: t.text,
              meta: {
                fontFamily: t.fontFamily,
                color: t.color,
                fontSize: t.fontSize,
                textShape: "straight",
              },
            })
          }
          className={`group relative flex h-[122px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 px-3 text-center shadow-[0_14px_35px_rgba(0,0,0,0.20)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(168,85,247,0.22)] active:scale-[0.98] ${t.bg}`}
        >
          <div className="absolute inset-0 bg-white/0 transition group-hover:bg-white/10" />

          {t.premium && (
            <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg">
              <Crown size={15} />
            </span>
          )}

          <span
            className="relative font-black leading-tight tracking-tight"
            style={{
              fontFamily: t.fontFamily,
              color: t.color,
              fontSize: 15,
            }}
          >
            {t.text}
          </span>
        </button>
      ))}
    </div>
  );
}