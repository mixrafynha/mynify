"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#f6f6f4]">

      {/* CENTER WRAPPER */}
      <div className="flex flex-col items-center gap-6">

        {/* LOGO / BRAND */}
        <div className="text-2xl font-semibold tracking-tight text-black">
          MY<span className="text-green-500">NIFY</span>
        </div>

        {/* SPINNER (PRINTIFY STYLE) */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-black/10"></div>
          <div className="absolute inset-0 rounded-full border-2 border-t-black animate-spin"></div>
        </div>

        {/* SKELETON TEXT */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-2 w-40 bg-black/10 rounded animate-pulse" />
          <div className="h-2 w-28 bg-black/10 rounded animate-pulse" />
        </div>

        {/* SMALL TEXT */}
        <p className="text-xs text-black/40 tracking-wide">
          Loading your dashboard...
        </p>

      </div>
    </div>
  );
}