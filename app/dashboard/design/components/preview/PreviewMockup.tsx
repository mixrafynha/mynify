"use client";

import { memo, useMemo, useState } from "react";
import { MOCKUP_AREA } from "../canvas/constants";
import { MOCKUP_VISUAL_SCALE_BY_PRODUCT } from "../canvas/productConfig";
import PreviewCleanElement from "./PreviewCleanElement";
import type { PreviewSideData } from "./types/preview";

function isDarkColor(color: string) {
  const value = String(color || "#ffffff").replace("#", "");
  if (value.length < 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 < 120;
}

function DesignOverlay({ data, className = "" }: { data: PreviewSideData; className?: string }) {
  const sorted = useMemo(
    () => [...data.elements].sort((a, b) => Number(a.zIndex || 0) - Number(b.zIndex || 0)),
    [data.elements],
  );

  return (
    <div className={`pointer-events-none overflow-hidden ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          transform: `scale(${MOCKUP_AREA.width / Math.max(1, data.safeArea.width)})`,
          transformOrigin: `${(data.safeArea.x / MOCKUP_AREA.width) * 100}% ${(data.safeArea.y / MOCKUP_AREA.height) * 100}%`,
        }}
      >
        <div
          className="absolute"
          style={{
            left: -data.safeArea.x,
            top: -data.safeArea.y,
            width: MOCKUP_AREA.width,
            height: MOCKUP_AREA.height,
          }}
        >
          {sorted.map((el) => (
            <PreviewCleanElement key={el.id} el={el} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewMockup({
  data,
  productId,
  color,
  generatedMockupUrl,
  generatedIncludesDesign = false,
  generating,
}: {
  data: PreviewSideData;
  productId: string;
  color: string;
  generatedMockupUrl?: string | null;
  generatedIncludesDesign?: boolean;
  generating?: boolean;
}) {
  const [aiImageFailed, setAiImageFailed] = useState(false);
  const sorted = useMemo(
    () => [...data.elements].sort((a, b) => Number(a.zIndex || 0) - Number(b.zIndex || 0)),
    [data.elements],
  );

  const visualScale = MOCKUP_VISUAL_SCALE_BY_PRODUCT?.[productId]?.[data.side] ?? 1;
  const dark = isDarkColor(color);
  const hasAiMockup = Boolean(generatedMockupUrl) && !aiImageFailed;

  return (
    <section className="relative flex h-dvh min-h-0 w-screen items-center justify-center overflow-hidden bg-[#f4f1ec]" data-production-preview-root>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,.98),transparent_31%),linear-gradient(180deg,#fbfaf7_0%,#eee9e0_100%)]" />
      <div className="absolute bottom-[5%] left-1/2 h-[11%] w-[58%] -translate-x-1/2 rounded-[100%] bg-black/14 blur-3xl" />

      {generating && !hasAiMockup && (
        <div className="absolute left-1/2 top-20 z-30 -translate-x-1/2 rounded-full border border-black/10 bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[.16em] text-black/65 shadow-lg backdrop-blur-xl">
          Generating free model mockups...
        </div>
      )}

      <div className="relative z-10 flex h-full w-full items-center justify-center p-2 pt-16 sm:p-6 sm:pt-20 lg:p-8">
        {hasAiMockup ? (
          <div className="relative flex h-full w-full items-center justify-center">
            <img
              src={generatedMockupUrl || ""}
              alt={`${productId} generated ${data.side}`}
              draggable={false}
              onError={() => setAiImageFailed(true)}
              className="block max-h-[92dvh] max-w-[100vw] select-none object-contain drop-shadow-[0_40px_55px_rgba(0,0,0,.24)]"
            />

            {!generatedIncludesDesign && (
              <DesignOverlay
                data={data}
                className="absolute left-1/2 top-[43%] z-20 aspect-[3/4] w-[min(25vw,175px)] -translate-x-1/2 -translate-y-1/2 opacity-95 mix-blend-multiply sm:w-[min(18vw,215px)]"
              />
            )}
          </div>
        ) : (
          <div className="relative aspect-square h-auto w-[min(96vw,88dvh,900px)] max-w-full overflow-visible">
            <div
              className="absolute inset-0"
              style={{ transform: `scale(${visualScale})`, transformOrigin: "center" }}
            >
              {data.mockupUrl ? (
                <>
                  <img
                    src={data.mockupUrl}
                    alt={`${productId} ${data.side}`}
                    draggable={false}
                    className="absolute inset-0 h-full w-full select-none object-contain drop-shadow-[0_40px_55px_rgba(0,0,0,.30)]"
                  />
                  <div
                    className={`absolute inset-0 ${dark ? "opacity-85" : "opacity-62"}`}
                    style={{
                      backgroundColor: color,
                      mixBlendMode: dark ? "normal" : "multiply",
                      WebkitMaskImage: `url(${data.mockupUrl})`,
                      maskImage: `url(${data.mockupUrl})`,
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                    }}
                  />
                </>
              ) : (
                <div
                  className="absolute left-1/2 top-1/2 h-[72%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-[28%_28%_16%_16%] shadow-[0_42px_60px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.18)]"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>

            <div
              className="absolute z-20 overflow-hidden"
              style={{
                left: `${(data.safeArea.x / MOCKUP_AREA.width) * 100}%`,
                top: `${(data.safeArea.y / MOCKUP_AREA.height) * 100}%`,
                width: `${(data.safeArea.width / MOCKUP_AREA.width) * 100}%`,
                height: `${(data.safeArea.height / MOCKUP_AREA.height) * 100}%`,
              }}
            >
              {sorted.map((el) => (
                <PreviewCleanElement key={el.id} el={el} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default memo(PreviewMockup);
