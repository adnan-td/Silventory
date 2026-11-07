import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Silventory | Tailoring work, in order",
    short_name: "Silventory",
    description: "A simple workspace for tailoring requests, customer contacts, and delivery dates.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9fc",
    theme_color: "#7753c8",
    icons: [
      { src: "/silventory-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/silventory-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/silventory-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
