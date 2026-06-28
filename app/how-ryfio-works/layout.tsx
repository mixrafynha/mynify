import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Ryfio Works | Create and Sell Print-on-Demand Products",
  description:
    "Learn how Ryfio helps creators choose products, create designs, preview mockups, checkout and sell print-on-demand products without inventory.",
  alternates: {
    canonical: "/how-ryfio-works",
  },
};

export default function HowRyfioWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
