import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "../_components";
import { getPost } from "../_content";

const post = getPost("how-to-sell-custom-products-online");

export const metadata: Metadata = {
  title: "How to Sell Custom Products Online Without Inventory | Ryfio",
  description: "A simple sales framework for custom products: choose the product, build the offer, create trust, and send traffic to a clear page.",
  alternates: { canonical: "https://ryfio.com/blog/how-to-sell-custom-products-online" },
  openGraph: {
    title: "How to Sell Custom Products Online Without Inventory | Ryfio",
    description: "A simple sales framework for custom products: choose the product, build the offer, create trust, and send traffic to a clear page.",
    url: "https://ryfio.com/blog/how-to-sell-custom-products-online",
    siteName: "Ryfio",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "How to Sell Custom Products Online Without Inventory" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Sell Custom Products Online Without Inventory | Ryfio",
    description: "A simple sales framework for custom products: choose the product, build the offer, create trust, and send traffic to a clear page.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
