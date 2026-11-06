import type { NextConfig } from "next";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // package workspace berisi TypeScript mentah, jadi perlu ditranspile oleh Next
  transpilePackages: ["@dragonhold/shared"],
  async rewrites() {
    // Browser hanya bicara ke satu origin; /api/* diteruskan ke Hono
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;