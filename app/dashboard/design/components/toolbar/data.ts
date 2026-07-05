export * from "../data";

const MAX_PRINT_IMAGE_BYTES = 25 * 1024 * 1024;

type PrintImageValidationResult =
  | {
      ok: true;
      error: null;
      message: string;
      label: "PRO";
    }
  | {
      ok: false;
      error: string;
      message: string;
      label: "ERROR";
    };

export const PRINT_IMAGE_LIMITS = {
  maxBytes: MAX_PRINT_IMAGE_BYTES,
  maxFileSize: MAX_PRINT_IMAGE_BYTES,
};

export const bytesToMb = (bytes: number) => bytes / 1024 / 1024;

export function validatePrintImage(file: File): PrintImageValidationResult {
  if (file.size > PRINT_IMAGE_LIMITS.maxFileSize) {
    const message = `Image is too large. Max ${bytesToMb(
      PRINT_IMAGE_LIMITS.maxFileSize,
    ).toFixed(0)}MB.`;

    return {
      ok: false,
      error: message,
      message,
      label: "ERROR",
    };
  }

  return {
    ok: true,
    error: null,
    message: "Image ready.",
    label: "PRO",
  };
}
