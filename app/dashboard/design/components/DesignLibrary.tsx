"use client";

import { useState } from "react";

type ElementType = {
  id: string;
  type: "text";
  text: string;
  x: number;
  y: number;
  meta: {
    fontFamily: string;
    color: string;
    fontSize: number;
  };
};

const TEMPLATES = [
  { text: "NEW DROP", fontFamily: "Impact", color: "#000", fontSize: 28 },
  { text: "LIMITED EDITION", fontFamily: "Arial Black", color: "#111", fontSize: 24 },
  { text: "STREET MODE", fontFamily: "Verdana", color: "#333", fontSize: 26 },
];

const FONTS = ["Arial", "Verdana", "Impact", "Arial Black"];

const STICKERS = ["🔥", "⚡", "💀", "🚀", "💎", "😎"];

type Props = {
  onAdd?: (element: ElementType) => void;
};

export default function DesignEditor({ onAdd }: Props) {
  const [elements, setElements] = useState<ElementType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = elements.find((e) => e.id === selectedId) || null;

  // ================= ADD FIXED =================
 const addElement = (el: Omit<ElementType, "id" | "x" | "y">) => {
  const newElement: ElementType = {
    id: crypto.randomUUID(),
    x: 120,
    y: 120,
    text: el.text,
    type: "text",
    meta: {
      fontFamily: el.meta?.fontFamily || "Arial",
      color: el.meta?.color || "#000",
      fontSize: el.meta?.fontSize || 20,
    },
  };

  setElements((prev) => [...prev, newElement]);

  onAdd?.(newElement);
};
  // ================= UPDATE SAFE =================
  const updateSelected = (patch: Partial<ElementType>) => {
    if (!selectedId) return;

    setElements((prev) =>
      prev.map((el) => {
        if (el.id !== selectedId) return el;

        return {
          ...el,
          text: patch.text ?? el.text,
          meta: {
            ...el.meta,
            ...(patch.meta || {}),
          },
        };
      })
    );
  };

  return (
    <div className="flex gap-6 p-4">

      {/* LEFT */}
      <div className="w-60 flex flex-col gap-4">

        {/* TEMPLATES */}
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.text}
              onClick={() =>
                addElement({
                  type: "text",
                  text: t.text,
                  meta: {
                    fontFamily: t.fontFamily,
                    color: t.color,
                    fontSize: t.fontSize,
                  },
                })
              }
              className="px-2 py-1 border rounded text-xs"
            >
              {t.text}
            </button>
          ))}
        </div>

        {/* STICKERS */}
        <div className="flex flex-wrap gap-2">
          {STICKERS.map((s) => (
            <button
              key={s}
              onClick={() =>
                addElement({
                  type: "text",
                  text: s,
                  meta: {
                    fontFamily: "Arial",
                    color: "#000",
                    fontSize: 40,
                  },
                })
              }
              className="text-2xl"
            >
              {s}
            </button>
          ))}
        </div>

        {/* EDITOR */}
        <div className="border p-2 rounded space-y-2">

          <h3 className="text-sm font-bold">Editor</h3>

          {!selected ? (
            <p className="text-xs text-gray-400">
              Seleciona um elemento
            </p>
          ) : (
            <>
              {/* TEXT */}
              <input
                className="border p-1 w-full text-sm"
                value={selected.text}
                onChange={(e) =>
                  updateSelected({
                    text: e.target.value,
                  })
                }
              />

              {/* COLOR */}
              <input
                type="color"
                value={selected.meta.color}
                onChange={(e) =>
                  updateSelected({
                    meta: {
                      ...selected.meta,
                      color: e.target.value,
                    },
                  })
                }
              />

              {/* FONT */}
              <select
                value={selected.meta.fontFamily}
                onChange={(e) =>
                  updateSelected({
                    meta: {
                      ...selected.meta,
                      fontFamily: e.target.value,
                    },
                  })
                }
                className="border p-1 w-full"
              >
                {FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              {/* SIZE */}
              <input
                type="range"
                min={10}
                max={80}
                value={selected.meta.fontSize}
                onChange={(e) =>
                  updateSelected({
                    meta: {
                      ...selected.meta,
                      fontSize: Number(e.target.value),
                    },
                  })
                }
              />
            </>
          )}
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 border relative h-[500px] bg-gray-50">

        {elements.map((el) => (
          <div
            key={el.id}
            onClick={() => setSelectedId(el.id)}
            className={`absolute cursor-pointer ${
              selectedId === el.id ? "ring-2 ring-blue-500" : ""
            }`}
            style={{
              left: el.x,
              top: el.y,
              color: el.meta.color,
              fontFamily: el.meta.fontFamily,
              fontSize: el.meta.fontSize,
            }}
          >
            {el.text}
          </div>
        ))}

      </div>
    </div>
  );
}