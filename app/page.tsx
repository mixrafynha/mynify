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
import TestimonialRotator from "./components/TestimonialRotator";

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
  category: string;
  description: string;
};

const FEATURES: readonly Feature[] = Object.freeze([
  {
    icon: Zap,
    title: "Create with AI",
    desc: "Turn a simple idea into a product concept in seconds.",
  },
  {
    icon: ShoppingBag,
    title: "Made to sell",
    desc: "Premium clothing, accessories and gifts in your style.",
  },
  {
    icon: Truck,
    title: "Zero inventory",
    desc: "Create on demand without buying or storing stock.",
  },
  {
    icon: Headphones,
    title: "Launch faster",
    desc: "A simple workflow built for creators and new brands.",
  },
]);

const PRODUCTS: readonly Product[] = Object.freeze([
  {
    name: "Purple Graphic Tee",
    tag: "NEW",
    category: "Streetwear apparel",
    description: "A cinematic graphic tee made for standout moments.",
    image: "/create/editorial-purple.webp",
  },
  {
    name: "Graphic T-Shirt",
    image: "/create/editorial-sunset.webp",
    category: "Apparel",
    description: "A bold graphic canvas made to stand out.",
  },
  {
    name: "Color Story Tee",
    category: "Apparel",
    description: "Bold color and graphic energy for everyday wear.",
    image: "/create/editorial-color.webp",
  },
  {
    name: "Parkside Graphic Tee",
    category: "Lifestyle apparel",
    description: "A relaxed everyday look with a memorable graphic.",
    image: "/create/editorial-park.webp",
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
  index,
}: {
  product: Product;
  index: number;
}) {
  return (
    <Link
      href={safeHref(CATALOG_HREF)}
      className="product-editorial-card group relative mx-auto block h-[360px] w-full overflow-hidden rounded-none bg-black/20 transition duration-700 hover:-translate-y-1 hover:shadow-[0_0_70px_rgba(168,85,247,0.22)] sm:h-[700px] lg:h-[760px]"
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
        className="object-cover transition duration-[1400ms] ease-out group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#08050d] via-[#08050d]/35 to-transparent" />
      <div className="absolute inset-0 opacity-0 transition duration-700 group-hover:opacity-100 bg-[radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.38),transparent_52%)]" />

    </Link>
  );
});

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#1d1726] text-white">
      <section className="relative overflow-hidden">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(216,180,254,0.32),transparent_25%),radial-gradient(circle_at_58%_55%,rgba(244,114,182,0.18),transparent_22%),linear-gradient(180deg,#332044_0%,#1d1726_55%,#18131f_100%)]" />

  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,23,38,0.25)_0%,#1d1726_100%)] lg:bg-[linear-gradient(90deg,#1d1726_0%,rgba(29,23,38,0.94)_34%,rgba(29,23,38,0.45)_72%,#1d1726_100%)]" />

  <div className="relative mx-auto grid w-full max-w-[1800px] items-center gap-2 px-4 pb-3 pt-7 sm:pt-12 md:px-10 lg:min-h-[760px] lg:grid-cols-2 lg:gap-12 lg:px-16 lg:pb-4 lg:pt-20 xl:px-20">
    <div className="hero-copy-enter z-10 order-1 -mt-6 text-center sm:-mt-10 lg:-mt-54 lg:text-left">
      
      <h1
        className="mb-[74px] font-[var(--font-logo)] text-[30px] font-normal uppercase leading-[0.98] tracking-[-0.025em] sm:text-[39px] md:text-[45px] lg:-translate-x-[10%] lg:translate-y-[20%] lg:whitespace-nowrap lg:text-[48px] xl:text-[57px]"
        style={{ fontFamily: "var(--font-logo)", textShadow: "0 0 14px rgba(102,67,136,.28)" }}
      >
        <span className="text-white">Turn any idea into a </span>
        <span className="bg-gradient-to-r from-fuchsia-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">real product.</span>
      </h1>

      <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-white/70 sm:text-xl md:text-2xl lg:mx-0 lg:mb-8 lg:translate-x-0 lg:whitespace-nowrap">
        Write your idea and AI will create a beautiful design — no design skills needed.
      </p>

      {/* DESKTOP CTA */}
      <div className="relative top-[73px] hidden items-end justify-start gap-8 lg:flex">
        <div className="flex -translate-y-[15px] flex-col items-start gap-3">
          <Link
            href={safeHref(CATALOG_HREF)}
            className="hero-cta group relative inline-flex items-center justify-center gap-4 overflow-visible rounded-lg px-[3.25rem] py-[1.5rem] text-[1.375rem] font-black text-white shadow-[0_12px_35px_rgba(34,211,238,0.25)] transition duration-300 hover:-translate-y-1 active:translate-y-0"
          >
            Start creating
            <Zap size={20} aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-12" />
          </Link>
          <div className="flex items-center gap-2 pl-1 text-xs font-bold text-white/75">
            <span className="tracking-[0.12em] text-amber-300">★★★★★</span>
            <span>5/5 from creators</span>
          </div>
        </div>

        <div className="w-[380px] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.08] px-5 py-4 shadow-[0_8px_26px_rgba(0,0,0,0.2)] backdrop-blur-xl lg:-translate-y-[10px] lg:translate-x-[calc(20%_+_20px)]">
          <TestimonialRotator />
        </div>
      </div>
    </div>

    <div className="hero-visual-enter relative z-0 order-2 mx-auto -mt-4 flex w-full items-center justify-center sm:-mt-2 lg:justify-end">
      <Link
        href={safeHref(CATALOG_HREF)}
        className="relative block h-[323px] w-full max-w-[722px] p-[10px] sm:h-[409px] md:h-[475px] lg:right-[-10%] lg:h-[532px] lg:w-[969px] lg:max-w-none"
      >
        <div className="relative h-full w-full">
          <Image
            src="/hero2.webp"
            alt="Create custom products with Ryfio"
            fill
            priority
            quality={78}
            sizes="(max-width:640px) 100vw, (max-width:1024px) 980px, 1040px"
            className="hero-slide hero-slide-first -translate-x-[4%] scale-[1.14] object-contain object-center sm:translate-x-0 sm:scale-[1.16] lg:-translate-x-[2%] lg:scale-[1.235]"
          />

          <Image
            src="/hero3.webp"
            alt="Custom Ryfio product example"
            fill
            quality={78}
            sizes="(max-width:640px) 100vw, (max-width:1024px) 980px, 1040px"
            className="hero-slide hero-slide-second translate-x-0 scale-[1.14] object-contain object-center sm:translate-x-0 sm:scale-[1.10] lg:-translate-x-[1%] lg:scale-[1.235]"
          />
        </div>
      </Link>
    </div>
  </div>

  {/* MOBILE CTA */}
<div className="relative mx-auto w-full max-w-[280px] px-4 pb-6 lg:hidden">
  <Link
    href={safeHref(CATALOG_HREF)}
    className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-5 text-[13px] font-semibold text-white shadow-[0_8px_30px_rgba(168,85,247,0.25)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
  >
    <Zap size={15} aria-hidden="true" />
    Start creating
  </Link>
</div>

</section>

      <section className="relative mt-0 bg-[#1d1726] py-0">
        <div className="relative mx-auto w-full max-w-none px-0 lg:px-6">
          <h2 className="mb-8 -translate-y-[20px] whitespace-nowrap px-4 pt-8 font-[var(--font-logo)] text-5xl font-normal uppercase leading-[0.98] tracking-[-0.025em] text-white sm:text-6xl lg:px-0 lg:pt-10" style={{ fontFamily: "var(--font-logo)" }}>
            See what you can <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">create</span>
          </h2>
          <div className="grid w-full grid-cols-2 gap-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {PRODUCTS.map((product, index) => (
              <ProductCard key={product.name} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#1d1726] py-14 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_85%_50%,rgba(14,165,233,0.14),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <Link
              href={safeHref(CATALOG_HREF)}
              className="relative h-[250px] overflow-hidden rounded-[28px] md:h-[420px]"
            >
              <Image
                src="/1.webp"
                alt="Customize products"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-center opacity-90"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[#1d1726]/70 via-transparent to-transparent" />
            </Link>

            <div className="relative p-0 lg:p-8">
              <div className="mb-4 text-xs font-black uppercase tracking-[0.3em] text-purple-400">
              From idea to income
              </div>

              <h2 className="mb-5 text-4xl font-black uppercase leading-[0.94] tracking-tight md:text-6xl lg:whitespace-nowrap">
                Build a product
                <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent lg:inline">
                  people want
                </span>
              </h2>

              <p className="mb-7 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
                No designer, no inventory and no complicated setup. Bring the
                idea — Ryfio helps you turn it into a product ready to sell.
              </p>

              <div className="grid gap-3">
                {CUSTOM_FEATURES.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-xs font-black text-white">
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

      <section className="relative overflow-hidden bg-[#1d1726] py-20 text-white sm:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8 lg:px-12">
          <h2 className="mb-5 text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl lg:whitespace-nowrap">
            Launch your
            <span className="block bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent lg:inline">
              next bestseller
            </span>
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/60 md:text-xl">
            Choose a product, describe your idea and let Ryfio create a custom
            design ready to order or sell online.
          </p>

          <Link
            href={safeHref(CREATE_HREF)}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 text-base font-black text-white transition hover:scale-[1.02] sm:w-auto"
          >
            Create my bestseller
          </Link>

          <p className="mt-5 text-sm text-white/35">
            Free to start • No credit card required
          </p>
        </div>
      </section>
      <style suppressHydrationWarning>{`
        .hero-slide {
          opacity: 0;
          animation: heroCrossfade 12s ease-in-out infinite;
          will-change: opacity;
        }

        .hero-slide-first {
          animation-delay: 0s;
        }

        .hero-slide-second {
          animation-delay: 6s;
        }

        @keyframes heroCrossfade {
          0%, 35% { opacity: 1; }
          48%, 88% { opacity: 0; }
          100% { opacity: 1; }
        }

        .hero-copy-enter {
          animation: heroCopyEnter 900ms cubic-bezier(.22,1,.36,1) both;
        }

        .product-editorial-card {
          animation: productCardReveal 900ms cubic-bezier(.22,1,.36,1) both;
        }

        .product-editorial-card:nth-child(2) { animation-delay: 90ms; }
        .product-editorial-card:nth-child(3) { animation-delay: 180ms; }
        .product-editorial-card:nth-child(4) { animation-delay: 270ms; }

        @keyframes productCardReveal {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-visual-enter {
          animation: heroVisualEnter 1100ms cubic-bezier(.22,1,.36,1) 120ms both;
        }

        .hero-cta {
          background: linear-gradient(135deg, #06b6d4 0%, #6366f1 48%, #a855f7 100%);
          isolation: isolate;
        }

        .hero-cta::before {
          content: "";
          position: absolute;
          z-index: -1;
          inset: -18px;
          border-radius: 18px;
          opacity: 0;
          background:
            radial-gradient(circle at 8% 35%, rgba(34,211,238,.9) 0 2px, transparent 3px),
            radial-gradient(circle at 94% 20%, rgba(217,70,239,.9) 0 2px, transparent 3px),
            radial-gradient(circle at 82% 92%, rgba(129,140,248,.9) 0 1.5px, transparent 3px),
            radial-gradient(circle at 18% 90%, rgba(255,255,255,.8) 0 1.5px, transparent 3px);
          transform: scale(.72);
          transition: opacity 220ms ease;
          pointer-events: none;
        }

        .hero-cta:hover {
          box-shadow: 0 16px 45px rgba(34,211,238,.32), 0 0 34px rgba(168,85,247,.28);
        }

        .hero-cta:hover::before {
          opacity: 1;
          animation: heroSpray 700ms cubic-bezier(.22,1,.36,1) both;
        }

        .testimonial-window > span {
          position: absolute;
          inset: 0;
          display: block;
          opacity: 0;
          transform: translateY(12px);
          animation: testimonialFade 24s ease-in-out infinite;
        }

        .testimonial-window > span:nth-child(1) { animation-delay: 0s; }
        .testimonial-window > span:nth-child(2) { animation-delay: 6s; }
        .testimonial-window > span:nth-child(3) { animation-delay: 12s; }
        .testimonial-window > span:nth-child(4) { animation-delay: 18s; }

        @keyframes testimonialFade {
          0%, 5% { opacity: 0; transform: translateY(12px); }
          8%, 20% { opacity: 1; transform: translateY(0); }
          25%, 100% { opacity: 0; transform: translateY(-12px); }
        }

        @keyframes heroSpray {
          0% { transform: scale(.72); filter: blur(1px); }
          65% { transform: scale(1.08); filter: blur(0); }
          100% { transform: scale(1); filter: blur(0); }
        }

        @keyframes heroCopyEnter {
          from { opacity: 0; transform: translateX(-34px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes heroVisualEnter {
          from { opacity: 0; transform: translateX(34px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-slide { animation: none; }
          .hero-slide-first { opacity: 1; }
          .hero-slide-second { opacity: 0; }
          .hero-copy-enter, .hero-visual-enter, .hero-cta::before, .testimonial-window > span, .product-editorial-card { animation: none; }
        .testimonial-window > span:first-child { opacity: 1; transform: none; }

        .testimonial-message {
          animation: testimonialMessageIn 500ms cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes testimonialMessageIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        }
      `}</style>
    </main>
  );
}
