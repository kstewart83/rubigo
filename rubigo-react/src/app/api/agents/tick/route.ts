/**
 * Agent Tick API - MVP implementation
 * 
 * POST /api/agents/tick
 * Processes one agent per call, making them "think" via Ollama
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma3:4b";

interface OllamaResponse {
    response: string;
    done: boolean;
}

/**
 * Call Ollama to generate a thought for an agent
 */
async function generateThought(
    agentName: string,
    agentTitle: string,
    agentDepartment: string
): Promise<string> {
    const systemPrompt = `You are ${agentName}, a ${agentTitle} in the ${agentDepartment} department.
You are an AI agent simulating a real employee in a workplace. 
Think about what you might be doing right now at work.
Respond with a brief internal thought (1-2 sentences) about your current work activity.
Be specific and realistic. Don't break character.`;

    const userPrompt = "What are you thinking about right now?";

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: userPrompt,
                system: systemPrompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }

        const data = (await response.json()) as OllamaResponse;
        return data.response.trim();
    } catch (error) {
        console.error("Ollama generation error:", error);
        throw error;
    }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
    return Math.random().toString(16).substring(2, 8) + Date.now().toString(36);
}

export async function POST() {
    try {
        // Get all agents that are marked as agents and not dormant
        const agents = await db
            .select({
                id: schema.personnel.id,
                name: schema.personnel.name,
                title: schema.personnel.title,
                department: schema.personnel.department,
                agentStatus: schema.personnel.agentStatus,
            })
            .from(schema.personnel)
            .where(
                and(
                    eq(schema.personnel.isAgent, true),
                    ne(schema.personnel.agentStatus, "dormant")
                )
            );

        if (agents.length === 0) {
            // No active agents, try to activate one that's dormant
            const dormantAgents = await db
                .select({
                    id: schema.personnel.id,
                    name: schema.personnel.name,
                    title: schema.personnel.title,
                    department: schema.personnel.department,
                })
                .from(schema.personnel)
                .where(
                    and(
                        eq(schema.personnel.isAgent, true),
                        eq(schema.personnel.agentStatus, "dormant")
                    )
                )
                .limit(1);

            if (dormantAgents.length === 0) {
                return NextResponse.json(
                    { success: false, message: "No agents available" },
                    { status: 404 }
                );
            }

            // Activate the dormant agent
            const agent = dormantAgents[0];
            await db
                .update(schema.personnel)
                .set({
                    agentStatus: "idle",
                })
                .where(eq(schema.personnel.id, agent.id));

            return NextResponse.json({
                success: true,
                message: `Activated agent: ${agent.name}`,
                agentId: agent.id,
                action: "activated",
            });
        }

        // Pick the first agent to process (simple round-robin could be added later)
        const agent = agents[0];

        // Update status to "working"
        await db
            .update(schema.personnel)
            .set({ agentStatus: "working" })
            .where(eq(schema.personnel.id, agent.id));

        // Generate a thought via Ollama
        const thought = await generateThought(
            agent.name,
            agent.title || "Employee",
            agent.department || "General"
        );

        // Record the thought as an event
        await db.insert(schema.agentEvents).values({
            id: generateId(),
            personnelId: agent.id,
            timestamp: new Date().toISOString(),
            eventType: "thought",
            content: thought,
            targetEntity: null,
            metadata: null,
        });

        // Update agent back to idle
        await db
            .update(schema.personnel)
            .set({
                agentStatus: "idle",
            })
            .where(eq(schema.personnel.id, agent.id));

        return NextResponse.json({
            success: true,
            agentId: agent.id,
            agentName: agent.name,
            thought,
            action: "thought",
        });
    } catch (error) {
        console.error("Tick error:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
