"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

type Props = {
  selected: Product;
};

export default function StepEditor({ selected }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!selected?.id) return;

    router.push(`/dashboard/design/${selected.id}`);
  }, [selected?.id, router]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <p className="text-gray-400 animate-pulse">
        Opening design editor...
      </p>
    </div>
  );
}