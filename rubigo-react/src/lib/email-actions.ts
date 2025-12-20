/**
 * Email Server Actions
 *
 * CRUD operations for internal email messaging
 */

"use server";

import { db } from "@/db";
import {
    emails,
    emailThreads,
    emailRecipients,
    personnel,
    type Email,
    type EmailThread,
    type EmailRecipient,
} from "@/db/schema";
import { eq, and, desc, or, like, sql } from "drizzle-orm";

// ============================================================================
// Types
// ============================================================================

export interface Recipient {
    type: "to" | "cc" | "bcc";
    personnelId?: string;
    emailAddress?: string;
}

export interface EmailWithDetails extends Email {
    senderName: string;
    senderEmail: string;
    recipients: {
        type: "to" | "cc" | "bcc";
        personnelId: string | null;
        emailAddress: string | null;
        name: string | null;
    }[];
}

export interface EmailListItem {
    id: string;
    threadId: string;
    subject: string;
    body: string;
    sentAt: string | null;
    senderName: string;
    senderEmail: string;
    isRead: boolean;
    isDraft: boolean;
    recipientNames: string[];
}

export interface ThreadWithEmails {
    thread: EmailThread;
    emails: EmailWithDetails[];
}

// ============================================================================
// Email Operations
// ============================================================================

/**
 * Get emails for current user in a specific folder
 */
export async function getEmails(
    userId: string,
    folder: "inbox" | "sent" | "drafts" | "trash"
): Promise<EmailListItem[]> {
    try {
        if (folder === "drafts") {
            // Drafts are emails created by this user with isDraft = true
            const drafts = await db
                .select({
                    email: emails,
                    senderName: personnel.name,
                    senderEmail: personnel.email,
                })
                .from(emails)
                .innerJoin(personnel, eq(emails.fromId, personnel.id))
                .where(and(eq(emails.fromId, userId), eq(emails.isDraft, true)))
                .orderBy(desc(emails.createdAt));

            return drafts.map(({ email, senderName, senderEmail }) => ({
                id: email.id,
                threadId: email.threadId,
                subject: email.subject,
                body: email.body,
                sentAt: email.sentAt,
                senderName,
                senderEmail,
                isRead: true,
                isDraft: email.isDraft ?? false,
                recipientNames: [],
            }));
        }

        // For inbox, sent, trash - look at email_recipients folder
        const result = await db
            .select({
                email: emails,
                senderName: personnel.name,
                senderEmail: personnel.email,
                recipientFolder: emailRecipients.folder,
                recipientRead: emailRecipients.read,
            })
            .from(emailRecipients)
            .innerJoin(emails, eq(emailRecipients.emailId, emails.id))
            .innerJoin(personnel, eq(emails.fromId, personnel.id))
            .where(
                and(
                    eq(emailRecipients.personnelId, userId),
                    eq(emailRecipients.folder, folder),
                    eq(emails.isDraft, false)
                )
            )
            .orderBy(desc(emails.sentAt));

        // Get recipient names for each email
        const emailIds = result.map((r) => r.email.id);
        const allRecipients = emailIds.length > 0
            ? await db
                .select({
                    emailId: emailRecipients.emailId,
                    personnelId: emailRecipients.personnelId,
                    emailAddress: emailRecipients.emailAddress,
                    name: personnel.name,
                })
                .from(emailRecipients)
                .leftJoin(personnel, eq(emailRecipients.personnelId, personnel.id))
                .where(sql`${emailRecipients.emailId} IN (${sql.join(emailIds.map(id => sql`${id}`), sql`, `)})`)
            : [];

        const recipientsByEmail = new Map<string, string[]>();
        for (const r of allRecipients) {
            const names = recipientsByEmail.get(r.emailId) || [];
            names.push(r.name || r.emailAddress || "Unknown");
            recipientsByEmail.set(r.emailId, names);
        }

        // Deduplicate by email ID (can have duplicates when sending to self)
        const seen = new Set<string>();
        const dedupedResult = result.filter(({ email }) => {
            if (seen.has(email.id)) return false;
            seen.add(email.id);
            return true;
        });

        return dedupedResult.map(({ email, senderName, senderEmail, recipientRead }) => ({
            id: email.id,
            threadId: email.threadId,
            subject: email.subject,
            body: email.body,
            sentAt: email.sentAt,
            senderName,
            senderEmail,
            isRead: recipientRead ?? false,
            isDraft: email.isDraft ?? false,
            recipientNames: recipientsByEmail.get(email.id) || [],
        }));
    } catch (error) {
        console.error("Failed to get emails:", error);
        return [];
    }
}

/**
 * Get a single email by ID with full details
 */
export async function getEmailById(
    emailId: string,
    userId: string
): Promise<EmailWithDetails | null> {
    try {
        const result = await db
            .select({
                email: emails,
                senderName: personnel.name,
                senderEmail: personnel.email,
            })
            .from(emails)
            .innerJoin(personnel, eq(emails.fromId, personnel.id))
            .where(eq(emails.id, emailId));

        if (result.length === 0) return null;

        const { email, senderName, senderEmail } = result[0];

        // Get recipients
        const recipients = await db
            .select({
                type: emailRecipients.type,
                personnelId: emailRecipients.personnelId,
                emailAddress: emailRecipients.emailAddress,
                name: personnel.name,
            })
            .from(emailRecipients)
            .leftJoin(personnel, eq(emailRecipients.personnelId, personnel.id))
            .where(eq(emailRecipients.emailId, emailId));

        // Mark as read for this user
        await db
            .update(emailRecipients)
            .set({ read: true })
            .where(
                and(
                    eq(emailRecipients.emailId, emailId),
                    eq(emailRecipients.personnelId, userId)
                )
            );

        return {
            ...email,
            senderName,
            senderEmail,
            recipients: recipients.map((r) => ({
                type: r.type as "to" | "cc" | "bcc",
                personnelId: r.personnelId,
                emailAddress: r.emailAddress,
                name: r.name,
            })),
        };
    } catch (error) {
        console.error("Failed to get email:", error);
        return null;
    }
}

/**
 * Get all emails in a thread
 */
export async function getThreadEmails(
    threadId: string
): Promise<EmailWithDetails[]> {
    try {
        const result = await db
            .select({
                email: emails,
                senderName: personnel.name,
                senderEmail: personnel.email,
            })
            .from(emails)
            .innerJoin(personnel, eq(emails.fromId, personnel.id))
            .where(and(eq(emails.threadId, threadId), eq(emails.isDraft, false)))
            .orderBy(emails.sentAt);

        const emailsWithRecipients: EmailWithDetails[] = [];

        for (const { email, senderName, senderEmail } of result) {
            const recipients = await db
                .select({
                    type: emailRecipients.type,
                    personnelId: emailRecipients.personnelId,
                    emailAddress: emailRecipients.emailAddress,
                    name: personnel.name,
                })
                .from(emailRecipients)
                .leftJoin(personnel, eq(emailRecipients.personnelId, personnel.id))
                .where(eq(emailRecipients.emailId, email.id));

            emailsWithRecipients.push({
                ...email,
                senderName,
                senderEmail,
                recipients: recipients.map((r) => ({
                    type: r.type as "to" | "cc" | "bcc",
                    personnelId: r.personnelId,
                    emailAddress: r.emailAddress,
                    name: r.name,
                })),
            });
        }

        return emailsWithRecipients;
    } catch (error) {
        console.error("Failed to get thread emails:", error);
        return [];
    }
}

/**
 * Send a new email
 */
export async function sendEmail(
    fromId: string,
    recipients: Recipient[],
    subject: string,
    body: string,
    parentEmailId?: string, // For replies
    existingThreadId?: string // For replies
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const now = new Date().toISOString();
        const emailId = crypto.randomUUID();

        // Create or use existing thread
        let threadId = existingThreadId;
        if (!threadId) {
            threadId = crypto.randomUUID();
            await db.insert(emailThreads).values({
                id: threadId,
                subject,
                createdAt: now,
                updatedAt: now,
            });
        } else {
            // Update thread timestamp
            await db
                .update(emailThreads)
                .set({ updatedAt: now })
                .where(eq(emailThreads.id, threadId));
        }

        // Create email
        await db.insert(emails).values({
            id: emailId,
            threadId,
            fromId,
            subject,
            body,
            parentEmailId: parentEmailId ?? null,
            sentAt: now,
            isDraft: false,
            createdAt: now,
        });

        // Create recipient records with explicit folder typing
        type FolderType = "inbox" | "sent" | "drafts" | "trash";
        const recipientRecords: {
            id: string;
            emailId: string;
            personnelId: string | null;
            emailAddress: string | null;
            type: "to" | "cc" | "bcc";
            folder: FolderType;
            read: boolean;
        }[] = recipients.map((r) => ({
            id: crypto.randomUUID(),
            emailId,
            personnelId: r.personnelId ?? null,
            emailAddress: r.emailAddress ?? null,
            type: r.type,
            folder: "inbox" as FolderType,
            read: false,
        }));

        // Add sender's copy in Sent folder
        recipientRecords.push({
            id: crypto.randomUUID(),
            emailId,
            personnelId: fromId,
            emailAddress: null,
            type: "to",
            folder: "sent" as FolderType,
            read: true,
        });

        if (recipientRecords.length > 0) {
            await db.insert(emailRecipients).values(recipientRecords);
        }

        return { success: true, id: emailId };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: "Failed to send email" };
    }
}

/**
 * Save email as draft
 */
export async function saveDraft(
    fromId: string,
    recipients: Recipient[],
    subject: string,
    body: string,
    existingDraftId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const now = new Date().toISOString();

        if (existingDraftId) {
            // Update existing draft
            await db
                .update(emails)
                .set({ subject, body })
                .where(eq(emails.id, existingDraftId));

            // Clear existing recipients and add new ones
            await db
                .delete(emailRecipients)
                .where(eq(emailRecipients.emailId, existingDraftId));

            const recipientRecords = recipients.map((r) => ({
                id: crypto.randomUUID(),
                emailId: existingDraftId,
                personnelId: r.personnelId ?? null,
                emailAddress: r.emailAddress ?? null,
                type: r.type,
                folder: "drafts" as const,
                read: false,
            }));

            if (recipientRecords.length > 0) {
                await db.insert(emailRecipients).values(recipientRecords);
            }

            return { success: true, id: existingDraftId };
        }

        // Create new draft
        const emailId = crypto.randomUUID();
        const threadId = crypto.randomUUID();

        await db.insert(emailThreads).values({
            id: threadId,
            subject: subject || "(No Subject)",
            createdAt: now,
            updatedAt: now,
        });

        await db.insert(emails).values({
            id: emailId,
            threadId,
            fromId,
            subject: subject || "(No Subject)",
            body,
            sentAt: null, // Drafts don't have sent time
            isDraft: true,
            createdAt: now,
        });

        const recipientRecords = recipients.map((r) => ({
            id: crypto.randomUUID(),
            emailId,
            personnelId: r.personnelId ?? null,
            emailAddress: r.emailAddress ?? null,
            type: r.type,
            folder: "drafts" as const,
            read: false,
        }));

        if (recipientRecords.length > 0) {
            await db.insert(emailRecipients).values(recipientRecords);
        }

        return { success: true, id: emailId };
    } catch (error) {
        console.error("Failed to save draft:", error);
        return { success: false, error: "Failed to save draft" };
    }
}

/**
 * Delete a draft permanently
 */
export async function deleteDraft(
    draftId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Delete recipients first (cascade should handle this, but being explicit)
        await db
            .delete(emailRecipients)
            .where(eq(emailRecipients.emailId, draftId));

        // Delete the email
        await db.delete(emails).where(eq(emails.id, draftId));

        return { success: true };
    } catch (error) {
        console.error("Failed to delete draft:", error);
        return { success: false, error: "Failed to delete draft" };
    }
}

/**
 * Move email to a different folder
 */
export async function moveToFolder(
    emailId: string,
    userId: string,
    folder: "inbox" | "trash"
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .update(emailRecipients)
            .set({ folder })
            .where(
                and(
                    eq(emailRecipients.emailId, emailId),
                    eq(emailRecipients.personnelId, userId)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Failed to move email:", error);
        return { success: false, error: "Failed to move email" };
    }
}

/**
 * Mark email as read
 */
export async function markAsRead(
    emailId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await db
            .update(emailRecipients)
            .set({ read: true })
            .where(
                and(
                    eq(emailRecipients.emailId, emailId),
                    eq(emailRecipients.personnelId, userId)
                )
            );

        return { success: true };
    } catch (error) {
        console.error("Failed to mark as read:", error);
        return { success: false, error: "Failed to mark as read" };
    }
}

/**
 * Get unread count for inbox
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(emailRecipients)
            .innerJoin(emails, eq(emailRecipients.emailId, emails.id))
            .where(
                and(
                    eq(emailRecipients.personnelId, userId),
                    eq(emailRecipients.folder, "inbox"),
                    eq(emailRecipients.read, false),
                    eq(emails.isDraft, false)
                )
            );

        return result[0]?.count || 0;
    } catch (error) {
        console.error("Failed to get unread count:", error);
        return 0;
    }
}

/**
 * Search emails
 */
export async function searchEmails(
    userId: string,
    query: string
): Promise<EmailListItem[]> {
    try {
        const searchPattern = `%${query}%`;

        const result = await db
            .select({
                email: emails,
                senderName: personnel.name,
                senderEmail: personnel.email,
                recipientRead: emailRecipients.read,
            })
            .from(emailRecipients)
            .innerJoin(emails, eq(emailRecipients.emailId, emails.id))
            .innerJoin(personnel, eq(emails.fromId, personnel.id))
            .where(
                and(
                    eq(emailRecipients.personnelId, userId),
                    or(
                        like(emails.subject, searchPattern),
                        like(emails.body, searchPattern),
                        like(personnel.name, searchPattern)
                    )
                )
            )
            .orderBy(desc(emails.sentAt));

        // Deduplicate by email ID (can have duplicates when sending to self)
        const seen = new Set<string>();
        const dedupedResult = result.filter(({ email }) => {
            if (seen.has(email.id)) return false;
            seen.add(email.id);
            return true;
        });

        return dedupedResult.map(({ email, senderName, senderEmail, recipientRead }) => ({
            id: email.id,
            threadId: email.threadId,
            subject: email.subject,
            body: email.body,
            sentAt: email.sentAt,
            senderName,
            senderEmail,
            isRead: recipientRead ?? false,
            isDraft: email.isDraft ?? false,
            recipientNames: [],
        }));
    } catch (error) {
        console.error("Failed to search emails:", error);
        return [];
    }
}

/**
 * Search personnel for recipient selection
 */
export async function searchPersonnel(
    query: string
): Promise<{ id: string; name: string; email: string }[]> {
    try {
        if (query.length < 1) return [];

        const searchLower = query.toLowerCase();
        const all = db.select().from(personnel).all();

        const filtered = all
            .filter(p =>
                p.name?.toLowerCase().includes(searchLower) ||
                p.email?.toLowerCase().includes(searchLower)
            )
            .slice(0, 5);

        return filtered.map(p => ({
            id: p.id,
            name: p.name,
            email: p.email || "",
        }));
    } catch (error) {
        console.error("Failed to search personnel:", error);
        return [];
    }
}
