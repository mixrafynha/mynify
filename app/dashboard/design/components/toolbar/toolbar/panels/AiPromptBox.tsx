"use client";

import {
  Loader2,
  Shuffle,
  Sparkles,
  Wand2,
} from "lucide-react";

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
  return value
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 180);
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
    <div className="rounded-[30px] border border-white/10 bg-[#0a1120] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-cyan-500 via-violet-500 to-fuchsia-500">
          <Wand2 size={21} />
        </div>

        <div>
          <h2 className="text-base font-black">
            AI Design Studio
          </h2>

          <p className="text-xs text-slate-400">
            Premium transparent PNG creator
          </p>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => {
          setPrompt(safePrompt(e.target.value));
          setNotice("");
          setError("");
        }}
        rows={3}
        maxLength={180}
        placeholder="Describe your premium design..."
        className="mt-5 w-full resize-none rounded-[24px] border border-white/10 bg-[#11192d] px-4 py-4 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40"
      />

      {notice && (
        <div className="mt-3 rounded-[22px] border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-fuchsia-500/10 px-4 py-4 text-xs font-black text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,0.10)] backdrop-blur-xl">
          {notice}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-[22px] border border-red-500/20 bg-gradient-to-r from-red-500/10 to-orange-500/10 px-4 py-4 text-xs font-black text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.10)] backdrop-blur-xl">
          {error}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={randomPrompt}
          disabled={loading}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] font-black transition hover:bg-white/[0.08] disabled:opacity-40"
        >
          <Shuffle size={17} />
          Random
        </button>

        <button
          type="button"
          onClick={generateImage}
          disabled={loading || !prompt.trim()}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500 font-black text-white transition active:scale-[0.98] disabled:opacity-40"
        >
          {loading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Sparkles size={17} />
          )}

          {loading ? "Creating..." : "Create Design"}
        </button>
      </div>
    </div>
  );
}