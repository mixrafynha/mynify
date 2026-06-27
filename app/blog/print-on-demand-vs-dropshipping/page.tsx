import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "../_components";
import { getPost } from "../_content";

const post = getPost("print-on-demand-vs-dropshipping");

export const metadata: Metadata = {
  title: "Print on Demand vs Dropshipping: Which Is Better? | Ryfio",
  description: "Compare print on demand and dropshipping so you can choose the best model for apparel, accessories, and creator-led ecommerce.",
  alternates: { canonical: "https://www.ryfio.com/blog/print-on-demand-vs-dropshipping" },
  openGraph: {
    title: "Print on Demand vs Dropshipping: Which Is Better? | Ryfio",
    description: "Compare print on demand and dropshipping so you can choose the best model for apparel, accessories, and creator-led ecommerce.",
    url: "https://www.ryfio.com/blog/print-on-demand-vs-dropshipping",
    siteName: "Ryfio",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Print on Demand vs Dropshipping: Which Is Better?" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Print on Demand vs Dropshipping: Which Is Better? | Ryfio",
    description: "Compare print on demand and dropshipping so you can choose the best model for apparel, accessories, and creator-led ecommerce.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
