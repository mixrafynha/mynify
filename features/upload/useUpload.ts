"use client";

import { useCallback } from "react";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

type CanvasElement = {
  type: "image";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  meta: Record<string, unknown>;
};

export function useUpload(
  addElement?: (el: CanvasElement) => void
) {
  return useCallback(
    (file: File) => {
      if (!file) return;

      const isValidType =
        ALLOWED_TYPES.includes(file.type) ||
        /\.(png|jpg|jpeg|webp)$/i.test(file.name);

      if (!isValidType) {
        alert("Apenas PNG, JPG ou WEBP.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert("A imagem deve ter no máximo 2MB.");
        return;
      }

      if (!addElement) return;

      const url = URL.createObjectURL(file);

      const img = new window.Image();

      img.onload = () => {
        const MAX_SIZE = 360;

        const ratio = img.width / img.height;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          width = MAX_SIZE;
          height = MAX_SIZE / ratio;
        } else {
          height = MAX_SIZE;
          width = MAX_SIZE * ratio;
        }

        addElement({
          type: "image",
          src: url,

          // centraliza melhor
          x: 180,
          y: 180,

          width,
          height,

          meta: {
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            naturalWidth: img.width,
            naturalHeight: img.height,
          },
        });
      };

      img.src = url;
    },
    [addElement]
  );
}