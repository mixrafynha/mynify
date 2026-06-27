import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "../_components";
import { getPost } from "../_content";

const post = getPost("how-to-start-a-clothing-brand");

export const metadata: Metadata = {
  title: "How to Start a Clothing Brand in 2026 | Ryfio",
  description: "Build a focused clothing brand with a real niche, a small product line, print-on-demand fulfillment, and a launch plan that does not require inventory.",
  alternates: { canonical: "https://www.ryfio.com/blog/how-to-start-a-clothing-brand" },
  openGraph: {
    title: "How to Start a Clothing Brand in 2026 | Ryfio",
    description: "Build a focused clothing brand with a real niche, a small product line, print-on-demand fulfillment, and a launch plan that does not require inventory.",
    url: "https://www.ryfio.com/blog/how-to-start-a-clothing-brand",
    siteName: "Ryfio",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "How to Start a Clothing Brand in 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Start a Clothing Brand in 2026 | Ryfio",
    description: "Build a focused clothing brand with a real niche, a small product line, print-on-demand fulfillment, and a launch plan that does not require inventory.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
