"use client";

import {
  Copy,
  Trash2,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  MoveUp,
  MoveDown,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  Image as ImageIcon,
  Type,
  Square,
} from "lucide-react";
import { getDpiLabel, recalcDpiForElement } from "./dpi";

type EditPanelProps = {
  selected: any;
  createElement?: (element: any) => void;
  updateSelected?: (patch: any) => void;
  deleteSelected?: () => void;
};

export default function EditPanel({
  selected,
  createElement,
  updateSelected,
  deleteSelected,
}: EditPanelProps) {
  if (!selected) {
    return (
      <div className="rounded-[26px] border border-white/10 bg-[#0b1120] p-5 text-center text-sm font-semibold text-slate-400">
        Select an element to edit
      </div>
    );
  }

  const meta = selected.meta ?? {};
  const dpi = meta.effectiveDpi || meta.dpi;
  const dpiStatus = meta.dpiStatus || (dpi >= 400 ? "excellent" : dpi >= 300 ? "good" : "low");

  const isText = selected.type === "text";
  const isImage = selected.type === "image";
  const isShape = selected.type === "shape";

  const width = selected.width ?? (isText ? 260 : 220);
  const height = selected.height ?? (isText ? 80 : 220);

  const fontSize = meta.fontSize ?? 40;
  const rotation = meta.rotation ?? 0;
  const opacity = meta.opacity ?? 1;
  const flipX = !!meta.flipX;
  const flipY = !!meta.flipY;
  const locked = !!meta.lock;

  const mergeMeta = (patch: any) => {
    const mergedMeta = { ...meta, ...patch };
    updateSelected?.({
      meta: {
        ...recalcDpiForElement({ ...selected, meta: mergedMeta }, width, height),
        ...mergedMeta,
      },
    });
  };

  const updateElement = (patch: any) => {
    const nextWidth = patch.width ?? width;
    const nextHeight = patch.height ?? height;
    const nextMeta = patch.meta ? { ...meta, ...patch.meta } : recalcDpiForElement({ ...selected, meta }, nextWidth, nextHeight);

    updateSelected?.({
      ...patch,
      meta: {
        ...nextMeta,
      },
    });
  };

  const duplicateElement = () => {
    createElement?.({
      ...selected,
      id: undefined,
      x: selected.x + 24,
      y: selected.y + 24,
      meta: {
        ...recalcDpiForElement(selected, width, height),
      },
    });
  };

  const resizeBy = (amount: number) => {
    if (isText) {
      mergeMeta({
        fontSize: Math.max(10, Math.min(160, fontSize + amount)),
      });
      return;
    }

    const ratio = width / height;
    const nextWidth = Math.max(30, Math.min(800, width + amount));
    const nextHeight = Math.round(nextWidth / ratio);

    updateElement({
      width: nextWidth,
      height: nextHeight,
    });
  };

  const resetTransform = () => {
    updateElement({
      meta: {
        ...meta,
        rotation: 0,
        flipX: false,
        flipY: false,
        opacity: 1,
      },
    });
  };

  return (
    <div className="space-y-3 pb-28 text-white">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
            {isText ? <Type size={20} /> : isImage ? <ImageIcon size={20} /> : <Square size={20} />}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-black">
              {isText ? "Text" : isImage ? "Image" : isShape ? "Shape" : "Element"}
            </p>
            <p className="truncate text-xs font-medium text-slate-400">
              {isText ? `${selected.text || "Text element"} • ${getDpiLabel(dpi)}` : `${Math.round(width)} × ${Math.round(height)}px • ${getDpiLabel(dpi)}`}
            </p>
          </div>
        </div>

        <div className="mt-4 flex min-h-[96px] items-center justify-center rounded-[24px] border border-white/10 bg-[#111827] p-4">
          {isText ? (
            <span
              className="max-w-full break-words text-center font-black"
              style={{
                fontFamily: meta.fontFamily,
                fontSize: Math.min(fontSize, 38),
                color: meta.color ?? "#fff",
                opacity,
                letterSpacing: meta.letterSpacing ?? 0,
                transform: `rotate(${rotation}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
              }}
            >
              {selected.text || "Text"}
            </span>
          ) : isImage ? (
            <img
              src={selected.src}
              alt=""
              className="max-h-[110px] max-w-full object-contain"
              style={{
                opacity,
                transform: `rotate(${rotation}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
              }}
            />
          ) : (
            <div
              className="h-20 w-20 rounded-2xl"
              style={{
                backgroundColor: meta.color ?? "#8b5cf6",
                opacity,
                transform: `rotate(${rotation}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
              }}
            />
          )}
        </div>
      </Card>

      <Card title="Print DPI">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black">{getDpiLabel(dpi)}</p>
            <p className="mt-1 text-[11px] font-bold text-slate-400">{meta.vector ? "Vector/text: keeps clean 400 DPI export" : "Image DPI updates when resized"}</p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${dpiStatus === "low" ? "bg-red-500/15 text-red-300" : dpiStatus === "good" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"}`}>
            {dpiStatus}
          </span>
        </div>
      </Card>

      <Card title={isText ? "Text Size" : "Size"}>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">
            {isText ? `${fontSize}px` : `${Math.round(width)} × ${Math.round(height)}px`}
          </span>
        </div>

        {isText ? (
          <input
            type="range"
            min={10}
            max={160}
            value={fontSize}
            onChange={(e) => mergeMeta({ fontSize: Number(e.target.value) })}
            className="w-full accent-cyan-400"
          />
        ) : (
          <input
            type="range"
            min={40}
            max={600}
            value={width}
            onChange={(e) => {
              const nextWidth = Number(e.target.value);
              const ratio = width / height;
              updateElement({
                width: nextWidth,
                height: Math.round(nextWidth / ratio),
              });
            }}
            className="w-full accent-cyan-400"
          />
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <ActionButton icon={<Minimize2 size={16} />} label="Smaller" onClick={() => resizeBy(-20)} />
          <ActionButton icon={<Maximize2 size={16} />} label="Bigger" onClick={() => resizeBy(20)} />
        </div>
      </Card>

      <Card title="Rotation">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">{rotation}°</span>
        </div>

        <input
          type="range"
          min={-180}
          max={180}
          value={rotation}
          onChange={(e) => mergeMeta({ rotation: Number(e.target.value) })}
          className="w-full accent-cyan-400"
        />

        <div className="mt-3 grid grid-cols-3 gap-2">
          <ActionButton label="-15°" onClick={() => mergeMeta({ rotation: Math.max(-180, rotation - 15) })} />
          <ActionButton icon={<RotateCcw size={16} />} label="Reset" onClick={() => mergeMeta({ rotation: 0 })} />
          <ActionButton label="+15°" onClick={() => mergeMeta({ rotation: Math.min(180, rotation + 15) })} />
        </div>
      </Card>

      <Card title="Opacity">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400">{Math.round(opacity * 100)}%</span>
        </div>

        <input
          type="range"
          min={0.1}
          max={1}
          step={0.01}
          value={opacity}
          onChange={(e) => mergeMeta({ opacity: Number(e.target.value) })}
          className="w-full accent-cyan-400"
        />
      </Card>

      <Card title="Transform">
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            active={flipX}
            icon={<FlipHorizontal size={16} />}
            label="Flip X"
            onClick={() => mergeMeta({ flipX: !flipX })}
          />

          <ActionButton
            active={flipY}
            icon={<FlipVertical size={16} />}
            label="Flip Y"
            onClick={() => mergeMeta({ flipY: !flipY })}
          />

          <ActionButton
            active={locked}
            icon={locked ? <Lock size={16} /> : <Unlock size={16} />}
            label={locked ? "Locked" : "Lock"}
            onClick={() => mergeMeta({ lock: !locked })}
          />

          <ActionButton
            icon={<RotateCcw size={16} />}
            label="Reset"
            onClick={resetTransform}
          />
        </div>
      </Card>

      {isText && (
        <Card title="Text Style">
          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              active={meta.fontWeight === 800}
              label="Bold"
              onClick={() =>
                mergeMeta({
                  fontWeight: meta.fontWeight === 800 ? 500 : 800,
                })
              }
            />

            <ActionButton
              active={meta.fontStyle === "italic"}
              label="Italic"
              onClick={() =>
                mergeMeta({
                  fontStyle: meta.fontStyle === "italic" ? "normal" : "italic",
                })
              }
            />

            <ActionButton
              active={meta.textTransform === "uppercase"}
              label="Uppercase"
              onClick={() =>
                mergeMeta({
                  textTransform: meta.textTransform === "uppercase" ? "none" : "uppercase",
                })
              }
            />

            <ActionButton
              active={!!meta.shadow}
              label="Shadow"
              onClick={() => mergeMeta({ shadow: !meta.shadow })}
            />
          </div>
        </Card>
      )}

      <Card title="Layer">
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            icon={<MoveUp size={16} />}
            label="Forward"
            onClick={() => updateElement({ zAction: "bringForward" })}
          />

          <ActionButton
            icon={<MoveDown size={16} />}
            label="Backward"
            onClick={() => updateElement({ zAction: "sendBackward" })}
          />

          <ActionButton
            icon={<Copy size={16} />}
            label="Duplicate"
            onClick={duplicateElement}
          />

          <button
            type="button"
            onClick={deleteSelected}
            className="flex h-12 items-center justify-center gap-2 rounded-[18px] border border-red-500/20 bg-red-500/10 text-xs font-black text-red-300 transition active:scale-[0.97]"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </Card>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-white/10 bg-[#0b1120] p-4">
      {title && (
        <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-12 items-center justify-center gap-2 rounded-[18px] border px-2 text-xs font-black transition active:scale-[0.97] ${
        active
          ? "border-cyan-400/40 bg-cyan-500/20 text-cyan-200"
          : "border-white/10 bg-white/[0.05] text-white hover:bg-white/[0.08]"
      }`}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}