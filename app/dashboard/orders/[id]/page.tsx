import Sidebar from "@/app/components/sidebar";
import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { ArrowRight, Headphones, ImageIcon, Truck } from "lucide-react";

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
  gelato_status?: string | null;
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
      gelato_status,
      created_at,
      stripe_session_id,
      product_title,
      product_price,
      product_currency,
      product_image,
      order_items!order_items_order_id_fkey (
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

  console.log("[orders-ui:raw-order-items]", {
    rawKeys: Object.keys(data ?? {}),
    orderItemsCount: Array.isArray(data?.order_items)
      ? data.order_items.length
      : null,
    itemsCount: Array.isArray((data as any)?.items)
      ? (data as any).items.length
      : null,
    orderItemsFirst:
      Array.isArray(data?.order_items) && data.order_items[0]
        ? {
            id: data.order_items[0].id,
            image: data.order_items[0].image ?? null,
          }
        : null,
  });

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
    gelato_status: data.gelato_status ?? null,
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

function resolveItemFrontImage(item: OrderItem | null) {
  if (!item) return null;
  return item.mockup_front || item.image || null;
}

function resolveItemBackImage(item: OrderItem | null) {
  if (!item) return null;
  return item.mockup_back || null;
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
      <div style="display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(180deg,#0b0c19,#090914);">
        <img src="${image}" alt="${title}" style="max-width:100%;max-height:100%;object-fit:contain;display:block;" />
      </div>
    `
    : `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;background:linear-gradient(180deg,#0b0c19,#090914);color:#7c83a3;font:600 14px/1.2 Arial,sans-serif;">
        No mockup available
      </div>
    `;

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.045] shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-200/80">
          {title}
        </p>
        <span className="h-2 w-2 rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400 shadow-[0_0_16px_rgba(168,85,247,0.35)]" />
      </div>
      <div className="aspect-[5/6] bg-[radial-gradient(circle_at_50%_0%,rgba(168,85,247,0.1),transparent_42%),linear-gradient(180deg,#0a0a15_0%,#080814_100%)]">
        {html ? (
          <div
            className="h-full w-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div
            className="h-full w-full overflow-hidden"
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
  const frontItem =
    order.items.find((item) => item?.mockup_front || item?.image) ??
    firstItem;
  const backItem =
    order.items.find((item) => item?.mockup_back) ??
    null;
  const resolvedFrontImage =
    resolveItemFrontImage(frontItem ?? firstItem ?? null) ??
    order.product.image ??
    null;
  const resolvedBackImage =
    resolveItemBackImage(backItem);
  const supportHref = `/support?orderId=${encodeURIComponent(order.id)}`;
  const trackHref = "#tracking";

  console.log("[orders-ui:image-debug]", {
    firstItemImage: firstItem?.image ?? null,
    imageItemImage: frontItem?.image ?? null,
    productImage: order?.product?.image ?? null,
    resolvedFrontImage,
    resolvedBackImage,
  });

  return (
    <div className="flex min-h-screen bg-[#080814] text-white">
      <Sidebar />

      <div className="flex-1 md:pl-[280px]">
        <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-5 sm:py-6 md:px-8">
          <div className="mb-5 flex flex-col gap-4 rounded-[30px] border border-white/[0.06] bg-white/[0.035] px-4 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-400">
                Order details
              </p>
              <h1 className="mt-1 truncate text-2xl font-black tracking-[-0.06em] text-white sm:text-3xl">
                #{order.id.slice(0, 8)}
              </h1>
              <p className="mt-1 text-sm font-semibold text-white/45">
                Review front and back mockups for this order.
              </p>
            </div>

            <Link
              href="/dashboard/orders"
              className="shrink-0 inline-flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-black text-white/70 transition hover:border-violet-500/30 hover:bg-white/[0.06] hover:text-white"
            >
              ← Back
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {renderMockupPanel({
              title: "Front mockup",
              image: resolvedFrontImage,
              html: frontItem ? resolveItemMockupHtml(frontItem, "front") : null,
            })}
            {renderMockupPanel({
              title: "Back mockup",
              image: resolvedBackImage,
              html: backItem ? resolveItemMockupHtml(backItem, "back") : null,
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
                order.status === "paid"
                  ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20"
                  : "bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/20"
              }`}
            >
              {order.status}
            </span>
            <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white/50 ring-1 ring-white/[0.06]">
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>

          <div id="tracking" className="mt-6 rounded-[30px] border border-white/[0.06] bg-white/[0.035] p-4 backdrop-blur-xl sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-400">
                  Tracking
                </p>
                <h2 className="mt-1 text-lg font-black tracking-[-0.04em] text-white">
                  {order.gelato_status ? `Gelato status: ${order.gelato_status}` : "Tracking pending"}
                </h2>
                <p className="mt-1 text-sm text-white/45">
                  We keep the order progress and support links in one place.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-white/45">
                <Truck size={14} className="text-violet-300" />
                {order.status}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={trackHref}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_14px_35px_rgba(168,85,247,0.22)] transition hover:brightness-110 active:scale-[0.99]"
            >
              Track order
              <ArrowRight size={16} />
            </Link>

            <Link
              href={supportHref}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-5 py-3 text-sm font-black text-white/75 transition hover:border-violet-500/30 hover:bg-white/[0.06] hover:text-white"
            >
              Need help with this order?
              <Headphones size={16} />
            </Link>
          </div>

          <p className="mt-4 text-xs text-white/35">
            Only the mockups are shown here. Item and payment metadata stay hidden to keep the page focused.
          </p>
        </div>
      </div>
    </div>
  );
}
