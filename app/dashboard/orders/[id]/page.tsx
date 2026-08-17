import Sidebar from "@/app/components/sidebar";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { FileImage, ImageIcon, Package, Truck, CreditCard, ReceiptText } from "lucide-react";

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
    item.image ||
    (typeof printFiles.front === "string" ? printFiles.front : null) ||
    (typeof printFiles.back === "string" ? printFiles.back : null) ||
    item.mockup_back ||
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
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          {title}
        </p>
      </div>
      <div className="aspect-[4/5] bg-white">
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

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#f6f6f4] to-[#f1f1ec]">
      <Sidebar />

      <div className="flex-1 md:pl-[280px]">
        <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Order Details
            </h1>

            <Link
              href="/dashboard/orders"
              className="text-sm text-gray-500 transition hover:text-black"
            >
              ← Back
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white/80 shadow-lg backdrop-blur-xl">
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 sm:aspect-[16/9]">
              {order.product.image ? (
                <img
                  src={order.product.image}
                  alt={order.product.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="lazy"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = "/placeholder.png";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  No image available
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    order.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.status}
                </span>

                <span className="font-mono text-xs text-gray-400">
                  #{order.id.slice(0, 8)}
                </span>
              </div>

              <h2 className="text-lg font-semibold leading-snug sm:text-xl">
                {order.product.title}
              </h2>

              <p className="text-base text-gray-600 sm:text-lg">
                {order.product.currency} {order.product.price}
              </p>

              <div className="grid gap-3 border-t pt-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-gray-600">
                    <ReceiptText size={15} />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Order</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">#{order.id}</p>
                  <p className="mt-1 text-xs text-gray-500">Created {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-gray-600">
                    <CreditCard size={15} />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Payment</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Stripe session</p>
                  <p className="mt-1 break-all text-xs text-gray-500">{order.stripe_session_id}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-gray-600">
                    <Truck size={15} />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em]">Shipping</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">Status {order.status}</p>
                  <p className="mt-1 text-xs text-gray-500">Details available in the item and API payload.</p>
                </div>
              </div>

              <div className="grid gap-4 border-t pt-4 lg:grid-cols-2">
                {renderMockupPanel({
                  title: "Front mockup HTML",
                  image: order.product.image ?? null,
                  html: firstItem ? resolveItemMockupHtml(firstItem, "front") : null,
                })}
                {renderMockupPanel({
                  title: "Back mockup HTML",
                  image: firstItem ? resolveItemPreview(firstItem) : null,
                  html: firstItem ? resolveItemMockupHtml(firstItem, "back") : null,
                })}
              </div>

              {order.items.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-violet-500" />
                    <p className="text-sm font-semibold text-gray-700">
                      Order items
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {order.items.map((item) => {
                      const preview = resolveItemPreview(item);

                      return (
                        <div
                          key={item.id}
                          className="overflow-hidden rounded-2xl border border-gray-100 bg-white"
                        >
                          <div className="flex gap-4 p-4">
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                              {preview ? (
                                <img
                                  src={preview}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={(event) => {
                                    (event.target as HTMLImageElement).src = "/placeholder.png";
                                  }}
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">
                                  <ImageIcon size={20} />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-base font-semibold text-gray-900">
                                    {item.title}
                                  </p>
                                  <p className="mt-0.5 text-xs text-gray-500">
                                    {item.quantity}x {item.size ?? "One size"}
                                    {item.color ? ` • ${item.color}` : ""}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {item.currency ?? order.product.currency}{" "}
                                    {item.unit_price ?? order.product.price}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                                {item.product_id && (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">
                                    Product {item.product_id.slice(0, 8)}
                                  </span>
                                )}
                                {item.variant_id && (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">
                                    Variant {item.variant_id.slice(0, 8)}
                                  </span>
                                )}
                                {item.user_product_id && (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">
                                    User product {item.user_product_id.slice(0, 8)}
                                  </span>
                                )}
                                {item.gelato_product_uid && (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">
                                    Gelato {item.gelato_product_uid}
                                  </span>
                                )}
                                {item.sku && (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium">
                                    SKU {item.sku}
                                  </span>
                                )}
                                {item.mockup_front && (
                                  <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
                                    Front mockup
                                  </span>
                                )}
                                {item.mockup_back && (
                                  <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-medium text-cyan-700">
                                    Back mockup
                                  </span>
                                )}
                                {item.print_files && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                                    <FileImage size={11} />
                                    Print files
                                  </span>
                                )}
                              </div>

                              {item.created_at && (
                                <p className="text-[11px] text-gray-400">
                                  Item created {new Date(item.created_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4">
                {order.status !== "paid" && (
                  <Link
                    href={`/api/stripe/retry/${order.id}`}
                    className="block rounded-xl bg-black py-3 text-center text-white transition hover:opacity-90 active:scale-[0.99]"
                  >
                    Complete payment
                  </Link>
                )}

                {order.status !== "paid" && (
                  <form action="/api/orders/delete" method="POST">
                    <input type="hidden" name="id" value={order.id} />

                    <button
                      type="submit"
                      className="w-full rounded-xl border border-red-300 py-2.5 text-red-600 transition hover:bg-red-50"
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
