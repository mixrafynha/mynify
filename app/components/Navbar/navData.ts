export const LINKS = Object.freeze([
  { name: "Catalog", href: "/catalog" },
  { name: "How it works", dropdown: ["How Ryfio works"] },
  { name: "Pricing", href: "/pricing" },
  { name: "Blog", href: "/blog" },
  { name: "Support", dropdown: ["Contact"] },
]);

export type NavLink = (typeof LINKS)[number];
