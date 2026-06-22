"use client";

import { Loader2, Shuffle, Wand2 } from "lucide-react";

type Props = {
  prompt: string;
  loading: boolean;
  notice: string;
  error: string;
  setPrompt: (value: string) => void;
  setNotice: (value: string) => void;
  setError: (value: string) => void;
  randomPrompt: () => void;
  generateImage: () => void;
};

function safePrompt(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").slice(0, 180);
}

export default function AiPromptBox({ prompt, loading, notice, error, setPrompt, setNotice, setError, randomPrompt, generateImage }: Props) {
  return (
    <div className="space-y-2 text-slate-900">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Wand2 size={16} />
        </div>
        <div className="min-w-0">
          <h2 className="text-xs font-black leading-none">AI Design Studio</h2>
          <p className="mt-0.5 text-[10px] font-medium text-slate-500">PNG transparente para print</p>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(safePrompt(e.target.value));
          setNotice("");
          setError("");
        }}
        rows={2}
        maxLength={180}
        placeholder="Descreve o design: skull rose vintage, gym mascot, streetwear logo..."
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
      />

      {(notice || error) && (
        <div className={`rounded-xl px-2.5 py-1.5 text-xs font-bold ${error ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200"}`}>
          {error || notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={randomPrompt}
          disabled={loading}
          className="flex h-9 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-slate-700 ring-1 ring-slate-200 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          <Shuffle size={15} /> Prompt
        </button>

        <button
          type="button"
          onClick={generateImage}
          disabled={loading || !prompt.trim()}
          className="flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-black text-white transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {loading ? "Criar..." : "Create"}
        </button>
      </div>
    </div>
  );
}
