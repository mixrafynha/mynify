"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import PreviewGallery from "./PreviewGallery";

// CORREÇÃO: Alinhar com o editor (SAFE_AREA_PADDING = 1)
const SAFE_AREA_PADDING = 1;

// Dimensões fixas do mockup area (igual ao editor)
const MOCKUP_AREA = {
  width: 1024,
  height: 1024,
};

function normalizeImages(value: any): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item : item?.imageUrl || item?.url
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            typeof item === "string" ? item : item?.imageUrl || item?.url
          )
          .filter(Boolean);
      }
    } catch {}

    return [value];
  }

  return [];
}

export default function TempPreviewClient({ product }: { product: any }) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadedPreview, setLoadedPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mockupImages, setMockupImages] = useState<string[]>([]);
  const [rateLimited, setRateLimited] = useState(false);
  const [mockupError, setMockupError] = useState<string | null>(null);

  const designCaptureRef = useRef<HTMLDivElement | null>(null);
  const requestInFlightRef = useRef(false);
  const generatedKeyRef = useRef<string | null>(null);
  const imagesLoadedRef = useRef<Set<string>>(new Set());

  const category =
    product.category || product.base_product?.category || "Product";

  const productId =
    product.base_product_id || product.baseProductId || product.id;

  const storageKey = `mynify-editor-preview:${productId}`;

  const backToEditorHref = `/dashboard/design/${category
    .toLowerCase()
    .replace(/\s+/g, "-")}?productId=${productId}`;

  useEffect(() => {
    const saved =
      sessionStorage.getItem(storageKey) ||
      localStorage.getItem(storageKey) ||
      sessionStorage.getItem(`mynify-editor-preview:${product.id}`) ||
      localStorage.getItem(`mynify-editor-preview:${product.id}`);

    if (saved) {
      try {
        setPreviewData(JSON.parse(saved));
      } catch {
        setPreviewData(null);
      }
    }

    setLoadedPreview(true);
  }, [storageKey, product.id]);

  const activeElements = useMemo(() => {
    if (!previewData) return [];

    if (previewData.elements?.length) {
      return previewData.elements;
    }

    return previewData.side === "back"
      ? previewData.designBack || []
      : previewData.designFront || [];
  }, [previewData]);

  const printBox = useMemo(() => {
    return (
      previewData?.printBox || {
        x: 375,
        y: 322,
        width: 274,
        height: 336,
      }
    );
  }, [previewData]);

  const safeArea = useMemo(() => {
    return {
      x: Number(printBox.x || 0) + SAFE_AREA_PADDING,
      y: Number(printBox.y || 0) + SAFE_AREA_PADDING,
      width: Number(printBox.width || 0) - SAFE_AREA_PADDING * 2,
      height: Number(printBox.height || 0) - SAFE_AREA_PADDING * 2,
    };
  }, [printBox]);

  // CORREÇÃO: Elementos em coordenadas absolutas do canvas (não relativas ao safeArea)
  const captureElements = useMemo(() => {
    return activeElements.map((el: any) => ({
      ...el,
      x: Number(el.x || 0),
      y: Number(el.y || 0),
    }));
  }, [activeElements]);

  // CORREÇÃO: Função para aguardar todas as imagens carregarem
  const waitForImages = useCallback((container: HTMLElement): Promise<void> => {
    const imgElements = Array.from(container.querySelectorAll("img"));
    
    if (imgElements.length === 0) return Promise.resolve();
    
    return Promise.all(
      imgElements.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            
            const onLoad = () => {
              cleanup();
              resolve();
            };
            
            const onError = () => {
              cleanup();
              console.warn("Failed to load image:", img.src);
              resolve(); // Não bloqueia mesmo se falhar
            };
            
            const cleanup = () => {
              img.removeEventListener("load", onLoad);
              img.removeEventListener("error", onError);
            };
            
            img.addEventListener("load", onLoad);
            img.addEventListener("error", onError);
          })
      )
    ).then(() => undefined);
  }, []);

  const generateTempMockup = useCallback(
    async (force = false) => {
      if (!previewData) return;
      if (requestInFlightRef.current) return;

      const activeProductId = previewData.productId || productId;

      const generationKey = JSON.stringify({
        productId: activeProductId,
        side: previewData.side || "front",
        elements: previewData.elements || [],
        designFront: previewData.designFront || [],
        designBack: previewData.designBack || [],
        designImage: previewData.designImage || null,
        mockupColor: previewData.mockupColor,
        printBox,
        safeArea,
      });

      if (!force && generatedKeyRef.current === generationKey) return;

      requestInFlightRef.current = true;
      generatedKeyRef.current = generationKey;

      try {
        setGenerating(true);
        setRateLimited(false);
        setMockupError(null);
        setMockupImages([]);

        let designImage = previewData.designImage;

        if (!designImage) {
          if (!designCaptureRef.current) {
            throw new Error("Design capture not ready.");
          }

          // CORREÇÃO: Aguardar todas as imagens carregarem
          await waitForImages(designCaptureRef.current);

          // CORREÇÃO: Usar dimensões fixas do MOCKUP_AREA
          const captureWidth = MOCKUP_AREA.width;
          const captureHeight = MOCKUP_AREA.height;

          designImage = await toPng(designCaptureRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: "transparent",
            width: captureWidth,
            height: captureHeight,
            // CORREÇÃO: Incluir estilos para garantir captura correta
            style: {
              transform: "none",
              transformOrigin: "top left",
            },
          });
        }

        const response = await fetch("/api/products/generate-own-mockup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: activeProductId,
            designImage,
            printBox,
            safeArea,
            category,
            side: previewData.side || "front",
            color: previewData.mockupColor || "white",
          }),
        });

        const rawText = await response.text();

        let data: any = {};

        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error(
            rawText
              ? `Mockup endpoint returned invalid JSON: ${rawText.slice(0, 160)}`
              : "Mockup endpoint returned an empty response."
          );
        }

        if (response.status === 429) {
          setRateLimited(true);
          throw new Error(data?.error || "Too many requests. Try again soon.");
        }

        if (!response.ok || !data.success) {
          throw new Error(data?.error || "Mockup preview failed.");
        }

        const images = [
          ...normalizeImages(data.mockupImages),
          ...normalizeImages(data.images),
          ...normalizeImages(data.imageUrls),
          ...normalizeImages(data.urls),
          ...normalizeImages(data.mockupUrl),
          ...normalizeImages(data.imageUrl),
          ...normalizeImages(data.url),
        ]
          .filter(Boolean)
          .filter(
            (img: string, index: number, arr: string[]) =>
              arr.indexOf(img) === index
          );

        if (!images.length) {
          throw new Error("Mockup renderer did not return images.");
        }

        setMockupImages(images);
      } catch (error: any) {
        generatedKeyRef.current = null;
        setMockupError(error?.message || "Mockup preview unavailable.");
      } finally {
        setGenerating(false);
        requestInFlightRef.current = false;
      }
    },
    [previewData, productId, category, printBox, safeArea, waitForImages]
  );

  useEffect(() => {
    if (loadedPreview && previewData) {
      const timer = window.setTimeout(() => {
        generateTempMockup(false);
      }, 250);

      return () => window.clearTimeout(timer);
    }
  }, [loadedPreview, previewData, generateTempMockup]);

  const previewImages = useMemo(() => {
    return mockupImages.filter(Boolean);
  }, [mockupImages]);

  const handleRealSave = async () => {
    if (!previewData || saving) return;

    try {
      setSaving(true);

      const activeProductId = previewData.productId || productId;

      const response = await fetch("/api/user-products/save-design", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseProductId: activeProductId,
          mockupColor: previewData.mockupColor,
          markup: 0,
          mockupUrl: mockupImages[0] || null,
          mockupImages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save design");
      }

      sessionStorage.removeItem(storageKey);
      localStorage.removeItem(storageKey);

      window.location.href = `/dashboard/design/preview/${data.product.id}`;
    } catch {
      alert("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      {/*
        CORREÇÃO: Elemento de captura agora usa posicionamento absoluto
        dentro de um container visível mas fora da área de visualização
      */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -9999,
        }}
      >
        <div
          ref={designCaptureRef}
          style={{
            position: "relative",
            width: MOCKUP_AREA.width,
            height: MOCKUP_AREA.height,
            background: "transparent",
            overflow: "visible",
          }}
        >
          {captureElements.map((el: any, index: number) => {
            const style: React.CSSProperties = {
              position: "absolute",
              left: Number(el.x) || 0,
              top: Number(el.y) || 0,
              width: Number(el.width) || 220,
              height: Number(el.height) || 80,
              transform: el.meta?.rotation
                ? `rotate(${el.meta.rotation}deg) scale(${el.meta?.flipX ? -1 : 1}, ${el.meta?.flipY ? -1 : 1})`
                : undefined,
              opacity: el.meta?.opacity ?? 1,
              transformOrigin: "center center",
            };

            if (el.type === "image" && el.src) {
              return (
                <img
                  key={index}
                  src={el.src}
                  alt=""
                  crossOrigin="anonymous"
                  style={{
                    ...style,
                    objectFit: "contain",
                  }}
                />
              );
            }

            if (el.type === "text") {
              return (
                <div
                  key={index}
                  style={{
                    ...style,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: el.meta?.color || el.color || "#111111",
                    fontSize: el.meta?.fontSize || 48,
                    fontFamily: el.meta?.fontFamily || "Arial Black",
                    fontWeight: el.meta?.fontWeight || 900,
                    lineHeight: 1.2,
                    letterSpacing: el.meta?.letterSpacing || 0,
                  }}
                >
                  {el.text || el.content || ""}
                </div>
              );
            }

            if (el.type === "shape") {
              return (
                <div
                  key={index}
                  style={{
                    ...style,
                    borderRadius: el.meta?.radius || 8,
                    background: el.meta?.color || "#111111",
                  }}
                />
              );
            }

            return null;
          })}
        </div>
      </div>

      <section className="relative min-h-screen py-3 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(168,85,247,0.28),transparent_26%),radial-gradient(circle_at_15%_40%,rgba(34,211,238,0.16),transparent_24%),linear-gradient(180deg,#03030a_0%,#060612_58%,#03030a_100%)]" />

        <div className="relative mx-auto max-w-7xl px-3 sm:px-4 md:px-8 lg:px-12">
          <div className="sticky top-2 z-40 mb-4 rounded-[24px] border border-white/10 bg-[#080812]/75 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:static sm:bg-transparent sm:p-0 sm:shadow-none">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between">
              <Link
                href={backToEditorHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm font-bold text-white/80 transition hover:bg-white/[0.1]"
              >
                <ArrowLeft size={17} />
                <span>Editor</span>
              </Link>

              <button
                onClick={handleRealSave}
                disabled={
                  saving || !previewData || generating || !mockupImages.length
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#5865F2] px-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(88,101,242,0.32)] transition hover:bg-[#4752C4] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {saving ? (
                  <RotateCcw size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </div>

          <div className="mb-5">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
              {generating ? (
                <RotateCcw size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {generating
                ? "Rendering mockups"
                : mockupImages.length
                ? "Mockups ready"
                : "Preview"}
            </div>

            <h1 className="max-w-4xl text-[30px] font-black uppercase leading-[0.9] tracking-[-0.04em] sm:text-5xl md:text-6xl">
              {product.title}
            </h1>

            {loadedPreview && !previewData && (
              <div className="mt-4 rounded-[24px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                No editor preview data found. Go back to the editor and generate
                preview again.
              </div>
            )}

            {rateLimited && (
              <div className="mt-4 rounded-[28px] border border-white/10 bg-[#111827]/80 p-5">
                <div className="flex gap-4">
                  <AlertCircle size={22} className="text-amber-300" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.14em]">
                      Preview is busy
                    </h3>
                    <p className="mt-2 text-sm text-white/70">
                      Wait a few seconds, then try again.
                    </p>
                    <button
                      onClick={() => generateTempMockup(true)}
                      disabled={generating}
                      className="mt-4 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-black text-[#03140d]"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!rateLimited && mockupError && (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/70">
                Mockup preview failed: {mockupError}
              </div>
            )}
          </div>

          {previewImages.length > 0 ? (
            <PreviewGallery
              images={previewImages.slice(0, 4)}
              title={product.title}
              category={category}
              price={Number(product.final_price || product.price || 0)}
              isAi={false}
            />
          ) : (
            <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                {generating ? (
                  <RotateCcw className="animate-spin" size={24} />
                ) : (
                  <Sparkles size={24} />
                )}
              </div>
              <h2 className="text-xl font-black uppercase">
                {generating ? "Rendering mockups" : "Preparing preview"}
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Your canvas design is being rendered into product mockups.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}