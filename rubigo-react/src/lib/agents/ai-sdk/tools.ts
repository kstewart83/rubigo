/**
 * AI SDK Tool Definitions for Agent Actions
 * 
 * Type-safe tool definitions using Zod schemas for agent actions.
 * These tools can be used with generateText for tool-calling workflows.
 */

import { tool } from 'ai';
import { z } from 'zod';

// Schema definitions for tool inputs
const sendChatMessageSchema = z.object({
    channelId: z.string().describe('The ID of the channel to send the message to'),
    content: z.string().describe('The message content to send'),
    replyToMessageId: z.string().optional().describe('Optional ID of the message being replied to'),
});

const sendEmailSchema = z.object({
    recipientId: z.string().describe('The personnel ID of the recipient'),
    subject: z.string().describe('The email subject line'),
    body: z.string().describe('The email body content'),
    isReply: z.boolean().optional().describe('Whether this is a reply to an existing email'),
    replyToEmailId: z.string().optional().describe('The ID of the email being replied to'),
});

const checkCalendarSchema = z.object({
    lookAheadMinutes: z.number().optional().default(60).describe('How many minutes ahead to check (default: 60)'),
});

const waitSchema = z.object({
    reason: z.string().optional().describe('Optional reason for waiting'),
});

const requestClarificationSchema = z.object({
    question: z.string().describe('The clarifying question to ask'),
    channelId: z.string().optional().describe('Channel to ask in (for chat contexts)'),
});

// Type aliases for tool inputs
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type CheckCalendarInput = z.infer<typeof checkCalendarSchema>;
export type WaitInput = z.infer<typeof waitSchema>;
export type RequestClarificationInput = z.infer<typeof requestClarificationSchema>;

/**
 * Tool: Send a chat message to a channel
 */
export const sendChatMessageTool = tool({
    description: 'Send a message to a chat channel. Use this when you want to respond to a conversation or share information with the team.',
    inputSchema: sendChatMessageSchema,
    execute: async (input: SendChatMessageInput) => {
        return {
            success: true,
            action: 'send_chat_message',
            channelId: input.channelId,
            content: input.content,
            replyToMessageId: input.replyToMessageId,
        };
    },
});

/**
 * Tool: Send an email
 */
export const sendEmailTool = tool({
    description: 'Send an email to a recipient. Use this for formal communication, follow-ups, or when a persistent record is needed.',
    inputSchema: sendEmailSchema,
    execute: async (input: SendEmailInput) => {
        return {
            success: true,
            action: 'send_email',
            recipientId: input.recipientId,
            subject: input.subject,
            body: input.body,
            isReply: input.isReply || false,
            replyToEmailId: input.replyToEmailId,
        };
    },
});

/**
 * Tool: Check calendar for upcoming events
 */
export const checkCalendarTool = tool({
    description: 'Check the calendar for upcoming events. Use this to see what meetings or appointments are scheduled.',
    inputSchema: checkCalendarSchema,
    execute: async (input: CheckCalendarInput) => {
        return {
            success: true,
            action: 'check_calendar',
            lookAheadMinutes: input.lookAheadMinutes ?? 60,
            events: [], // Would be populated by actual calendar query
        };
    },
});

/**
 * Tool: Wait/observe without taking action
 */
export const waitTool = tool({
    description: 'Choose to wait and observe without taking any action. Use this when no response is needed or when you want to defer action.',
    inputSchema: waitSchema,
    execute: async (input: WaitInput) => {
        return {
            success: true,
            action: 'wait',
            reason: input.reason,
        };
    },
});

/**
 * Tool: Request clarification
 */
export const requestClarificationTool = tool({
    description: 'Ask for clarification when something is unclear. Use this when you need more information to proceed.',
    inputSchema: requestClarificationSchema,
    execute: async (input: RequestClarificationInput) => {
        return {
            success: true,
            action: 'request_clarification',
            question: input.question,
            channelId: input.channelId,
        };
    },
});

/**
 * All available agent tools bundled together
 */
export const agentTools = {
    sendChatMessage: sendChatMessageTool,
    sendEmail: sendEmailTool,
    checkCalendar: checkCalendarTool,
    wait: waitTool,
    requestClarification: requestClarificationTool,
};

/**
 * Type for tool execution results
 */
export type AgentToolResult = {
    success: boolean;
    action: string;
    [key: string]: unknown;
};
