import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "../_components";
import { getPost } from "../_content";

const post = getPost("how-to-create-a-hoodie-design");

export const metadata: Metadata = {
  title: "How to Create a Hoodie Design People Want to Wear | Ryfio",
  description: "A practical guide to hoodie design, placement, scale, contrast, and brand feel for custom apparel.",
  alternates: { canonical: "https://www.ryfio.com/blog/how-to-create-a-hoodie-design" },
  openGraph: {
    title: "How to Create a Hoodie Design People Want to Wear | Ryfio",
    description: "A practical guide to hoodie design, placement, scale, contrast, and brand feel for custom apparel.",
    url: "https://www.ryfio.com/blog/how-to-create-a-hoodie-design",
    siteName: "Ryfio",
    type: "article",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "How to Create a Hoodie Design People Want to Wear" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Create a Hoodie Design People Want to Wear | Ryfio",
    description: "A practical guide to hoodie design, placement, scale, contrast, and brand feel for custom apparel.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  if (!post) notFound();
  return <ArticlePage post={post} />;
}
