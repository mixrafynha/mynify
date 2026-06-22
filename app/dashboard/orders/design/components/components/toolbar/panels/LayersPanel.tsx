"use client";

import { Eye, EyeOff, Lock, Unlock, MoveDown, MoveUp, Trash2 } from "lucide-react";

type Props = { elements?: any[]; selected?: any; setSelectedId?: (id: string | null) => void; setSelectedElement?: (el: any) => void; updateElement?: (id: string, patch: any) => void; deleteElement?: (id: string) => void };

export default function LayersPanel({ elements = [], selected, setSelectedId, setSelectedElement, updateElement, deleteElement }: Props) {
  const sorted = [...elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
  if (!sorted.length) return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">No layers yet.</div>;
  return <div className="space-y-2 pb-6">{sorted.map((el) => {
    const active = selected?.id === el.id;
    const title = el.type === "text" ? el.text || "Text" : el.meta?.title || el.type || "Element";
    return <div key={el.id} className={`flex min-h-10 items-center gap-2 rounded-xl border px-2 ${active ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white"}`}>
      <button type="button" onClick={() => { setSelectedId?.(el.id); setSelectedElement?.(el); }} className="min-w-0 flex-1 text-left"><p className="truncate text-sm font-black text-white">{title}</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{el.type}</p></button>
      <Icon onClick={() => updateElement?.(el.id, { meta: { ...(el.meta || {}), hidden: !el.meta?.hidden } })}>{el.meta?.hidden ? <EyeOff size={14} /> : <Eye size={14} />}</Icon>
      <Icon onClick={() => updateElement?.(el.id, { locked: !el.locked, meta: { ...(el.meta || {}), locked: !el.meta?.locked } })}>{el.meta?.locked || el.locked ? <Lock size={14} /> : <Unlock size={14} />}</Icon>
      <Icon onClick={() => updateElement?.(el.id, { zAction: "bringForward" })}><MoveUp size={14} /></Icon>
      <Icon onClick={() => updateElement?.(el.id, { zAction: "sendBackward" })}><MoveDown size={14} /></Icon>
      <Icon onClick={() => deleteElement?.(el.id)} danger><Trash2 size={14} /></Icon>
    </div>})}</div>;
}

function Icon({ children, onClick, danger }: any) { return <button type="button" onClick={onClick} className={`flex h-8 w-8 items-center justify-center rounded-xl ${danger ? "bg-red-500/15 text-red-300" : "bg-white/5 text-slate-300"}`}>{children}</button>; }
