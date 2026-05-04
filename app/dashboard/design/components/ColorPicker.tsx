"use client";

import { useState } from "react";

const COLORS = ["#000000", "#ffffff", "#ff3b30", "#34c759", "#007aff", "#ffcc00"];

export default function ColorPicker({ onChange }: any) {
  const [color, setColor] = useState("#000000");

  const handleChange = (value: string) => {
    setColor(value);
    onChange(value);
  };

  return (
    <div className="
      w-full 
      flex items-center justify-center 
      px-2 sm:px-4 py-2
      border-b border-black/10
      backdrop-blur-md
    ">

      <div className="
        flex items-center gap-2 sm:gap-3 
        w-full max-w-[800px]
        overflow-x-auto
      ">

        {/* CURRENT COLOR */}
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-md border shrink-0"
          style={{ background: color }}
        />

        {/* PRESETS */}
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => handleChange(c)}
            className={`
              w-7 h-7 sm:w-8 sm:h-8 rounded-full border shrink-0
              transition hover:scale-105
              ${color === c ? "ring-2 ring-black" : ""}
            `}
            style={{ background: c }}
          />
        ))}

        {/* COLOR PICKER */}
        <input
          type="color"
          value={color}
          onChange={(e) => handleChange(e.target.value)}
          className="w-8 h-8 sm:w-9 sm:h-9 cursor-pointer shrink-0"
        />

        {/* HEX INPUT */}
        <input
          type="text"
          value={color}
          onChange={(e) => handleChange(e.target.value)}
          className="
            min-w-[90px] sm:min-w-[110px]
            px-2 py-1 text-xs sm:text-sm 
            border-b border-black/20 
            focus:outline-none
            bg-transparent
          "
        />

      </div>
    </div>
  );
}