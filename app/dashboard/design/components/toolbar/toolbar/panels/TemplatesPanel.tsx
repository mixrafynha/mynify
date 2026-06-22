"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { TEMPLATE_CATEGORIES, TEMPLATES, loadEditorFont, type TemplatePreset } from "../data";

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
    meta: { fontFamily: template.fontFamily, color: template.color, fontSize: template.fontSize, fontWeight: template.fontWeight, letterSpacing: template.letterSpacing ?? 0, opacity: 1, rotation: 0, textAlign: "center", textShape: "straight", template: template.label },
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
    <div className="space-y-4 pb-6 text-white">
      <label className="flex h-11 items-center gap-2 rounded-[24px] bg-white/[0.055] ring-1 ring-white/10 px-3 text-slate-400">
        <Search size={15} />
        <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search templates" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600" />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {["all", ...TEMPLATE_CATEGORIES].map((item) => (
          <button key={item} type="button" onClick={() => { setCategory(item); setPage(1); }} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black capitalize transition active:scale-95 ${category === item ? "bg-violet-400 text-slate-950 shadow-[0_10px_26px_rgba(168,85,247,0.18)]" : "bg-white/[0.055] text-slate-400 ring-1 ring-white/10 hover:bg-white/[0.09]"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((template) => (
          <button key={template.id} type="button" onClick={() => addTemplate(createElement, template)} className="group relative h-[124px] overflow-hidden rounded-[28px] p-3 text-left shadow-[0_18px_42px_rgba(0,0,0,0.22)] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:ring-white/30 active:scale-[0.98]" style={{ background: template.background }}>
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/18 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between">
              {template.tag && <span className="w-fit rounded-full bg-black/30 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/90 backdrop-blur">{template.tag}</span>}
              <div>
                <p className="whitespace-pre-line text-xl font-black leading-[0.88] tracking-[-0.05em] text-white drop-shadow" style={{ fontFamily: template.fontFamily }}>{template.preview}</p>
                <p className="mt-2 truncate text-[10px] font-black uppercase tracking-[0.14em] text-white/70">{template.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {visible.length < items.length && <button type="button" onClick={() => setPage((value) => value + 1)} className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-black text-white">Load more</button>}
      {!items.length && <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm font-bold text-slate-400">No templates found.</div>}
    </div>
  );
}
