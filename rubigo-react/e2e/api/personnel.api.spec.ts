/**
 * Personnel API E2E Tests
 * 
 * Tests the Personnel REST API endpoints using direct HTTP calls.
 * Maps to requirements in common/seed/mmc/requirements/personnel.toml
 */

import { test, expect } from "@playwright/test";

// API configuration
const API_URL = process.env.RUBIGO_API_URL || "http://localhost:3000";
const API_TOKEN = process.env.RUBIGO_API_TOKEN || "";

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_TOKEN}`,
};

test.describe("Personnel API - CRUD Operations", () => {
    let createdPersonnelId: string;

    test.beforeAll(() => {
        if (!API_TOKEN) {
            console.warn("RUBIGO_API_TOKEN not set - tests may fail");
        }
    });

    test("POST /api/personnel - create personnel", async ({ request }) => {
        const response = await request.post(`${API_URL}/api/personnel`, {
            headers,
            data: {
                name: "Test User API",
                email: "testuser-api@example.com",
                department: "IT",
                title: "API Tester",
            },
        });

        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.id).toBeDefined();
        createdPersonnelId = body.id;
    });

    test("GET /api/personnel - list personnel", async ({ request }) => {
        const response = await request.get(`${API_URL}/api/personnel`, {
            headers,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.total).toBeGreaterThanOrEqual(0);
    });

    test("GET /api/personnel - list with pagination", async ({ request }) => {
        // Note: API supports pageSize of 10, 25, 50, 100 only
        const response = await request.get(`${API_URL}/api/personnel?page=1&pageSize=10`, {
            headers,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.page).toBe(1);
        expect(body.pageSize).toBe(10);
    });

    test("GET /api/personnel - list with search", async ({ request }) => {
        const response = await request.get(`${API_URL}/api/personnel?search=Test`, {
            headers,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test("GET /api/personnel/[id] - get single personnel", async ({ request }) => {
        // Skip if no personnel was created
        test.skip(!createdPersonnelId, "No personnel ID from creation");

        const response = await request.get(`${API_URL}/api/personnel/${createdPersonnelId}`, {
            headers,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.id).toBe(createdPersonnelId);
        expect(body.data.name).toBe("Test User API");
    });

    test("PUT /api/personnel/[id] - update personnel", async ({ request }) => {
        test.skip(!createdPersonnelId, "No personnel ID from creation");

        const response = await request.put(`${API_URL}/api/personnel/${createdPersonnelId}`, {
            headers,
            data: {
                title: "Updated API Tester",
                bio: "Updated via API test",
            },
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test("DELETE /api/personnel/[id] - delete personnel", async ({ request }) => {
        test.skip(!createdPersonnelId, "No personnel ID from creation");

        const response = await request.delete(`${API_URL}/api/personnel/${createdPersonnelId}`, {
            headers,
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test("GET /api/personnel/[id] - returns 404 for deleted", async ({ request }) => {
        test.skip(!createdPersonnelId, "No personnel ID from creation");

        const response = await request.get(`${API_URL}/api/personnel/${createdPersonnelId}`, {
            headers,
        });

        expect(response.status()).toBe(404);
    });
});

test.describe("Personnel API - Error Handling", () => {
    test("returns 401 without auth token", async ({ request }) => {
        const response = await request.get(`${API_URL}/api/personnel`, {
            headers: { "Content-Type": "application/json" },
        });

        expect(response.status()).toBe(401);
    });

    test("returns 401 with invalid token", async ({ request }) => {
        const response = await request.get(`${API_URL}/api/personnel`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer invalid-token",
            },
        });

        expect(response.status()).toBe(401);
    });

    test("returns 404 for non-existent personnel", async ({ request }) => {
        const response = await request.get(`${API_URL}/api/personnel/nonexistent-id`, {
            headers,
        });

        expect(response.status()).toBe(404);
    });
});
