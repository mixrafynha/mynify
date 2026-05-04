"use client";

import { useState } from "react";
import {
  LayoutTemplate,
  Type,
  Palette,
  Shapes,
} from "lucide-react";

import DesignLibrary from "./DesignLibrary";
import FontPicker from "./FontPicker";
import ColorPicker from "./ColorPicker";
import ShapesPanel from "./Shapes";

export default function Sidebar({
  addElement,
  updateSelected,
  selectedElement,
}: any) {
  const [active, setActive] = useState<string | null>(null);

  // ================= ICON BUTTON =================
  const iconBtn = (isActive: boolean) => `
    w-11 h-11 sm:w-12 sm:h-12 
    flex items-center justify-center 
    rounded-xl 
    transition-all duration-200
    ${isActive ? "text-black scale-105" : "text-gray-400 hover:text-black"}
  `;

  // ================= SAFE UPDATE =================
  const safeUpdateMeta = (patch: any) => {
    if (!selectedElement || !updateSelected) return;

    updateSelected({
      meta: {
        ...(selectedElement.meta || {}),
        ...patch,
      },
    });
  };

  const handleFontChange = (data: any) => {
    safeUpdateMeta({
      fontFamily: data.fontFamily ?? selectedElement?.meta?.fontFamily,
      fontSize: data.fontSize ?? selectedElement?.meta?.fontSize,
      color: data.color ?? selectedElement?.meta?.color,
    });
  };

  return (
    <>
      {/* ================= DESKTOP SIDEBAR (VISÍVEL SEMPRE) ================= */}
      <div className="hidden md:flex fixed left-3 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
        
        <button
          onClick={() =>
            setActive(active === "library" ? null : "library")
          }
          className={iconBtn(active === "library")}
        >
          <LayoutTemplate size={22} />
        </button>

        <button
          onClick={() =>
            setActive(active === "font" ? null : "font")
          }
          className={iconBtn(active === "font")}
        >
          <Type size={22} />
        </button>

        <button
          onClick={() =>
            setActive(active === "color" ? null : "color")
          }
          className={iconBtn(active === "color")}
        >
          <Palette size={22} />
        </button>

        <button
          onClick={() =>
            setActive(active === "shapes" ? null : "shapes")
          }
          className={iconBtn(active === "shapes")}
        >
          <Shapes size={22} />
        </button>
      </div>

      {/* ================= MOBILE BOTTOM TOOLBAR ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 md:hidden">
        <div className="flex gap-3 bg-white/95 backdrop-blur border border-black/10 shadow-xl rounded-2xl px-3 py-2">

          <button
            onClick={() =>
              setActive(active === "library" ? null : "library")
            }
            className={iconBtn(active === "library")}
          >
            <LayoutTemplate size={22} />
          </button>

          <button
            onClick={() =>
              setActive(active === "font" ? null : "font")
            }
            className={iconBtn(active === "font")}
          >
            <Type size={22} />
          </button>

          <button
            onClick={() =>
              setActive(active === "color" ? null : "color")
            }
            className={iconBtn(active === "color")}
          >
            <Palette size={22} />
          </button>

          <button
            onClick={() =>
              setActive(active === "shapes" ? null : "shapes")
            }
            className={iconBtn(active === "shapes")}
          >
            <Shapes size={22} />
          </button>

        </div>
      </div>

      {/* ================= PANEL ================= */}
      {active && (
        <div
          className="
            fixed 
            bottom-20 left-1/2 -translate-x-1/2
            z-50

            w-[92vw] sm:w-[320px]
            max-h-[60vh]

            overflow-y-auto
            p-3 sm:p-4

            rounded-xl
            bg-white/95 backdrop-blur
            border border-black/10
            shadow-xl
          "
        >
          {active === "library" && (
            <DesignLibrary onAdd={addElement} />
          )}

          {active === "font" && (
            <FontPicker
              value={selectedElement?.meta?.fontFamily}
              size={selectedElement?.meta?.fontSize}
              color={selectedElement?.meta?.color}
              onChange={handleFontChange}
              onAddText={addElement}
            />
          )}

          {active === "color" && (
            <ColorPicker
              value={selectedElement?.meta?.color}
              onChange={(color: string) =>
                safeUpdateMeta({ color })
              }
            />
          )}

          {active === "shapes" && (
            <ShapesPanel onAddShape={addElement} />
          )}
        </div>
      )}

      {/* ================= OVERLAY ================= */}
      {active && (
        <div
          onClick={() => setActive(null)}
          className="fixed inset-0 z-40 bg-transparent"
        />
      )}
    </>
  );
}