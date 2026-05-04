import Sidebar from "@/app/components/sidebar";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";

type Order = {
  id: string;
  product: {
    title: string;
    price: number;
    currency: string;
    image?: string | null;
  };
  status: string;
  stripe_session_id: string;
  created_at: string;
};

async function getOrder(id: string): Promise<Order | null> {
  const supabase = createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      created_at,
      stripe_session_id,
      product_title,
      product_price,
      product_currency,
      product_image
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    console.error("ORDER ERROR:", error);
    return null;
  }

  return {
    id: data.id,
    product: {
      title: data.product_title ?? "Product",
      price: Number(data.product_price ?? 0),
      currency: data.product_currency ?? "€",
      image: data.product_image ?? null,
    },
    status: data.status,
    stripe_session_id: data.stripe_session_id,
    created_at: data.created_at,
  };
}

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrder(params.id);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f6f4] to-[#f1f1ec] flex">
      <Sidebar />

      <div className="flex-1 md:pl-[280px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-8">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Order Details
            </h1>

            <Link
              href="/dashboard/orders"
              className="text-sm text-gray-500 hover:text-black transition"
            >
              ← Back
            </Link>
          </div>

          {/* CARD */}
          <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-lg overflow-hidden">

            {/* IMAGE */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-gray-100 overflow-hidden">

              {order.product.image ? (
                <img
                  src={order.product.image}
                  alt={order.product.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No image available
                </div>
              )}

              {/* subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>

            {/* CONTENT */}
            <div className="p-5 sm:p-6 space-y-5">

              {/* STATUS */}
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    order.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.status}
                </span>

                <span className="text-xs text-gray-400 font-mono">
                  #{order.id.slice(0, 8)}
                </span>
              </div>

              {/* TITLE */}
              <h2 className="text-lg sm:text-xl font-semibold leading-snug">
                {order.product.title}
              </h2>

              {/* PRICE */}
              <p className="text-gray-600 text-base sm:text-lg">
                {order.product.currency} {order.product.price}
              </p>

              {/* DATE */}
              <div className="text-xs text-gray-400 border-t pt-3 space-y-1">
                <p>
                  Created:{" "}
                  {new Date(order.created_at).toLocaleString()}
                </p>

                <p className="break-all">
                  Stripe session: {order.stripe_session_id}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="pt-4 space-y-3">

                {order.status !== "paid" && (
                  <Link
                    href={`/api/stripe/retry/${order.id}`}
                    className="block text-center bg-black text-white py-3 rounded-xl hover:opacity-90 active:scale-[0.99] transition"
                  >
                    Complete payment
                  </Link>
                )}

                {order.status !== "paid" && (
                  <form action="/api/orders/delete" method="POST">
                    <input type="hidden" name="id" value={order.id} />

                    <button
                      type="submit"
                      className="w-full border border-red-300 text-red-600 py-2.5 rounded-xl hover:bg-red-50 transition"
                    >
                      Cancel order
                    </button>
                  </form>
                )}

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}