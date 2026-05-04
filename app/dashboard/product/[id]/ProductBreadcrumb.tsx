"use client";

import Link from "next/link";

export function ProductBreadcrumb({ title }: { title: string }) {
  return (
    <nav className="flex items-center text-xs sm:text-sm text-gray-400">

      <Link
        href="/"
        className="hover:text-gray-700 transition-colors"
      >
        Home
      </Link>

      <span className="mx-2 text-gray-300">/</span>

      <Link
        href="/catalog"
        className="hover:text-gray-700 transition-colors"
      >
        Catalog
      </Link>

      <span className="mx-2 text-gray-300">/</span>

      <span className="text-gray-700 font-medium truncate max-w-[180px] sm:max-w-none">
        {title}
      </span>

    </nav>
  );
}