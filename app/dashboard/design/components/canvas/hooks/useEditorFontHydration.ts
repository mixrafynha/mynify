"use client";

import { useEffect, useMemo, useState } from "react";
import { loadEditorFont } from "../../data/fonts";

function collectTextFontFamilies(elements: any[]) {
  const families = new Set<string>();

  (Array.isArray(elements) ? elements : []).forEach((element) => {
    if (!element || element.type !== "text") return;

    const family = element.fontFamily || element.meta?.fontFamily;
    if (typeof family === "string" && family.trim()) {
      families.add(family.trim());
    }
  });

  return Array.from(families).sort((a, b) => a.localeCompare(b));
}

export function useEditorFontHydration(elements: any[]) {
  const fontKey = useMemo(
    () => collectTextFontFamilies(elements).join("|"),
    [elements],
  );
  const [readyKey, setReadyKey] = useState(fontKey);

  useEffect(() => {
    let cancelled = false;
    const families = fontKey ? fontKey.split("|").filter(Boolean) : [];

    async function loadFonts() {
      try {
        await Promise.all(families.map((family) => loadEditorFont(family)));
        await (document.fonts?.ready ?? Promise.resolve());
      } catch {
        // Font loading must never block editor usage permanently.
      }

      if (!cancelled) setReadyKey(fontKey);
    }

    void loadFonts();

    return () => {
      cancelled = true;
    };
  }, [fontKey]);

  return {
    fontsReady: readyKey === fontKey,
    fontRenderKey: readyKey || "default-fonts",
  };
}
