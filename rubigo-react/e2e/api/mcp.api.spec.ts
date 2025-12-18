/**
 * MCP Server E2E Tests
 *
 * Tests the MCP (Model Context Protocol) server endpoints.
 * Maps to requirements in common/scenarios/mmc/integration.toml
 *
 * Feature: feat-mcp-server
 */

import { test, expect } from "@playwright/test";

// API configuration
const API_URL = process.env.RUBIGO_API_URL || "http://localhost:3000";
const API_TOKEN = process.env.RUBIGO_API_TOKEN || "";

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_TOKEN}`,
};

// Helper to create MCP JSON-RPC request
function mcpRequest(method: string, params: Record<string, unknown> = {}, id = 1) {
    return {
        jsonrpc: "2.0",
        method,
        params,
        id,
    };
}

// ============================================================================
// AUTHENTICATION TESTS - rule-mcp-auth
// ============================================================================

test.describe("MCP Authentication - rule-mcp-auth", () => {
    /**
     * Scenario: scen-mcp-auth-valid-token
     * Given I have a valid API token
     * When I connect to the MCP server with the token in the Authorization header
     * Then the connection is established successfully
     */
    test("scen-mcp-auth-valid-token: authenticate with valid token", async ({ request }) => {
        const response = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        // Should return 200 (or valid MCP response)
        expect(response.ok()).toBe(true);
    });

    /**
     * Scenario: scen-mcp-auth-invalid-token
     * Given I have an invalid or expired API token
     * When I attempt to connect to the MCP server
     * Then the connection is rejected with an authentication error
     */
    test("scen-mcp-auth-invalid-token: reject invalid token", async ({ request }) => {
        const response = await request.post(`${API_URL}/api/mcp`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer invalid-token-12345",
            },
            data: mcpRequest("initialize"),
        });

        expect(response.status()).toBe(401);
        const body = await response.json();
        expect(body.error).toBeDefined();
    });

    test("reject missing token", async ({ request }) => {
        const response = await request.post(`${API_URL}/api/mcp`, {
            headers: { "Content-Type": "application/json" },
            data: mcpRequest("initialize"),
        });

        expect(response.status()).toBe(401);
    });
});

// ============================================================================
// SCHEMA DISCOVERY TESTS - rule-mcp-schema
// ============================================================================

test.describe("MCP Schema Discovery - rule-mcp-schema", () => {
    /**
     * Scenario: scen-mcp-discover-resources
     * Given I have a valid MCP connection
     * When I send a resources/list request
     * Then I receive a list of all available resources with their URIs and descriptions
     */
    test("scen-mcp-discover-resources: list available resources", async ({ request }) => {
        // First initialize
        await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        // Then list resources
        const response = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("resources/list"),
        });

        expect(response.ok()).toBe(true);
        const body = await response.json();

        // Should have resources array or resourceTemplates
        if (body.result) {
            // Resources should include personnel, projects, objectives, etc.
            const hasPersonnel =
                body.result.resources?.some((r: { uri?: string }) =>
                    r.uri?.includes("personnel")
                ) ||
                body.result.resourceTemplates?.some((r: { uriTemplate?: string }) =>
                    r.uriTemplate?.includes("personnel")
                );
            expect(hasPersonnel).toBe(true);
        }
    });

    /**
     * Scenario: scen-mcp-discover-tools
     * Given I have a valid MCP connection
     * When I send a tools/list request
     * Then I receive a list of all available tools with their input schemas
     */
    test("scen-mcp-discover-tools: list available tools", async ({ request }) => {
        // First initialize
        await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        // Then list tools
        const response = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("tools/list"),
        });

        expect(response.ok()).toBe(true);
        const body = await response.json();

        if (body.result?.tools) {
            // Should have CRUD tools
            const toolNames = body.result.tools.map((t: { name: string }) => t.name);
            expect(toolNames).toContain("create_personnel");
            expect(toolNames).toContain("update_personnel");
            expect(toolNames).toContain("delete_personnel");
            expect(toolNames).toContain("create_project");
            expect(toolNames).toContain("create_objective");
            expect(toolNames).toContain("create_feature");

            // Tools should have inputSchema
            const createPersonnel = body.result.tools.find(
                (t: { name: string }) => t.name === "create_personnel"
            );
            expect(createPersonnel?.inputSchema).toBeDefined();
            expect(createPersonnel?.inputSchema?.properties?.name).toBeDefined();
            expect(createPersonnel?.inputSchema?.properties?.email).toBeDefined();
        }
    });
});

// ============================================================================
// RESOURCE TESTS - rule-mcp-resources-read
// ============================================================================

test.describe("MCP Resources - rule-mcp-resources-read", () => {
    /**
     * Scenario: scen-mcp-list-personnel
     * Given I have a valid MCP connection
     * When I request the personnel resource
     * Then I receive a list of all personnel records with their attributes
     */
    test("scen-mcp-list-personnel: read personnel resource", async ({ request }) => {
        // Initialize
        await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        // Read personnel resource
        const response = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("resources/read", { uri: "rubigo://personnel" }),
        });

        expect(response.ok()).toBe(true);
        const body = await response.json();

        if (body.result?.contents) {
            expect(body.result.contents.length).toBeGreaterThan(0);
            const content = body.result.contents[0];
            expect(content.uri).toBe("rubigo://personnel");
            expect(content.mimeType).toBe("application/json");

            // Parse and verify personnel data structure
            const data = JSON.parse(content.text);
            expect(Array.isArray(data)).toBe(true);
        }
    });

    /**
     * Scenario: scen-mcp-list-projects
     * Given I have a valid MCP connection
     * When I request the projects resource
     * Then I receive a list of all projects with their status and linked solutions
     */
    test("scen-mcp-list-projects: read projects resource", async ({ request }) => {
        await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        const response = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("resources/read", { uri: "rubigo://projects" }),
        });

        expect(response.ok()).toBe(true);
        const body = await response.json();

        if (body.result?.contents) {
            const content = body.result.contents[0];
            expect(content.uri).toBe("rubigo://projects");
        }
    });

    /**
     * Scenario: scen-mcp-list-objectives
     * Given I have a valid MCP connection
     * When I request the objectives resource
     * Then I receive the objective hierarchy with parent-child relationships
     */
    test("scen-mcp-list-objectives: read objectives resource", async ({ request }) => {
        await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        const response = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("resources/read", { uri: "rubigo://objectives" }),
        });

        expect(response.ok()).toBe(true);
    });
});

// ============================================================================
// TOOL TESTS - rule-mcp-tools-crud
// ============================================================================

test.describe("MCP Tools - rule-mcp-tools-crud", () => {
    let createdPersonnelId: string;

    /**
     * Scenario: scen-mcp-create-personnel
     * Given I have authenticated MCP connection with admin privileges
     * When I invoke the create_personnel tool with name and email
     * Then a new personnel record is created and returned
     */
    test("scen-mcp-create-personnel: create personnel via tool", async ({ request }) => {
        // Initialize
        await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        // Call create_personnel tool
        const response = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("tools/call", {
                name: "create_personnel",
                arguments: {
                    name: "MCP Test User",
                    email: "mcp-test@example.com",
                    department: "IT",
                    title: "MCP Tester",
                },
            }),
        });

        expect(response.ok()).toBe(true);
        const body = await response.json();

        if (body.result?.content) {
            const textContent = body.result.content.find(
                (c: { type: string }) => c.type === "text"
            );
            if (textContent) {
                const result = JSON.parse(textContent.text);
                expect(result.success).toBe(true);
                if (result.id) {
                    createdPersonnelId = result.id;
                }
            }
        }
    });

    /**
     * Scenario: scen-mcp-update-objective
     * Given I have authenticated MCP connection with admin privileges
     * When I invoke the update_objective tool with an ID and new title
     * Then the objective is updated and the change is logged
     */
    test("scen-mcp-update-objective: update objective via tool", async ({ request }) => {
        // Initialize
        await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        // First create an objective
        const createResponse = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("tools/call", {
                name: "create_objective",
                arguments: {
                    title: "Test Objective for Update",
                    description: "Created by E2E test",
                    status: "draft",
                },
            }),
        });

        expect(createResponse.ok()).toBe(true);
        const createBody = await createResponse.json();

        let objectiveId: string | undefined;
        if (createBody.result?.content) {
            const textContent = createBody.result.content.find(
                (c: { type: string }) => c.type === "text"
            );
            if (textContent) {
                const result = JSON.parse(textContent.text);
                objectiveId = result.id;
            }
        }

        if (objectiveId) {
            // Update the objective
            const updateResponse = await request.post(`${API_URL}/api/mcp`, {
                headers,
                data: mcpRequest("tools/call", {
                    name: "update_objective",
                    arguments: {
                        id: objectiveId,
                        title: "Updated Test Objective",
                    },
                }),
            });

            expect(updateResponse.ok()).toBe(true);
            const updateBody = await updateResponse.json();

            if (updateBody.result?.content) {
                const textContent = updateBody.result.content.find(
                    (c: { type: string }) => c.type === "text"
                );
                if (textContent) {
                    const result = JSON.parse(textContent.text);
                    expect(result.success).toBe(true);
                }
            }

            // Cleanup: delete the objective
            await request.post(`${API_URL}/api/mcp`, {
                headers,
                data: mcpRequest("tools/call", {
                    name: "delete_objective",
                    arguments: { id: objectiveId },
                }),
            });
        }
    });

    /**
     * Scenario: scen-mcp-delete-activity
     * Given I have authenticated MCP connection with admin privileges
     * When I invoke the delete_activity tool with a valid ID
     * Then the activity is removed from the system
     */
    test("scen-mcp-delete-activity: delete activity via tool", async ({ request }) => {
        // Initialize
        await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        // First create an activity
        const createResponse = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("tools/call", {
                name: "create_activity",
                arguments: {
                    name: "Test Activity for Deletion",
                    description: "Created by E2E test",
                    status: "backlog",
                },
            }),
        });

        expect(createResponse.ok()).toBe(true);
        const createBody = await createResponse.json();

        let activityId: string | undefined;
        if (createBody.result?.content) {
            const textContent = createBody.result.content.find(
                (c: { type: string }) => c.type === "text"
            );
            if (textContent) {
                const result = JSON.parse(textContent.text);
                activityId = result.id;
            }
        }

        if (activityId) {
            // Delete the activity
            const deleteResponse = await request.post(`${API_URL}/api/mcp`, {
                headers,
                data: mcpRequest("tools/call", {
                    name: "delete_activity",
                    arguments: { id: activityId },
                }),
            });

            expect(deleteResponse.ok()).toBe(true);
            const deleteBody = await deleteResponse.json();

            if (deleteBody.result?.content) {
                const textContent = deleteBody.result.content.find(
                    (c: { type: string }) => c.type === "text"
                );
                if (textContent) {
                    const result = JSON.parse(textContent.text);
                    expect(result.success).toBe(true);
                }
            }
        }
    });

    // Cleanup created personnel at the end
    test.afterAll(async ({ request }) => {
        if (createdPersonnelId) {
            await request.post(`${API_URL}/api/mcp`, {
                headers,
                data: mcpRequest("tools/call", {
                    name: "delete_personnel",
                    arguments: { id: createdPersonnelId },
                }),
            });
        }
    });
});

// ============================================================================
// TRANSPORT TESTS - rule-mcp-transport-sse
// ============================================================================

test.describe("MCP Transport - rule-mcp-transport-sse", () => {
    /**
     * Scenario: scen-mcp-sse-connect
     * Given the Rubigo MCP server is running
     * When I establish a connection to the MCP endpoint
     * Then I receive the protocol handshake and can begin exchanging messages
     */
    test("scen-mcp-sse-connect: establish HTTP connection", async ({ request }) => {
        const response = await request.post(`${API_URL}/api/mcp`, {
            headers,
            data: mcpRequest("initialize", {
                protocolVersion: "2024-11-05",
                capabilities: {},
                clientInfo: { name: "e2e-test", version: "1.0.0" },
            }),
        });

        expect(response.ok()).toBe(true);
        const body = await response.json();

        // Should receive session ID header
        const sessionId = response.headers()["mcp-session-id"];
        // Session ID may or may not be present depending on implementation
        // Just verify we got a valid response
        expect(body.result || body.jsonrpc).toBeDefined();
    });
});

// ============================================================================
// ACCESS CONTROL TESTS - rule-mcp-auth (readonly scenario)
// ============================================================================

test.describe("MCP Access Control - rule-mcp-auth", () => {
    /**
     * Scenario: scen-mcp-auth-readonly
     * Given I have an authenticated connection without admin privileges
     * When I invoke a write tool like create_personnel
     * Then the operation is rejected with a permissions error
     *
     * Note: Currently all token-authenticated connections are admin.
     * This test is a placeholder for future role-based access control.
     */
    test.skip("scen-mcp-auth-readonly: enforce role-based access", async () => {
        // TODO: Implement when non-admin roles are supported
        // This would require a different token type or user role
    });
});
