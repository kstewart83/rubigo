import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
    plugins: [solid()],
    server: {
        port: 37003,
        strictPort: true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
