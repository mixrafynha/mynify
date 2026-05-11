import Image from "next/image";

type SidebarHeaderProps = {
  expanded: boolean;
};

export default function SidebarHeader({
  expanded,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-center px-4 pb-6 pt-5">
      {expanded ? (
        <div className="flex w-full items-center gap-2.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
            <Image
              src="/Logo.png"
              alt="Mynify"
              width={36}
              height={36}
              priority
              quality={100}
              className="object-contain"
            />
          </div>

          <div className="min-w-0 flex-1 leading-none">
            <h1 className="truncate text-[20px] font-black uppercase tracking-[-0.05em] text-white">
              MY
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                NIFY
              </span>
            </h1>

            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white/35">
              AI Workspace
            </p>
          </div>

          <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
        </div>
      ) : (
        <div className="flex h-11 w-11 items-center justify-center">
          <Image
            src="/Logo.png"
            alt="Mynify"
            width={32}
            height={32}
            priority
            quality={100}
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}
