import type { Metadata } from "next";

export const metadata: Metadata = {
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
