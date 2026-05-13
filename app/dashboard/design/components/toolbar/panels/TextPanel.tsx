"use client";

import { useState } from "react";
import { FONTS, COLORS } from "../data";

type TextShape = "straight" | "wave" | "arc";

export default function TextPanel({
  createElement,
  onAddText,
}: {
  createElement?: (element: any) => void;
  onAddText?: () => void;
}) {
  const [textValue, setTextValue] = useState("Dream big");
  const [textFont, setTextFont] = useState(FONTS?.[0] || "Arial");
  const [textColor, setTextColor] = useState(COLORS?.[0] || "#ffffff");
  const [textSize, setTextSize] = useState(44);
  const [textShape, setTextShape] =
    useState<TextShape>("straight");

  const addCustomText = () => {
    const text = textValue.trim();

    if (!text) return;

    createElement?.({
      type: "text",
      text,
      meta: {
        fontFamily: textFont,
        color: textColor,
        fontSize: textSize,
        textShape,
      },
    });

    onAddText?.();
  };

  return (
    <div className="space-y-5 pb-7">
      <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 shadow-[0_14px_35px_rgba(0,0,0,0.18)]">
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Texto
        </label>

        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          rows={3}
          className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-[#070711] px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400"
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Pré-visualização
        </label>

        <div className="mt-3 flex min-h-[112px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#070711] px-4 text-center">
          <span
            className={`${
              textShape === "wave" ? "animate-pulse" : ""
            } ${
              textShape === "arc" ? "rotate-[-4deg]" : ""
            } font-black leading-tight`}
            style={{
              fontFamily: textFont,
              color: textColor,
              fontSize: Math.min(textSize, 58),
            }}
          >
            {textValue || "Texto"}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Fonte
        </label>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {FONTS.map((font) => (
            <button
              key={font}
              type="button"
              style={{ fontFamily: font }}
              onClick={() => setTextFont(font)}
              className={`h-12 rounded-2xl border px-3 text-left text-sm font-black transition active:scale-95 ${
                textFont === font
                  ? "border-violet-400 bg-violet-500/20 text-white"
                  : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-violet-500/15"
              }`}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Tamanho
          </label>

          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
            {textSize}px
          </span>
        </div>

        <input
          type="range"
          min={16}
          max={96}
          value={textSize}
          onChange={(e) =>
            setTextSize(Number(e.target.value))
          }
          className="mt-4 w-full accent-violet-500"
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
        <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          Cor
        </label>

        <div className="mt-3 grid grid-cols-7 gap-3">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setTextColor(color)}
              style={{ backgroundColor: color }}
              className={`h-9 w-9 rounded-full border border-white/20 shadow-[0_10px_25px_rgba(0,0,0,0.22)] transition hover:scale-110 active:scale-95 ${
                textColor === color
                  ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-[#0f1020]"
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={addCustomText}
        disabled={!textValue.trim()}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-base font-black text-white shadow-[0_16px_40px_rgba(168,85,247,0.35)] transition hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
      >
        Adicionar texto
      </button>
    </div>
  );
}