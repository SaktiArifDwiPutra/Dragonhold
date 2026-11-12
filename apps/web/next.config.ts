import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Package workspace berisi TypeScript mentah, ditranspile oleh Next.js
  transpilePackages: ["@dragonhold/shared", "@dragonhold/api", "@dragonhold/db"],
  serverExternalPackages: ["@node-rs/argon2"],
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
};

export default nextConfig;