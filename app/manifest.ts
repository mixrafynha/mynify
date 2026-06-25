import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ryfio",
    short_name: "Ryfio",
    description:
      "Design custom products, launch your brand and sell worldwide with print-on-demand fulfillment.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#03030a",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
