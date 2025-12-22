/**
 * Agent Loop Worker
 * 
 * Runs in a separate Bun thread, calling the tick API on an interval.
 * This allows the agent loop to run server-side without a browser tab.
 */

// Worker-specific global
const workerSelf = self as unknown as Worker;

let tickInterval: ReturnType<typeof setInterval> | null = null;
let tickCount = 0;
let isRunning = false;
let baseUrl = "http://localhost:3000"; // Will be configured on start

/**
 * Process one tick by calling the tick API
 */
async function tick() {
    try {
        const response = await fetch(`${baseUrl}/api/agents/tick`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();

        workerSelf.postMessage({
            type: "tick",
            tickCount: ++tickCount,
            result
        });
    } catch (error) {
        workerSelf.postMessage({
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            tickCount
        });
    }
}

/**
 * Handle messages from main thread
 */
workerSelf.onmessage = (event: MessageEvent) => {
    const { type, tickIntervalMs, serverUrl } = event.data;

    switch (type) {
        case "start":
            if (!isRunning) {
                isRunning = true;
                tickCount = 0;
                if (serverUrl) {
                    baseUrl = serverUrl;
                }
                const interval = tickIntervalMs || 3000;
                tickInterval = setInterval(tick, interval);
                // Run first tick immediately
                tick();
                workerSelf.postMessage({ type: "started", tickIntervalMs: interval });
            } else {
                workerSelf.postMessage({ type: "already_running" });
            }
            break;

        case "stop":
            if (isRunning) {
                isRunning = false;
                if (tickInterval) {
                    clearInterval(tickInterval);
                    tickInterval = null;
                }
                workerSelf.postMessage({ type: "stopped", tickCount });
            } else {
                workerSelf.postMessage({ type: "already_stopped" });
            }
            break;

        case "status":
            workerSelf.postMessage({
                type: "status",
                isRunning,
                tickCount
            });
            break;

        default:
            workerSelf.postMessage({ type: "unknown_command", command: type });
    }
};

// Signal ready
workerSelf.postMessage({ type: "ready" });
