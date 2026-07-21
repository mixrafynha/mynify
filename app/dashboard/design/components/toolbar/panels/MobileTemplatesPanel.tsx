"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crown } from "lucide-react";
import { TEMPLATES, type TemplatePreset } from "../data";
import { insertTemplate } from "./templateInsert";

const MOBILE_TEMPLATE_PAGE_SIZE = 12;

function getPreviewUrl(item: unknown) {
  const value = item as Record<string, any>;
  return String(
    value.previewUrl ??
      value.preview_url ??
      value.thumbnailUrl ??
      value.thumbnail_url ??
      value.templatePreviewUrl ??
      value.template_preview_url ??
      value.meta?.previewUrl ??
      value.meta?.preview_url ??
      "",
  );
}

function triggerTemplatePreview(template: TemplatePreset) {
  if (typeof window === "undefined") return;

  void fetch("/api/template-previews/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      templateId: template.id,
      label: template.label,
      category: template.category,
    }),
    keepalive: true,
  }).catch(() => undefined);
}

function MobileTemplatesPanel({
  createElement,
}: {
  createElement?: (element: any) => void;
}) {
  const requestedRef = useRef<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    return TEMPLATES.slice(0, page * MOBILE_TEMPLATE_PAGE_SIZE);
  }, [page]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const idle = (window as any).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 140));
    const cancelIdle = (window as any).cancelIdleCallback ?? window.clearTimeout;

    const id = idle(() => {
      visible.slice(0, 16).forEach((template) => {
        if (getPreviewUrl(template)) return;
        if (requestedRef.current.has(template.id)) return;
        requestedRef.current.add(template.id);
        triggerTemplatePreview(template);
      });
    });

    return () => cancelIdle(id as number);
  }, [visible]);

  const handleAdd = useCallback(
    (template: TemplatePreset) => insertTemplate(createElement, template),
    [createElement],
  );

  return (
    <div className="space-y-2 pb-3 text-white" style={{ contain: "layout paint style" }}>
      <div className="grid grid-cols-2 gap-2">
        {visible.map((template) => (
          <MobileTemplateCard
            key={template.id}
            template={template}
            previewUrl={getPreviewUrl(template)}
            onAdd={() => handleAdd(template)}
          />
        ))}
      </div>

      {visible.length < TEMPLATES.length && (
        <button
          type="button"
          onClick={() => setPage((value) => value + 1)}
          className="h-10 w-full rounded-2xl border border-violet-300/18 bg-white/[0.055] text-xs font-black text-violet-100 active:scale-[0.99]"
        >
          Load more
        </button>
      )}
    </div>
  );
}

const MobileTemplateCard = memo(function MobileTemplateCard({
  template,
  previewUrl,
  onAdd,
}: {
  template: TemplatePreset;
  previewUrl: string;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="relative h-[104px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-2 text-left active:scale-[0.99]"
      style={{ contain: "layout paint style" }}
    >
      {previewUrl ? (
        <img
          src={previewUrl}
          alt={template.label}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: template.background }}>
          <div className="absolute inset-x-2 bottom-7 line-clamp-2 text-[19px] font-black uppercase leading-[0.9] tracking-[-0.05em] text-white/90">
            {template.preview}
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex justify-end">
          {(template.tag === "PRO" || template.tag === "PREMIUM") && (
            <Crown size={13} className="text-amber-300 drop-shadow" />
          )}
        </div>

        <p className="relative z-10 truncate text-[10px] font-extrabold text-white/75">
          {template.subtitle ?? template.label}
        </p>
      </div>
    </button>
  );
});

export default memo(MobileTemplatesPanel);
