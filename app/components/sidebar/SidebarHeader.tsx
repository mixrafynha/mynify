import Image from "next/image";
import Link from "next/link";

type SidebarHeaderProps = {
  expanded: boolean;
};

export default function SidebarHeader({
  expanded,
}: SidebarHeaderProps) {
  return (
    <div className="relative flex items-center justify-center px-4 py-7">
      {expanded ? (
        <Link href="/" className="group relative flex items-center justify-center select-none">
          <div className="pointer-events-none absolute inset-0 scale-125 bg-purple-500/10 blur-3xl opacity-60 transition duration-300 group-hover:opacity-100" />

          <span
            className="relative text-[30px] uppercase leading-none tracking-[-0.03em] transition-transform duration-300 group-hover:scale-[1.03]"
            style={{ fontFamily: "var(--font-logo)", textShadow: "0 0 18px rgba(102, 67, 136, 0.35)" }}
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

          <div className="absolute -bottom-3 left-1/2 h-px w-14 -translate-x-1/2 bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" />
        </Link>
      ) : (
        <div className="group relative flex h-12 w-12 items-center justify-center">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-purple-500/10 blur-xl opacity-70 transition duration-300 group-hover:opacity-100" />

          <Image
            src="/favicon.ico"
            alt="Ryfio"
            width={46}
            height={46}
            priority
            unoptimized
            draggable={false}
            className="relative object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
    </div>
  );
}
