import type { Metadata } from "next";

export const metadata: Metadata = {
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
