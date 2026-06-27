import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "../_components";
import { getPost } from "../_content";

const post = getPost("product-page-seo-for-custom-products");

export const metadata: Metadata = {
  title: "Product Page SEO for Custom Products | Ryfio",
  description: "Structure product pages so search engines and customers understand exactly what you sell.",
  alternates: { canonical: "https://www.ryfio.com/blog/product-page-seo-for-custom-products" },
  openGraph: {
    title: "Product Page SEO for Custom Products | Ryfio",
    description: "Structure product pages so search engines and customers understand exactly what you sell.",
    url: "https://www.ryfio.com/blog/product-page-seo-for-custom-products",
    siteName: "Ryfio",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Product Page SEO for Custom Products" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Product Page SEO for Custom Products | Ryfio",
    description: "Structure product pages so search engines and customers understand exactly what you sell.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
