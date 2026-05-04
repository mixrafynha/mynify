"use client";

import {
  Plus,
  X,
  Image,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { useState } from "react";

const TEMPLATES = [
  { text: "NEW DROP", fontFamily: "Impact", color: "#000", fontSize: 28 },
  { text: "LIMITED EDITION", fontFamily: "Arial Black", color: "#111", fontSize: 24 },
  { text: "STREET MODE", fontFamily: "Verdana", color: "#333", fontSize: 26 },
];

const STICKERS = ["🔥", "⚡", "💀", "🚀", "💎", "😎"];

export default function ToolbarFAB({
  onUploadClick,
  onAddText,
  setElements,
  elements,
  selectedId,
  zoomIn,
  zoomOut,
}: any) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"main" | "templates" | "edit">("main");

  const selected = elements.find((e: any) => e.id === selectedId);

  // ================= CREATE =================
  const createElement = (data: any) => {
    setElements((prev: any[]) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        x: 120,
        y: 120,
        meta: {},
        ...data,
      },
    ]);
  };

  // ================= UPDATE SAFE =================
  const updateSelected = (patch: any) => {
    if (!selectedId) return;

    setElements((prev: any[]) =>
      prev.map((el) => {
        if (el.id !== selectedId) return el;

        return {
          ...el,
          ...patch,
          meta: {
            ...(el.meta ?? {}),
            ...(patch.meta ?? {}),
          },
        };
      })
    );
  };

  return (
    <>
      {/* MAIN BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-[#4d4d34] text-white p-3 rounded-full shadow-lg z-50"
      >
        {open ? <X size={18} /> : <Plus size={18} />}
      </button>

      {/* MAIN BAR */}
      {open && panel === "main" && (
        <div className="fixed bottom-6 right-20 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md border rounded-full shadow-lg z-50">

          <button onClick={onUploadClick}>
            <Image size={16} />
          </button>

          <button onClick={onAddText}>
            <Type size={16} />
          </button>

          <button onClick={() => setPanel("templates")}>
            ✨
          </button>

          {selected && (
            <button onClick={() => setPanel("edit")}>
              ✏️
            </button>
          )}

          <div className="w-px h-5 bg-gray-200" />

          <button onClick={zoomIn}>
            <ZoomIn size={16} />
          </button>

          <button onClick={zoomOut}>
            <ZoomOut size={16} />
          </button>
        </div>
      )}

      {/* ================= TEMPLATES ================= */}
      {open && panel === "templates" && (
        <div className="fixed bottom-24 right-6 w-[260px] bg-white border shadow-lg rounded-xl p-3 z-50">

          <div className="text-xs font-bold mb-2">Templates</div>

          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() =>
                createElement({
                  type: "text",
                  text: t.text,
                  meta: {
                    fontFamily: t.fontFamily,
                    color: t.color,
                    fontSize: t.fontSize,
                  },
                })
              }
              className="p-2 border rounded hover:bg-gray-100 w-full text-left"
            >
              {t.text}
            </button>
          ))}

          <div className="text-xs font-bold mt-3 mb-2">Stickers</div>

          <div className="flex flex-wrap gap-2">
            {STICKERS.map((s, i) => (
              <button
                key={i}
                onClick={() =>
                  createElement({
                    type: "text",
                    text: s,
                    meta: {
                      fontSize: 40,
                      fontFamily: "Arial",
                      color: "#000",
                    },
                  })
                }
                className="text-xl hover:scale-110 transition"
              >
                {s}
              </button>
            ))}
          </div>

          <button onClick={() => setPanel("main")} className="mt-3 text-xs">
            back
          </button>
        </div>
      )}

      {/* ================= EDIT ================= */}
      {open && panel === "edit" && selected && (
        <div className="fixed bottom-24 right-6 bg-white border shadow-lg rounded-xl p-3 z-50 w-[220px]">

          <select
            value={selected.meta?.fontFamily || "Arial"}
            onChange={(e) =>
              updateSelected({
                meta: { fontFamily: e.target.value },
              })
            }
            className="border p-2 rounded w-full"
          >
            <option>Arial</option>
            <option>Verdana</option>
            <option>Georgia</option>
            <option>Impact</option>
          </select>

          <input
            type="color"
            value={selected.meta?.color || "#000"}
            onChange={(e) =>
              updateSelected({
                meta: { color: e.target.value },
              })
            }
            className="mt-2 w-full"
          />

          <input
            type="number"
            value={selected.meta?.fontSize || 20}
            onChange={(e) =>
              updateSelected({
                meta: { fontSize: Number(e.target.value) },
              })
            }
            className="mt-2 border p-2 rounded w-full"
          />

          <button
            onClick={() => setPanel("main")}
            className="mt-2 text-xs text-gray-500"
          >
            back
          </button>
        </div>
      )}
    </>
  );
}