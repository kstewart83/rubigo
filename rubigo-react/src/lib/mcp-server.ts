/**
 * MCP Server
 * 
 * Main MCP server configuration for Rubigo.
 * Uses the high-level McpServer API with resource/tool registration.
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { tools, handleToolCall, type McpActorContext } from "./mcp-tools";

// ============================================================================
// Server Configuration
// ============================================================================

const SERVER_NAME = "rubigo";
const SERVER_VERSION = "0.1.0";

// ============================================================================
// Create MCP Server Factory
// ============================================================================

export function createMcpServer(actor: McpActorContext) {
    const server = new McpServer({
        name: SERVER_NAME,
        version: SERVER_VERSION,
    });

    // ========================================================================
    // Resources - Read-only data access
    // ========================================================================

    // Personnel resource
    server.resource(
        "personnel",
        new ResourceTemplate("rubigo://personnel/{id}", { list: undefined }),
        async (uri) => {
            const match = uri.href.match(/rubigo:\/\/personnel\/(.+)/);
            if (match) {
                const id = match[1];
                const data = await db.select().from(schema.personnel).where(eq(schema.personnel.id, id));
                if (data.length === 0) throw new Error(`Personnel not found: ${id}`);
                return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data[0], null, 2) }] };
            }
            const data = await db.select().from(schema.personnel);
            return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Projects resource
    server.resource(
        "projects",
        new ResourceTemplate("rubigo://projects/{id}", { list: undefined }),
        async (uri) => {
            const match = uri.href.match(/rubigo:\/\/projects\/(.+)/);
            if (match) {
                const id = match[1];
                const data = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
                if (data.length === 0) throw new Error(`Project not found: ${id}`);
                return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data[0], null, 2) }] };
            }
            const data = await db.select().from(schema.projects);
            return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Objectives resource
    server.resource(
        "objectives",
        "rubigo://objectives",
        async () => {
            const data = await db.select().from(schema.objectives);
            return { contents: [{ uri: "rubigo://objectives", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Features resource
    server.resource(
        "features",
        "rubigo://features",
        async () => {
            const data = await db.select().from(schema.features);
            return { contents: [{ uri: "rubigo://features", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Rules resource
    server.resource(
        "rules",
        "rubigo://rules",
        async () => {
            const data = await db.select().from(schema.rules);
            return { contents: [{ uri: "rubigo://rules", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Scenarios resource
    server.resource(
        "scenarios",
        "rubigo://scenarios",
        async () => {
            const data = await db.select().from(schema.scenarios);
            return { contents: [{ uri: "rubigo://scenarios", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Solutions resource
    server.resource(
        "solutions",
        "rubigo://solutions",
        async () => {
            const data = await db.select().from(schema.solutions);
            return { contents: [{ uri: "rubigo://solutions", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Activities resource
    server.resource(
        "activities",
        "rubigo://activities",
        async () => {
            const data = await db.select().from(schema.activities);
            return { contents: [{ uri: "rubigo://activities", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Initiatives resource
    server.resource(
        "initiatives",
        "rubigo://initiatives",
        async () => {
            const data = await db.select().from(schema.initiatives);
            return { contents: [{ uri: "rubigo://initiatives", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Metrics resource
    server.resource(
        "metrics",
        "rubigo://metrics",
        async () => {
            const data = await db.select().from(schema.metrics);
            return { contents: [{ uri: "rubigo://metrics", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // KPIs resource
    server.resource(
        "kpis",
        "rubigo://kpis",
        async () => {
            const data = await db.select().from(schema.kpis);
            return { contents: [{ uri: "rubigo://kpis", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // Roles resource
    server.resource(
        "roles",
        "rubigo://roles",
        async () => {
            const data = await db.select().from(schema.roles);
            return { contents: [{ uri: "rubigo://roles", mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
        }
    );

    // ========================================================================
    // Tools - CRUD operations
    // ========================================================================

    for (const tool of tools) {
        server.tool(
            tool.name,
            tool.description || "",
            tool.inputSchema as Record<string, unknown>,
            async (args: Record<string, unknown>) => {
                return handleToolCall(tool.name, args, actor);
            }
        );
    }

    return server;
}

export { type McpActorContext };
