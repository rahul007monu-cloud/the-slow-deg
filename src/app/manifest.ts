import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "The Slow Deg",
    short_name: "Slow Deg",
    description: "Book a master non-veg chef for your event. Live coals, dum biryani, raan carving.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0807",
    theme_color: "#0b0807",
    categories: ["food", "lifestyle", "business"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book the chef", url: "/#book", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Ask the AI", url: "/?chat=1", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
