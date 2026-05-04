"use client";

import { useState, useEffect } from "react";

const FONTS = ["Inter", "Arial", "Verdana", "Georgia", "Impact"];

export default function FontPicker({
  value = "Inter",
  size = 24,
  color = "#000000",
  onChange,
  onAddText,
}: any) {
  const [text, setText] = useState("Your text");

  const [fontFamily, setFontFamily] = useState(value);
  const [fontSize, setFontSize] = useState(size);
  const [fontColor, setFontColor] = useState(color);

  useEffect(() => setFontFamily(value), [value]);
  useEffect(() => setFontSize(size), [size]);
  useEffect(() => setFontColor(color), [color]);

  // ================= FIXED EMIT =================
  const emit = (patch: any) => {
    if (patch.fontFamily) setFontFamily(patch.fontFamily);
    if (patch.fontSize) setFontSize(patch.fontSize);
    if (patch.color) setFontColor(patch.color);

    // 🔥 SEND RAW PATCH (CANVAS HANDLES MERGE)
    onChange?.(patch);
  };

  const handleAddText = () => {
    onAddText?.({
      type: "text",
      content: text || "Text",
      x: 100,
      y: 100,
      meta: {
        fontFamily,
        fontSize,
        color: fontColor,
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">

      <button
        onClick={handleAddText}
        className="w-full py-2 rounded-lg text-sm font-medium bg-black text-white active:scale-95"
      >
        Add Text
      </button>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full px-3 py-2 text-sm border rounded-lg outline-none"
        placeholder="Type something..."
      />

      <div
        className="px-3 py-3 border rounded-lg text-center break-words"
        style={{
          fontFamily,
          fontSize,
          color: fontColor,
        }}
      >
        {text}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FONTS.map((font) => (
          <button
            key={font}
            onClick={() => emit({ fontFamily: font })}
            className={`
              flex-shrink-0 px-3 py-2 rounded-lg text-xs transition
              ${fontFamily === font
                ? "bg-black text-white"
                : "text-gray-500 hover:text-black"
              }
            `}
            style={{ fontFamily: font }}
          >
            {font}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">

        <div className="flex justify-between text-xs text-gray-500">
          <span>Size</span>
          <span>{fontSize}px</span>
        </div>

        <input
          type="range"
          min={10}
          max={120}
          value={fontSize}
          onChange={(e) => emit({ fontSize: Number(e.target.value) })}
          className="w-full"
        />

        <div className="flex gap-2">
          {[16, 24, 32, 48].map((s) => (
            <button
              key={s}
              onClick={() => emit({ fontSize: s })}
              className={`
                flex-1 py-1 text-xs border rounded-md transition
                ${fontSize === s ? "bg-black text-white" : ""}
              `}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">

        <span className="text-xs text-gray-500">Color</span>

        <div className="flex items-center gap-2">

          <input
            type="color"
            value={fontColor}
            onChange={(e) => emit({ color: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer"
          />

          <div
            className="w-6 h-6 rounded border"
            style={{ background: fontColor }}
          />

        </div>
      </div>
    </div>
  );
}