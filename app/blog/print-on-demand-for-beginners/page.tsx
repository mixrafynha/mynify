import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "../_components";
import { getPost } from "../_content";

const post = getPost("print-on-demand-for-beginners");

export const metadata: Metadata = {
  title: "Print on Demand for Beginners: A Simple Step-by-Step Guide | Ryfio",
  description: "Understand how print on demand works, what to sell, and what to avoid when launching your first custom products.",
  alternates: { canonical: "https://ryfio.com/blog/print-on-demand-for-beginners" },
  openGraph: {
    title: "Print on Demand for Beginners: A Simple Step-by-Step Guide | Ryfio",
    description: "Understand how print on demand works, what to sell, and what to avoid when launching your first custom products.",
    url: "https://ryfio.com/blog/print-on-demand-for-beginners",
    siteName: "Ryfio",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Print on Demand for Beginners: A Simple Step-by-Step Guide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Print on Demand for Beginners: A Simple Step-by-Step Guide | Ryfio",
    description: "Understand how print on demand works, what to sell, and what to avoid when launching your first custom products.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
