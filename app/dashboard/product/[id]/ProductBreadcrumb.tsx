"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function ProductBreadcrumb({ title }: { title: string }) {
  const safeTitle = title?.trim() || "Product";

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex min-w-0 items-center gap-1 text-xs font-bold text-white/50 sm:text-sm"
    >
      <Link
        href="/"
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 transition-colors duration-200 hover:text-white"
      >
        <Home size={14} />
        <span className="hidden sm:inline">Home</span>
      </Link>

      <ChevronRight size={14} className="shrink-0 text-white/25" />

      <Link
        href="/dashboard"
        className="shrink-0 rounded-full px-2 py-1 transition-colors duration-200 hover:text-white"
      >
        Products
      </Link>

      <ChevronRight size={14} className="shrink-0 text-white/25" />

      <span className="min-w-0 truncate rounded-full px-2 py-1 font-black text-white/80">
        {safeTitle}
      </span>
    </nav>
  );
}
