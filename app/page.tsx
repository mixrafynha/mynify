import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import {
  ArrowUpRight,
  Headphones,
  ShoppingBag,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";

const CREATE_HREF = "/dashboard/create";
const CATALOG_HREF = "/catalog";

const safeHref = (href: string) => {
  if (typeof href !== "string") return "/";
  const trimmed = href.trim();
  const clean = trimmed.toLowerCase();

  if (
    clean.startsWith("javascript:") ||
    clean.startsWith("data:") ||
    clean.startsWith("vbscript:")
  ) {
    return "/";
  }

  return trimmed || "/";
};

const safeText = (val: unknown) => {
  if (typeof val !== "string") return "";

  return val
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

type Feature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type Product = {
  name: string;
  image: string;
  tag?: string;
};

const FEATURES: readonly Feature[] = Object.freeze([
  {
    icon: Zap,
    title: "AI design",
    desc: "Describe your idea and create a product design fast.",
  },
  {
    icon: ShoppingBag,
    title: "Custom products",
    desc: "Clothing, accessories and gifts with your own style.",
  },
  {
    icon: Truck,
    title: "No stock",
    desc: "Order on demand without storing inventory.",
  },
  {
    icon: Headphones,
    title: "Simple",
    desc: "Made for people who want a product, not a complex editor.",
  },
]);

const PRODUCTS: readonly Product[] = Object.freeze([
  {
    name: "Streetwear Hoodie",
    tag: "POPULAR",
    image: "/create/streetwear-hoodie.webp",
  },
  {
    name: "Classic Cap",
    image: "/create/classic-cap.webp",
  },
  {
    name: "Coffee Mug",
    image: "/create/coffee-mug.webp",
  },
  {
    name: "Minimal T-Shirt",
    image: "/create/minimal-tshirt.webp",
  },
]);

const CUSTOM_FEATURES = Object.freeze([
  "Describe your idea",
  "AI creates the design",
  "Preview the product",
  "Order or sell online",
]);

const FeatureCard = memo(function FeatureCard({ item }: { item: Feature }) {
  const Icon = item.icon;

  return (
    <div className="flex items-start gap-3 border-b border-white/10 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:p-6 lg:last:border-r-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300">
        <Icon size={20} aria-hidden="true" />
      </div>

      <div>
        <h3 className="mb-1 text-sm font-black tracking-tight text-white sm:text-base">
          {safeText(item.title)}
        </h3>

        <p className="text-xs leading-relaxed text-white/52 sm:text-sm">
          {safeText(item.desc)}
        </p>
      </div>
    </div>
  );
});

const ProductCard = memo(function ProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <Link
      href={safeHref(CATALOG_HREF)}
      className="group relative min-h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_0_24px_rgba(168,85,247,0.07)] transition duration-300 hover:-translate-y-1 hover:border-purple-500/45 sm:min-h-[380px]"
    >
      {product.tag && (
        <div className="absolute left-3 top-3 z-20 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-2.5 py-1 text-[9px] font-black sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
          {safeText(product.tag)}
        </div>
      )}

      <Image
        src={product.image}
        alt={safeText(product.name)}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />

      <div className="relative z-10 flex min-h-[220px] flex-col justify-end p-4 sm:min-h-[380px] sm:p-6">
        <h3 className="mb-3 text-sm font-black text-white sm:text-xl">
          {safeText(product.name)}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-300 sm:text-sm">
            View product
          </p>

          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-purple-300 transition group-hover:bg-purple-500/20 sm:h-10 sm:w-10">
            <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
});

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#03030a] text-white">
      <section className="relative overflow-hidden">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(168,85,247,0.34),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.22),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.25)_0%,#03030a_100%)] lg:bg-[linear-gradient(90deg,#03030a_0%,rgba(3,3,10,0.94)_34%,rgba(3,3,10,0.45)_72%,#03030a_100%)]" />

  <div className="relative mx-auto grid max-w-7xl items-center gap-2 px-4 pb-3 pt-7 sm:pt-12 md:px-8 lg:min-h-[650px] lg:grid-cols-2 lg:gap-6 lg:px-12 lg:pb-4 lg:pt-20">
    <div className="z-10 order-1 text-center lg:text-left">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.28)] sm:mb-6 sm:text-xs">
        <Zap size={14} className="text-purple-400" aria-hidden="true" />
        AI custom products
      </div>

      <h1 className="mb-4 text-[38px] font-black uppercase leading-[0.9] tracking-[-0.052em] sm:text-6xl md:text-7xl lg:text-[96px]">
        <span className="block text-white">Your idea.</span>
        <span className="block bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
          Your product.
        </span>
        <span className="block text-white">Made with AI.</span>
      </h1>

      <p className="mx-auto max-w-xl text-[14px] font-medium leading-relaxed text-white/62 sm:text-lg md:text-xl lg:mx-0 lg:mb-6">
        Choose a product, describe your idea and let Ryfio create a custom
        design ready to order.
      </p>

      {/* DESKTOP CTA */}
      <div className="hidden justify-center lg:flex lg:justify-start">
        <Link
          href={safeHref(CATALOG_HREF)}
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-7 py-4 text-base font-black text-white shadow-[0_0_30px_rgba(168,85,247,0.42)] transition duration-300 hover:scale-[1.02]"
        >
          Free to start
          <Zap size={17} aria-hidden="true" />
        </Link>
      </div>
    </div>

    <div className="relative z-0 order-2 mx-auto -mt-4 h-[390px] w-full max-w-[820px] sm:h-[470px] md:h-[540px] lg:-mt-2 lg:h-[560px] lg:max-w-none">
      <div className="absolute inset-0 rounded-full bg-purple-600/10 blur-[24px] md:bg-purple-600/20 md:blur-[80px]" />

        <Link
  href={safeHref(CATALOG_HREF)}
  className="
    absolute
    left-[3%]
    inset-y-0
    w-full

    sm:left-[2%]

    lg:left-auto
    lg:right-[-130px]
    lg:w-[900px]
  "
>
        <Image
  src="/hero2.png"
  alt="Create custom products with Ryfio"
  fill
  priority
  quality={72}
  sizes="(max-width: 640px) 820px, (max-width: 1024px) 900px, 900px"
  className="
    scale-[1.08]
    object-contain
    object-[%_center]
    sm:object-center
    sm:scale-[1.04]
    lg:scale-100
    md:drop-shadow-[0_0_55px_rgba(168,85,247,0.45)]
  "
/>
      </Link>
    </div>
  </div>

  {/* MOBILE CTA */}
  <div className="relative mx-auto w-full max-w-md px-4 pb-5 lg:hidden">
    <Link
      href={safeHref(CATALOG_HREF)}
      className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 text-sm font-black text-white shadow-[0_0_25px_rgba(168,85,247,0.35)]"
    >
      Free to start
    </Link>
  </div>

  {/* HERO MARQUEE */}
  <div className="relative mx-auto max-w-7xl px-4 pb-5 md:px-8 lg:px-12">
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] py-3 shadow-[0_0_24px_rgba(168,85,247,0.06)]">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#03030a] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#03030a] to-transparent" />

      <div className="flex w-max animate-marquee gap-2 px-2">
        {[
          "Your idea",
          "AI creates",
          "Real product",
          "No designer",
          "No stock",
          "Fast preview",
          "Ready to order",
          "Made for you",
          "Your idea",
          "AI creates",
          "Real product",
          "No designer",
          "No stock",
          "Fast preview",
          "Ready to order",
          "Made for you",
        ].map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="shrink-0 rounded-full border border-purple-400/20 bg-gradient-to-r from-purple-500/12 via-fuchsia-500/10 to-cyan-500/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/80 shadow-[0_0_16px_rgba(168,85,247,0.06)] sm:text-xs"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* TRUST BAR */}
  <div className="relative mx-auto max-w-7xl px-4 pb-8 md:px-8 lg:px-12">
    <div className="flex items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 shadow-[0_0_24px_rgba(168,85,247,0.05)]">
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <span className="text-sm font-black text-white">Excellent</span>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex h-5 w-5 items-center justify-center rounded-[3px] bg-gradient-to-r from-purple-500 to-fuchsia-500 text-[10px] font-black text-white sm:h-6 sm:w-6"
            >
              ★
            </div>
          ))}
        </div>

        <span className="hidden h-4 w-px bg-white/10 sm:block" />

        <span className="text-xs font-medium text-white/55 sm:text-sm">
          4.9/5
        </span>

        <span className="hidden h-4 w-px bg-white/10 sm:block" />

        <span className="text-xs font-medium text-white/55 sm:text-sm">
          Based on 2,000+ reviews
        </span>

        <span className="hidden h-4 w-px bg-white/10 lg:block" />

        <span className="hidden text-sm font-medium text-white/55 lg:block">
          Trusted by creators worldwide
        </span>
      </div>
    </div>
  </div>

  <div className="relative mx-auto max-w-7xl px-4 pb-10 md:px-8 lg:px-12">
    <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-xl sm:grid-cols-2 md:shadow-[0_0_50px_rgba(168,85,247,0.12)] md:backdrop-blur-xl lg:grid-cols-4">
      {FEATURES.map((item) => (
        <FeatureCard key={item.title} item={item} />
      ))}
    </div>
  </div>
</section>

      <section className="relative bg-[#03030a] py-12 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-[2px] w-9 bg-purple-500 sm:w-12" />
            <h2 className="text-xl font-black uppercase italic tracking-tight sm:text-2xl md:text-3xl">
              What you can create
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {PRODUCTS.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#03030a] py-14 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_85%_50%,rgba(14,165,233,0.14),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <Link
              href={safeHref(CATALOG_HREF)}
              className="relative h-[250px] overflow-hidden rounded-[28px] md:h-[420px]"
            >
              <Image
                src="/1.png"
                alt="Customize products"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-center opacity-90"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#03030a]/70 via-transparent to-transparent" />
              <div className="absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-purple-600/25 blur-[45px] md:blur-[100px]" />
            </Link>

            <div className="relative p-0 lg:p-8">
              <div className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-purple-400">
                How it works
              </div>

              <h2 className="mb-5 text-4xl font-black uppercase leading-[0.94] tracking-tight md:text-6xl">
                From idea to
                <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                  real product
                </span>
              </h2>

              <p className="mb-7 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
                No designer, no complex editor, no stock. Just bring the idea
                and Ryfio helps you make it real.
              </p>

              <div className="grid gap-3">
                {CUSTOM_FEATURES.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-xs font-black text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                      ✓
                    </div>

                    <p className="text-sm font-semibold text-white/75 sm:text-base">
                      {safeText(item)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#03030a] py-20 text-white sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8 lg:px-12">
          <h2 className="mb-5 text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">
            Create your
            <span className="block bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              first product
            </span>
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/60 md:text-xl">
            Choose a product, describe your idea and let Ryfio create a custom
            design ready to order.
          </p>

          <Link
            href={safeHref(CREATE_HREF)}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 text-base font-black text-white shadow-lg transition hover:scale-[1.02] sm:w-auto md:shadow-[0_0_35px_rgba(168,85,247,0.55)]"
          >
            Create my product
          </Link>

          <p className="mt-5 text-sm text-white/35">
            Free to start • No credit card required
          </p>
        </div>
      </section>
    </main>
  );
}