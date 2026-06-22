"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductionPreview from "@/app/dashboard/design/components/preview/ProductionPreview";

function readPreviewPayload(id: string) {
  if (typeof window === "undefined") return null;

  const keys = [
    `mynify-editor-preview:${id}`,
    "mynify-editor-preview:draft",
  ];

  for (const key of keys) {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (!raw) continue;

    try {
      return JSON.parse(raw);
    } catch {}
  }

  return null;
}

export default function ProductionPreviewPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = useMemo(() => String(params?.id || "draft"), [params?.id]);
  const [payload, setPayload] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setPayload(readPreviewPayload(id));
    setLoaded(true);
  }, [id]);

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050d] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-bold text-white/70">
          Loading production preview...
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05050d] px-4 text-white">
        <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.05] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-200">Preview unavailable</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.06em]">No editor preview found.</h1>
          <p className="mt-3 text-sm leading-6 text-white/58">
            Go back to the editor, make sure the design has a product selected, then open Preview again.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/design")}
            className="mt-5 h-11 rounded-2xl bg-white px-5 text-sm font-black text-[#05050d] transition active:scale-95"
          >
            Back to editor
          </button>
        </div>
      </main>
    );
  }

  return <ProductionPreview input={payload} onClose={() => router.back()} />;
}
