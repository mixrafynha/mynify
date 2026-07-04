import { useCallback, useEffect, useRef, useState } from "react";

interface UseTopBarZoomArgs {
  zoom?: number;
  zoomIn: () => void;
  zoomOut: () => void;
  onZoomChange?: (zoom: number) => void;
}

const ZOOM_MIN = 25;
const ZOOM_MAX = 200;
const ZOOM_STEP = 25;

function clampZoomSafe(value: number) {
  return Math.min(
    ZOOM_MAX,
    Math.max(ZOOM_MIN, Math.round(Number(value) || 100))
  );
}

export function useTopBarZoom({
  zoom = 100,
  zoomIn,
  zoomOut,
  onZoomChange,
}: UseTopBarZoomArgs) {
  const [localZoom, setLocalZoom] = useState(() => clampZoomSafe(zoom));
  const lastZoomRef = useRef(clampZoomSafe(zoom));

  useEffect(() => {
    const nextZoom = clampZoomSafe(zoom);
    setLocalZoom(nextZoom);
    lastZoomRef.current = nextZoom;
  }, [zoom]);

  const setZoom = useCallback(
    (value: number) => {
      const nextZoom = clampZoomSafe(value);
      const previousZoom = lastZoomRef.current;

      setLocalZoom(nextZoom);
      lastZoomRef.current = nextZoom;

      if (onZoomChange) {
        onZoomChange(nextZoom);
        return;
      }

      if (nextZoom > previousZoom) zoomIn();
      if (nextZoom < previousZoom) zoomOut();
    },
    [onZoomChange, zoomIn, zoomOut]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom(lastZoomRef.current + ZOOM_STEP);
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        setZoom(lastZoomRef.current - ZOOM_STEP);
      }

      if (event.key === "0") {
        event.preventDefault();
        setZoom(100);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setZoom]);

  return { zoom: localZoom, setZoom };
}