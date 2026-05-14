"use client";

import { useState } from "react";
import {
  UploadCloud,
  PenTool,
  Folder,
  Grid2X2,
  Wand2,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { AI_STYLES, QUICK_PROMPTS } from "../data";

const tabs = ["Images", "Illustrations", "Videos", "3D"];

const previewImages = [
  {
    title: "Rose with bee",
    src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Soft flower",
    src: "https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=900&auto=format&fit=crop",
  },
];

const blockedWords = [
  "nude",
  "naked",
  "porn",
  "sex",
  "sexual",
  "minor",
  "child",
  "kid",
  "blood",
  "gore",
  "kill",
  "weapon",
  "gun",
  "drugs",
  "cocaine",
  "hate",
  "nazi",
  "terrorist",
];

function isPromptAllowed(prompt: string) {
  const clean = prompt.toLowerCase();
  return !blockedWords.some((word) => clean.includes(word));
}

export default function AiPanel({ createElement }: any) {
  const [activeTab, setActiveTab] = useState("Images");
  const [prompt, setPrompt] = useState("rose with bee");
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState(previewImages);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    if (!isPromptAllowed(prompt)) {
      alert("This prompt is not allowed.");
      return;
    }

    try {
      setLoading(true);

      const finalPrompt = `
${prompt}

Clean isolated product graphic.
Transparent background.
No mockup.
No shirt.
No hoodie.
No person.
No background.
No shadows.
Centered design.
High quality PNG style.
Perfect for printing on t-shirts, hoodies and products.
`.trim();

      const response = await fetch("/api/ai-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          originalPrompt: prompt,
          transparent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to generate image");
        return;
      }

      const imageUrl = data.imageUrl;

      if (!imageUrl) {
        alert("No image returned");
        return;
      }

      const newImage = {
        title: prompt,
        src: imageUrl,
      };

      setGeneratedImages((prev) => [newImage, ...prev]);

      createElement?.({
        type: "image",
        src: imageUrl,
        meta: {
          prompt,
          finalPrompt,
          source: "leonardo-ai",
          generationId: data.generationId,
          transparent: true,
        },
      });
    } catch (error) {
      console.log(error);
      alert("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const addImageToCanvas = (src: string, title: string) => {
    createElement?.({
      type: "image",
      src,
      meta: {
        prompt: title,
        source: "ai-preview",
        transparent: true,
      },
    });
  };

  return (
    <div className="-mx-4 -mb-4">
      <div className="border-b border-slate-200 bg-white">
        <div className="flex items-center gap-7 overflow-x-auto px-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative h-12 shrink-0 text-sm font-semibold ${
                activeTab === tab ? "text-slate-950" : "text-slate-500"
              }`}
            >
              {tab}

              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-violet-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 px-4 pt-3">
        <div className="relative flex gap-3 overflow-x-auto pb-1">
          {generatedImages.map((item, index) => (
            <button
              key={`${item.src}-${index}`}
              onClick={() => addImageToCanvas(item.src, item.title)}
              className="relative h-[278px] w-[278px] shrink-0 overflow-hidden rounded-xl bg-slate-100 active:scale-[0.98]"
            >
              <img
                src={item.src}
                alt={item.title}
                className="h-full w-full object-cover"
              />

              <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md">
                <MoreHorizontal size={18} />
              </span>
            </button>
          ))}

          <button className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-lg">
            <ChevronRight size={20} />
          </button>
        </div>

        <p className="text-[12px] leading-relaxed text-slate-600">
          Generate clean transparent graphics for products. Unsafe prompts are blocked.
        </p>

        <div className="rounded-2xl border border-slate-300 bg-white p-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="Describe the image you want..."
            className="w-full resize-none bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
          />

          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => setPrompt("")}
              className="text-sm font-bold text-slate-700"
            >
              Clear
            </button>

            <button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-black text-white shadow-lg shadow-violet-600/20 active:scale-95 disabled:opacity-40"
            >
              <Sparkles size={16} />
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {AI_STYLES.map((style) => (
            <button
              key={style}
              onClick={() => setPrompt(`${prompt} ${style}`)}
              className="h-9 shrink-0 rounded-full bg-slate-100 px-4 text-xs font-bold text-slate-700"
            >
              {style}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {QUICK_PROMPTS.map((item) => (
            <button
              key={item}
              onClick={() => setPrompt(item)}
              className="h-9 shrink-0 rounded-full bg-violet-50 px-4 text-xs font-bold text-violet-700"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-1 grid grid-cols-5 border-t border-slate-200 bg-white px-1 pb-1 pt-2">
        <BottomTool icon={<UploadCloud size={20} />} label="Import" />
        <BottomTool icon={<PenTool size={20} />} label="Tools" />
        <BottomTool icon={<Folder size={20} />} label="Projects" />
        <BottomTool icon={<Grid2X2 size={20} />} label="Apps" />
        <BottomTool active icon={<Wand2 size={20} />} label="Magic media" />
      </div>
    </div>
  );
}

function BottomTool({ icon, label, active }: any) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[10px] font-bold ${
        active ? "text-violet-600" : "text-slate-500"
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
          active ? "bg-violet-50" : ""
        }`}
      >
        {icon}
      </div>

      <span className="max-w-[64px] truncate">{label}</span>
    </button>
  );
}