import Image from "next/image";

type SidebarHeaderProps = {
  expanded: boolean;
};

export default function SidebarHeader({
  expanded,
}: SidebarHeaderProps) {
  return (
    <div className="relative flex items-center justify-center px-4 py-7">
      {expanded ? (
        <div className="group relative flex items-center justify-center">
          <div className="pointer-events-none absolute inset-0 scale-125 bg-purple-500/10 blur-3xl opacity-60 transition duration-300 group-hover:opacity-100" />

          <h1 className="relative select-none text-[34px] font-black uppercase leading-none tracking-[-0.09em] text-white transition-all duration-300">
            MY
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent">
              NIFY
            </span>
          </h1>

          <div className="absolute -bottom-3 left-1/2 h-px w-14 -translate-x-1/2 bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" />
        </div>
      ) : (
        <div className="group relative flex h-12 w-12 items-center justify-center">
          <div className="pointer-events-none absolute inset-0 rounded-full bg-purple-500/10 blur-xl opacity-70 transition duration-300 group-hover:opacity-100" />

          <Image
            src="/sidelogo.ico"
            alt="Mynify"
            width={48}
            height={48}
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
