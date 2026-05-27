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

const FONT_MAP: Record<string, string> = {
  Anton: "var(--font-anton)",
  "Bebas Neue": "var(--font-bebas)",
  Orbitron: "var(--font-orbitron)",
  "Playfair Display": "var(--font-playfair)",
  Poppins: "var(--font-poppins)",
  Cinzel: "var(--font-cinzel)",
  "DM Serif Display": "var(--font-dm-serif)",
  "Space Grotesk": "var(--font-space)",
  "Rubik Mono One": "var(--font-rubik-mono)",
};

function resolveFontFamily(font?: string) {
  if (!font) {
    return "var(--font-poppins), Arial, sans-serif";
  }

  return `${FONT_MAP[font] || `"${font}"`}, Arial, sans-serif`;
}

function sanitizeTextInput(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/\s{3,}/g, "  ")
    .slice(0, 100);
}

function safeText(value: unknown) {
  if (typeof value !== "string") return "";
  return sanitizeTextInput(value);
}

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

  const selectedFont =
    el.meta?.fontFamily || el.fontFamily || "Poppins";

  const fontFamily = resolveFontFamily(selectedFont);

  const selectedClass = isSelected
    ? "ring-2 ring-violet-500 ring-offset-1 ring-offset-transparent"
    : "";

  if (el.type === "image") {
    return (
      <div
        className={`relative h-full w-full rounded-md touch-none ${selectedClass}`}
        style={{
          overflow: "visible",
          borderRadius: el.meta?.radius ?? 8,
          opacity: el.meta?.opacity ?? 1,
        }}
      >
        <img
          src={el.src}
          draggable={false}
          alt=""
          className="pointer-events-none select-none"
          style={{
            width: "100%",
            height: "100%",
            objectFit: el.meta?.objectFit || "contain",
            objectPosition: el.meta?.objectPosition || "center",
            transform: `scale(${el.meta?.scale ?? 1})`,
            transformOrigin: "center",
            userSelect: "none",
          }}
        />
      </div>
    );
  }

  if (el.type === "text") {
    const content = safeText(el.content || el.text);

    const textStyle: React.CSSProperties = {
      fontFamily,
      fontSize: el.meta?.fontSize || el.fontSize || 24,
      fontWeight: el.meta?.fontWeight || el.fontWeight || 700,
      fontStyle: el.meta?.fontStyle || el.fontStyle || "normal",
      color: el.meta?.color || el.color || "#000",
      letterSpacing: `${el.meta?.letterSpacing ?? -0.4}px`,
      lineHeight: el.meta?.lineHeight || 1.02,
      textAlign: el.meta?.textAlign || "center",
      opacity: el.meta?.opacity ?? 1,
      textShadow: el.meta?.shadow || "none",
      WebkitTextStroke: el.meta?.strokeWidth
        ? `${el.meta.strokeWidth}px ${el.meta.strokeColor || "#000"}`
        : undefined,
    };

    return (
      <div
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!editing) {
            startEditing();
          }
        }}
        className={`relative h-full w-full overflow-visible rounded-sm px-1 py-0.5 touch-none ${
          isSelected ? "outline outline-2 outline-violet-500" : ""
        }`}
        style={{
          minWidth: 24,
          ...textStyle,
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={content}
            autoFocus
            maxLength={200}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            inputMode="text"
            enterKeyHint="done"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onPaste={(e) => {
              e.preventDefault();

              const text =
                e.clipboardData.getData("text");

              updateText(
                sanitizeTextInput(text)
              );
            }}
            onChange={(e) => {
              updateText(
                sanitizeTextInput(e.target.value)
              );
            }}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditing(false);
              }

              if (e.key === "Escape") {
                setEditing(false);
              }
            }}
            className="block h-full w-full bg-transparent outline-none"
            style={textStyle}
          />
        ) : (
          <div
            className={`h-full w-full whitespace-pre-wrap break-words select-none ${
              textShape === "wave" ? "animate-pulse" : ""
            }`}
            style={{
              ...textStyle,
              transform:
                textShape === "wave"
                  ? "skewY(-5deg) rotate(-2deg)"
                  : textShape === "arc"
                    ? "rotate(-5deg)"
                    : "none",
            }}
          >
            {content}
          </div>
        )}
      </div>
    );
  }

  if (el.type === "shape") {
    return (
      <div
        className={`h-full w-full rounded-md touch-none ${selectedClass}`}
        style={{
          backgroundColor: el.meta?.color || "#8b5cf6",
          opacity: el.meta?.opacity ?? 1,
          borderRadius: el.meta?.radius ?? 8,
          border: el.meta?.borderWidth
            ? `${el.meta.borderWidth}px solid ${el.meta.borderColor || "#000"}`
            : undefined,
        }}
      />
    );
  }

  return null;
}
