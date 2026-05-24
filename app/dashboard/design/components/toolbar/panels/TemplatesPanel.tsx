"use client";

const TEMPLATES = [
  {
    text: "LUXURY",
    family: "Playfair Display",
    color: "#FFF7D6",
    bg: "from-amber-400 via-orange-500 to-red-600",
    size: 64,
    weight: 900,
    spacing: 4,
  },

  {
    text: "TOKYO",
    family: "Orbitron",
    color: "#7DF9FF",
    bg: "from-cyan-400 via-sky-500 to-indigo-900",
    size: 60,
    weight: 900,
  },

  {
    text: "NO LIMITS",
    family: "Anton",
    color: "#ffffff",
    bg: "from-pink-500 via-fuchsia-600 to-purple-800",
    size: 74,
    weight: 900,
    spacing: 2,
  },

  {
    text: "Street Soul",
    family: "Bebas Neue",
    color: "#FDE68A",
    bg: "from-orange-400 via-red-500 to-zinc-900",
    size: 68,
    weight: 900,
  },

  {
    text: "Dream Big",
    family: "DM Serif Display",
    color: "#ffffff",
    bg: "from-violet-500 via-fuchsia-500 to-indigo-800",
    size: 52,
    weight: 700,
  },

  {
    text: "Royal Club",
    family: "Cinzel",
    color: "#FFD700",
    bg: "from-yellow-400 via-amber-600 to-zinc-950",
    size: 56,
    weight: 900,
  },

  {
    text: "CYBER",
    family: "Orbitron",
    color: "#00F5FF",
    bg: "from-cyan-400 via-violet-700 to-black",
    size: 68,
    weight: 900,
  },

  {
    text: "SUNSET",
    family: "Anton",
    color: "#fff",
    bg: "from-orange-400 via-pink-500 to-purple-700",
    size: 64,
    weight: 900,
  },

  {
    text: "FUTURE",
    family: "Space Grotesk",
    color: "#ffffff",
    bg: "from-slate-700 via-zinc-900 to-black",
    size: 60,
    weight: 800,
  },

  {
    text: "NEON",
    family: "Bebas Neue",
    color: "#34D399",
    bg: "from-emerald-500 via-cyan-500 to-indigo-800",
    size: 66,
    weight: 900,
  },

  {
    text: "Y2K",
    family: "Orbitron",
    color: "#FF6BFF",
    bg: "from-pink-500 via-violet-600 to-cyan-600",
    size: 66,
    weight: 900,
  },

  {
    text: "PARIS",
    family: "Playfair Display",
    color: "#ffffff",
    bg: "from-rose-500 via-fuchsia-500 to-violet-900",
    size: 54,
    weight: 700,
  },
];

const CANVAS = {
  width: 540,
  height: 540,
};

export default function TemplatesPanel({
  createElement,
}: {
  createElement?: (element: any) => void;
}) {
  const addTemplate = (
    template: any
  ) => {
    const width =
      template.text.length *
      (template.size * 0.58);

    const height =
      template.size * 1.35;

    createElement?.({
      type: "text",

      text: template.text,

      width,
      height,

      x:
        CANVAS.width / 2 -
        width / 2,

      y:
        CANVAS.height / 2 -
        height / 2,

      meta: {
        fontFamily:
          template.family,

        color:
          template.color,

        fontSize:
          template.size,

        fontWeight:
          template.weight,

        letterSpacing:
          template.spacing ??
          0,

        opacity: 1,
        rotation: 0,
        shadow: true,
        textShape:
          "straight",
      },
    });
  };

  return (
    <div className="grid grid-cols-2 gap-3 pb-8">
      {TEMPLATES.map(
        (t, i) => (
          <button
            key={i}
            type="button"
            onClick={() =>
              addTemplate(t)
            }
            className={`
              group relative
              h-[150px]
              overflow-hidden
              rounded-[34px]
              border border-white/10
              bg-gradient-to-br
              ${t.bg}
              p-5
              text-left
              transition-all duration-300
              hover:-translate-y-1
              hover:scale-[1.02]
              hover:border-white/20
              active:scale-[0.98]
            `}
          >
            {/* glow */}
            <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/20 blur-3xl" />

            {/* overlay */}
            <div className="absolute inset-0 bg-black/10" />

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="overflow-hidden">
                <span
                  style={{
                    fontFamily:
                      t.family,
                    color:
                      t.color,
                    fontSize: 32,
                    fontWeight:
                      t.weight,
                    letterSpacing:
                      t.spacing,
                  }}
                  className="
                    block
                    leading-[0.88]
                    break-words
                    drop-shadow-[0_4px_18px_rgba(0,0,0,0.28)]
                  "
                >
                  {t.text}
                </span>
              </div>

              <div className="text-[11px] font-semibold tracking-wide text-white/75">
                Template
              </div>
            </div>
          </button>
        )
      )}
    </div>
  );
}