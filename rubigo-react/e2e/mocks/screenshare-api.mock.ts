/**
 * Screen Share API Mocks for E2E Testing
 *
 * Playwright route handlers that mock the Next.js API routes,
 * eliminating the need for the Go SFU during E2E tests.
 */

import { Page, Route } from "@playwright/test";

// In-memory mock state
interface MockRoom {
    id: string;
    hasBroadcaster: boolean;
    viewerCount: number;
    createdAt: number;
}

const mockRooms = new Map<string, MockRoom>();

/**
 * Generate a mock room ID
 */
function generateRoomId(): string {
    return "room-" + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a mock SDP answer
 */
function generateMockSDP(): string {
    const sessionId = Date.now();
    return [
        "v=0",
        `o=- ${sessionId} 2 IN IP4 127.0.0.1`,
        "s=-",
        "t=0 0",
        "a=group:BUNDLE 0",
        "m=video 9 UDP/TLS/RTP/SAVPF 96",
        "c=IN IP4 0.0.0.0",
        "a=rtcp:9 IN IP4 0.0.0.0",
        "a=ice-ufrag:mock",
        "a=ice-pwd:mockpassword12345678901234",
        "a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
        "a=setup:active",
        "a=mid:0",
        "a=rtpmap:96 VP8/90000",
        "a=recvonly",
        "",
    ].join("\r\n");
}

/**
 * Handle POST /api/screen-share/rooms - Create room
 */
async function handleCreateRoom(route: Route): Promise<void> {
    const roomId = generateRoomId();
    mockRooms.set(roomId, {
        id: roomId,
        hasBroadcaster: false,
        viewerCount: 0,
        createdAt: Date.now(),
    });

    await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
            success: true,
            roomId,
        }),
    });
}

/**
 * Handle POST /api/screen-share/rooms/[id]/publish - Broadcaster publishes
 */
async function handlePublish(route: Route, roomId: string): Promise<void> {
    const room = mockRooms.get(roomId);
    if (room) {
        room.hasBroadcaster = true;
    } else {
        // Auto-create room if it doesn't exist (for edge cases)
        mockRooms.set(roomId, {
            id: roomId,
            hasBroadcaster: true,
            viewerCount: 0,
            createdAt: Date.now(),
        });
    }

    await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
            success: true,
            type: "answer",
            sdp: generateMockSDP(),
        }),
    });
}

/**
 * Handle POST /api/screen-share/rooms/[id]/subscribe - Viewer subscribes
 */
async function handleSubscribe(route: Route, roomId: string): Promise<void> {
    const room = mockRooms.get(roomId);
    if (room) {
        room.viewerCount++;
    }

    await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
            success: true,
            type: "answer",
            sdp: generateMockSDP(),
        }),
    });
}

/**
 * Handle GET /api/screen-share/rooms/[id]/status - Get room status
 */
async function handleStatus(route: Route, roomId: string): Promise<void> {
    const room = mockRooms.get(roomId);

    await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
            success: true,
            hasBroadcaster: room?.hasBroadcaster ?? false,
            viewerCount: room?.viewerCount ?? 0,
        }),
    });
}

/**
 * Extract room ID from URL path
 */
function extractRoomId(url: string): string | null {
    const match = url.match(/\/api\/screen-share\/rooms\/([^/]+)/);
    return match ? match[1] : null;
}

/**
 * Setup all Screen Share API mocks on a Playwright page
 *
 * @param page - Playwright page instance
 */
export async function setupScreenShareAPIMocks(page: Page): Promise<void> {
    // Clear mock state
    mockRooms.clear();

    // POST /api/screen-share/rooms - Create room
    await page.route("**/api/screen-share/rooms", async (route) => {
        if (route.request().method() === "POST") {
            await handleCreateRoom(route);
        } else {
            await route.continue();
        }
    });

    // POST /api/screen-share/rooms/[id]/publish
    await page.route("**/api/screen-share/rooms/*/publish", async (route) => {
        if (route.request().method() === "POST") {
            const roomId = extractRoomId(route.request().url());
            await handlePublish(route, roomId || "unknown");
        } else {
            await route.continue();
        }
    });

    // POST /api/screen-share/rooms/[id]/subscribe
    await page.route("**/api/screen-share/rooms/*/subscribe", async (route) => {
        if (route.request().method() === "POST") {
            const roomId = extractRoomId(route.request().url());
            await handleSubscribe(route, roomId || "unknown");
        } else {
            await route.continue();
        }
    });

    // GET /api/screen-share/rooms/[id]/status
    await page.route("**/api/screen-share/rooms/*/status", async (route) => {
        if (route.request().method() === "GET") {
            const roomId = extractRoomId(route.request().url());
            await handleStatus(route, roomId || "unknown");
        } else {
            await route.continue();
        }
    });
}

/**
 * Clear all mock rooms (useful between tests)
 */
export function clearMockRooms(): void {
    mockRooms.clear();
}

/**
 * Get current mock room state (for test assertions)
 */
export function getMockRooms(): Map<string, MockRoom> {
    return mockRooms;
}
