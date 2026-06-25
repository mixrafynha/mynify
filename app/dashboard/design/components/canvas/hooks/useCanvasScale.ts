"use client";

import { useEffect, useRef, useState } from "react";
import { MOCKUP_AREA } from "../constants";

const DESKTOP_MARGIN = 0.92;
const TABLET_MARGIN = 0.95;
const MOBILE_MARGIN = 0.98;

const MIN_SCALE = 0.08;
const MAX_SCALE = 6;

function getViewportMode() {
  if (typeof window === "undefined") return "desktop";

  if (window.innerWidth < 640) return "mobile";
  if (window.innerWidth < 1024) return "tablet";

  return "desktop";
}

export function useCanvasScale(
  wrapperRef: React.RefObject<HTMLDivElement | null>
) {
  const [canvasScale, setCanvasScale] = useState(1);

  const rafRef = useRef<number | null>(null);
  const lastScaleRef = useRef(1);

  useEffect(() => {
    const updateScale = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const wrapper = wrapperRef.current;

        if (!wrapper) return;

        const rect = wrapper.getBoundingClientRect();

        const mode = getViewportMode();

        const margin =
          mode === "mobile"
            ? MOBILE_MARGIN
            : mode === "tablet"
              ? TABLET_MARGIN
              : DESKTOP_MARGIN;

        const usableWidth = Math.max(
          1,
          rect.width * margin
        );

        const usableHeight = Math.max(
          1,
          rect.height * margin
        );

        const fitWidth =
          usableWidth / MOCKUP_AREA.width;

        const fitHeight =
          usableHeight / MOCKUP_AREA.height;

        const nextScale = Math.max(
          MIN_SCALE,
          Math.min(
            MAX_SCALE,
            Number(
              Math.min(
                fitWidth,
                fitHeight
              ).toFixed(4)
            )
          )
        );

        if (
          Math.abs(
            nextScale - lastScaleRef.current
          ) < 0.001
        ) {
          return;
        }

        lastScaleRef.current = nextScale;
        setCanvasScale(nextScale);
      });
    };

    updateScale();

    const observer = new ResizeObserver(
      updateScale
    );

    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }

    window.addEventListener(
      "resize",
      updateScale,
      { passive: true }
    );

    window.addEventListener(
      "orientationchange",
      updateScale,
      { passive: true }
    );

    return () => {
      observer.disconnect();

      window.removeEventListener(
        "resize",
        updateScale
      );

      window.removeEventListener(
        "orientationchange",
        updateScale
      );

      if (rafRef.current) {
        cancelAnimationFrame(
          rafRef.current
        );
      }
    };
  }, [wrapperRef]);

  return canvasScale;
}