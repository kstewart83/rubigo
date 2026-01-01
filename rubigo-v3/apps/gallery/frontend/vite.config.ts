import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [solid()],
    server: {
        port: 37003,
        strictPort: true,
    },
    resolve: {
        alias: {
            '@rubigo/components': fileURLToPath(new URL('../../../impl/ts/shared/primitives', import.meta.url)),
            '@rubigo/statechart': fileURLToPath(new URL('../../../impl/ts/statechart', import.meta.url)),
            '@rubigo/tokens': fileURLToPath(new URL('../../../impl/ts/tokens', import.meta.url)),
            '@generated': fileURLToPath(new URL('../../../generated', import.meta.url)),
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});
