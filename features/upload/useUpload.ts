"use client";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export type UploadedImage = {
  file: File;
  url: string;
  naturalWidth: number;
  naturalHeight: number;
};

export function isValidUploadFile(file: File) {
  return (
    ALLOWED_TYPES.includes(file.type) ||
    /\.(png|jpg|jpeg|webp)$/i.test(file.name)
  );
}

export function validateUploadFileSize(file: File) {
  return file.size <= MAX_FILE_SIZE;
}

export async function readUploadedImage(file: File): Promise<UploadedImage> {
  if (!file) throw new Error("File is required.");

  if (!isValidUploadFile(file)) {
    throw new Error("Apenas PNG, JPG ou WEBP.");
  }

  if (!validateUploadFileSize(file)) {
    throw new Error("A imagem deve ter no máximo 25MB.");
  }

  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      img.src = url;
    });

    return {
      file,
      url,
      naturalWidth: image.naturalWidth || image.width,
      naturalHeight: image.naturalHeight || image.height,
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}
