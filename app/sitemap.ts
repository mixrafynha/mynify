import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://mynify.vercel.app";

  const routes = [
    "",
    "/how-it-works",
    "/catalog",
    "/login",
    "/privacy",
    "/terms",
    "/contact",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency:
      route === ""
        ? "daily"
        : route === "/catalog"
        ? "daily"
        : "weekly",
    priority:
      route === ""
        ? 1
        : route === "/how-it-works"
        ? 0.95
        : route === "/catalog"
        ? 0.9
        : route === "/login"
        ? 0.5
        : 0.7,
  }));
}
