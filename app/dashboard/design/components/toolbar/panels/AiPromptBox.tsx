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

export default function AiPromptBox({
  prompt,
  loading,
  notice,
  error,
  setPrompt,
  setNotice,
  setError,
  randomPrompt,
  generateImage,
}: Props) {
  return (
    <div className="space-y-3 text-white">
      <textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(safePrompt(e.target.value));
          setNotice("");
          setError("");
        }}
        rows={3}
        maxLength={180}
        placeholder="Describe the design: skull rose vintage, gym mascot, streetwear logo..."
        className="w-full resize-none rounded-2xl bg-white/[0.055] px-3 py-3 text-sm font-medium text-white outline-none ring-1 ring-white/10 placeholder:text-slate-600 focus:ring-violet-400/50"
      />

      {(notice || error) && (
        <div
          className={`rounded-2xl px-3 py-2 text-xs font-bold ${
            error
              ? "bg-red-500/10 text-red-200 ring-1 ring-red-500/20"
              : "bg-violet-500/10 text-violet-100 ring-1 ring-violet-400/20"
          }`}
        >
          {error || notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={randomPrompt}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-white/[0.06] text-xs font-black text-slate-200 ring-1 ring-white/10 transition-colors active:scale-[0.98] disabled:opacity-50"
        >
          <Shuffle size={15} /> Prompt
        </button>

        <button
          type="button"
          onClick={generateImage}
          disabled={loading || !prompt.trim()}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-500 text-xs font-black text-white transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}
