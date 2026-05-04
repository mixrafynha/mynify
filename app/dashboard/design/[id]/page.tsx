"use client";

import { useState, useRef, useEffect } from "react";

import Canvas from "@/app/dashboard/design/components/Canvas";
import Sidebar from "@/app/dashboard/design/components/Sidebar";
import TopBar from "@/app/dashboard/design/components/TopBar";
import { useElements } from "@/features/elements/useElements";
import { useUpload } from "@/features/upload/useUpload";

type ElementType = {
  id: string;
  type: "image" | "text" | "shape";
  src?: string;
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  meta?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
  };
};

export default function EditorPage() {
  const [side, setSide] = useState<"front" | "back">("front");

  // ================= ZOOM LIMITADO =================
  const MIN_ZOOM = 0.4;
  const MAX_ZOOM = 2;

  const [zoom, _setZoom] = useState(1);

  const setZoom = (value: number | ((z: number) => number)) => {
    _setZoom((prev) => {
      const next =
        typeof value === "function" ? value(prev) : value;

      return Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Number(next.toFixed(2)))
      );
    });
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const [frontElements, setFrontElements] = useState<ElementType[]>([]);
  const [backElements, setBackElements] = useState<ElementType[]>([]);

  const elements = side === "back" ? backElements : frontElements;
  const setElements = side === "back" ? setBackElements : setFrontElements;

  const { addText, updateSelected, addElement } = useElements({
    setElements,
    selectedId,
  });

  const handleUpload = useUpload({ setElements });

  const selectedElement = elements.find((el) => el.id === selectedId);

  // cleanup memory
  useEffect(() => {
    return () => {
      [...frontElements, ...backElements].forEach((el) => {
        if (el.type === "image" && el.src?.startsWith("blob:")) {
          URL.revokeObjectURL(el.src);
        }
      });
    };
  }, [frontElements, backElements]);

  // ================= ZOOM CONTROLS =================
 const zoomIn = () =>
  setZoom((z) => Math.min(1.3, z + 0.1));

const zoomOut = () =>
  setZoom((z) => Math.max(0.8, z - 0.1));

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#efefe9] overflow-hidden">

      {/* ================= SIDEBAR ================= */}
      <div className="md:block hidden">
        <Sidebar
          addElement={addElement}
          updateSelected={updateSelected}
          selectedElement={selectedElement}
        />
      </div>

      {/* ================= MOBILE SIDEBAR ================= */}
      <div className="md:hidden">
        <Sidebar
          addElement={addElement}
          updateSelected={updateSelected}
          selectedElement={selectedElement}
        />
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TOPBAR */}
        <TopBar
          setSide={setSide}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
        />

        {/* CANVAS RESPONSIVO */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-2 sm:p-3 md:p-4">
          <div className="w-full h-full flex items-center justify-center">
            <Canvas
              side={side}
              elements={elements}
              setElements={setElements}
              zoom={zoom}
              setZoom={setZoom}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
            />
          </div>
        </div>
      </div>

      {/* FILE INPUT */}
      <input
        type="file"
        hidden
        ref={fileRef}
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
      />
    </div>
  );
}