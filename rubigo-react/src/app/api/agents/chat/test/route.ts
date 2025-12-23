/**
 * Agent Chat Test API - Test endpoint for AI SDK Phase 2 ToolLoopAgent
 * 
 * POST /api/agents/chat/test
 * Tests the new generateChatWithTools function with a sample conversation
 */

import { NextResponse } from "next/server";
import { generateChatWithTools, shouldUseToolLoopAgent, type ChatContext } from "@/lib/agents/ai-sdk";

export async function POST(request: Request) {
    try {
        const body = await request.json() as Partial<ChatContext & { persona?: string }>;

        // Build test context
        const context: ChatContext = {
            channelId: body.channelId || "test-channel",
            channelName: body.channelName || "general",
            messageContent: body.messageContent || "Hello, can you help me with a question?",
            senderName: body.senderName || "Test User",
            recentMessages: body.recentMessages || [],
        };

        const persona = body.persona ||
            "You are Alex, a helpful IT support specialist at MMC. You are friendly, professional, and enjoy solving technical problems.";

        // Generate response using Phase 2 ToolLoopAgent
        const result = await generateChatWithTools(context, {
            persona,
            temperature: 0.7,
            verbose: true,
        });

        return NextResponse.json({
            success: true,
            useToolLoopAgent: shouldUseToolLoopAgent(),
            context,
            result,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Agent Chat Test] Error:", message);
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
