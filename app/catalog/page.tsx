"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

/* ================= SECURITY HELPERS (ADDED) ================= */

// 🔐 prevent unsafe URLs
const safeUrl = (url: string) => {
  if (typeof url !== "string") return "";
  const clean = url.trim().toLowerCase();
  if (clean.startsWith("javascript:")) return "";
  if (clean.startsWith("data:")) return "";
  return url;
};

// 🔐 safe text rendering
const safeText = (val: any) => {
  if (typeof val !== "string") return "";
  return val.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// 🔥 safe image builder (prevents injection via query params)
const safeImg = (url: string, w = 1200) => {
  if (typeof url !== "string") return "";
  if (!url.startsWith("http")) return "";
  return `${url}?auto=format&fit=crop&w=${w}`;
};

/* DATA */
const hero1Images = [
  "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c",
];

const hero2Images = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
  "https://images.unsplash.com/photo-1520975916090-3105956dac38",
];

const popularProducts = [
  { id: 1, name: "Minimal Hoodie", price: "€34.99", image: "https://images.unsplash.com/photo-1544441893-675973e31985" },
  { id: 2, name: "Classic T-Shirt", price: "€19.99", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab" },
  { id: 3, name: "Street Cap", price: "€14.99", image: "https://images.unsplash.com/photo-1514996937319-344454492b37" },
  { id: 4, name: "Coffee Mug", price: "€9.99", image: "https://images.unsplash.com/photo-1511920170033-f8396924c348" },
];

const newProducts = [
  { id: 5, name: "White Sneakers", price: "€49.99", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772" },
  { id: 6, name: "Backpack", price: "€39.99", image: "https://images.unsplash.com/photo-1503341733017-1901578f9f1e" },
  { id: 7, name: "Smart Watch", price: "€79.99", image: "https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b" },
  { id: 8, name: "Sunglasses", price: "€24.99", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083" },
];

export default function Home() {
  const [hero1Index, setHero1Index] = useState(0);
  const [hero2Index, setHero2Index] = useState(0);

  // 🔐 safe memo (prevents undefined issues)
  const hero1Length = useMemo(() => hero1Images?.length || 0, []);
  const hero2Length = useMemo(() => hero2Images?.length || 0, []);

  useEffect(() => {
    if (!hero1Length || !hero2Length) return;

    const interval = setInterval(() => {
      setHero1Index((prev) => (prev + 1) % hero1Length);
      setHero2Index((prev) => (prev + 1) % hero2Length);
    }, 3000);

    return () => clearInterval(interval);
  }, [hero1Length, hero2Length]);

  return (
    <div className="bg-white text-gray-900">

      {/* HERO 1 */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Create your own
            <span className="block text-green-500">brand products</span>
          </h1>

          <p className="text-gray-600 text-base max-w-md">
            Build a modern store with custom products and powerful design.
          </p>

          <Link href={safeUrl("/catalog")}>
            <button className="bg-green-500 text-white px-6 py-3 rounded-xl hover:scale-105 transition">
              Shop now
            </button>
          </Link>
        </div>

        <div className="relative h-[300px] w-full overflow-hidden rounded-2xl">
          {hero1Images.map((img, i) => (
            <Image
              key={i}
              src={safeImg(img, 1200)}
              alt="Hero"
              fill
              priority={i === 0}
              quality={80}
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`object-cover absolute inset-0 transition-opacity duration-1000 will-change-opacity ${
                i === hero1Index ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </section>

      {/* POPULAR PRODUCTS */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold mb-8">Popular products</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {popularProducts.map((p) => (
            <div key={p.id} className="group border rounded-xl overflow-hidden hover:shadow-lg transition">
              <div className="relative h-48 w-full">
                <Image
                  src={safeImg(p.image, 600)}
                  alt={safeText(p.name)}
                  fill
                  quality={75}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition"
                />
              </div>

              <div className="p-3">
                <h3 className="font-medium">{safeText(p.name)}</h3>
                <p className="text-gray-500 text-sm">{safeText(p.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HERO 2 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">

          <div className="relative h-[280px] w-full overflow-hidden rounded-2xl">
            {hero2Images.map((img, i) => (
              <Image
                key={i}
                src={safeImg(img, 1200)}
                alt="Hero"
                fill
                quality={80}
                sizes="(max-width: 768px) 100vw, 50vw"
                className={`object-cover absolute inset-0 transition-opacity duration-1000 will-change-opacity ${
                  i === hero2Index ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-semibold">
              Discover new trends
            </h2>
            <p className="text-gray-600 text-sm">
              Stay ahead with the latest products and modern designs.
            </p>
            <button className="bg-black text-white px-6 py-3 rounded-lg">
              Explore
            </button>
          </div>

        </div>
      </section>

      {/* NEW PRODUCTS */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold mb-8">New products</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {newProducts.map((p) => (
            <div key={p.id} className="group border rounded-xl overflow-hidden hover:shadow-lg transition">
              <div className="relative h-48 w-full">
                <Image
                  src={safeImg(p.image, 600)}
                  alt={safeText(p.name)}
                  fill
                  quality={75}
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition"
                />
              </div>

              <div className="p-3">
                <h3 className="font-medium">{safeText(p.name)}</h3>
                <p className="text-gray-500 text-sm">{safeText(p.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}