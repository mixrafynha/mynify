"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push("/products");
      }}
      className="group absolute right-3 grid h-11 w-11 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white transition active:scale-[0.98] hover:border-fuchsia-300/30 sm:right-5 md:static"
      aria-label="Back to previous page"
    >
      <ArrowLeft
        size={18}
        className="transition-transform duration-200 md:group-hover:-translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}
