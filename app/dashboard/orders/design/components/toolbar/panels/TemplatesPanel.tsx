"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TEMPLATE_CATEGORIES, TEMPLATES, loadEditorFont, type TemplatePreset } from "../data";
import { vectorDpiMeta } from "./dpi";

function addTemplate(createElement: ((element: any) => void) | undefined, template: TemplatePreset) {
  loadEditorFont(template.fontFamily);
  const width = Math.max(150, Math.round(template.text.length * template.fontSize * 0.54));
  const height = Math.round(template.fontSize * 1.34);
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
    meta: { fontFamily: template.fontFamily, color: template.color, fontSize: template.fontSize, fontWeight: template.fontWeight, letterSpacing: template.letterSpacing ?? 0, opacity: 1, rotation: 0, textAlign: "center", textShape: "straight", template: template.label, ...vectorDpiMeta("template", { qualityMode: "text-template-vector-400dpi" }) },
  });
}

export default function TemplatesPanel({ createElement }: { createElement?: (element: any) => void }) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    return TEMPLATES.filter((item) => {
      const categoryMatch = category === "all" || item.category === category;
      const queryMatch = !term || `${item.label} ${item.text} ${item.category}`.toLowerCase().includes(term);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  const visible = items.slice(0, page * 36);

  return (
    <div className="space-y-2 pb-3 text-slate-900">
      <label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-slate-500">
        <Search size={15} />
        <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search templates" className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400" />
      </label>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["all", ...TEMPLATE_CATEGORIES].map((item) => (
          <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[11px] font-black capitalize transition active:scale-95 ${category === item ? "bg-slate-950 text-white shadow-none" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((template) => (
          <button key={template.id} type="button" onClick={() => addTemplate(createElement, template)} className="group relative h-[92px] overflow-hidden rounded-xl p-2.5 text-left shadow-none ring-1 ring-slate-200 transition active:scale-[0.98]" style={{ background: template.background }}>
            <div className="hidden" />
            <div className="relative flex h-full flex-col justify-between">
              {template.tag && <span className="w-fit rounded-full bg-black/30 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-white/90 backdrop-blur">{template.tag}</span>}
              <div>
                <p className="whitespace-pre-line text-base font-black leading-[0.88] tracking-[-0.05em] text-white drop-shadow" style={{ fontFamily: template.fontFamily }}>{template.preview}</p>
                <p className="mt-1 truncate text-[9px] font-black uppercase tracking-[0.14em] text-white/70">{template.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {visible.length < items.length && <button type="button" onClick={() => setPage((value) => value + 1)} className="h-9 w-full rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700">Load more</button>}
      {!items.length && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">No templates found.</div>}
    </div>
  );
}
