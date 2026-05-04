import "./globals.css";
import Providers from "./providers";
import { Manrope, Inter } from "next/font/google";
import Script from "next/script";
import Footer from "@/app/components/Footer"; // ✅ ADD

// ================= FONTS (PREMIUM SAAS / APPLE STYLE) =================

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

// ================= METADATA =================

export const metadata = {
  title:
    "MYNIFY – Create and Sell Custom Products Online | Print on Demand Platform",
  description:
    "Create and sell custom products online with MYNIFY. Design t-shirts, hoodies, mugs, and more with print-on-demand. No inventory, no hassle. Start your online business today.",
  keywords: [
    "custom products",
    "print on demand",
    "sell custom t-shirts",
    "create online store",
    "dropshipping custom products",
    "design your own products",
    "custom merch platform",
  ],
  openGraph: {
    title:
      "MYNIFY – Create and Sell Custom Products Online | Print on Demand Platform",
    description:
      "Create and sell custom products online with MYNIFY. Design t-shirts, hoodies, mugs, and more with print-on-demand.",
    url: "https://www.mynify.com",
    site_name: "MYNIFY",
    images: [
      {
        url: "https://example.com/path/to/image.jpg",
        width: 800,
        height: 600,
        alt: "MYNIFY Platform Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@mynify",
    title: "MYNIFY – Create and Sell Custom Products Online",
    description:
      "Start your online business today with MYNIFY. Create custom products on demand.",
    image: "https://example.com/path/to/image.jpg",
  },
};

// ================= ROOT LAYOUT =================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt"
      className={`${manrope.variable} ${inter.variable} w-full h-full`}
    >
      <body
        className={`
          ${manrope.className}
          w-full min-h-screen m-0 p-0 bg-white text-gray-900
          antialiased leading-relaxed tracking-tight
          flex flex-col
        `}
      >
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />

        <Script
          src="https://example.com/analytics.js"
          strategy="lazyOnload"
        />

        {/* ✅ FIX IMPORTANTE: evita hidration mismatch em sidebars */}
        <div className="flex flex-col flex-1 w-full min-h-screen">
          <Providers>
            <main className="flex-1 w-full">
              {children}
            </main>
          </Providers>
        </div>

      </body>
    </html>
  );
}