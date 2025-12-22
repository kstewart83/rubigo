import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* instrumentation.ts is enabled by default in Next.js 15+ */

  // Exclude native modules from bundling - they'll use native require() at runtime
  // DuckDB has platform-specific bindings that can't be bundled
  serverExternalPackages: [
    '@duckdb/node-api',
    '@duckdb/node-bindings',
    '@duckdb/node-bindings-darwin-arm64',
    '@duckdb/node-bindings-darwin-x64',
    '@duckdb/node-bindings-linux-arm64',
    '@duckdb/node-bindings-linux-x64',
    '@duckdb/node-bindings-win32-x64',
    'better-sqlite3',
  ],

  // Note: watchOptions.ignored is deprecated in Next.js 16 with Turbopack
  // Turbopack handles file watching internally and ignores node_modules/.git by default
};

export default nextConfig;

