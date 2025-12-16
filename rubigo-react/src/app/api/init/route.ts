/**
 * Initialization API
 * 
 * GET: Check initialization status
 * POST: Validate init token and create Global Administrator
 */

import { NextResponse } from "next/server";
import {
    validateInitToken,
    initializeSystem,
    getInitializationStatus,
    getBip39WordList,
} from "@/lib/initialization";

/**
 * GET /api/init
 * Returns initialization status and word list for autocomplete
 */
export async function GET() {
    const status = await getInitializationStatus();

    return NextResponse.json({
        ...status,
        wordList: getBip39WordList(),
    });
}

/**
 * POST /api/init
 * Validates the init token and creates Global Administrator
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { words } = body as { words: string[] };

        if (!words || !Array.isArray(words) || words.length !== 4) {
            return NextResponse.json(
                { error: "Must provide exactly 4 words" },
                { status: 400 }
            );
        }

        const success = await initializeSystem(words);

        if (!success) {
            return NextResponse.json(
                { error: "Invalid initialization phrase" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "System initialized successfully",
        });
    } catch (error) {
        console.error("Initialization error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
