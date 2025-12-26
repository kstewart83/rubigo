/**
 * Settings API
 * GET /api/settings - Get all settings
 * GET /api/settings?key=ollama_model - Get specific setting
 * PUT /api/settings - Update a setting
 */

import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key");

        if (key) {
            // Get specific setting
            const settings = await db
                .select()
                .from(schema.appSettings)
                .where(eq(schema.appSettings.key, key))
                .limit(1);

            if (settings.length === 0) {
                return NextResponse.json({
                    success: true,
                    setting: null
                });
            }

            return NextResponse.json({
                success: true,
                setting: settings[0]
            });
        }

        // Get all settings
        const settings = await db.select().from(schema.appSettings);
        return NextResponse.json({
            success: true,
            settings
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json(
                { success: false, error: "Missing key or value" },
                { status: 400 }
            );
        }

        const now = new Date().toISOString();

        // Upsert the setting
        await db
            .insert(schema.appSettings)
            .values({
                key,
                value,
                updatedAt: now,
            })
            .onConflictDoUpdate({
                target: schema.appSettings.key,
                set: {
                    value,
                    updatedAt: now,
                },
            });

        return NextResponse.json({
            success: true,
            setting: { key, value, updatedAt: now }
        });
    } catch (error) {
        console.error("Error updating setting:", error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
