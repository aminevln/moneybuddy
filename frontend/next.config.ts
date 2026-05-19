import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ============================================================
  // DEV - allowedDevOrigins
  // ============================================================
  // Permette al dev server di accettare connessioni da IP non-localhost.
  // Necessario per testare via rete locale (es. iPhone su hotspot).
  // In produzione (Vercel) questa opzione è ignorata.
  allowedDevOrigins: [
    "172.20.10.4",
    "172.31.34.211",
    "172.26.4.53",   // IP PC su rete aziendale
  ],
  
  // ============================================================
  // DEV - onDemandEntries
  // ============================================================
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
  },
  
  // ============================================================
  // PROD - reactStrictMode
  // ============================================================
  // Doppio render in dev per debug. Non impatta prod.
  reactStrictMode: true,
  
  // ============================================================
  // PROD - poweredByHeader
  // ============================================================
  // Rimuove l'header "X-Powered-By: Next.js" per non rivelare lo stack.
  // Piccolo bonus di sicurezza.
  poweredByHeader: false,
};

export default nextConfig;