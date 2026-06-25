import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "../_components";
import { getPost } from "../_content";

const post = getPost("ai-product-design-guide");

export const metadata: Metadata = {
  title: "AI Product Design: How to Turn Ideas Into Sellable Products | Ryfio",
  description: "Use AI design tools without creating generic products that look like everything else online.",
  alternates: { canonical: "https://ryfio.com/blog/ai-product-design-guide" },
  openGraph: {
    title: "AI Product Design: How to Turn Ideas Into Sellable Products | Ryfio",
    description: "Use AI design tools without creating generic products that look like everything else online.",
    url: "https://ryfio.com/blog/ai-product-design-guide",
    siteName: "Ryfio",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AI Product Design: How to Turn Ideas Into Sellable Products" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Product Design: How to Turn Ideas Into Sellable Products | Ryfio",
    description: "Use AI design tools without creating generic products that look like everything else online.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
