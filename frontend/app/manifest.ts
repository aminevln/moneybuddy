/**
 * Web App Manifest per MoneyBuddy.
 *
 * Next.js genera automaticamente /manifest.webmanifest da questo file.
 * Il browser lo legge per capire come "installare" l'app come PWA.
 *
 * Documentazione: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoneyBuddy",
    short_name: "MoneyBuddy",
    description: "Il tuo assistente finanziario con AI",
    start_url: "/",
    display: "standalone",  // niente barra del browser quando installata
    background_color: "#0f172a",  // slate-900
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",  // versione "ritagliabile" per Android
      },
    ],
  };
}