"use client";

import { useEffect, useId } from "react";
import type { CanvasSide } from "./types";

type Props = {
  mockup: string;
  mockupId: string;
  currentSide: CanvasSide;
  color?: string;
  visualScale?: number;
  tint?: boolean;
};

export default function CanvasMockup({
  mockup,
  mockupId,
  currentSide,
  color = "#ffffff",
  visualScale = 1,
  tint = true,
}: Props) {
  function shortUrl(value: unknown) {
    if (typeof value !== "string" || !value.trim()) return null;
    const url = value.trim();
    return {
      start: url.slice(0, 80),
      end: url.slice(-30),
      length: url.length,
    };
  }

  function normalizeImageSource(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const source = value.trim();
    if (!source) return null;

    if (
      source.startsWith("data:image/") ||
      source.startsWith("blob:") ||
      /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(source)
    ) {
      return source;
    }

    return null;
  }

  const safeMockup = normalizeImageSource(mockup);
  const filterId = `mockup-tint-${useId().replace(/:/g, "")}`;
  const normalizedColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
    String(color).trim(),
  )
    ? String(color).trim().toLowerCase()
    : "#ffffff";

  useEffect(() => {
    const element = document.querySelector<HTMLElement>(
      `[data-mockup-export-root="${currentSide}"] img[src="${CSS.escape(safeMockup || "")}"]`,
    );
    const style = element ? window.getComputedStyle(element) : null;
    const rect = element?.getBoundingClientRect() ?? null;

    console.info("[checkout-preview:mockup-render]", {
      side: currentSide,
      mockupUrl: shortUrl(safeMockup),
      elementFound: Boolean(element),
      tagName: element?.tagName ?? null,
      kind: element instanceof HTMLImageElement ? "img" : element instanceof HTMLCanvasElement ? "canvas" : element ? "background-image" : null,
      complete: element instanceof HTMLImageElement ? element.complete : null,
      naturalWidth: element instanceof HTMLImageElement ? element.naturalWidth : null,
      naturalHeight: element instanceof HTMLImageElement ? element.naturalHeight : null,
      currentSrc: element instanceof HTMLImageElement ? shortUrl(element.currentSrc || element.src) : null,
      clientWidth: element?.clientWidth ?? null,
      clientHeight: element?.clientHeight ?? null,
      boundingClientRect: rect
        ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        : null,
      display: style?.display ?? null,
      visibility: style?.visibility ?? null,
      opacity: style?.opacity ?? null,
      zIndex: style?.zIndex ?? null,
      position: style?.position ?? null,
      transform: style?.transform ?? null,
    });
    console.info("[checkout-preview:mockup-load-success]", {
      side: currentSide,
      mockupUrl: shortUrl(safeMockup),
      elementFound: Boolean(element),
    });
    return () => undefined;
  }, [currentSide, safeMockup]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 mx-auto aspect-square w-full max-w-full select-none"
      style={{
        transform: `scale(${visualScale})`,
        transformOrigin: "center center",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[78%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[42%] bg-[radial-gradient(circle_at_50%_45%,rgba(168,85,247,.16),rgba(168,85,247,.06)_42%,transparent_72%)] blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[86%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-[42%] border border-violet-300/10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,.04),rgba(255,255,255,0)_58%)] opacity-70"
      />

      {tint && (
        <svg aria-hidden="true" className="absolute h-0 w-0">
          <defs>
            <filter
              id={filterId}
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodColor={normalizedColor} result="tintColor" />
              <feComposite
                in="tintColor"
                in2="SourceAlpha"
                operator="in"
                result="coloredShape"
              />
              <feBlend
                in="SourceGraphic"
                in2="coloredShape"
                mode="multiply"
              />
            </filter>
          </defs>
        </svg>
      )}

      {safeMockup ? (
        <img
          data-checkout-mockup-base={currentSide}
          src={safeMockup}
          alt={`${mockupId}-${currentSide}`}
          draggable={false}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover md:drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)]"
          onLoad={(event) => {
            const img = event.currentTarget;
            const style = window.getComputedStyle(img);
            const rect = img.getBoundingClientRect();
            console.info("[checkout-preview:mockup-load-success]", {
              side: currentSide,
              mockupUrl: shortUrl(safeMockup),
              tagName: img.tagName,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              currentSrc: shortUrl(img.currentSrc || img.src),
              clientWidth: img.clientWidth,
              clientHeight: img.clientHeight,
              boundingClientRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              zIndex: style.zIndex,
              position: style.position,
              transform: style.transform,
            });
          }}
          onError={(event) => {
            const target = event.currentTarget;
            const style = window.getComputedStyle(target);
            const rect = target.getBoundingClientRect();
            console.info("[checkout-preview:mockup-load-error]", {
              side: currentSide,
              mockupUrl: shortUrl(safeMockup),
              tagName: target.tagName,
              complete: target.complete,
              naturalWidth: target.naturalWidth,
              naturalHeight: target.naturalHeight,
              currentSrc: shortUrl(target.currentSrc || target.src),
              clientWidth: target.clientWidth,
              clientHeight: target.clientHeight,
              boundingClientRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              zIndex: style.zIndex,
              position: style.position,
              transform: style.transform,
            });
          }}
          style={{
            imageRendering: "auto",
            filter: tint ? `url(#${filterId})` : undefined,
            position: "absolute",
            inset: 0,
          }}
        />
      ) : null}
    </div>
  );
}
