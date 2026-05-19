import type { Metadata, Viewport } from "next";
import { Geist, Sora } from "next/font/google";

import "./globals.css";

import { AuthProvider } from "@/lib/auth/context/AuthProvider";
import { QueryProvider } from "@/lib/query/QueryProvider";


// Body font: Geist (sans-serif moderno, leggibile)
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});


// Heading font: Sora (rounded geometric)
const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "800"],
});


// URL base del sito — usato per gli og:image. In produzione mettilo nelle env.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MoneyBuddy — Il tuo assistente finanziario con AI",
    template: "%s · MoneyBuddy",
  },
  description:
    "Tieni traccia delle tue finanze con un assistente AI che capisce il linguaggio naturale.",
  applicationName: "MoneyBuddy",
  authors: [{ name: "Amine Ferhane" }],
  generator: "Next.js",
  keywords: [
    "finance",
    "personal finance",
    "AI",
    "budget",
    "expense tracker",
    "moneybuddy",
    "chatbot finanziario",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MoneyBuddy",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#FF6B35",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: siteUrl,
    siteName: "MoneyBuddy",
    title: "MoneyBuddy — Il tuo assistente finanziario con AI",
    description:
      "Tieni traccia delle tue finanze con un assistente AI che capisce il linguaggio naturale.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "MoneyBuddy logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "MoneyBuddy",
    description:
      "Tieni traccia delle tue finanze con un assistente AI che capisce il linguaggio naturale.",
    images: ["/icon-512.png"],
  },
  robots: {
    index: false,
    follow: false,
  },
};


export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a1a1f" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1f" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-bg-base text-fg-primary">
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}