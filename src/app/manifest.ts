import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orbisy",
    short_name: "Orbisy",
    description:
      "Custom websites, member portals, and scoped software integrations for associations.",
    start_url: "/",
    display: "standalone",
    background_color: "#0e1220",
    theme_color: "#0e1220",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
