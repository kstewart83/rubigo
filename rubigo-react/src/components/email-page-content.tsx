"use client";

/**
 * Email Page Content
 *
 * Main email UI component with folder sidebar, email list, and reading pane
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Inbox,
    Send,
    FileEdit,
    Trash2,
    PenSquare,
    Reply,
    ReplyAll,
    Forward,
    ArrowLeft,
    Search,
    X,
} from "lucide-react";
import { usePersona } from "@/contexts/persona-context";
import {
    getEmails,
    getEmailById,
    sendEmail,
    saveDraft,
    deleteDraft,
    moveToFolder,
    searchEmails,
    getUnreadCount,
    getThreadEmails,
    searchPersonnel,
    type EmailListItem,
    type EmailWithDetails,
    type Recipient,
} from "@/lib/email-actions";

// ============================================================================
// Types
// ============================================================================

type FolderType = "inbox" | "sent" | "drafts" | "trash";

// ============================================================================
// Main Component
// ============================================================================

export function EmailPageContent() {
    const { currentPersona } = usePersona();
    const [activeFolder, setActiveFolder] = useState<FolderType>("inbox");
    const [emails, setEmails] = useState<EmailListItem[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<EmailWithDetails | null>(null);
    const [threadEmails, setThreadEmails] = useState<EmailWithDetails[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeMode, setComposeMode] = useState<"new" | "reply" | "replyAll" | "forward">("new");
    const [draftId, setDraftId] = useState<string | null>(null);

    // Compose form state
    const [toRecipients, setToRecipients] = useState<Recipient[]>([]);
    const [ccRecipients, setCcRecipients] = useState<Recipient[]>([]);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [recipientInput, setRecipientInput] = useState("");
    const [ccInput, setCcInput] = useState("");
    const [showPersonnelSearch, setShowPersonnelSearch] = useState(false);
    const [showCcPersonnelSearch, setShowCcPersonnelSearch] = useState(false);
    const [showCcField, setShowCcField] = useState(false);

    const userId = currentPersona?.id;

    // Load emails for current folder
    const loadEmails = useCallback(async () => {
        if (!userId) return;
        const data = await getEmails(userId, activeFolder);
        setEmails(data);
    }, [userId, activeFolder]);

    // Load unread count
    const loadUnreadCount = useCallback(async () => {
        if (!userId) return;
        const count = await getUnreadCount(userId);
        setUnreadCount(count);
    }, [userId]);

    // Initial load
    useEffect(() => {
        loadEmails();
        loadUnreadCount();
    }, [loadEmails, loadUnreadCount]);

    // Reload emails when folder changes
    useEffect(() => {
        loadEmails();
    }, [activeFolder, loadEmails]);

    // Select email
    const handleSelectEmail = async (emailId: string, threadId: string) => {
        if (!userId) return;
        const email = await getEmailById(emailId, userId);
        setSelectedEmail(email);

        // Load thread messages
        const thread = await getThreadEmails(threadId);
        setThreadEmails(thread);

        // Reload to update read status
        await loadEmails();
        await loadUnreadCount();
    };

    // Search
    const handleSearch = async () => {
        if (!userId || !searchQuery.trim()) {
            loadEmails();
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const results = await searchEmails(userId, searchQuery);
        setEmails(results);
    };

    // Open compose modal
    const openCompose = (mode: "new" | "reply" | "replyAll" | "forward" = "new") => {
        setComposeMode(mode);
        setDraftId(null);

        if (mode === "new") {
            setToRecipients([]);
            setCcRecipients([]);
            setSubject("");
            setBody("");
            setShowCcField(false);
            setCcInput("");
        } else if (selectedEmail) {
            if (mode === "reply") {
                setToRecipients([{ type: "to", personnelId: selectedEmail.fromId }]);
                setCcRecipients([]);
                setSubject(`Re: ${selectedEmail.subject}`);
                setBody(`\n\n---\nOn ${new Date(selectedEmail.sentAt || "").toLocaleString()}, ${selectedEmail.senderName} wrote:\n${selectedEmail.body}`);
            } else if (mode === "replyAll") {
                // Add original sender and all recipients except self
                const toList: Recipient[] = [{ type: "to", personnelId: selectedEmail.fromId }];
                const ccList: Recipient[] = [];
                for (const r of selectedEmail.recipients) {
                    if (r.personnelId && r.personnelId !== userId) {
                        if (r.type === "to") {
                            toList.push({ type: "to", personnelId: r.personnelId });
                        } else if (r.type === "cc") {
                            ccList.push({ type: "cc", personnelId: r.personnelId });
                        }
                    }
                }
                setToRecipients(toList);
                setCcRecipients(ccList);
                setSubject(`Re: ${selectedEmail.subject}`);
                setBody(`\n\n---\nOn ${new Date(selectedEmail.sentAt || "").toLocaleString()}, ${selectedEmail.senderName} wrote:\n${selectedEmail.body}`);
            } else if (mode === "forward") {
                setToRecipients([]);
                setCcRecipients([]);
                setSubject(`Fwd: ${selectedEmail.subject}`);
                setBody(`\n\n---\nForwarded message:\nFrom: ${selectedEmail.senderName}\nDate: ${new Date(selectedEmail.sentAt || "").toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`);
            }
        }

        setIsComposeOpen(true);
    };

    // Send email
    const handleSend = async () => {
        if (!userId) return;

        const allRecipients = [...toRecipients, ...ccRecipients];
        if (allRecipients.length === 0) return;

        await sendEmail(
            userId,
            allRecipients,
            subject,
            body,
            composeMode !== "new" && composeMode !== "forward" ? selectedEmail?.id : undefined,
            composeMode === "reply" || composeMode === "replyAll" ? selectedEmail?.threadId : undefined
        );

        // If we were editing a draft, delete it after sending
        if (draftId) {
            await deleteDraft(draftId);
        }

        setIsComposeOpen(false);
        setDraftId(null);
        setToRecipients([]);
        setCcRecipients([]);
        setSubject("");
        setBody("");
        loadEmails();
    };

    // Save draft
    const handleSaveDraft = async () => {
        if (!userId) return;

        const allRecipients = [...toRecipients, ...ccRecipients];
        const result = await saveDraft(userId, allRecipients, subject, body, draftId || undefined);

        if (result.success && result.id) {
            setDraftId(result.id);
        }

        setIsComposeOpen(false);
        loadEmails();
    };

    // Delete (move to trash)
    const handleDelete = async () => {
        if (!userId || !selectedEmail) return;
        await moveToFolder(selectedEmail.id, userId, "trash");
        setSelectedEmail(null);
        await loadEmails();
    };

    // Restore from trash
    const handleRestore = async () => {
        if (!userId || !selectedEmail) return;
        await moveToFolder(selectedEmail.id, userId, "inbox");
        setSelectedEmail(null);
        await loadEmails();
    };

    // Add recipient
    const addRecipient = (personnelId?: string, emailAddress?: string) => {
        if (!personnelId && !emailAddress) return;
        const newRecipient: Recipient = {
            type: "to",
            personnelId,
            emailAddress,
        };
        setToRecipients([...toRecipients, newRecipient]);
        setRecipientInput("");
        setShowPersonnelSearch(false);
    };

    // Add CC recipient
    const addCcRecipient = (personnelId?: string, emailAddress?: string) => {
        if (!personnelId && !emailAddress) return;
        const newRecipient: Recipient = {
            type: "cc",
            personnelId,
            emailAddress,
        };
        setCcRecipients([...ccRecipients, newRecipient]);
        setCcInput("");
        setShowCcPersonnelSearch(false);
    };

    // Add custom email
    const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (recipientInput.includes("@")) {
                addRecipient(undefined, recipientInput);
            }
        }
    };

    // Add custom CC email
    const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (ccInput.includes("@")) {
                addCcRecipient(undefined, ccInput);
            }
        }
    };

    // Remove recipient
    const removeRecipient = (index: number, type: "to" | "cc") => {
        if (type === "to") {
            setToRecipients(toRecipients.filter((_, i) => i !== index));
        } else {
            setCcRecipients(ccRecipients.filter((_, i) => i !== index));
        }
    };

    if (!currentPersona) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Please sign in to access email.</p>
            </div>
        );
    }

    return (
        <div data-testid="email-container" className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* Folder Sidebar */}
            <div className="w-56 border-r bg-muted/30 flex flex-col">
                <div className="p-3">
                    <Button
                        data-testid="compose-button"
                        className="w-full"
                        onClick={() => openCompose("new")}
                    >
                        <PenSquare className="mr-2 h-4 w-4" />
                        Compose
                    </Button>
                </div>
                <nav className="flex-1 p-2 space-y-1">
                    <FolderButton
                        folder="inbox"
                        active={activeFolder === "inbox"}
                        count={unreadCount}
                        onClick={() => {
                            setActiveFolder("inbox");
                            setSelectedEmail(null);
                            setIsSearching(false);
                            setSearchQuery("");
                        }}
                    />
                    <FolderButton
                        folder="sent"
                        active={activeFolder === "sent"}
                        onClick={() => {
                            setActiveFolder("sent");
                            setSelectedEmail(null);
                            setIsSearching(false);
                            setSearchQuery("");
                        }}
                    />
                    <FolderButton
                        folder="drafts"
                        active={activeFolder === "drafts"}
                        onClick={() => {
                            setActiveFolder("drafts");
                            setSelectedEmail(null);
                            setIsSearching(false);
                            setSearchQuery("");
                        }}
                    />
                    <FolderButton
                        folder="trash"
                        active={activeFolder === "trash"}
                        onClick={() => {
                            setActiveFolder("trash");
                            setSelectedEmail(null);
                            setIsSearching(false);
                            setSearchQuery("");
                        }}
                    />
                </nav>
            </div>

            {/* Email List */}
            <div className="w-80 border-r flex flex-col">
                {/* Search */}
                <div className="p-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            data-testid="email-search"
                            placeholder="Search emails..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                    </div>
                </div>

                {/* Email List */}
                <ScrollArea data-testid="email-list" className="flex-1">
                    {emails.length === 0 ? (
                        <div data-testid="email-empty-state" className="p-8 text-center text-muted-foreground">
                            <p>No emails in this folder</p>
                            {activeFolder === "inbox" && (
                                <Button
                                    variant="link"
                                    className="mt-2"
                                    onClick={() => openCompose("new")}
                                >
                                    Compose your first email
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {emails.map((email) => (
                                <div
                                    key={email.id}
                                    data-testid="email-row"
                                    data-unread={!email.isRead}
                                    className={`p-3 cursor-pointer hover:bg-muted/50 ${selectedEmail?.id === email.id ? "bg-muted" : ""
                                        } ${!email.isRead ? "font-semibold" : ""}`}
                                    onClick={() => handleSelectEmail(email.id, email.threadId)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span
                                            data-testid="email-sender"
                                            className="text-sm truncate"
                                        >
                                            {activeFolder === "sent"
                                                ? `To: ${email.recipientNames.join(", ") || "Unknown"}`
                                                : email.senderName}
                                        </span>
                                        <span
                                            data-testid="email-timestamp"
                                            className="text-xs text-muted-foreground whitespace-nowrap"
                                        >
                                            {email.sentAt
                                                ? new Date(email.sentAt).toLocaleDateString()
                                                : "Draft"}
                                        </span>
                                    </div>
                                    <div
                                        data-testid="email-subject"
                                        className="text-sm truncate mt-1"
                                    >
                                        {email.subject || "(No Subject)"}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                                        {email.body.slice(0, 80)}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Reading Pane */}
            <div data-testid="reading-pane" className="flex-1 flex flex-col">
                {selectedEmail ? (
                    <>
                        {/* Email Header */}
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedEmail(null)}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Button>
                                <div className="flex gap-1">
                                    {activeFolder !== "drafts" && (
                                        <>
                                            <Button
                                                data-testid="reply-button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openCompose("reply")}
                                            >
                                                <Reply className="h-4 w-4 mr-1" />
                                                Reply
                                            </Button>
                                            <Button
                                                data-testid="reply-all-button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openCompose("replyAll")}
                                            >
                                                <ReplyAll className="h-4 w-4 mr-1" />
                                                Reply All
                                            </Button>
                                            <Button
                                                data-testid="forward-button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openCompose("forward")}
                                            >
                                                <Forward className="h-4 w-4 mr-1" />
                                                Forward
                                            </Button>
                                        </>
                                    )}
                                    {activeFolder === "drafts" && (
                                        <Button
                                            data-testid="edit-draft-button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setDraftId(selectedEmail.id);
                                                setToRecipients(
                                                    selectedEmail.recipients
                                                        .filter((r) => r.type === "to")
                                                        .map((r) => ({
                                                            type: "to" as const,
                                                            personnelId: r.personnelId || undefined,
                                                            emailAddress: r.emailAddress || undefined,
                                                        }))
                                                );
                                                setCcRecipients(
                                                    selectedEmail.recipients
                                                        .filter((r) => r.type === "cc")
                                                        .map((r) => ({
                                                            type: "cc" as const,
                                                            personnelId: r.personnelId || undefined,
                                                            emailAddress: r.emailAddress || undefined,
                                                        }))
                                                );
                                                setSubject(selectedEmail.subject);
                                                setBody(selectedEmail.body);
                                                setComposeMode("new");
                                                setIsComposeOpen(true);
                                            }}
                                        >
                                            <FileEdit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                    )}
                                    {activeFolder === "trash" ? (
                                        <Button
                                            data-testid="restore-button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRestore}
                                        >
                                            <Inbox className="h-4 w-4 mr-1" />
                                            Restore
                                        </Button>
                                    ) : (
                                        <Button
                                            data-testid="delete-button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <h2
                                data-testid="email-detail-subject"
                                className="text-xl font-semibold"
                            >
                                {selectedEmail.subject || "(No Subject)"}
                            </h2>
                            <div className="mt-2 text-sm space-y-1">
                                <div>
                                    <span className="text-muted-foreground">From: </span>
                                    <span data-testid="email-detail-sender">
                                        {selectedEmail.senderName} &lt;{selectedEmail.senderEmail}&gt;
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">To: </span>
                                    {selectedEmail.recipients
                                        .filter((r) => r.type === "to")
                                        .map((r) => r.name || r.emailAddress)
                                        .join(", ")}
                                </div>
                                {selectedEmail.recipients.some((r) => r.type === "cc") && (
                                    <div>
                                        <span className="text-muted-foreground">CC: </span>
                                        {selectedEmail.recipients
                                            .filter((r) => r.type === "cc")
                                            .map((r) => r.name || r.emailAddress)
                                            .join(", ")}
                                    </div>
                                )}
                                <div data-testid="email-detail-date" className="text-muted-foreground">
                                    {selectedEmail.sentAt
                                        ? new Date(selectedEmail.sentAt).toLocaleString()
                                        : "Draft"}
                                </div>
                            </div>
                        </div>

                        {/* Email Body or Thread View */}
                        <ScrollArea className="flex-1 p-4">
                            {threadEmails.length > 1 ? (
                                <div data-testid="thread-view" className="space-y-4">
                                    {threadEmails.map((email) => (
                                        <div
                                            key={email.id}
                                            data-testid="thread-message"
                                            className="border rounded-lg p-4"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium">{email.senderName}</span>
                                                <span className="text-sm text-muted-foreground">
                                                    {email.sentAt
                                                        ? new Date(email.sentAt).toLocaleString()
                                                        : "Draft"}
                                                </span>
                                            </div>
                                            <div className="whitespace-pre-wrap">{email.body}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    data-testid="email-detail-body"
                                    className="whitespace-pre-wrap"
                                >
                                    {selectedEmail.body}
                                </div>
                            )}
                        </ScrollArea>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select an email to read
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                <DialogContent data-testid="compose-modal" className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {composeMode === "new"
                                ? draftId
                                    ? "Edit Draft"
                                    : "New Email"
                                : composeMode === "reply"
                                    ? "Reply"
                                    : composeMode === "replyAll"
                                        ? "Reply All"
                                        : "Forward"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* To Recipients */}
                        <div className="relative">
                            <div className="flex items-center justify-between">
                                <Label>To</Label>
                                {!showCcField && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        data-testid="show-cc-button"
                                        onClick={() => setShowCcField(true)}
                                        className="text-xs h-6"
                                    >
                                        + Cc
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px]" data-testid="to-chips">
                                {toRecipients.map((r, i) => (
                                    <RecipientChip
                                        key={i}
                                        recipient={r}
                                        onRemove={() => removeRecipient(i, "to")}
                                    />
                                ))}
                                <Input
                                    data-testid="recipient-input"
                                    data-testid-alias="recipient-input-to"
                                    className="flex-1 min-w-[150px] border-0 shadow-none focus-visible:ring-0 h-6 p-0"
                                    placeholder="Add recipient..."
                                    value={recipientInput}
                                    onChange={(e) => {
                                        setRecipientInput(e.target.value);
                                        setShowPersonnelSearch(e.target.value.length > 0);
                                    }}
                                    onKeyDown={handleRecipientKeyDown}
                                />
                            </div>
                            {showPersonnelSearch && recipientInput.length > 0 && (
                                <PersonnelSearch
                                    query={recipientInput}
                                    onSelect={(personnelId) => addRecipient(personnelId)}
                                />
                            )}
                        </div>

                        {/* CC Recipients (shown when toggled) */}
                        {showCcField && (
                            <div className="relative">
                                <Label>Cc</Label>
                                <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[40px]" data-testid="cc-chips">
                                    {ccRecipients.map((r, i) => (
                                        <RecipientChip
                                            key={i}
                                            recipient={r}
                                            onRemove={() => removeRecipient(i, "cc")}
                                        />
                                    ))}
                                    <Input
                                        data-testid="recipient-input-cc"
                                        className="flex-1 min-w-[150px] border-0 shadow-none focus-visible:ring-0 h-6 p-0"
                                        placeholder="Add Cc recipient..."
                                        value={ccInput}
                                        onChange={(e) => {
                                            setCcInput(e.target.value);
                                            setShowCcPersonnelSearch(e.target.value.length > 0);
                                        }}
                                        onKeyDown={handleCcKeyDown}
                                    />
                                </div>
                                {showCcPersonnelSearch && ccInput.length > 0 && (
                                    <PersonnelSearch
                                        query={ccInput}
                                        onSelect={(personnelId) => addCcRecipient(personnelId)}
                                    />
                                )}
                            </div>
                        )}

                        {/* Subject */}
                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                data-testid="subject-input"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject"
                            />
                        </div>

                        {/* Body */}
                        <div>
                            <Label htmlFor="body">Message</Label>
                            <Textarea
                                id="body"
                                data-testid="body-input"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Write your message..."
                                className="min-h-[200px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleSaveDraft}>
                            Save Draft
                        </Button>
                        <Button onClick={handleSend} disabled={toRecipients.length === 0}>
                            Send
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

function FolderButton({
    folder,
    active,
    count,
    onClick,
}: {
    folder: FolderType;
    active: boolean;
    count?: number;
    onClick: () => void;
}) {
    const icons = {
        inbox: Inbox,
        sent: Send,
        drafts: FileEdit,
        trash: Trash2,
    };
    const labels = {
        inbox: "Inbox",
        sent: "Sent",
        drafts: "Drafts",
        trash: "Trash",
    };
    const Icon = icons[folder];

    return (
        <button
            data-testid={`folder-${folder}`}
            data-active={active}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
                }`}
            onClick={onClick}
        >
            <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {labels[folder]}
            </span>
            {count !== undefined && count > 0 && (
                <span
                    data-testid="unread-badge"
                    className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground"
                        }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

function RecipientChip({
    recipient,
    onRemove,
}: {
    recipient: Recipient;
    onRemove: () => void;
}) {
    // For personnel, we'd need to look up their name - for now show ID or address
    const display = recipient.emailAddress || recipient.personnelId || "Unknown";

    return (
        <span
            data-testid="recipient-chip"
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-full text-sm"
        >
            {display}
            <button
                type="button"
                className="hover:text-destructive"
                onClick={onRemove}
            >
                <X className="h-3 w-3" />
            </button>
        </span>
    );
}

function PersonnelSearch({
    query,
    onSelect,
}: {
    query: string;
    onSelect: (personnelId: string) => void;
}) {
    const [results, setResults] = useState<{ id: string; name: string; email: string }[]>([]);

    useEffect(() => {
        // Use server action to search personnel
        async function search() {
            try {
                const results = await searchPersonnel(query);
                setResults(results);
            } catch {
                setResults([]);
            }
        }
        search();
    }, [query]);

    if (results.length === 0) return null;

    return (
        <div
            data-testid="recipient-suggestions"
            className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-lg"
        >
            {results.map((person) => (
                <button
                    key={person.id}
                    data-testid="recipient-option"
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    onClick={() => onSelect(person.id)}
                >
                    <div>{person.name}</div>
                    <div className="text-xs text-muted-foreground">{person.email}</div>
                </button>
            ))}
        </div>
    );
}
