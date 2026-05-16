import "./globals.css";
import Providers from "./providers";
import Script from "next/script";
import { Manrope, Inter } from "next/font/google";

// ================= FONTS (PREMIUM SAAS / APPLE STYLE) =================

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "600"],
});

// ================= METADATA =================

export const metadata = {
  title: "MYNIFY – Create Your Brand with AI | Sell Products Without Inventory",

  description:
    "Create your own brand with AI using MYNIFY. Generate designs, customize products, launch your online store, and sell t-shirts, hoodies, mugs, and more without inventory.",

  keywords: [
    "AI ecommerce platform",
    "AI brand generator",
    "create brand with AI",
    "print on demand",
    "sell custom products",
    "custom merch platform",
    "AI product design",
    "AI mockup generator",
    "creator commerce",
    "sell merch online",
    "create online store",
    "custom t-shirts",
    "custom hoodies",
    "no inventory ecommerce",
    "dropshipping custom products",
  ],

  authors: [{ name: "MYNIFY" }],
  creator: "MYNIFY",
  publisher: "MYNIFY",

  metadataBase: new URL("https://mynify.vercel.app"),

  alternates: {
    canonical: "https://mynify.vercel.app",
  },

  openGraph: {
    title: "MYNIFY – Create Your Brand with AI",
    description:
      "Turn your ideas into products, brands, and online stores with AI. Create and sell custom merch without inventory.",
    url: "https://mynify.vercel.app",
    siteName: "MYNIFY",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://mynify.vercel.app/ogimage.jpg",
        width: 1200,
        height: 630,
        alt: "MYNIFY AI Ecommerce Platform",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@mynify",
    creator: "@mynify",
    title: "MYNIFY – Create Your Brand with AI",
    description:
      "Generate designs, customize products, launch your store, and sell online without inventory.",
    images: ["https://mynify.vercel.app/ogimage.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],

    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
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

        <div className="flex flex-col flex-1 w-full min-h-screen">
          <Providers>
            <main className="flex-1 w-full">{children}</main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
