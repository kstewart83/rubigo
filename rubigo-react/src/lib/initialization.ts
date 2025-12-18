/**
 * Initialization System
 *
 * Handles first-run initialization with BIP39 mnemonic phrase verification.
 * The init token is stored in process.env so all workers can access it.
 */

import { wordlist } from "@scure/bip39/wordlists/english.js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export interface InitializationStatus {
    initialized: boolean;
}

// ============================================================================
// Token Storage via Environment Variable
// ============================================================================

// Environment variable name for the init token
const TOKEN_ENV_KEY = "RUBIGO_INIT_TOKEN";

/**
 * Get the current token from environment
 */
function getTokenFromEnv(): string[] | null {
    const token = process.env[TOKEN_ENV_KEY];
    if (!token) return null;
    const words = token.split(" ");
    return words.length === 4 ? words : null;
}

/**
 * Set the token in environment
 */
function setTokenInEnv(words: string[]): void {
    process.env[TOKEN_ENV_KEY] = words.join(" ");
}

/**
 * Clear the token from environment
 */
function clearTokenFromEnv(): void {
    delete process.env[TOKEN_ENV_KEY];
}

// ============================================================================
// BIP39 Word List
// ============================================================================

/**
 * Get the full BIP39 English word list (2048 words)
 */
export function getBip39WordList(): string[] {
    return [...wordlist];
}

/**
 * Generate 4 random BIP39 words for initialization
 */
export function generateInitToken(): string[] {
    const words: string[] = [];
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * wordlist.length);
        words.push(wordlist[randomIndex]);
    }
    return words;
}

// ============================================================================
// Initialization State
// ============================================================================

/**
 * Check if the system has been initialized
 * (i.e., a Global Administrator exists)
 */
export async function isInitialized(): Promise<boolean> {
    try {
        const admins = await db
            .select()
            .from(schema.personnel)
            .where(eq(schema.personnel.isGlobalAdmin, true))
            .limit(1);
        return admins.length > 0;
    } catch {
        // Table might not exist yet
        return false;
    }
}

/**
 * Get the current init token
 */
export function getCurrentToken(): string[] | null {
    return getTokenFromEnv();
}

/**
 * Generate token and log it to console (called once at startup)
 * If RUBIGO_AUTO_INIT is set, automatically creates Global Administrator
 */
export async function generateAndLogToken(): Promise<void> {
    // Check if token already exists in environment
    if (getTokenFromEnv()) {
        return;
    }

    const initialized = await isInitialized();

    if (initialized) {
        clearTokenFromEnv();
        // Regenerate API token on restart (ephemeral env var is lost on restart)
        const apiToken = await getOrCreateApiToken();
        console.log("\n" + "=".repeat(60));
        console.log("✅ SYSTEM INITIALIZED");
        console.log("=".repeat(60));
        console.log("\nThe system is ready. Users can sign in.");
        if (apiToken) {
            console.log(`\nAPI Token: ${apiToken}`);
            console.log("Use this token for programmatic API access.");
        }
        console.log("\n" + "=".repeat(60) + "\n");
        return;
    }

    // Check for auto-init mode
    if (process.env.RUBIGO_AUTO_INIT === "true") {
        await autoInitialize();
        return;
    }

    // Generate new token for this server session
    const token = generateInitToken();
    setTokenInEnv(token);

    console.log("\n" + "=".repeat(60));
    console.log("🔐 INITIALIZATION REQUIRED");
    console.log("=".repeat(60));
    console.log("\nThis is a fresh installation. Enter the following words");
    console.log("in the initialization UI to create the Global Administrator:\n");
    console.log(`   INIT TOKEN: ${token.join(" ")}\n`);
    console.log("=".repeat(60) + "\n");
}

/**
 * Automatically initialize the system (for dev mode)
 * Creates Global Administrator without requiring token entry
 */
async function autoInitialize(): Promise<void> {
    // Check if already initialized (race condition protection)
    const alreadyInit = await isInitialized();
    if (alreadyInit) {
        // Generate API token for existing system
        const apiToken = await getOrCreateApiToken();

        console.log("\n" + "=".repeat(60));
        console.log("✅ SYSTEM INITIALIZED");
        console.log("=".repeat(60));
        console.log("\nThe system is ready. Users can sign in.");
        if (apiToken) {
            console.log(`\nAPI Token: ${apiToken}`);
        }
        console.log("\n" + "=".repeat(60) + "\n");
        return;
    }

    // Create the Global Administrator
    const adminId = "global-admin";
    await db.insert(schema.personnel).values({
        id: adminId,
        name: "Global Administrator",
        email: "admin@rubigo.local",
        title: "System Administrator",
        department: "Executive",
        isGlobalAdmin: true,
    });

    // Generate API token
    const apiToken = await getOrCreateApiToken();

    console.log("\n" + "=".repeat(60));
    console.log("✅ AUTO-INITIALIZED (RUBIGO_AUTO_INIT=true)");
    console.log("=".repeat(60));
    console.log("\nGlobal Administrator created automatically.");
    console.log("The system is ready. Users can sign in.");
    if (apiToken) {
        console.log(`\nAPI Token: ${apiToken}`);
        console.log("Use this token for programmatic API access.");
    }
    console.log("\n" + "=".repeat(60) + "\n");
}

/**
 * Validate the provided initialization words
 */
export async function validateInitToken(words: string[]): Promise<boolean> {
    const currentToken = getTokenFromEnv();

    if (!currentToken) {
        console.log("[Init] Token validation failed: no token in environment");
        return false;
    }

    if (words.length !== 4) {
        console.log("[Init] Token validation failed: wrong word count");
        return false;
    }

    // Case-insensitive comparison
    const normalized = words.map((w) => w.toLowerCase().trim());
    const expected = currentToken.map((w) => w.toLowerCase());

    const isValid = normalized.every((word, i) => word === expected[i]);

    if (!isValid) {
        console.log(`[Init] Token validation failed: mismatch`);
        console.log(`[Init]   Expected: ${expected.join(" ")}`);
        console.log(`[Init]   Received: ${normalized.join(" ")}`);
    }

    return isValid;
}

/**
 * Create the Global Administrator and mark system as initialized
 */
export async function initializeSystem(words: string[]): Promise<boolean> {
    const isValid = await validateInitToken(words);
    if (!isValid) {
        return false;
    }

    // Check if already initialized (race condition protection)
    const alreadyInit = await isInitialized();
    if (alreadyInit) {
        return false;
    }

    // Create the Global Administrator
    const adminId = "global-admin";
    await db.insert(schema.personnel).values({
        id: adminId,
        name: "Global Administrator",
        email: "admin@rubigo.local",
        title: "System Administrator",
        department: "Executive",
        isGlobalAdmin: true,
    });

    // Clear the token (no longer needed)
    clearTokenFromEnv();

    // Generate API token for programmatic access
    const apiToken = await getOrCreateApiToken();

    console.log("\n" + "=".repeat(60));
    console.log("✅ SYSTEM INITIALIZED");
    console.log("=".repeat(60));
    console.log("\nGlobal Administrator account created successfully.");
    console.log("The system is now ready for use.");
    if (apiToken) {
        console.log(`\n   API TOKEN: ${apiToken}\n`);
        console.log("Use this token for programmatic API access.");
    }
    console.log("\n" + "=".repeat(60) + "\n");

    return true;
}

/**
 * Get initialization status for API
 */
export async function getInitializationStatus(): Promise<InitializationStatus> {
    const initialized = await isInitialized();
    return { initialized };
}

// ============================================================================
// API Token Authentication (for programmatic access)
// ============================================================================

const API_TOKEN_ENV_KEY = "RUBIGO_API_TOKEN";

/**
 * Generate a random API token (32 hex characters)
 */
function generateApiToken(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get or create the API token (stored in environment)
 * Returns null if system is not initialized
 */
export async function getOrCreateApiToken(): Promise<string | null> {
    const initialized = await isInitialized();
    if (!initialized) {
        return null;
    }

    let token = process.env[API_TOKEN_ENV_KEY];
    if (!token) {
        token = generateApiToken();
        process.env[API_TOKEN_ENV_KEY] = token;
    }
    return token;
}

/**
 * Get the current API token (without creating one)
 */
export function getApiToken(): string | null {
    return process.env[API_TOKEN_ENV_KEY] || null;
}

/**
 * Validate an API token and return the actor (Global Admin) if valid
 */
export interface ApiAuthResult {
    valid: boolean;
    actorId?: string;
    actorName?: string;
    error?: string;
}

export async function validateApiToken(token: string | null): Promise<ApiAuthResult> {
    if (!token) {
        return { valid: false, error: "No token provided" };
    }

    const storedToken = process.env[API_TOKEN_ENV_KEY];
    if (!storedToken) {
        return { valid: false, error: "API not available (system not initialized)" };
    }

    if (token !== storedToken) {
        return { valid: false, error: "Invalid token" };
    }

    // Token is valid - return Global Admin as actor
    const admins = await db
        .select()
        .from(schema.personnel)
        .where(eq(schema.personnel.isGlobalAdmin, true))
        .limit(1);

    if (admins.length === 0) {
        return { valid: false, error: "No Global Admin found" };
    }

    return {
        valid: true,
        actorId: admins[0].id,
        actorName: admins[0].name,
    };
}

