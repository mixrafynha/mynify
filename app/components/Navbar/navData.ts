export const LINKS = Object.freeze([
  { name: "Catalog", href: "/catalog" },
  { name: "How it works", href: "/how-ryfio-works" },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  { name: "Support", href: "/contact" },
] satisfies ReadonlyArray<{ name: string; href: string }>);

export type NavLink = (typeof LINKS)[number];
