import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Products to Sell | RYFIO Product Catalogue",
  description:
    "Explore premium blank t-shirts, hoodies, sweatshirts, bags and accessories. Create custom products with RYFIO and start selling your designs online.",
  keywords: [
    "custom products",
    "print on demand products",
    "blank t-shirts",
    "custom hoodies",
    "custom clothing",
    "RYFIO catalogue",
  ],
  openGraph: {
    title: "Create Custom Products That Sell | RYFIO",
    description:
      "Choose premium blank products, customise your design and launch your next product with RYFIO.",
    type: "website",
    url: "/catalog",
  },
  alternates: {
    canonical: "/catalog",
  },
};

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
