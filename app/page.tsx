import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import {
  ArrowUpRight,
  Headphones,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
  type LucideIcon,
} from "lucide-react";

const LOGIN_HREF = "/login";
const CREATE_HREF = "/dashboard/create";

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
  price: string;
  image: string;
  tag?: string;
};

const FEATURES: readonly Feature[] = Object.freeze([
  {
    icon: Zap,
    title: "Fast creation",
    desc: "Customize your products in seconds with our editor.",
  },
  {
    icon: ShieldCheck,
    title: "Premium quality",
    desc: "High-quality products made to last.",
  },
  {
    icon: Truck,
    title: "Worldwide shipping",
    desc: "We deliver wherever you are, fast and secure.",
  },
  {
    icon: Headphones,
    title: "Made for gamers",
    desc: "Exclusive designs for people who live the game.",
  },
]);

const PRODUCTS: readonly Product[] = Object.freeze([
  {
    name: "Custom Gamer Hoodie",
    price: "€49.99",
    tag: "BEST SELLER",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Premium Gamer T-Shirt",
    price: "€24.99",
    image:
      "https://images.unsplash.com/photo-1626160200951-fc4b4f8d4de9?q=80&w=900&auto=format&fit=crop",
  },
  {
    name: "Custom Gaming Poster",
    price: "€15.99",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
  },
  {
    name: "Custom Gamer Mug",
    price: "€14.99",
    image:
      "https://images.unsplash.com/photo-1614940403522-a8c829e7eb82?q=80&w=900&auto=format&fit=crop",
  },
]);

const CUSTOM_FEATURES = Object.freeze([
  "Upload your own designs",
  "Customize colors and styles",
  "Preview before buying",
]);

const FeatureCard = memo(function FeatureCard({ item }: { item: Feature }) {
  const Icon = item.icon;

  return (
    <Link
      href={safeHref(LOGIN_HREF)}
      className="flex min-h-[116px] items-center gap-3 border-b border-white/10 p-4 transition active:scale-[0.99] hover:bg-purple-500/10 xs:gap-4 xs:p-5 sm:min-h-[132px] sm:p-6 lg:min-h-0 lg:border-b-0 lg:border-r lg:p-7 lg:last:border-r-0"
    >
      <Icon
        className="h-9 w-9 shrink-0 text-purple-400 drop-shadow-[0_0_16px_rgba(168,85,247,0.85)] sm:h-[38px] sm:w-[38px]"
        aria-hidden="true"
      />

      <div className="min-w-0">
        <h3 className="mb-1 text-[15px] font-black leading-tight tracking-tight text-white sm:text-base">
          {safeText(item.title)}
        </h3>

        <p className="text-[13px] leading-relaxed text-white/55 sm:text-sm">
          {safeText(item.desc)}
        </p>
      </div>
    </Link>
  );
});

const ProductCard = memo(function ProductCard({
  product,
}: {
  product: Product;
}) {
  return (
    <Link
      href={safeHref(LOGIN_HREF)}
      className="group relative min-h-[250px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_0_30px_rgba(168,85,247,0.08)] transition duration-300 active:scale-[0.99] hover:-translate-y-1 hover:border-purple-500/45 sm:min-h-[240px] lg:min-h-[220px]"
    >
      {product.tag && (
        <div className="absolute left-3 top-3 z-20 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1 text-[10px] font-black sm:left-4 sm:top-4 sm:text-xs">
          {safeText(product.tag)}
        </div>
      )}

      <Image
        src={product.image}
        alt={safeText(product.name)}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover opacity-60 transition duration-500 group-hover:scale-110 sm:opacity-55"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent sm:bg-gradient-to-r sm:from-black sm:via-black/55 sm:to-transparent" />

      <div className="relative z-10 flex min-h-[250px] flex-col justify-end p-5 sm:min-h-[240px] sm:p-6 lg:min-h-[220px]">
        <h3 className="mb-4 max-w-[230px] text-lg font-bold leading-tight text-white sm:mb-5 sm:max-w-[190px] sm:text-base">
          {safeText(product.name)}
        </h3>

        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-black text-fuchsia-400">
            {safeText(product.price)}
          </p>

          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-purple-300 transition group-hover:bg-purple-500/20 sm:h-10 sm:w-10">
            <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
});

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#03030a] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(168,85,247,0.38),transparent_32%),radial-gradient(circle_at_52%_52%,rgba(14,165,233,0.22),transparent_28%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)] sm:bg-[radial-gradient(circle_at_72%_32%,rgba(168,85,247,0.35),transparent_28%),radial-gradient(circle_at_58%_52%,rgba(14,165,233,0.25),transparent_24%),linear-gradient(180deg,#03030a_0%,#050511_55%,#03030a_100%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,3,10,0.2)_0%,#03030a_100%)] lg:bg-[linear-gradient(90deg,#03030a_0%,rgba(3,3,10,0.92)_34%,rgba(3,3,10,0.45)_72%,#03030a_100%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pb-8 pt-8 sm:gap-10 sm:pt-14 md:px-8 lg:min-h-[690px] lg:grid-cols-2 lg:px-12 lg:pb-10 lg:pt-24">
          <div className="z-10 order-1 text-center lg:text-left">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/85 shadow-[0_0_22px_rgba(168,85,247,0.35)] sm:mb-6 sm:px-4 sm:text-xs sm:tracking-[0.25em]">
              <Zap size={14} className="shrink-0 text-purple-400" aria-hidden="true" />
              <span className="truncate">AI-powered creator platform</span>
            </div>

            <h1 className="mx-auto mb-5 max-w-[380px] text-[clamp(3rem,16vw,4.5rem)] font-black uppercase leading-[0.84] tracking-[-0.055em] sm:mb-6 sm:max-w-none sm:text-6xl md:text-7xl lg:mx-0 lg:text-[105px]">
              <span className="block text-white">Create your</span>
              <span className="block bg-gradient-to-r from-violet-300 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                brand
              </span>
              <span className="block text-white">with AI</span>
            </h1>

            <p className="mx-auto mb-7 max-w-xl text-[15px] font-medium leading-relaxed text-white/65 sm:mb-8 sm:text-lg md:text-xl lg:mx-0 lg:text-white/60">
              Generate designs, customize products, launch your online store and
              sell worldwide without inventory.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={safeHref(LOGIN_HREF)}
                className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 px-6 py-4 text-base font-black text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition duration-300 active:scale-[0.99] hover:scale-105 sm:w-auto sm:px-8"
              >
                Generate my brand
                <Zap size={18} aria-hidden="true" />
              </Link>

              <Link
                href={safeHref(LOGIN_HREF)}
                className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base font-bold text-white/90 backdrop-blur-xl transition active:scale-[0.99] hover:border-purple-500/40 hover:bg-white/10 sm:w-auto sm:px-8"
              >
                Explore products
                <ShoppingBag size={18} aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur sm:mt-10 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-8 sm:border-0 sm:bg-transparent sm:p-0 lg:justify-start">
              <div>
                <div className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  10K+
                </div>
                <div className="text-xs font-medium text-white/40 sm:text-sm">
                  creators
                </div>
              </div>

              <div>
                <div className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  AI
                </div>
                <div className="text-xs font-medium text-white/40 sm:text-sm">
                  generated designs
                </div>
              </div>

              <div>
                <div className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  Global
                </div>
                <div className="text-xs font-medium text-white/40 sm:text-sm">
                  shipping
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-0 order-2 mx-auto h-[260px] w-full max-w-[420px] sm:h-[360px] sm:max-w-[520px] md:h-[430px] lg:h-[560px] lg:max-w-none">
            <div className="absolute inset-x-8 inset-y-0 rounded-full bg-purple-600/20 blur-[70px] sm:inset-0 sm:blur-[80px]" />

            <Link
              href={safeHref(LOGIN_HREF)}
              className="absolute inset-0 overflow-visible lg:left-auto lg:right-[-120px] lg:w-[900px]"
            >
              <Image
                src="/hero2.png"
                alt="Mynify AI ecommerce platform"
                fill
                priority
                quality={85}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 80vw, 900px"
                className="object-contain object-center drop-shadow-[0_0_45px_rgba(168,85,247,0.45)] sm:drop-shadow-[0_0_55px_rgba(168,85,247,0.45)]"
              />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-10 md:px-8 lg:px-12 lg:pb-12">
          <div className="grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] shadow-[0_0_50px_rgba(168,85,247,0.12)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((item) => (
              <FeatureCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR PRODUCTS */}
      <section className="relative bg-[#03030a] py-12 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(168,85,247,0.16),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="mb-6 flex items-center gap-3 sm:mb-8 sm:gap-4">
            <div className="h-[2px] w-8 bg-purple-500 sm:w-12" />
            <h2 className="text-lg font-black uppercase italic tracking-tight sm:text-2xl md:text-3xl">
              Popular products
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {PRODUCTS.map((product) => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CUSTOMIZATION */}
      <section className="relative overflow-hidden bg-[#03030a] py-14 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_85%_50%,rgba(14,165,233,0.14),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-[26px] bg-[#070711]/90 shadow-[0_0_80px_rgba(168,85,247,0.08)] backdrop-blur-2xl sm:rounded-[30px]">
            <div className="grid items-center lg:grid-cols-[1.1fr_1fr]">
              <Link
                href={safeHref(CREATE_HREF)}
                className="relative h-[260px] overflow-hidden sm:h-[340px] md:h-[420px]"
              >
                <Image
                  src="/1.png"
                  alt="Customize products"
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center opacity-90"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#03030a]/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#03030a]/70 lg:via-transparent lg:to-transparent" />
                <div className="absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-purple-600/25 blur-[100px]" />
              </Link>

              <div className="relative p-6 sm:p-8 md:p-12 lg:p-16">
                <div className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-purple-400 sm:text-xs sm:tracking-[0.35em]">
                  Customize
                </div>

                <h2 className="mb-5 text-[clamp(2.4rem,11vw,3.8rem)] font-black uppercase leading-[0.92] tracking-tight md:text-6xl lg:mb-6">
                  Create your
                  <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                    gamer style
                  </span>
                </h2>

                <p className="mb-7 max-w-xl text-base leading-relaxed text-white/60 sm:mb-8 sm:text-lg sm:text-white/55">
                  Let creators customize products with names, tags, colors and
                  unique AI-powered visuals.
                </p>

                <div className="space-y-3 sm:space-y-4">
                  {CUSTOM_FEATURES.map((item) => (
                    <div key={item} className="flex items-center gap-3 sm:gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-xs font-black text-white shadow-[0_0_20px_rgba(168,85,247,0.45)]">
                        ✓
                      </div>

                      <p className="text-sm font-medium text-white/75 sm:text-base">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 sm:mt-10">
                  <Link
                    href={safeHref(LOGIN_HREF)}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-4 font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.45)] transition active:scale-[0.99] hover:scale-105 sm:w-auto sm:px-8"
                  >
                    Start customizing
                    <Zap size={18} aria-hidden="true" />
                  </Link>
                </div>

                <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-[90px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#03030a] py-16 text-white sm:py-24 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_45%)]" />

        <div className="relative mx-auto max-w-5xl px-4 text-center md:px-8 lg:px-12">
          <h2 className="mb-5 text-[clamp(2.3rem,11vw,3.8rem)] font-black uppercase leading-tight tracking-tight md:text-6xl lg:mb-6">
            Turn ideas into{" "}
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
              real products
            </span>
          </h2>

          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/60 sm:mb-10 sm:text-lg md:text-xl">
            Start your gamer brand, sell custom products, and grow without
            inventory.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href={safeHref(LOGIN_HREF)}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-8 py-4 text-base font-bold text-white shadow-[0_0_35px_rgba(168,85,247,0.55)] transition active:scale-[0.99] hover:scale-105 sm:inline-block sm:px-10 sm:text-lg"
            >
              🚀 Start now
            </Link>

            <Link
              href={safeHref(LOGIN_HREF)}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 px-8 py-4 text-base text-white transition active:scale-[0.99] hover:border-purple-500/40 hover:bg-white/10 sm:px-10 sm:text-lg"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-6 text-sm text-white/35">
            No credit card required • Free to start
          </p>
        </div>
      </section>
    </main>
  );
}
