"use client";

import { useMemo, useRef, useState } from "react";
import {
  Type,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

import { FONTS, COLORS } from "../data";

type TextShape = "straight" | "wave" | "arc";

export default function TextPanel({
  createElement,
  onAddText,
}: {
  createElement?: (element: any) => void;
  onAddText?: () => void;
}) {
  const [textValue, setTextValue] =
    useState("Dream big");

  const [textFont, setTextFont] =
    useState(FONTS?.[0] || "Arial");

  const [textColor, setTextColor] =
    useState(COLORS?.[0] || "#ffffff");

  const [textSize, setTextSize] =
    useState(44);

  const [textShape] =
    useState<TextShape>("straight");

  const [fontOpen, setFontOpen] =
    useState(false);

  const [fontSearch, setFontSearch] =
    useState("");

  // evita clique duplo / duplicação
  const addingRef = useRef(false);

  const filteredFonts = useMemo(() => {
    return FONTS.filter((font) =>
      font
        .toLowerCase()
        .includes(fontSearch.toLowerCase()),
    );
  }, [fontSearch]);

  const addCustomText = () => {
    const text = textValue.trim();

    if (!text) return;
    if (addingRef.current) return;

    addingRef.current = true;

   createElement?.({
  type: "text",
  text,
  content: text,

  width: text.length * (textSize * 0.62),
  height: textSize * 1.4,

  // importante: fonte também no root do elemento
  fontFamily: textFont,
  fontSize: textSize,
  fontWeight: "800",
  fontStyle: "normal",
  color: textColor,

  meta: {
    fontFamily: textFont,
    fontSize: textSize,
    fontWeight: "800",
    fontStyle: "normal",
    color: textColor,
    textShape,
  },
});

    setTimeout(() => {
      addingRef.current = false;
    }, 350);
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* scrollable content */}
      <div className="space-y-5 pb-6">
        {/* TEXT */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Text
          </label>

          <textarea
            rows={3}
            value={textValue}
            onChange={(e) =>
              setTextValue(
                e.target.value,
              )
            }
            className="
              mt-3 w-full resize-none
              rounded-2xl
              border border-white/10
              bg-[#070711]
              px-4 py-3
              text-base font-bold
              text-white
              outline-none
              transition
              focus:border-violet-400
            "
          />
        </div>

        {/* PREVIEW */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Preview
          </label>

          <div
            className="
              mt-3 flex min-h-[120px]
              items-center justify-center
              rounded-3xl
              border border-white/10
              bg-[#070711]
              p-5 text-center
            "
          >
            <span
              className="break-words font-black leading-tight"
              style={{
                fontFamily: `"${textFont}", sans-serif`,
                color: textColor,
                fontSize: Math.min(
                  textSize,
                  58,
                ),
              }}
            >
              {textValue ||
                "Text"}
            </span>
          </div>
        </div>

        {/* FONT PICKER */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Font
          </label>

          <button
            type="button"
            onClick={() =>
              setFontOpen(
                (v) => !v,
              )
            }
            className="
              mt-3 flex h-14
              w-full items-center
              justify-between
              rounded-2xl
              border border-white/10
              bg-[#070711]
              px-4 text-white
              transition
              hover:border-violet-400/50
            "
          >
            <div className="flex min-w-0 items-center gap-3 overflow-hidden">
              <Type size={18} />

              <span
                className="truncate font-bold"
                style={{
                  fontFamily: `"${textFont}", sans-serif`,
                }}
              >
                {textFont}
              </span>
            </div>

            {fontOpen ? (
              <ChevronUp
                size={18}
              />
            ) : (
              <ChevronDown
                size={18}
              />
            )}
          </button>

          {fontOpen && (
            <div className="mt-4 rounded-3xl border border-white/10 bg-[#070711] p-3">
              <div
                className="
                  mb-3 flex items-center gap-2
                  rounded-2xl
                  border border-white/10
                  bg-white/[0.04]
                  px-3
                "
              >
                <Search
                  size={16}
                  className="text-slate-500"
                />

                <input
                  value={
                    fontSearch
                  }
                  onChange={(
                    e,
                  ) =>
                    setFontSearch(
                      e.target
                        .value,
                    )
                  }
                  placeholder="Search font..."
                  className="
                    h-11 w-full
                    bg-transparent
                    text-white
                    outline-none
                    placeholder:text-slate-500
                  "
                />
              </div>

              <div
                className="
                  max-h-[38dvh]
                  overflow-y-auto
                  overscroll-contain
                  space-y-2 pr-1
                "
              >
                {filteredFonts.map(
                  (font) => (
                    <button
                      key={
                        font
                      }
                      type="button"
                      onClick={() => {
                        setTextFont(
                          font,
                        );

                        setFontOpen(
                          false,
                        );
                      }}
                      style={{
                        fontFamily: `"${font}", sans-serif`,
                      }}
                      className={`flex min-h-[58px] w-full items-center rounded-2xl border px-4 text-left transition active:scale-[0.98] ${
                        textFont ===
                        font
                          ? "border-violet-400 bg-violet-500/20 text-white"
                          : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-black">
                          {
                            font
                          }
                        </div>

                        <div className="truncate text-xs opacity-70">
                          The
                          quick
                          brown
                          fox
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>

        {/* SIZE */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Size
            </label>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
              {textSize}px
            </span>
          </div>

          <input
            type="range"
            min={16}
            max={120}
            value={textSize}
            onChange={(
              e,
            ) =>
              setTextSize(
                Number(
                  e
                    .target
                    .value,
                ),
              )
            }
            className="mt-4 w-full accent-violet-500"
          />
        </div>

        {/* COLORS */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
          <label className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Color
          </label>

          <div className="mt-3 grid grid-cols-7 gap-3">
            {COLORS.map(
              (
                color,
              ) => (
                <button
                  key={
                    color
                  }
                  type="button"
                  onClick={() =>
                    setTextColor(
                      color,
                    )
                  }
                  style={{
                    backgroundColor:
                      color,
                  }}
                  className={`h-9 w-9 rounded-full border border-white/20 transition hover:scale-110 active:scale-95 ${
                    textColor ===
                    color
                      ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-[#0f1020]"
                      : ""
                  }`}
                />
              ),
            )}
          </div>
        </div>
      </div>

      {/* fixed bottom button */}
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={
            addCustomText
          }
          disabled={
            !textValue.trim()
          }
          className="
            flex h-14 w-full
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-r
            from-violet-600
            via-fuchsia-500
            to-cyan-500
            px-5
            text-base font-black
            text-white
            shadow-[0_14px_35px_rgba(168,85,247,0.35)]
            transition
            hover:scale-[1.01]
            active:scale-[0.98]
            disabled:opacity-40
          "
        >
          Add text
        </button>
      </div>
    </div>
  );
}