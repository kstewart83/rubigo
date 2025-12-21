/**
 * MCP Tools
 * 
 * Tool definitions for CRUD operations on Rubigo entities.
 * Uses explicit JSON Schema definitions for MCP compatibility.
 */

import type { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
} from "@/lib/personnel-actions";
import {
    createProjectAction,
    updateProjectAction,
    deleteProjectAction,
    createObjectiveAction,
    updateObjectiveAction,
    deleteObjectiveAction,
    createFeatureAction,
    updateFeatureAction,
    deleteFeatureAction,
    createActivityAction,
    updateActivityAction,
    deleteActivityAction,
    createInitiativeAction,
    updateInitiativeAction,
    deleteInitiativeAction,
} from "@/lib/project-actions";
import type { Department } from "@/types/personnel";

// ============================================================================
// Tool Definitions with explicit JSON Schema
// ============================================================================

export const tools: Tool[] = [
    // Personnel tools
    {
        name: "create_personnel",
        description: "Create a new personnel record in the Rubigo directory",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Full name of the person" },
                email: { type: "string", description: "Email address" },
                title: { type: "string", description: "Job title" },
                department: {
                    type: "string",
                    enum: ["Executive", "Engineering", "Sales", "Operations", "Finance", "HR", "IT", "Marketing", "Legal"],
                    description: "Department name"
                },
                site: { type: "string", description: "Site/location name" },
                building: { type: "string", description: "Building name" },
                level: { type: "number", description: "Floor level" },
                space: { type: "string", description: "Space/office identifier" },
                manager: { type: "string", description: "Manager's personnel ID" },
                deskPhone: { type: "string", description: "Desk phone number" },
                cellPhone: { type: "string", description: "Cell phone number" },
                bio: { type: "string", description: "Biography text" },
            },
            required: ["name", "email", "department"],
        },
    },
    {
        name: "update_personnel",
        description: "Update an existing personnel record",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Personnel ID to update" },
                name: { type: "string" },
                email: { type: "string" },
                title: { type: "string" },
                department: { type: "string", enum: ["Executive", "Engineering", "Sales", "Operations", "Finance", "HR", "IT", "Marketing", "Legal"] },
                site: { type: "string" },
                building: { type: "string" },
                level: { type: "number" },
                space: { type: "string" },
                manager: { type: "string" },
                deskPhone: { type: "string" },
                cellPhone: { type: "string" },
                bio: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_personnel",
        description: "Delete a personnel record from the directory",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Personnel ID to delete" },
            },
            required: ["id"],
        },
    },
    // Project tools
    {
        name: "create_project",
        description: "Create a new project in Rubigo",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Project name" },
                description: { type: "string", description: "Project description" },
                solutionId: { type: "string", description: "Linked solution ID" },
                status: { type: "string", enum: ["planning", "active", "on_hold", "complete", "cancelled"] },
                startDate: { type: "string", description: "Start date (ISO 8601)" },
                endDate: { type: "string", description: "End date (ISO 8601)" },
            },
            required: ["name"],
        },
    },
    {
        name: "update_project",
        description: "Update an existing project",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Project ID to update" },
                name: { type: "string" },
                description: { type: "string" },
                solutionId: { type: "string" },
                status: { type: "string", enum: ["planning", "active", "on_hold", "complete", "cancelled"] },
                startDate: { type: "string" },
                endDate: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_project",
        description: "Delete a project",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Project ID to delete" },
            },
            required: ["id"],
        },
    },
    // Objective tools
    {
        name: "create_objective",
        description: "Create a new strategic objective",
        inputSchema: {
            type: "object",
            properties: {
                title: { type: "string", description: "Objective title" },
                description: { type: "string", description: "Objective description" },
                projectId: { type: "string", description: "Parent project ID" },
                parentId: { type: "string", description: "Parent objective ID for hierarchy" },
                status: { type: "string", enum: ["draft", "active", "achieved", "deferred"] },
            },
            required: ["title"],
        },
    },
    {
        name: "update_objective",
        description: "Update an existing objective",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Objective ID to update" },
                title: { type: "string" },
                description: { type: "string" },
                projectId: { type: "string" },
                parentId: { type: "string" },
                status: { type: "string", enum: ["draft", "active", "achieved", "deferred"] },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_objective",
        description: "Delete an objective",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Objective ID to delete" },
            },
            required: ["id"],
        },
    },
    // Feature tools
    {
        name: "create_feature",
        description: "Create a new feature definition",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Feature name" },
                description: { type: "string", description: "Feature description" },
                objectiveId: { type: "string", description: "Parent objective ID" },
                status: { type: "string", enum: ["planned", "in_progress", "complete", "cancelled"] },
            },
            required: ["name"],
        },
    },
    {
        name: "update_feature",
        description: "Update an existing feature",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Feature ID to update" },
                name: { type: "string" },
                description: { type: "string" },
                objectiveId: { type: "string" },
                status: { type: "string", enum: ["planned", "in_progress", "complete", "cancelled"] },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_feature",
        description: "Delete a feature",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Feature ID to delete" },
            },
            required: ["id"],
        },
    },
    // Activity tools
    {
        name: "create_activity",
        description: "Create a new work activity",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Activity name" },
                description: { type: "string", description: "Activity description" },
                initiativeId: { type: "string", description: "Parent initiative ID" },
                parentId: { type: "string", description: "Parent activity ID" },
                status: { type: "string", enum: ["backlog", "ready", "in_progress", "blocked", "complete"] },
            },
            required: ["name"],
        },
    },
    {
        name: "update_activity",
        description: "Update an existing activity",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Activity ID to update" },
                name: { type: "string" },
                description: { type: "string" },
                initiativeId: { type: "string" },
                parentId: { type: "string" },
                status: { type: "string", enum: ["backlog", "ready", "in_progress", "blocked", "complete"] },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_activity",
        description: "Delete an activity",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Activity ID to delete" },
            },
            required: ["id"],
        },
    },
    // Initiative tools
    {
        name: "create_initiative",
        description: "Create a new strategic initiative",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Initiative name" },
                description: { type: "string", description: "Initiative description" },
                kpiId: { type: "string", description: "Linked KPI ID" },
                status: { type: "string", enum: ["planned", "active", "complete", "cancelled"] },
                startDate: { type: "string", description: "Start date (ISO 8601)" },
                endDate: { type: "string", description: "End date (ISO 8601)" },
            },
            required: ["name"],
        },
    },
    {
        name: "update_initiative",
        description: "Update an existing initiative",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Initiative ID to update" },
                name: { type: "string" },
                description: { type: "string" },
                kpiId: { type: "string" },
                status: { type: "string", enum: ["planned", "active", "complete", "cancelled"] },
                startDate: { type: "string" },
                endDate: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_initiative",
        description: "Delete an initiative",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "Initiative ID to delete" },
            },
            required: ["id"],
        },
    },
];

// ============================================================================
// Actor context for authenticated user
// ============================================================================

export interface McpActorContext {
    actorId: string;
    actorName: string;
    isAdmin: boolean;
}

// ============================================================================
// Tool Handler
// ============================================================================

type ToolHandler = (args: Record<string, unknown>, actor: McpActorContext) => Promise<CallToolResult>;

function errorResult(message: string): CallToolResult {
    return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

function successResult(data: unknown): CallToolResult {
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

const toolHandlers: Record<string, ToolHandler> = {
    // Personnel handlers
    create_personnel: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const result = await createPersonnel(
            args as { name: string; email: string; department: Department } & Record<string, unknown>,
            actor.actorId,
            actor.actorName,
            "mcp"
        );
        return result.success ? successResult(result) : errorResult(result.error || "Unknown error");
    },
    update_personnel: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id, ...input } = args as { id: string } & Record<string, unknown>;
        const result = await updatePersonnel(id, input, actor.actorId, actor.actorName, "mcp");
        return result.success ? successResult(result) : errorResult(result.error || "Unknown error");
    },
    delete_personnel: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id } = args as { id: string };
        const result = await deletePersonnel(id, actor.actorId, actor.actorName, "mcp");
        return result.success ? successResult(result) : errorResult(result.error || "Unknown error");
    },
    // Project handlers
    create_project: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const result = await createProjectAction(args as { name: string } & Record<string, unknown>);
        return successResult({ success: true, id: result.id });
    },
    update_project: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id, ...input } = args as { id: string } & Record<string, unknown>;
        const result = await updateProjectAction(id, input);
        return result ? successResult({ success: true }) : errorResult("Project not found");
    },
    delete_project: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id } = args as { id: string };
        await deleteProjectAction(id);
        return successResult({ success: true });
    },
    // Objective handlers
    create_objective: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const result = await createObjectiveAction(args as { title: string } & Record<string, unknown>);
        return successResult({ success: true, id: result.id });
    },
    update_objective: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id, ...input } = args as { id: string } & Record<string, unknown>;
        const result = await updateObjectiveAction(id, input);
        return result ? successResult({ success: true }) : errorResult("Objective not found");
    },
    delete_objective: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id } = args as { id: string };
        await deleteObjectiveAction(id);
        return successResult({ success: true });
    },
    // Feature handlers
    create_feature: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const result = await createFeatureAction(args as { name: string } & Record<string, unknown>);
        return successResult({ success: true, id: result.id });
    },
    update_feature: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id, ...input } = args as { id: string } & Record<string, unknown>;
        const result = await updateFeatureAction(id, input);
        return result ? successResult({ success: true }) : errorResult("Feature not found");
    },
    delete_feature: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id } = args as { id: string };
        await deleteFeatureAction(id);
        return successResult({ success: true });
    },
    // Activity handlers
    create_activity: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const result = await createActivityAction(args as { name: string } & Record<string, unknown>);
        return successResult({ success: true, id: result.id });
    },
    update_activity: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id, ...input } = args as { id: string } & Record<string, unknown>;
        const result = await updateActivityAction(id, input);
        return result ? successResult({ success: true }) : errorResult("Activity not found");
    },
    delete_activity: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id } = args as { id: string };
        await deleteActivityAction(id);
        return successResult({ success: true });
    },
    // Initiative handlers
    create_initiative: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const result = await createInitiativeAction(args as { name: string } & Record<string, unknown>);
        return successResult({ success: true, id: result.id });
    },
    update_initiative: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id, ...input } = args as { id: string } & Record<string, unknown>;
        const result = await updateInitiativeAction(id, input);
        return result ? successResult({ success: true }) : errorResult("Initiative not found");
    },
    delete_initiative: async (args, actor) => {
        if (!actor.isAdmin) return errorResult("Admin privileges required");
        const { id } = args as { id: string };
        await deleteInitiativeAction(id);
        return successResult({ success: true });
    },
};

export async function handleToolCall(
    name: string,
    args: Record<string, unknown>,
    actor: McpActorContext
): Promise<CallToolResult> {
    const handler = toolHandlers[name];
    if (!handler) {
        return errorResult(`Unknown tool: ${name}`);
    }

    try {
        return await handler(args, actor);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return errorResult(message);
    }
}
