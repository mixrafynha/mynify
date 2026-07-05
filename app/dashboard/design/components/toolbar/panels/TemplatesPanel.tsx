"use client";

import { memo, useDeferredValue, useMemo, useState } from "react";
import { Crown, Search } from "lucide-react";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATES,
  loadEditorFont,
  type TemplatePreset,
} from "../data";

const MOBILE_TEMPLATE_PAGE_SIZE = 12;
const DESKTOP_TEMPLATE_PAGE_SIZE = 30;

function getTemplatePageSize() {
  if (typeof window === "undefined") return DESKTOP_TEMPLATE_PAGE_SIZE;
  return window.matchMedia?.("(max-width: 767px)").matches
    ? MOBILE_TEMPLATE_PAGE_SIZE
    : DESKTOP_TEMPLATE_PAGE_SIZE;
}

function addTemplate(
  createElement: ((element: any) => void) | undefined,
  template: TemplatePreset,
) {
  void loadEditorFont(template.fontFamily);
  const width = Math.max(
    150,
    Math.round(template.text.length * template.fontSize * 0.52),
  );
  const height = Math.round(
    template.fontSize * (template.text.includes(" ") ? 1.45 : 1.25),
  );

  createElement?.({
    type: "text",
    text: template.text,
    content: template.text,
    width,
    height,
    fontFamily: template.fontFamily,
    fontSize: template.fontSize,
    fontWeight: template.fontWeight,
    color: template.color,
    meta: {
      fontFamily: template.fontFamily,
      color: template.color,
      fontSize: template.fontSize,
      fontWeight: template.fontWeight,
      letterSpacing: template.letterSpacing ?? 0,
      lineHeight: template.lineHeight ?? 0.92,
      opacity: 1,
      rotation: 0,
      textAlign: "center",
      textShape: "straight",
      template: template.label,
    },
  });
}

function TemplatesPanel({
  createElement,
}: {
  createElement?: (element: any) => void;
}) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(query);

  const items = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    return TEMPLATES.filter((item) => {
      const categoryMatch = category === "all" || item.category === category;
      const queryMatch =
        !term ||
        `${item.label} ${item.text} ${item.category} ${item.subtitle ?? ""}`
          .toLowerCase()
          .includes(term);
      return categoryMatch && queryMatch;
    });
  }, [category, deferredQuery]);

  const visible = useMemo(
    () => items.slice(0, page * getTemplatePageSize()),
    [items, page],
  );

  return (
    <div className="space-y-2 pb-3 text-white">
      <label className="group flex h-8 items-center gap-2 rounded-xl border border-violet-300/18 bg-white/[0.045] px-2.5 text-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,.045)] transition focus-within:border-fuchsia-400/45 focus-within:bg-white/[0.07] focus-within:shadow-[0_0_0_2px_rgba(168,85,247,.12)]">
        <Search
          size={14}
          className="shrink-0 text-violet-200/70 transition group-focus-within:text-fuchsia-200"
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Search templates"
          className="min-w-0 flex-1 bg-transparent text-[12px] font-bold text-white outline-none placeholder:text-white/38"
        />
      </label>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["all", ...TEMPLATE_CATEGORIES].map((item) => {
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCategory(item);
                setPage(1);
              }}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black capitalize transition active:scale-95 ${
                active
                  ? "border-fuchsia-300/55 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_0_22px_rgba(168,85,247,.35)]"
                  : "border-white/12 bg-white/[0.04] text-violet-100/78 hover:border-violet-300/35 hover:bg-white/[0.07]"
              }`}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            createElement={createElement}
          />
        ))}
      </div>

      {visible.length < items.length && (
        <button
          type="button"
          onClick={() => setPage((value) => value + 1)}
          className="h-10 w-full rounded-2xl border border-violet-300/20 bg-white/[0.06] text-sm font-black text-violet-100 transition hover:bg-white/[0.09]"
        >
          Load more
        </button>
      )}

      {!items.length && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-5 text-center text-sm font-bold text-white/55">
          No templates found.
        </div>
      )}
    </div>
  );
}

const TemplateCard = memo(function TemplateCard({
  template,
  createElement,
}: {
  template: TemplatePreset;
  createElement?: (element: any) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => addTemplate(createElement, template)}
      className="group relative h-[136px] overflow-hidden rounded-[1.35rem] border border-white/10 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,.06)] transition will-change-transform hover:-translate-y-0.5 hover:border-violet-300/35 hover:shadow-[0_16px_36px_rgba(0,0,0,.32),0_0_26px_rgba(139,92,246,.12)] active:scale-[0.985]"
      style={{ background: template.background }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,.08),transparent_36%,rgba(255,255,255,.025)_72%,transparent)] opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/58 to-transparent" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          {template.tag && (
            <span
              className="rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-sm"
              style={{
                backgroundColor: `${template.accent}4D`,
                borderColor: `${template.accent}80`,
              }}
            >
              {template.tag}
            </span>
          )}
          {(template.tag === "PRO" || template.tag === "PREMIUM") && (
            <Crown size={13} className="text-amber-300 drop-shadow" />
          )}
        </div>

        <div>
          <p
            className="whitespace-pre-line text-[1.72rem] font-black uppercase leading-[0.84] tracking-[-0.055em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.55)]"
            style={{
              fontFamily: template.fontFamily,
              color: template.color,
              letterSpacing: template.letterSpacing ?? undefined,
            }}
          >
            {template.preview}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[10px] font-extrabold text-white/68">
              {template.subtitle ?? template.label}
            </p>
            <span
              className="h-1.5 w-8 shrink-0 rounded-full"
              style={{ backgroundColor: template.accent }}
            />
          </div>
        </div>
      </div>
    </button>
  );
});

export default memo(TemplatesPanel);
