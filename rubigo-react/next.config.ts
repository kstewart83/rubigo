import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* instrumentation.ts is enabled by default in Next.js 15+ */

  // Exclude native modules from webpack bundling - they must be loaded at runtime
  serverExternalPackages: [
    "@duckdb/node-api",
    "@duckdb/node-bindings",
  ],
};

export default nextConfig;
