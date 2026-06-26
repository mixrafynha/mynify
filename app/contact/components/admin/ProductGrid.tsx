"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

let lastClick = 0;

type Product = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

export default function ProductGrid({
  products,
  deleteProduct,
}: {
  products: Product[];
  deleteProduct: (id: string) => void;
}) {
  const router = useRouter();

  const safeDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    const now = Date.now();
    if (now - lastClick < 500) return;
    lastClick = now;

    if (!confirm("Delete this product?")) return;

    deleteProduct(id);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

      {products.map((product) => (
        <motion.div
          key={product.id}
          whileHover={{ y: -4 }}
          onClick={() => router.push(`/dashboard/product/${product.id}`)}
          className="cursor-pointer rounded-2xl overflow-hidden
          bg-white/5 border border-white/10
          hover:border-white/20 transition"
        >

          {/* IMAGE */}
          <div className="h-32 overflow-hidden bg-black/20">
            <img
              src={product.image || "/placeholder.png"}
              alt={product.title}
              className="w-full h-full object-cover hover:scale-110 transition duration-300"
            />
          </div>

          {/* CONTENT */}
          <div className="p-3">

            <h3 className="text-sm font-medium truncate text-white/90">
              {product.title}
            </h3>

            <p className="text-xs text-white/40 mt-1">
              €{product.price}
            </p>

            {/* ACTIONS */}
            <div className="flex justify-between items-center mt-3">

              <span className="text-[10px] text-white/30">
                ID: {product.id.slice(0, 6)}
              </span>

              <button
                onClick={(e) => safeDelete(e, product.id)}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 transition"
              >
                <Trash2 size={13} className="text-red-400" />
              </button>

            </div>

          </div>

        </motion.div>
      ))}

    </div>
  );
}