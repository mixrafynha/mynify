import "./globals.css";
import Providers from "./providers";
import Script from "next/script";
import type { Metadata } from "next";
import { Manrope, Inter, Audiowide } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "600", "700"],
});

const audiowide = Audiowide({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-logo",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "600"],
});

const siteUrl = "https://ryfio.com";
const siteName = "Ryfio";
const defaultTitle = "Ryfio — Create & Sell Custom Products";
const defaultDescription =
  "Design custom products, launch your brand and sell worldwide with print-on-demand fulfillment.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | Ryfio",
  },
  description: defaultDescription,
  keywords: [
    "print on demand",
    "custom products",
    "custom apparel",
    "t-shirt design",
    "hoodie design",
    "product designer",
    "ecommerce",
    "dropshipping",
    "online store",
    "print provider",
    "Ryfio",
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  category: "ecommerce",
  applicationName: siteName,
  alternates: {
    canonical: "/",
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
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ryfio — Create and sell custom products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: `${siteUrl}/favicon.ico`,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
        lang="en"
        className={`${manrope.variable} ${inter.variable} ${audiowide.variable} w-full h-full`}
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
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
