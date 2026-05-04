"use client";

import { useCallback } from "react";
import { ElementType } from "../../types/editor.types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// limites reais de print (Gelato-safe)
const MAX_WIDTH = 4000;
const MAX_HEIGHT = 4000;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function validateImage(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const ok =
        img.width <= MAX_WIDTH &&
        img.height <= MAX_HEIGHT;

      URL.revokeObjectURL(img.src);
      resolve(ok);
    };

    img.onerror = () => resolve(false);

    img.src = URL.createObjectURL(file);
  });
}

export function useUpload(setElements: any) {
  return useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 1. tipo
      if (!ALLOWED_TYPES.includes(file.type)) return;

      // 2. tamanho
      if (file.size > MAX_FILE_SIZE) return;

      // 3. dimensões reais (IMPORTANTE para impressão)
      const isValid = await validateImage(file);
      if (!isValid) return;

      const url = URL.createObjectURL(file);

      setElements((prev: ElementType[]) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "image",
          src: url,
          x: 120,
          y: 120,

          // padrão seguro para print
          width: 140,
          height: 140,
        },
      ]);

      e.target.value = "";
    },
    [setElements]
  );
}