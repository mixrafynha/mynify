"use client";

import { useState } from "react";

export function useCanvasSelection() {
  const [selectionBox, setSelectionBox] =
    useState<any>(null);

  return {
    selectionBox,
    setSelectionBox,
  };
}