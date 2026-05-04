"use client";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900">

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Create and sell custom products your way
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Design your own products, customize everything, and build your brand with MYNIFY.
          </p>

          <div className="flex gap-4">
            <Link href="/login">
              <button className="bg-[#39E58C] px-6 py-3 rounded-xl font-medium hover:bg-[#2fd67d] transition">
                Start creating
              </button>
            </Link>

            <button className="border border-gray-300 px-6 py-3 rounded-xl hover:bg-gray-100 transition">
              See examples
            </button>
          </div>
        </div>

        <div className="relative h-80 w-full">
          <Image
            src="https://images.unsplash.com/photo-1521336575822-6da63fb45455"
            alt="Custom products"
            fill
            className="object-cover rounded-2xl"
          />
        </div>
      </section>

      {/* CUSTOMIZATION SECTION */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">

          <div className="relative h-80 w-full">
            <Image
              src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519"
              alt="Design tools"
              fill
              className="object-cover rounded-2xl"
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">
              Fully customizable products
            </h2>
            <p className="text-gray-600 mb-6">
              Let your customers personalize products the way they want — from design to details.
            </p>

            <ul className="space-y-3 text-gray-700">
              <li>✔ Upload your own designs</li>
              <li>✔ Customize colors and styles</li>
              <li>✔ Preview before selling</li>
            </ul>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why MYNIFY?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-lg mb-2">Easy design</h3>
              <p className="text-gray-600">
                Create products in minutes with simple tools.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-lg mb-2">No inventory</h3>
              <p className="text-gray-600">
                We produce and ship for you automatically.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition">
              <h3 className="font-semibold text-lg mb-2">Scale easily</h3>
              <p className="text-gray-600">
                Grow your business without limits.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* PRODUCT PREVIEW GRID */}
     <section className="py-24 bg-gray-50">
  <div className="max-w-7xl mx-auto px-6">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
      What you can create
    </h2>

    <p className="text-center text-gray-600 mb-12">
      Create and sell unique products with your own designs.
    </p>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[
        {
          name: "T-Shirts",
          image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
        },
        {
          name: "Hoodies",
          image: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2",
        },
        {
          name: "Mugs",
          image: "https://images.unsplash.com/photo-1580910051074-3eb694886505",
        },
        {
          name: "Caps",
          image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
        },
      ].map((product, i) => (
        <div
          key={i}
          className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300"
        >
          <div className="relative h-44 w-full">
            <Image
              src={`${product.image}?auto=format&fit=crop&w=600&q=80`}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition duration-300"
            />
          </div>

          <div className="p-4 text-center font-medium">
            {product.name}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">
          Start building your custom brand today
        </h2>

        <Link href="/login">
          <button className="bg-black text-white px-8 py-4 rounded-xl hover:opacity-90 transition">
            Create your store
          </button>
        </Link>
      </section>

    </div>
  );
}
