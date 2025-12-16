/**
 * Next.js Instrumentation
 * 
 * This file runs on server startup - we use it to generate and log 
 * the initialization token once per server launch.
 */

export async function register() {
    console.log("[Instrumentation] register() called");
    console.log("[Instrumentation] NEXT_RUNTIME:", process.env.NEXT_RUNTIME);

    // Only run on server side
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("[Instrumentation] Running in nodejs runtime");

        try {
            const { generateAndLogToken } = await import("@/lib/initialization");

            // Generate and log token once at startup
            await generateAndLogToken();

            console.log("[Instrumentation] Token generated, RUBIGO_INIT_TOKEN:", process.env.RUBIGO_INIT_TOKEN ? "SET" : "NOT SET");
        } catch (error) {
            console.error("[Instrumentation] Error:", error);
        }
    }
}
