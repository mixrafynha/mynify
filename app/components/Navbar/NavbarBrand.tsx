import Link from "next/link";

export default function NavbarBrand() {
  return (
    <Link href="/" className="group overflow-visible select-none shrink-0 ml-3">
      <div className="relative flex items-center">
        <span
          className="
            text-[27px]
            md:text-[40px]
            uppercase
            leading-none
            tracking-[-0.03em]
            select-none
            transition-all
            duration-300
            group-hover:scale-[1.03]
          "
          style={{
            fontFamily: "var(--font-logo)",
            textShadow: "0 0 18px rgba(102, 67, 136, 0.35)",
          }}
        >
          <span className="ryfio-letter text-white" style={{ animationDelay: "0ms" }}>
            R
          </span>
          <span className="ryfio-letter text-white" style={{ animationDelay: "120ms" }}>
            Y
          </span>
          <span
            className="ryfio-letter bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent"
            style={{ animationDelay: "240ms" }}
          >
            F
          </span>
          <span
            className="ryfio-letter bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent"
            style={{ animationDelay: "360ms" }}
          >
            I
          </span>
          <span
            className="ryfio-letter bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent"
            style={{ animationDelay: "480ms" }}
          >
            O
          </span>
        </span>

        <div className="absolute -inset-3 bg-purple-500/10 blur-2xl rounded-full opacity-70 pointer-events-none" />
      </div>
    </Link>
  );
}
