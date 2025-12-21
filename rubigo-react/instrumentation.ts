/**
 * OpenTelemetry Instrumentation for Next.js
 * 
 * This file must be at the root of the project (not in src/).
 * Next.js 15+ automatically loads instrumentation.ts on startup.
 * 
 * Uses a custom SQLite exporter for airgapped operation.
 */

import { registerOTel } from '@vercel/otel';

export async function register() {
    // Only register on the server (Node.js runtime)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Dynamic import to avoid bundling issues
        const { SQLiteSpanExporter } = await import('@/lib/otel/sqlite-exporter');

        registerOTel({
            serviceName: 'rubigo-react',
            traceExporter: new SQLiteSpanExporter(),
        });
    }
}
