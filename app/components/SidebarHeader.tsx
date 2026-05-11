import Image from "next/image";

type SidebarHeaderProps = {
  expanded: boolean;
};

export default function SidebarHeader({
  expanded,
}: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-center px-4 pb-7 pt-6">
      {expanded ? (
        <div className="flex w-full items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <Image
              src="/Logo.png"
              alt="Mynify"
              width={46}
              height={46}
              priority
              quality={100}
              className="object-contain"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[28px] font-black uppercase leading-none tracking-[-0.07em] text-white">
              MY
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                NIFY
              </span>
            </h1>
          </div>

          <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.95)]" />
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center">
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
      )}
    </div>
  );
}
