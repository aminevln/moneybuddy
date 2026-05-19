import type { MetadataRoute } from "next";


/**
 * PWA Manifest dinamico per MoneyBuddy.
 *
 * Next 16 lo serve automaticamente all'URL `/manifest.webmanifest`,
 * inferendo il content-type corretto.
 *
 * Non aggiungere anche un manifest.webmanifest in public/: andrebbero in conflitto.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoneyBuddy — Il tuo assistente finanziario con AI",
    short_name: "MoneyBuddy",
    description:
      "Tieni traccia delle tue finanze con un assistente AI che capisce il linguaggio naturale.",
    lang: "it",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#1a1a1f",
    background_color: "#1a1a1f",
    categories: ["finance", "productivity", "lifestyle"],
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
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Chiedi a MoneyBuddy",
        short_name: "Chat",
        description: "Apri la chat con l'assistente AI",
        url: "/chat",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Nuova transazione",
        short_name: "Transazioni",
        description: "Vai alle transazioni",
        url: "/transactions",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}