/**
 * Projects API E2E Tests
 * 
 * Tests the Projects REST API endpoints using direct HTTP calls.
 * Maps to requirements in common/scenarios/mmc/requirements/projects.toml
 */

import { test, expect } from "@playwright/test";

// API configuration
const API_URL = process.env.RUBIGO_API_URL || "http://localhost:3000";
const API_TOKEN = process.env.RUBIGO_API_TOKEN || "";

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_TOKEN}`,
};

test.describe("Projects API - CRUD Operations", () => {
    let createdProjectId: string;

    test.beforeAll(() => {
        if (!API_TOKEN) {
            console.warn("RUBIGO_API_TOKEN not set - tests may fail");
        }
    });

    test("POST /api/projects - create project", async ({ request }) => {
        const response = await request.post(`${API_URL}/api/projects`, {
            headers,
            data: {
                name: "Test Project API",
                description: "Created via API test",
                status: "planning",
            },
        });

        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.id).toBeDefined();
        createdProjectId = body.id;
    });

    test("GET /api/projects - list all projects", async ({ request }) => {
        const response = await request.get(`${API_URL}/api/projects`, {
            headers,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
        expect(Array.isArray(body.data)).toBe(true);
    });

    test("GET /api/projects/[id] - get single project", async ({ request }) => {
        test.skip(!createdProjectId, "No project ID from creation");

        const response = await request.get(`${API_URL}/api/projects/${createdProjectId}`, {
            headers,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(createdProjectId);
        expect(body.data.name).toBe("Test Project API");
    });

    test("PUT /api/projects/[id] - update project", async ({ request }) => {
        test.skip(!createdProjectId, "No project ID from creation");

        const response = await request.put(`${API_URL}/api/projects/${createdProjectId}`, {
            headers,
            data: {
                name: "Updated Test Project",
                status: "active",
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);

        // Verify update
        const getResponse = await request.get(`${API_URL}/api/projects/${createdProjectId}`, {
            headers,
        });
        const getData = await getResponse.json();
        expect(getData.data.name).toBe("Updated Test Project");
        expect(getData.data.status).toBe("active");
    });

    test("DELETE /api/projects/[id] - delete project", async ({ request }) => {
        test.skip(!createdProjectId, "No project ID from creation");

        const response = await request.delete(`${API_URL}/api/projects/${createdProjectId}`, {
            headers,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test("GET /api/projects/[id] - returns 404 for deleted", async ({ request }) => {
        test.skip(!createdProjectId, "No project ID from creation");

        const response = await request.get(`${API_URL}/api/projects/${createdProjectId}`, {
            headers,
        });

        expect(response.status()).toBe(404);
    });
});

test.describe("Projects API - Error Handling", () => {
    test("returns 401 without auth token", async ({ request }) => {
        const response = await request.get(`${API_URL}/api/projects`, {
            headers: { "Content-Type": "application/json" },
        });

        expect(response.status()).toBe(401);
    });

    test("returns 400 for create without name", async ({ request }) => {
        const response = await request.post(`${API_URL}/api/projects`, {
            headers,
            data: {
                description: "Missing name",
            },
        });

        expect(response.status()).toBe(400);
    });

    test("returns 404 for non-existent project", async ({ request }) => {
        const response = await request.get(`${API_URL}/api/projects/nonexistent-id`, {
            headers,
        });

        expect(response.status()).toBe(404);
    });
});
