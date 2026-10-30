import type { MetadataRoute } from "next";

/** Install metadata, so "Add to Home Screen" and installed-app windows show the Sijill mark and name. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sijill",
    short_name: "Sijill",
    description: "Sijill is the digital share register and cap table for GCC companies.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#0b8a68",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
      { src: "/icons/icon-maskable-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ],
  };
}
