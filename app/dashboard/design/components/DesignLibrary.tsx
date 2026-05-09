"use client";

import { useEffect, useState } from "react";

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

const STORAGE_KEY = "design-editor-draft";

const TEMPLATES = [
  { text: "NEW DROP", fontFamily: "Impact", color: "#000", fontSize: 28 },
  { text: "LIMITED EDITION", fontFamily: "Arial Black", color: "#111", fontSize: 24 },
  { text: "STREET MODE", fontFamily: "Verdana", color: "#333", fontSize: 26 },
];

const FONTS = ["Arial", "Verdana", "Impact", "Arial Black"];

const STICKERS = ["🔥", "⚡", "💀", "🚀", "💎", "😎"];

type Props = {
  onAdd?: (element: ElementType) => void;
  onSaveDesign?: (elements: ElementType[]) => void;
  onPreviewDesign?: (elements: ElementType[]) => void;
  saving?: boolean;
};

export default function DesignEditor({
  onAdd,
  onSaveDesign,
  onPreviewDesign,
  saving,
}: Props) {
  const [elements, setElements] = useState<ElementType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = elements.find((e) => e.id === selectedId) || null;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        setElements(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(elements));
  }, [elements]);

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

  const handleSave = () => {
    const confirmSave = window.confirm(
      "Queres guardar este produto com o design?"
    );

    if (!confirmSave) return;

    onSaveDesign?.(elements);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handlePreview = () => {
    onPreviewDesign?.(elements);
  };

  return (
    <div className="flex gap-6 p-4">
      <div className="w-60 flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-3 py-2 rounded bg-black text-white text-xs disabled:opacity-40"
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>

          <button
            type="button"
            onClick={handlePreview}
            disabled={saving}
            className="flex-1 px-3 py-2 rounded border text-xs disabled:opacity-40"
          >
            Preview
          </button>
        </div>

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

        <div className="border p-2 rounded space-y-2">
          <h3 className="text-sm font-bold">Editor</h3>

          {!selected ? (
            <p className="text-xs text-gray-400">
              Seleciona um elemento
            </p>
          ) : (
            <>
              <input
                className="border p-1 w-full text-sm"
                value={selected.text}
                onChange={(e) =>
                  updateSelected({
                    text: e.target.value,
                  })
                }
              />

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
