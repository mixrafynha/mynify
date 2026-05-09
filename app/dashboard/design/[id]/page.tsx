"use client";

import {
  useState,
  useRef,
  useEffect,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

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
  const router = useRouter();

  const searchParams = useSearchParams();

  const productId =
    searchParams.get("productId");

  const [side, setSide] = useState<
    "front" | "back"
  >("front");

  const [saving, setSaving] =
    useState(false);

  // ================= ZOOM LIMITADO =================
  const MIN_ZOOM = 0.4;
  const MAX_ZOOM = 2;

  const [zoom, _setZoom] = useState(1);

  const setZoom = (
    value:
      | number
      | ((z: number) => number)
  ) => {
    _setZoom((prev) => {
      const next =
        typeof value === "function"
          ? value(prev)
          : value;

      return Math.min(
        MAX_ZOOM,
        Math.max(
          MIN_ZOOM,
          Number(next.toFixed(2))
        )
      );
    });
  };

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const fileRef =
    useRef<HTMLInputElement>(null);

  const [frontElements, setFrontElements] =
    useState<ElementType[]>([]);

  const [backElements, setBackElements] =
    useState<ElementType[]>([]);

  const elements =
    side === "back"
      ? backElements
      : frontElements;

  const setElements =
    side === "back"
      ? setBackElements
      : setFrontElements;

  const {
    addText,
    updateSelected,
    addElement,
  } = useElements({
    setElements,
    selectedId,
  });

  const handleUpload = useUpload({
    setElements,
  });

  const selectedElement =
    elements.find(
      (el) => el.id === selectedId
    );

  // cleanup memory
  useEffect(() => {
    return () => {
      [
        ...frontElements,
        ...backElements,
      ].forEach((el) => {
        if (
          el.type === "image" &&
          el.src?.startsWith("blob:")
        ) {
          URL.revokeObjectURL(el.src);
        }
      });
    };
  }, [frontElements, backElements]);

  // ================= ZOOM CONTROLS =================
  const zoomIn = () =>
    setZoom((z) =>
      Math.min(1.3, z + 0.1)
    );

  const zoomOut = () =>
    setZoom((z) =>
      Math.max(0.8, z - 0.1)
    );

  // ================= SAVE DESIGN =================
  const handleSaveDesign =
    async () => {
      try {
        if (!productId) {
          alert("Missing product ID");
          return;
        }

        setSaving(true);

        const response = await fetch(
          "/api/user-products/save-design",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              baseProductId:
                productId,

              designFront:
                frontElements,

              designBack:
                backElements,

              markup: 0,
            }),
          }
        );

        const data =
          await response.json();

        console.log(
          "SAVE RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to save design"
          );
        }

        alert(
          "Design saved successfully!"
        );

        // ✅ PREVIEW PAGE
        router.push(
          `/dashboard/design/preview/${data.product.id}`
        );
      } catch (error) {
        console.error(
          "SAVE ERROR:",
          error
        );

        alert(
          "Error saving design"
        );
      } finally {
        setSaving(false);
      }
    };

  // ================= PREVIEW =================
  const handlePreviewDesign =
    async () => {
      try {
        await handleSaveDesign();
      } catch (error) {
        console.error(error);
      }
    };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#efefe9] overflow-hidden">
      {/* ================= SIDEBAR ================= */}
      <div className="md:block hidden">
        <Sidebar
          addElement={addElement}
          updateSelected={
            updateSelected
          }
          selectedElement={
            selectedElement
          }
        />
      </div>

      {/* ================= MOBILE SIDEBAR ================= */}
      <div className="md:hidden">
        <Sidebar
          addElement={addElement}
          updateSelected={
            updateSelected
          }
          selectedElement={
            selectedElement
          }
        />
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <TopBar
          side={side}
          setSide={setSide}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          onSaveDesign={
            handleSaveDesign
          }
          onPreviewDesign={
            handlePreviewDesign
          }
          saving={saving}
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
              setSelectedId={
                setSelectedId
              }
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
