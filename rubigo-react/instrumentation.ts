/**
 * Next.js Instrumentation
 * 
 * This file runs on server startup. It handles:
 * 1. OpenTelemetry registration with custom SQLite exporter
 * 2. System initialization (Global Administrator creation)
 * 3. Event Router initialization (worker threads)
 * 
 * Must be at the root (not in src/) for Next.js 15+.
 */

import { registerOTel } from '@vercel/otel';

export async function register() {
    console.log("[Instrumentation] register() called");
    console.log("[Instrumentation] NEXT_RUNTIME:", process.env.NEXT_RUNTIME);

    // Only run on server side (Node.js runtime)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        console.log("[Instrumentation] Running in nodejs runtime");

        try {
            // 1. Register OpenTelemetry with custom SQLite exporter
            const { SQLiteSpanExporter } = await import('@/lib/otel/sqlite-exporter');

            registerOTel({
                serviceName: 'rubigo-react',
                traceExporter: new SQLiteSpanExporter(),
            });

            // 2. Initialize system (generate token or auto-init)
            const { generateAndLogToken } = await import("@/lib/initialization");
            await generateAndLogToken();

            // 3. Initialize Event Router (spawns worker threads)
            const { eventRouter } = await import("@/workers/event-router");
            eventRouter.initialize();

            console.log("[Instrumentation] Setup complete");
        } catch (error) {
            console.error("[Instrumentation] Error:", error);
        }
    }
}
