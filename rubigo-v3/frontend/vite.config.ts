import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  server: {
    // Vite runs on 37001, backend proxies to us
    port: parseInt(process.env.VITE_PORT || '37001'),
    strictPort: true,
    // Allow connections from the Axum proxy
    cors: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
});
