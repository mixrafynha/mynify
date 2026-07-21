"use client";

import { memo, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, ChevronsDown, ChevronsUp, Eye, EyeOff, GripVertical, Lock, Trash2, Unlock } from "lucide-react";

type Props = {
  elements?: any[];
  selected?: any;
  setSelectedId?: (id: string | null) => void;
  setSelectedElement?: (element: any | null) => void;
  updateElement?: (id: string, patch: any) => void;
  deleteElement?: (id: string) => void;
};

function layerName(element: any) {
  if (element?.type === "text") return String(element.text || element.content || "Text layer").replace(/\s+/g, " ");
  return String(element?.meta?.title || element?.meta?.sticker || element?.meta?.shape || element?.type || "Layer");
}

function layerKind(element: any) {
  if (element?.type === "sticker-element" || element?.meta?.sticker) return "Sticker";
  if (element?.meta?.isVector) return "Vector";
  return String(element?.type || "Element");
}

function LayersPanel({ elements = [], selected, setSelectedId, setSelectedElement, updateElement, deleteElement }: Props) {
  const ordered = useMemo(() => [...elements].sort((a, b) => (Number(a?.zIndex) || 0) - (Number(b?.zIndex) || 0)), [elements]);
  const visible = useMemo(() => [...ordered].reverse(), [ordered]);

  const select = useCallback((element: any) => {
    setSelectedId?.(String(element.id));
    setSelectedElement?.(element);
  }, [setSelectedElement, setSelectedId]);

  const reorder = useCallback((id: string, action: "up" | "down" | "top" | "bottom") => {
    const next = [...ordered];
    const index = next.findIndex((element) => element.id === id);
    if (index < 0) return;
    const [current] = next.splice(index, 1);
    const target = action === "top" ? next.length : action === "bottom" ? 0 : action === "up" ? Math.min(next.length, index + 1) : Math.max(0, index - 1);
    next.splice(target, 0, current);
    next.forEach((element, zIndex) => {
      if ((Number(element.zIndex) || 0) !== zIndex) updateElement?.(element.id, { zIndex });
    });
  }, [ordered, updateElement]);

  const remove = useCallback((element: any) => {
    deleteElement?.(element.id);
    if (selected?.id === element.id) {
      setSelectedId?.(null);
      setSelectedElement?.(null);
    }
  }, [deleteElement, selected?.id, setSelectedElement, setSelectedId]);

  if (!visible.length) return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center text-sm font-bold text-slate-400">No layers yet.</div>;

  return <div className="space-y-2 pb-6">{visible.map((element, visualIndex) => {
    const active = selected?.id === element.id;
    const hidden = Boolean(element?.meta?.hidden);
    const locked = Boolean(element?.locked || element?.meta?.locked);
    return <div key={element.id} className={`group rounded-2xl border p-2 transition ${active ? "border-violet-400 bg-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,.14)]" : "border-white/10 bg-white/[0.045] hover:border-white/20"}`}>
      <div className="flex min-h-11 items-center gap-2">
        <GripVertical size={15} className="shrink-0 text-white/25" />
        <button type="button" onClick={() => select(element)} className="min-w-0 flex-1 text-left" aria-pressed={active}>
          <p className={`truncate text-sm font-black ${hidden ? "text-slate-500 line-through" : "text-white"}`}>{layerName(element)}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{layerKind(element)} · layer {visible.length - visualIndex}</p>
        </button>
        <Action label={hidden ? "Show layer" : "Hide layer"} onClick={() => updateElement?.(element.id, { meta: { ...(element.meta || {}), hidden: !hidden } })}>{hidden ? <EyeOff size={14} /> : <Eye size={14} />}</Action>
        <Action label={locked ? "Unlock layer" : "Lock layer"} onClick={() => updateElement?.(element.id, { locked: !locked, meta: { ...(element.meta || {}), locked: !locked } })}>{locked ? <Lock size={14} /> : <Unlock size={14} />}</Action>
      </div>
      {active && <div className="mt-1 flex items-center justify-end gap-1 border-t border-white/8 pt-2">
        <Action label="Send to bottom" onClick={() => reorder(element.id, "bottom")}><ChevronsDown size={14} /></Action>
        <Action label="Move down" onClick={() => reorder(element.id, "down")}><ChevronDown size={14} /></Action>
        <Action label="Move up" onClick={() => reorder(element.id, "up")}><ChevronUp size={14} /></Action>
        <Action label="Bring to top" onClick={() => reorder(element.id, "top")}><ChevronsUp size={14} /></Action>
        <Action label="Delete layer" danger onClick={() => remove(element)}><Trash2 size={14} /></Action>
      </div>}
    </div>;
  })}</div>;
}

function Action({ children, label, onClick, danger = false }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" title={label} aria-label={label} onClick={(event) => { event.stopPropagation(); onClick(); }} className={`flex h-8 w-8 items-center justify-center rounded-xl transition active:scale-90 ${danger ? "bg-red-500/15 text-red-300 hover:bg-red-500/25" : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"}`}>{children}</button>;
}

export default memo(LayersPanel);
