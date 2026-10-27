import type { NextConfig } from "next";

/**
 * Cabeçalhos de segurança estáticos. A Content-Security-Policy é definida por
 * request em `src/proxy.ts`, porque usa nonce (exige renderização dinâmica).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Conteúdo vem do CMS a cada request e a CSP usa nonce: renderização dinâmica clássica.
  cacheComponents: false,
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Pacotes com binários/WASM que não devem ser empacotados pelo bundler do servidor.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp", "nodemailer"],
  transpilePackages: ["three"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/**" }],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
