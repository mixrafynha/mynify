"use client";

type Props = {
  el: any;
  isSelected: boolean;
  editing: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  startEditing: () => void;
  updateText: (value: string) => void;
  setEditing: (value: boolean) => void;
};

export default function ElementRenderer({
  el,
  isSelected,
  editing,
  inputRef,
  startEditing,
  updateText,
  setEditing,
}: Props) {
  const textShape = el.meta?.textShape || "straight";

  const selectedClass = isSelected
    ? "ring-2 ring-violet-500 ring-offset-1 ring-offset-transparent"
    : "";

  if (el.type === "image") {
    return (
      <div
        className={`
          relative h-full w-full overflow-hidden rounded-md touch-none
          ${selectedClass}
        `}
      >
        <img
          src={el.src}
          draggable={false}
          alt=""
          className="pointer-events-none h-full w-full select-none object-contain"
        />
      </div>
    );
  }

  if (el.type === "text") {
    return (
      <div
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!editing) {
            startEditing();
          }
        }}
        className={`
          relative h-full w-full overflow-hidden rounded-sm px-1 py-0.5
          leading-tight touch-none
          ${isSelected ? "outline outline-2 outline-violet-500" : ""}
        `}
        style={{
          minWidth: 24,
          fontSize: el.meta?.fontSize || 24,
          fontFamily: el.meta?.fontFamily || "Inter",
          color: el.meta?.color || "#000",
          letterSpacing: `${el.meta?.letterSpacing || 0}px`,
          lineHeight: el.meta?.lineHeight || 1.05,
          textAlign: el.meta?.textAlign || "center",
          fontWeight: el.meta?.fontWeight || 900,
          opacity: el.meta?.opacity ?? 1,
          textShadow: el.meta?.shadow || "none",
          WebkitTextStroke: el.meta?.strokeWidth
            ? `${el.meta.strokeWidth}px ${el.meta.strokeColor || "#000"}`
            : undefined,
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={el.content || el.text || ""}
            autoFocus
            maxLength={200}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateText(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setEditing(false);
              if (e.key === "Escape") setEditing(false);
            }}
            className="block h-full w-full bg-transparent outline-none"
            style={{
              fontSize: el.meta?.fontSize || 24,
              fontFamily: el.meta?.fontFamily || "Inter",
              color: el.meta?.color || "#000",
              textAlign: el.meta?.textAlign || "center",
              fontWeight: el.meta?.fontWeight || 900,
            }}
          />
        ) : (
          <div
            className={`
              h-full w-full overflow-hidden whitespace-pre-wrap break-words
              ${textShape === "wave" ? "animate-pulse" : ""}
            `}
            style={{
              transform:
                textShape === "wave"
                  ? "skewY(-5deg) rotate(-2deg)"
                  : textShape === "arc"
                  ? "rotate(-5deg)"
                  : "none",
            }}
          >
            {el.content || el.text}
          </div>
        )}
      </div>
    );
  }

  if (el.type === "shape") {
    return (
      <div
        className={`
          h-full w-full rounded-md touch-none
          ${selectedClass}
        `}
        style={{
          backgroundColor: el.meta?.color || "#8b5cf6",
          opacity: el.meta?.opacity ?? 1,
          borderRadius: el.meta?.radius ?? 8,
          border: el.meta?.borderWidth
            ? `${el.meta.borderWidth}px solid ${
                el.meta.borderColor || "#000"
              }`
            : undefined,
        }}
      />
    );
  }

  return null;
}