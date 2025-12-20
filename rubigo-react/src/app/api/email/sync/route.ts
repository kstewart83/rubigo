/**
 * Email Sync API
 * 
 * POST endpoints for syncing email seed data from profiles.sqlite
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { emails, emailThreads, emailRecipients } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// Create or get existing email thread
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, ...data } = body;

        if (action === "createThread") {
            const { subject } = data;
            if (!subject) {
                return NextResponse.json({ success: false, error: "Subject required" }, { status: 400 });
            }

            // Check if thread with this subject already exists
            const existing = await db
                .select()
                .from(emailThreads)
                .where(eq(emailThreads.subject, subject))
                .limit(1);

            if (existing.length > 0) {
                return NextResponse.json({ success: true, id: existing[0].id, existed: true });
            }

            const id = randomUUID();
            const now = new Date().toISOString();
            await db.insert(emailThreads).values({
                id,
                subject,
                createdAt: data.createdAt || now,
                updatedAt: data.updatedAt || now,
            });

            return NextResponse.json({ success: true, id });
        }

        if (action === "createEmail") {
            const { threadId, fromId, subject, body: emailBody, parentEmailId, sentAt, isDraft } = data;
            if (!threadId || !fromId || !subject || !emailBody) {
                return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
            }

            // Check for existing email by subject + fromId + sentAt (business key)
            if (sentAt) {
                const existing = await db
                    .select()
                    .from(emails)
                    .where(and(
                        eq(emails.subject, subject),
                        eq(emails.fromId, fromId),
                        eq(emails.sentAt, sentAt)
                    ))
                    .limit(1);

                if (existing.length > 0) {
                    return NextResponse.json({ success: true, id: existing[0].id, existed: true });
                }
            }

            const id = randomUUID();
            const now = new Date().toISOString();
            await db.insert(emails).values({
                id,
                threadId,
                fromId,
                subject,
                body: emailBody,
                parentEmailId: parentEmailId || null,
                sentAt: sentAt || null,
                isDraft: isDraft || false,
                createdAt: data.createdAt || now,
            });

            return NextResponse.json({ success: true, id });
        }

        if (action === "createRecipient") {
            const { emailId, personnelId, emailAddress, type, folder, read } = data;
            if (!emailId) {
                return NextResponse.json({ success: false, error: "emailId required" }, { status: 400 });
            }

            // Check for existing recipient
            const existing = await db
                .select()
                .from(emailRecipients)
                .where(and(
                    eq(emailRecipients.emailId, emailId),
                    personnelId ? eq(emailRecipients.personnelId, personnelId) : eq(emailRecipients.emailAddress, emailAddress || ""),
                    eq(emailRecipients.folder, folder || "inbox")
                ))
                .limit(1);

            if (existing.length > 0) {
                return NextResponse.json({ success: true, id: existing[0].id, existed: true });
            }

            const id = randomUUID();
            await db.insert(emailRecipients).values({
                id,
                emailId,
                personnelId: personnelId || null,
                emailAddress: emailAddress || null,
                type: type || "to",
                folder: folder || "inbox",
                read: read ?? false,
            });

            return NextResponse.json({ success: true, id });
        }

        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
    } catch (error) {
        console.error("Email sync error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
