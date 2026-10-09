import type { NextConfig } from "next";

// Static export: the same `out/` folder is served by Vercel (web/PWA) and
// copied into the native shells by Capacitor. No server features allowed.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  devIndicators: false,
};

export default nextConfig;
