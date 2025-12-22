import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* instrumentation.ts is enabled by default in Next.js 15+ */

  // Exclude SQLite database files from the file watcher
  // This prevents Fast Refresh from triggering on every DB query
  // Works with both webpack and turbopack
  watchOptions: {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/rubigo.db*',
      '**/*.db',
      '**/*.db-wal',
      '**/*.db-shm',
      '**/*.sqlite*',
    ],
  },
};

export default nextConfig;
