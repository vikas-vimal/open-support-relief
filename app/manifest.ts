import type { MetadataRoute } from "next";

import { appConfig } from "@/config/app.config";

/**
 * PWA manifest, generated from config/app.config.ts.
 *
 * Next's file convention statically generates this at build, so rebranding in
 * config propagates to the installed app's name, icon label and splash colours
 * — not just the web page.
 */
export default function manifest(): MetadataRoute.Manifest {
  const { brand, theme } = appConfig;

  return {
    name: brand.name,
    short_name: brand.shortName,
    description: brand.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: theme.light.canvas,
    theme_color: theme.light.headerBg,
    categories: ["utilities", "social"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
