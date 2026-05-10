import Image from "next/image";

type SidebarHeaderProps = {
  expanded: boolean;
};

export default function SidebarHeader({ expanded }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-center px-4 pb-7 pt-6">
      {expanded ? (
        <div className="flex w-full items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <Image
              src="/Logo.png"
              alt="Mynify"
              width={38}
              height={38}
              priority
              className="object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[22px] font-black uppercase tracking-[-0.04em] text-white">
              MY
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                NIFY
              </span>
            </h1>
          </div>

          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center">
          <Image
            src="/Logo.png"
            alt="Mynify"
            width={34}
            height={34}
            priority
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
}
