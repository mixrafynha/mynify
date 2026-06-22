"use client";

import { useMemo } from "react";

import { validateElement } from "../engine/preflight";

export function usePreflight(
  elements: any[],
  safeArea: any
) {
  const warnings = useMemo(() => {
    return elements.flatMap((element) =>
      validateElement(element, safeArea)
    );
  }, [elements, safeArea]);

  const quality = useMemo(() => {
    const count = warnings.length;

    if (count === 0) {
      return "Excellent";
    }

    if (count <= 2) {
      return "Good";
    }

    return "Poor";
  }, [warnings]);

  return {
    warnings,
    quality,
    warningCount: warnings.length,
  };
}