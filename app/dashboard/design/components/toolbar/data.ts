export * from "../data";

const MAX_PRINT_IMAGE_BYTES = 25 * 1024 * 1024;

export const PRINT_IMAGE_LIMITS = {
  maxBytes: MAX_PRINT_IMAGE_BYTES,
  maxFileSize: MAX_PRINT_IMAGE_BYTES,
};

export const bytesToMb = (bytes: number) => bytes / 1024 / 1024;

export function validatePrintImage(file: File) {
  if (file.size > PRINT_IMAGE_LIMITS.maxFileSize) {
    return {
      ok: false,
      error: `Image is too large. Max ${bytesToMb(PRINT_IMAGE_LIMITS.maxFileSize).toFixed(0)}MB.`,
    };
  }

  return { ok: true, error: null };
}
