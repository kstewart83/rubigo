/**
 * Agent Scheduler - Discrete event simulation for agent activity
 * 
 * Manages a priority queue of events and processes them based on
 * reaction tier priority and scheduled time.
 */

import {
    ScheduledEvent,
    AgentRuntimeState,
    AgentAction,
    ActionResult,
    calculateEventPriority,
    createEventId,
    getEventTier,
    type AgentStatus,
    type ReactionTier,
} from "./agent-types";
import { OllamaClient, getOllamaClient } from "./ollama-client";
import { buildPersonaPrompt, buildReActPrompt, parseReActResponse } from "./agent-persona";

/**
 * Priority Queue implementation using a binary heap
 */
class PriorityQueue<T> {
    private heap: T[] = [];
    private compareFn: (a: T, b: T) => number;

    constructor(compareFn: (a: T, b: T) => number) {
        this.compareFn = compareFn;
    }

    push(item: T): void {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    pop(): T | undefined {
        if (this.heap.length === 0) return undefined;
        const top = this.heap[0];
        const last = this.heap.pop();
        if (this.heap.length > 0 && last !== undefined) {
            this.heap[0] = last;
            this.bubbleDown(0);
        }
        return top;
    }

    peek(): T | undefined {
        return this.heap[0];
    }

    size(): number {
        return this.heap.length;
    }

    clear(): void {
        this.heap = [];
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.compareFn(this.heap[index], this.heap[parentIndex]) >= 0) break;
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    private bubbleDown(index: number): void {
        const length = this.heap.length;
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < length && this.compareFn(this.heap[leftChild], this.heap[smallest]) < 0) {
                smallest = leftChild;
            }
            if (rightChild < length && this.compareFn(this.heap[rightChild], this.heap[smallest]) < 0) {
                smallest = rightChild;
            }
            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }
}

export interface SchedulerCallbacks {
    onAgentStateChange?: (agentId: string, newStatus: AgentStatus) => Promise<void>;
    onEventProcessed?: (event: ScheduledEvent, result: ActionResult) => Promise<void>;
    onError?: (error: Error, event?: ScheduledEvent) => void;
    getPersonnel?: (personnelId: string) => Promise<{
        id: string;
        name: string;
        title?: string;
        department?: string;
        bio?: string;
    } | null>;
}

/**
 * AgentScheduler - Core event loop for agent simulation
 */
export class AgentScheduler {
    private eventQueue: PriorityQueue<ScheduledEvent>;
    private agentStates: Map<string, AgentRuntimeState>;
    private ollamaClient: OllamaClient;
    private personaCache: Map<string, string>; // Cached persona prompts
    private running: boolean = false;
    private tickInterval: ReturnType<typeof setInterval> | null = null;
    private callbacks: SchedulerCallbacks;

    constructor(callbacks: SchedulerCallbacks = {}) {
        this.eventQueue = new PriorityQueue<ScheduledEvent>(
            (a, b) => calculateEventPriority(a) - calculateEventPriority(b)
        );
        this.agentStates = new Map();
        this.ollamaClient = getOllamaClient();
        this.personaCache = new Map();
        this.callbacks = callbacks;
    }

    /**
     * Initialize agents from database
     */
    async initializeAgents(agentIds: string[]): Promise<void> {
        for (const agentId of agentIds) {
            this.agentStates.set(agentId, {
                personnelId: agentId,
                name: agentId, // Will be updated when personnel data is fetched
                status: "dormant",
                activeContextIds: [],
                lastActivityAt: new Date().toISOString(),
                pendingActionCount: 0,
            });
        }
    }

    /**
     * Schedule an event for processing
     */
    scheduleEvent(
        agentId: string,
        eventType: ScheduledEvent["eventType"],
        payload: Record<string, unknown> = {},
        scheduledFor?: number
    ): string {
        const tier = getEventTier(eventType);
        const event: ScheduledEvent = {
            id: createEventId(),
            agentId,
            scheduledFor: scheduledFor || Date.now(),
            tier,
            eventType,
            payload,
            createdAt: Date.now(),
        };

        this.eventQueue.push(event);

        // Update agent pending count
        const state = this.agentStates.get(agentId);
        if (state) {
            state.pendingActionCount++;
        }

        return event.id;
    }

    /**
     * Process the next event in the queue
     */
    async tick(): Promise<ActionResult | null> {
        const event = this.eventQueue.peek();
        if (!event) return null;

        // Check if event is ready to process
        if (event.scheduledFor > Date.now()) {
            return null; // Not time yet
        }

        // Remove from queue
        this.eventQueue.pop();

        const state = this.agentStates.get(event.agentId);
        if (!state) {
            return { success: false, action: { type: "wait" }, error: "Agent not found", durationMs: 0 };
        }

        // Update agent status to active (processing)
        state.status = "active";
        state.pendingActionCount = Math.max(0, state.pendingActionCount - 1);
        await this.callbacks.onAgentStateChange?.(event.agentId, "active");

        const startTime = Date.now();
        let result: ActionResult;

        try {
            result = await this.processEvent(event, state);
        } catch (error) {
            result = {
                success: false,
                action: { type: "wait" },
                error: error instanceof Error ? error.message : "Unknown error",
                durationMs: Date.now() - startTime,
            };
            this.callbacks.onError?.(error instanceof Error ? error : new Error(String(error)), event);
        }

        // Update agent state - stays active while running
        state.status = "active";
        state.lastActivityAt = new Date().toISOString();
        await this.callbacks.onAgentStateChange?.(event.agentId, "active");

        await this.callbacks.onEventProcessed?.(event, result);

        return result;
    }

    /**
     * Process a specific event
     */
    private async processEvent(event: ScheduledEvent, state: AgentRuntimeState): Promise<ActionResult> {
        const startTime = Date.now();

        // Check Ollama availability
        const health = await this.ollamaClient.isAvailable();
        if (!health.available) {
            // Set agent to dormant
            state.status = "dormant";
            await this.callbacks.onAgentStateChange?.(event.agentId, "dormant");
            return {
                success: false,
                action: { type: "wait" },
                error: `Ollama unavailable: ${health.error}`,
                durationMs: Date.now() - startTime,
            };
        }

        // Get or build persona prompt
        let persona = this.personaCache.get(event.agentId);
        if (!persona && this.callbacks.getPersonnel) {
            const personnel = await this.callbacks.getPersonnel(event.agentId);
            if (personnel) {
                persona = buildPersonaPrompt(personnel as Parameters<typeof buildPersonaPrompt>[0]);
                this.personaCache.set(event.agentId, persona);
                state.name = personnel.name;
            }
        }

        if (!persona) {
            persona = `You are an AI agent with ID ${event.agentId}. Respond helpfully.`;
        }

        // Build observation from event
        const observation = this.buildObservation(event);

        // Generate ReAct response
        const prompt = buildReActPrompt(persona, observation, {
            currentTime: new Date().toISOString(),
        });

        const generateResult = await this.ollamaClient.generate(prompt, {
            temperature: 0.7,
            maxTokens: 256,
        });

        if (!generateResult.success) {
            return {
                success: false,
                action: { type: "wait" },
                error: generateResult.error,
                durationMs: Date.now() - startTime,
            };
        }

        // Parse the response
        const parsed = parseReActResponse(generateResult.response || "");

        // Determine action from parsed response
        const action = this.parseAction(parsed.action, parsed.response);

        return {
            success: true,
            action,
            thought: parsed.thought,
            response: parsed.response,
            durationMs: Date.now() - startTime,
        };
    }

    /**
     * Build observation string from event
     */
    private buildObservation(event: ScheduledEvent): string {
        switch (event.eventType) {
            case "chat_message":
                return `New chat message in ${event.payload.channelName || "channel"} from ${event.payload.senderName || "someone"}: "${event.payload.content || ""}"`;
            case "email_received":
                return `New email from ${event.payload.senderName || "someone"} with subject: "${event.payload.subject || "No subject"}"`;
            case "meeting_start":
                return `Meeting "${event.payload.title || "Untitled"}" is starting now`;
            case "calendar_check":
                return `Checking your calendar for upcoming events`;
            case "idle_check":
                return `You have a moment of free time. What would you like to do?`;
            default:
                return `Event: ${event.eventType}`;
        }
    }

    /**
     * Parse action string into AgentAction
     */
    private parseAction(actionStr: string, response?: string): AgentAction {
        const actionLower = actionStr.toLowerCase();

        if (actionLower.includes("respond") && response) {
            return { type: "send_chat_message", content: response };
        }
        if (actionLower.includes("email") && response) {
            return { type: "send_email", content: response };
        }
        if (actionLower.includes("ignore")) {
            return { type: "wait" };
        }
        if (actionLower.includes("delegate")) {
            return { type: "wait", metadata: { delegated: true } };
        }
        if (actionLower.includes("clarif")) {
            return { type: "send_chat_message", content: response || "Could you please clarify?" };
        }

        return { type: "wait" };
    }

    /**
     * Start the simulation loop
     */
    async start(tickRateMs: number = 1000): Promise<void> {
        if (this.running) return;

        this.running = true;

        // Check Ollama and update agent states accordingly
        const health = await this.ollamaClient.isAvailable();
        const newStatus: AgentStatus = health.available ? "active" : "dormant";

        for (const [agentId, state] of this.agentStates) {
            state.status = newStatus;
            await this.callbacks.onAgentStateChange?.(agentId, newStatus);
        }

        // Start tick loop
        this.tickInterval = setInterval(async () => {
            if (!this.running) return;
            await this.tick();
        }, tickRateMs);
    }

    /**
     * Stop the simulation loop
     */
    stop(): void {
        this.running = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }

        // Set all agents to dormant
        for (const [agentId, state] of this.agentStates) {
            state.status = "dormant";
            this.callbacks.onAgentStateChange?.(agentId, "dormant");
        }
    }

    /**
     * Get current status
     */
    getStatus(): { running: boolean; agents: AgentRuntimeState[]; pendingEvents: number } {
        return {
            running: this.running,
            agents: Array.from(this.agentStates.values()),
            pendingEvents: this.eventQueue.size(),
        };
    }

    /**
     * Get a specific agent's state
     */
    getAgentState(agentId: string): AgentRuntimeState | undefined {
        return this.agentStates.get(agentId);
    }

    /**
     * Clear persona cache (useful after personnel updates)
     */
    clearPersonaCache(): void {
        this.personaCache.clear();
    }
}
