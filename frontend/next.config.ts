import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permette al dev server di accettare connessioni da IP non-localhost.
  // Necessario per testare via rete locale (es. iPhone su hotspot, Chrome via IP).
  // Senza questo, Next.js 15+ blocca HMR e altre connessioni Turbopack
  // da origini diverse da localhost → la hydration React può non completarsi.
  allowedDevOrigins: [
    "172.20.10.4",   // IP Windows su hotspot iPhone
    "172.31.34.211", // IP WSL (accesso diretto)
  ],
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
  },
};

export default nextConfig;
