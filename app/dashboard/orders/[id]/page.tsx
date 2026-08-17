import Sidebar from "@/app/components/sidebar";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { ImageIcon } from "lucide-react";

type OrderItem = {
  id: string;
  title: string;
  quantity: number;
  size: string | null;
  color: string | null;
  sku: string | null;
  unit_price: number | null;
  currency: string | null;
  image: string | null;
  mockup_front: string | null;
  mockup_back: string | null;
  print_files: Record<string, unknown> | null;
  selected_variant?: Record<string, unknown> | null;
  product_id?: string | null;
  variant_id?: string | null;
  user_product_id?: string | null;
  gelato_product_uid?: string | null;
  created_at?: string | null;
};

type Order = {
  id: string;
  product: {
    title: string;
    price: number;
    currency: string;
    image?: string | null;
  };
  items: OrderItem[];
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
      product_image,
      order_items (
        id,
        order_id,
        cart_item_id,
        user_product_id,
        product_id,
        variant_id,
        title,
        quantity,
        size,
        color,
        sku,
        unit_price,
        currency,
        image,
        mockup_front,
        mockup_back,
        print_files,
        selected_variant,
        gelato_product_uid,
        created_at
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    console.error("ORDER ERROR:", error);
    return null;
  }

  const items = Array.isArray(data.order_items) ? data.order_items : [];

  return {
    id: data.id,
    product: {
      title: data.product_title ?? "Product",
      price: Number(data.product_price ?? 0),
      currency: data.product_currency ?? "€",
      image: data.product_image ?? null,
    },
      items: items.map((item: any) => ({
        id: String(item.id),
        title: String(item.title ?? "Product"),
        quantity: Number(item.quantity ?? 1),
        size: item.size ?? null,
      color: item.color ?? null,
      sku: item.sku ?? null,
      unit_price: item.unit_price != null ? Number(item.unit_price) : null,
      currency: item.currency ?? null,
      image: item.image ?? null,
      mockup_front: item.mockup_front ?? null,
      mockup_back: item.mockup_back ?? null,
      print_files: item.print_files ?? null,
      selected_variant: item.selected_variant ?? null,
      product_id: item.product_id ?? null,
      variant_id: item.variant_id ?? null,
        user_product_id: item.user_product_id ?? null,
        gelato_product_uid: item.gelato_product_uid ?? null,
        created_at: item.created_at ?? null,
      })),
    status: data.status,
    stripe_session_id: data.stripe_session_id,
    created_at: data.created_at,
  };
}

function resolveItemPreview(item: OrderItem) {
  const printFiles =
    item.print_files && typeof item.print_files === "object"
      ? (item.print_files as Record<string, unknown>)
      : {};
  const selectedVariant =
    item.selected_variant && typeof item.selected_variant === "object"
      ? item.selected_variant
      : {};

  return (
    (typeof selectedVariant.front === "string" ? selectedVariant.front : null) ||
    (typeof selectedVariant.back === "string" ? selectedVariant.back : null) ||
    item.mockup_front ||
    item.mockup_back ||
    item.image ||
    (typeof printFiles.front === "string" ? printFiles.front : null) ||
    (typeof printFiles.back === "string" ? printFiles.back : null) ||
    null
  );
}

function resolveItemMockupHtml(item: OrderItem, side: "front" | "back") {
  const printFiles =
    item.print_files && typeof item.print_files === "object"
      ? (item.print_files as Record<string, unknown>)
      : {};
  const selectedVariant =
    item.selected_variant && typeof item.selected_variant === "object"
      ? (item.selected_variant as Record<string, unknown>)
      : {};

  const candidates = [
    side === "front" ? printFiles.front_html : printFiles.back_html,
    side === "front" ? printFiles.mockup_html_front : printFiles.mockup_html_back,
    side === "front" ? printFiles.html_front : printFiles.html_back,
    side === "front" ? selectedVariant.front_html : selectedVariant.back_html,
    side === "front" ? selectedVariant.mockup_html_front : selectedVariant.mockup_html_back,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
}

function renderMockupPanel({
  title,
  image,
  html,
}: {
  title: string;
  image: string | null;
  html: string | null;
  }) {
  const fallbackHtml = image
    ? `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f4f4f5;">
        <img src="${image}" alt="${title}" style="max-width:100%;max-height:100%;object-fit:contain;display:block;" />
      </div>
    `
    : `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(180deg,#f8fafc,#e5e7eb);color:#94a3b8;font:600 14px/1.2 Arial,sans-serif;">
        No mockup available
      </div>
    `;

  return (
    <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-black/5 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
          {title}
        </p>
      </div>
      <div className="aspect-[5/6] bg-[#f7f7f4]">
        {html ? (
          <div
            className="h-full w-full"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div
            className="h-full w-full"
            dangerouslySetInnerHTML={{ __html: fallbackHtml }}
          />
        )}
      </div>
    </div>
  );
}

export default async function OrderPage({
  params,
}: {
  params: { id: string };
}) {
  const order = await getOrder(params.id);

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const firstItem = order.items[0] ?? null;
  const resolvedImage = firstItem?.image ?? order.product.image ?? null;

  console.log("[orders-ui:image-debug]", {
    firstItemImage: firstItem?.image ?? null,
    productImage: order?.product?.image ?? null,
    resolvedImage,
  });

  return (
    <div className="flex min-h-screen bg-[#f6f6f2]">
      <Sidebar />

      <div className="flex-1 md:pl-[280px]">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
                Order details
              </p>
              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
                #{order.id.slice(0, 8)}
              </h1>
            </div>

            <Link
              href="/dashboard/orders"
              className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-black/20 hover:text-black"
            >
              ← Back
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {renderMockupPanel({
              title: "Front mockup",
              image: resolvedImage,
              html: firstItem ? resolveItemMockupHtml(firstItem, "front") : null,
            })}
            {renderMockupPanel({
              title: "Back mockup",
              image: resolvedImage,
              html: firstItem ? resolveItemMockupHtml(firstItem, "back") : null,
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                order.status === "paid"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {order.status}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm ring-1 ring-black/5">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>

          {order.status !== "paid" && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/api/stripe/retry/${order.id}`}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 active:scale-[0.99]"
              >
                Complete payment
              </Link>

              <form action="/api/orders/delete" method="POST" className="flex-1">
                <input type="hidden" name="id" value={order.id} />
                <button
                  type="submit"
                  className="w-full rounded-full border border-red-300 bg-white px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Cancel order
                </button>
              </form>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-400">
            Only the mockups are shown here. Item and payment metadata stay hidden to keep the page focused.
          </p>
        </div>
      </div>
    </div>
  );
}
