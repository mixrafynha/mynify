import { useCallback, useState } from "react";
import { storePreviewPayload } from "../services/previewStorage";
import type { PreviewPayloadInput } from "../types";

interface UsePreviewActionArgs extends PreviewPayloadInput {
  isBusy: boolean;
  onPreviewDesign: () => Promise<void> | void;
}

export function usePreviewAction({ isBusy, onPreviewDesign, ...payload }: UsePreviewActionArgs) {
  const [previewing, setPreviewing] = useState(false);

  const openPreview = useCallback(async () => {
    if (isBusy || previewing) return;

    try {
      setPreviewing(true);
      await storePreviewPayload(payload);
      await onPreviewDesign();
    } catch {
      alert("Error opening preview.");
    } finally {
      setPreviewing(false);
    }
  }, [isBusy, onPreviewDesign, payload, previewing]);

  return { previewing, openPreview };
}
