/// <reference types="vitest" />
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
    plugins: [solidPlugin()],
    test: {
        environment: 'jsdom',
        globals: true,
        // Only run .test.tsx files (component tests). .test.ts are run by Bun.
        include: ['**/*.test.tsx'],
        exclude: ['**/node_modules/**', '**/dist/**', 'tests/**'],
        // Force browser-like module resolution for SolidJS
        deps: {
            optimizer: {
                web: {
                    include: ['solid-js'],
                },
            },
        },
        // Required for SolidJS to use client-side render
        resolve: {
            conditions: ['browser'],
        },
    },
    resolve: {
        conditions: ['browser'],
    },
});
