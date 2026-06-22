"use client";

import { memo, useCallback, useRef, useState } from "react";
import { Download, RotateCcw, Save, ShieldCheck } from "lucide-react";
import {
  captureProductionPreview,
  downloadDataUrl,
} from "./services/previewCapture";

function PreviewActions({
  captureNode,
  onSaveDesign,
  productId,
  side,
}: {
  captureNode: React.RefObject<HTMLElement | null>;
  onSaveDesign?: () => Promise<void> | void;
  productId: string;
  side: string;
}) {
  const [busy, setBusy] = useState<"download" | "save" | null>(null);
  const lockRef = useRef(false);

  const download = useCallback(async () => {
    if (lockRef.current) return;

    lockRef.current = true;
    setBusy("download");

    try {
      const png = await captureProductionPreview(captureNode.current);
      if (png) downloadDataUrl(png, `${productId}-${side}-production-preview.png`);
    } finally {
      lockRef.current = false;
      setBusy(null);
    }
  }, [captureNode, productId, side]);

  const save = useCallback(async () => {
    if (!onSaveDesign || lockRef.current) return;

    lockRef.current = true;
    setBusy("save");

    try {
      await onSaveDesign();
    } finally {
      lockRef.current = false;
      setBusy(null);
    }
  }, [onSaveDesign]);

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-2.5">
      <div className="mb-2 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-[.16em] text-white/38">
        <ShieldCheck size={14} /> Production actions
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <button
          type="button"
          onClick={download}
          disabled={!!busy}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm font-black text-white transition hover:bg-white/[.09] active:scale-[.98] disabled:opacity-50"
        >
          {busy === "download" ? <RotateCcw size={16} className="animate-spin" /> : <Download size={16} />}
          Download Preview
        </button>

        <button
          type="button"
          onClick={save}
          disabled={!onSaveDesign || !!busy}
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(168,85,247,.28)] transition hover:brightness-110 active:scale-[.98] disabled:opacity-50"
        >
          {busy === "save" ? <RotateCcw size={16} className="animate-spin" /> : <Save size={16} />}
          Save Design
        </button>
      </div>
    </section>
  );
}

export default memo(PreviewActions);
