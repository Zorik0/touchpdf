import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TouchPDF",
    short_name: "TouchPDF",
    description: "Free PDF tools that run on your device.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#eceef1",
    theme_color: "#eceef1",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
