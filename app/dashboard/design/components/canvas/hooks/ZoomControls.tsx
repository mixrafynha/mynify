"use client";

import { ZoomIn, ZoomOut, Maximize, Minus, Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface ZoomControlsProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  onFitScreen?: () => void;
  onZoomToSelection?: () => void;
  showPercentage?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  variant?: "floating" | "inline";
}

const positionClasses = {
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
};

const ZOOM_PRESETS = [25, 50, 75, 100, 150, 200];

export function ZoomControls({
  zoom,
  setZoom,
  minZoom = 0.25,
  maxZoom = 3,
  zoomStep = 0.1,
  onFitScreen,
  onZoomToSelection,
  showPercentage = true,
  position = "bottom-right",
  variant = "floating",
}: ZoomControlsProps) {
  const [showPresets, setShowPresets] = useState(false);

  const handleZoomIn = () => {
    setZoom(Math.min(maxZoom, zoom + zoomStep));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(minZoom, zoom - zoomStep));
  };

  const handleZoomTo = (value: number) => {
    setZoom(Math.max(minZoom, Math.min(maxZoom, value / 100)));
    setShowPresets(false);
  };

  const handleFitScreen = () => {
    onFitScreen?.();
  };

  const handleZoomToSelection = () => {
    onZoomToSelection?.();
  };

  const percentage = Math.round(zoom * 100);

  const containerClasses =
    variant === "floating"
      ? `fixed z-50 ${positionClasses[position]} flex gap-1 rounded-lg bg-white/95 shadow-lg backdrop-blur-sm border border-gray-200 p-1.5`
      : "flex gap-1 rounded-lg bg-gray-100 p-1.5";

  return (
    <div className={containerClasses}>
      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
        disabled={zoom <= minZoom}
        title="Zoom Out (Ctrl -)"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      {/* Zoom Percentage with Presets */}
      <div className="relative">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex h-8 min-w-[60px] items-center justify-center rounded-md px-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          title="Zoom presets"
        >
          {showPercentage ? `${percentage}%` : ""}
        </button>

        {showPresets && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPresets(false)}
            />
            <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[80px] rounded-lg bg-white shadow-lg border border-gray-200 py-1">
              {ZOOM_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleZoomTo(preset)}
                  className={`block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-100 ${
                    percentage === preset ? "bg-blue-50 text-blue-600" : "text-gray-700"
                  }`}
                >
                  {preset}%
                </button>
              ))}
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleFitScreen}
                className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                Fit to screen
              </button>
              {onZoomToSelection && (
                <button
                  onClick={handleZoomToSelection}
                  className="block w-full px-3 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Zoom to selection
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
        disabled={zoom >= maxZoom}
        title="Zoom In (Ctrl +)"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      {/* Separator */}
      <div className="mx-0.5 h-6 w-px bg-gray-300" />

      {/* Fit Screen */}
      <button
        onClick={handleFitScreen}
        className="flex h-8 w-8 items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-200"
        title="Fit to screen"
      >
        <Maximize className="h-4 w-4" />
      </button>
    </div>
  );
}