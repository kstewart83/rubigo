import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [solid()],
  server: {
    // Vite runs on 37001, backend proxies to us
    port: parseInt(process.env.VITE_PORT || '37001'),
    strictPort: true,
    // Allow connections from the Axum proxy
    cors: true,
  },
  resolve: {
    alias: {
      '@rubigo/components': fileURLToPath(new URL('../../../impl/ts', import.meta.url)),
      '@rubigo/tokens': fileURLToPath(new URL('../../../impl/ts/tokens', import.meta.url)),
      '@generated': fileURLToPath(new URL('../../../generated', import.meta.url)),
      // Legacy alias for existing imports
      '../../components-ts': fileURLToPath(new URL('../../../impl/ts', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
