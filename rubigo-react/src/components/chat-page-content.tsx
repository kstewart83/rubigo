"use client";

/**
 * Chat Page Content
 *
 * Main chat UI component with channel sidebar and message area
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePersona } from "@/contexts/persona-context";
import {
    Hash,
    MessageSquare,
    Plus,
    Send,
    Users,
    Smile,
    Reply,
    X,
} from "lucide-react";
import {
    createChannel,
    getChannels,
    getUserChannels,
    getUserDirectMessages,
    getOrCreateDirectMessage,
    joinChannel,
    sendMessage,
    getMessages,
    toggleReaction,
    getMessageReactions,
    getAllPersonnel,
    type ChatChannelWithMembers,
    type ChatMessageWithSender,
    type ReactionGroup,
} from "@/lib/chat-actions";
import type { ChatChannel } from "@/db/schema";
import { getUserColor } from "@/lib/user-color";
import { PersonnelPopover } from "@/components/chat/personnel-popover";
import { useTheme } from "@/components/theme-provider";

// Common emoji set for reactions (simple inline grid - no external deps)
const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👀"];

// ============================================================================
// Types
// ============================================================================

interface ChannelListItem {
    id: string;
    name: string;
    type: "channel" | "dm";
    otherUserName?: string; // For DMs
}

// ============================================================================
// Main Component
// ============================================================================

export function ChatPageContent() {
    const { currentPersona } = usePersona();
    const { resolvedTheme } = useTheme();
    const isDarkMode = resolvedTheme === "dark";

    // State
    const [channels, setChannels] = useState<ChannelListItem[]>([]);
    const [availableChannels, setAvailableChannels] = useState<ChatChannel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Modal state
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    const [showBrowseChannels, setShowBrowseChannels] = useState(false);
    const [showNewDM, setShowNewDM] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [newChannelDescription, setNewChannelDescription] = useState("");
    const [dmSearchQuery, setDmSearchQuery] = useState("");

    // Emoji picker state
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPickerForMessage, setEmojiPickerForMessage] = useState<string | null>(null);
    const [messageReactions, setMessageReactions] = useState<Record<string, ReactionGroup[]>>({});

    // Threading state
    const [activeThread, setActiveThread] = useState<{ messageId: string; senderName: string; content: string } | null>(null);

    // Mention autocomplete state
    const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
    const [mentionPersonnel, setMentionPersonnel] = useState<Array<{ id: string; name: string }>>([]);
    const [allPersonnel, setAllPersonnel] = useState<Array<{ id: string; name: string }>>([]);

    // Load channels on mount
    const loadChannels = useCallback(async () => {
        if (!currentPersona) return;

        try {
            // Get user's channels
            const userChannels = await getUserChannels(currentPersona.id);
            const userDMs = await getUserDirectMessages(currentPersona.id);

            const channelItems: ChannelListItem[] = [
                ...userChannels.map((c) => ({
                    id: c.id,
                    name: c.name ?? "Unnamed Channel",
                    type: "channel" as const,
                })),
                ...userDMs.map((dm) => {
                    const otherUser = dm.members.find(
                        (m) => m.personnelId !== currentPersona.id
                    );
                    return {
                        id: dm.id,
                        name: otherUser?.name ?? "Direct Message",
                        type: "dm" as const,
                        otherUserName: otherUser?.name,
                    };
                }),
            ];

            setChannels(channelItems);

            // Get all available channels for browsing
            const allChannels = await getChannels();
            setAvailableChannels(allChannels);
        } catch (error) {
            console.error("Failed to load channels:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentPersona]);

    useEffect(() => {
        loadChannels();
    }, [loadChannels]);

    // Load personnel for mention autocomplete
    useEffect(() => {
        const loadPersonnelForMentions = async () => {
            try {
                const personnelList = await getAllPersonnel();
                setAllPersonnel(personnelList);
                setMentionPersonnel(personnelList);
            } catch (error) {
                console.error("Failed to load personnel for mentions:", error);
            }
        };
        loadPersonnelForMentions();
    }, []);

    // Load messages when channel selected
    useEffect(() => {
        if (!selectedChannel) {
            setMessages([]);
            setMessageReactions({});
            return;
        }

        // Track if this is the initial load or a poll
        let isInitialLoad = true;

        const loadMessages = async () => {
            const msgs = await getMessages(selectedChannel);
            // Only update if messages actually changed (compare IDs to avoid re-renders)
            const messagesChanged = setMessages((prev) => {
                const prevIds = prev.map(m => m.id).join(',');
                const newIds = msgs.map(m => m.id).join(',');
                if (prevIds === newIds) return prev; // No change
                return msgs;
            });

            // Only load reactions on initial load or when messages change
            // Skip reactions during normal polls to reduce server load
            if (isInitialLoad && currentPersona) {
                const reactionsMap: Record<string, ReactionGroup[]> = {};
                // Only fetch reactions for visible messages (last 10)
                const visibleMsgs = msgs.slice(-10);
                for (const msg of visibleMsgs) {
                    const reactions = await getMessageReactions(msg.id, currentPersona.id);
                    if (reactions.length > 0) {
                        reactionsMap[msg.id] = reactions;
                    }
                }
                setMessageReactions((prev) => {
                    // Only update if reactions actually changed
                    const prevStr = JSON.stringify(prev);
                    const newStr = JSON.stringify(reactionsMap);
                    if (prevStr === newStr) return prev;
                    return reactionsMap;
                });
            }
            isInitialLoad = false;
        };

        loadMessages();

        // Poll for new messages every 15 seconds (reduced from 5s to minimize server load)
        const interval = setInterval(loadMessages, 15000);
        return () => clearInterval(interval);
    }, [selectedChannel, currentPersona]);

    // Scroll to bottom only on initial load or when new messages are added
    const prevMessageCountRef = useRef(0);
    useEffect(() => {
        // Only scroll if message count increased (new message arrived)
        if (messages.length > prevMessageCountRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
        prevMessageCountRef.current = messages.length;
    }, [messages.length]);

    // Handle reaction toggle
    const handleReactionToggle = async (messageId: string, emoji: string) => {
        if (!currentPersona) return;

        const result = await toggleReaction(messageId, emoji, currentPersona.id);
        if (result.success) {
            // Reload reactions for this message
            const reactions = await getMessageReactions(messageId, currentPersona.id);
            setMessageReactions((prev) => ({
                ...prev,
                [messageId]: reactions,
            }));
        }
        setEmojiPickerForMessage(null);
    };


    // Handlers
    const handleCreateChannel = async () => {
        if (!currentPersona || !newChannelName.trim()) return;

        const result = await createChannel(
            newChannelName.trim(),
            newChannelDescription.trim() || undefined,
            currentPersona.id
        );

        if (result.success && result.id) {
            setShowCreateChannel(false);
            setNewChannelName("");
            setNewChannelDescription("");
            await loadChannels();
            setSelectedChannel(result.id);
        }
    };

    const handleJoinChannel = async (channelId: string) => {
        if (!currentPersona) return;

        const result = await joinChannel(channelId, currentPersona.id);
        if (result.success) {
            setShowBrowseChannels(false);
            await loadChannels();
            setSelectedChannel(channelId);
        }
    };

    const handleStartDM = async (personnelId: string) => {
        if (!currentPersona) return;

        const result = await getOrCreateDirectMessage(currentPersona.id, personnelId);
        if (result.success && result.id) {
            setShowNewDM(false);
            setDmSearchQuery("");
            await loadChannels();
            setSelectedChannel(result.id);
        }
    };

    const handleSendMessage = async () => {
        if (!currentPersona || !selectedChannel || !messageInput.trim()) return;

        const result = await sendMessage(
            selectedChannel,
            currentPersona.id,
            messageInput.trim(),
            activeThread?.messageId
        );

        if (result.success) {
            setMessageInput("");
            setActiveThread(null); // Clear thread after sending
            // Reload messages
            const msgs = await getMessages(selectedChannel);
            setMessages(msgs);
            // Auto-scroll to bottom after sending
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    };

    const handleMentionSelect = (name: string) => {
        const lastAtIndex = messageInput.lastIndexOf('@');
        const beforeAt = messageInput.slice(0, lastAtIndex);
        setMessageInput(`${beforeAt}@${name} `);
        setShowMentionAutocomplete(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        // Handle arrow keys for mention navigation
        if (showMentionAutocomplete) {
            const filteredMatches = mentionPersonnel.filter(p =>
                p.name.toLowerCase().includes(mentionQuery)
            ).slice(0, 5);

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setMentionSelectedIndex(prev =>
                    prev < filteredMatches.length - 1 ? prev + 1 : prev
                );
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setMentionSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
                return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (filteredMatches.length > 0) {
                    handleMentionSelect(filteredMatches[mentionSelectedIndex]?.name || filteredMatches[0].name);
                }
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setShowMentionAutocomplete(false);
                return;
            }
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!currentPersona) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Please sign in to use chat</p>
            </div>
        );
    }

    const selectedChannelInfo = channels.find((c) => c.id === selectedChannel);

    return (
        <div className="flex h-[calc(100vh-3rem)] overflow-hidden" data-testid="chat-container">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/30 flex flex-col">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-semibold">Chat</h1>
                </div>

                {/* Channels Section */}
                <div className="p-2">
                    <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm font-medium text-muted-foreground">
                            Channels
                        </span>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setShowBrowseChannels(true)}
                                data-testid="browse-channels-button"
                                title="Browse channels"
                            >
                                <Users className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setShowCreateChannel(true)}
                                data-testid="create-channel-button"
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <div data-testid="channel-list" className="space-y-0.5">
                        {channels
                            .filter((c) => c.type === "channel")
                            .map((channel) => (
                                <button
                                    key={channel.id}
                                    data-testid="channel-item"
                                    onClick={() => setSelectedChannel(channel.id)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent ${selectedChannel === channel.id
                                        ? "bg-accent"
                                        : ""
                                        }`}
                                >
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{channel.name}</span>
                                </button>
                            ))}
                    </div>
                </div>

                <Separator />

                {/* Direct Messages Section */}
                <div className="p-2">
                    <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-sm font-medium text-muted-foreground">
                            Direct Messages
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setShowNewDM(true)}
                            data-testid="new-dm-button"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="space-y-0.5">
                        {channels
                            .filter((c) => c.type === "dm")
                            .map((dm) => (
                                <button
                                    key={dm.id}
                                    data-testid="dm-item"
                                    onClick={() => setSelectedChannel(dm.id)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent ${selectedChannel === dm.id ? "bg-accent" : ""
                                        }`}
                                >
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{dm.name}</span>
                                </button>
                            ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {selectedChannel ? (
                    <>
                        {/* Channel Header */}
                        <div className="h-14 border-b flex items-center px-4">
                            {selectedChannelInfo?.type === "channel" ? (
                                <Hash className="h-5 w-5 mr-2 text-muted-foreground" />
                            ) : (
                                <MessageSquare className="h-5 w-5 mr-2 text-muted-foreground" />
                            )}
                            <h2 className="font-semibold">
                                {selectedChannelInfo?.name ?? "Chat"}
                            </h2>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 min-h-0">
                            <div
                                data-testid="message-list"
                                className="space-y-2 message-list p-4"
                            >
                                {/* Only render top-level messages, replies will be shown inline */}
                                {messages
                                    .filter(msg => !msg.threadId)
                                    .map((msg) => {
                                        const isOwnMessage = msg.senderId === currentPersona?.id;
                                        const userColor = getUserColor(msg.senderId, isDarkMode);
                                        const replies = messages.filter(m => m.threadId === msg.id);

                                        return (
                                            <div
                                                key={msg.id}
                                                data-testid="message-bubble"
                                                data-own-message={isOwnMessage ? "true" : "false"}
                                                data-user-color={userColor}
                                                className={`flex gap-3 group ${isOwnMessage ? "ml-4 pl-3 border-l-2 border-primary/40" : ""}`}
                                            >
                                                <PersonnelPopover
                                                    personnelId={msg.senderId}
                                                    personnelName={msg.senderName}
                                                    personnelTitle={msg.senderTitle ?? undefined}
                                                    personnelDepartment={msg.senderDepartment ?? undefined}
                                                    personnelEmail={msg.senderEmail ?? undefined}
                                                    personnelDeskPhone={msg.senderDeskPhone ?? undefined}
                                                    personnelCellPhone={msg.senderCellPhone ?? undefined}
                                                    currentUserId={currentPersona?.id}
                                                    onStartDM={handleStartDM}
                                                >
                                                    <div
                                                        data-testid="message-avatar"
                                                        className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm flex items-center justify-center text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all border border-primary/10 shadow-sm"
                                                    >
                                                        {msg.senderName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                    </div>
                                                </PersonnelPopover>
                                                <div
                                                    className="w-fit max-w-[75%] rounded-2xl px-3 py-2 backdrop-blur-md border shadow-sm transition-all"
                                                    style={{
                                                        backgroundColor: userColor,
                                                        borderColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
                                                    }}
                                                >
                                                    <div className="flex items-baseline gap-2">
                                                        <PersonnelPopover
                                                            personnelId={msg.senderId}
                                                            personnelName={msg.senderName}
                                                            personnelTitle={msg.senderTitle ?? undefined}
                                                            personnelDepartment={msg.senderDepartment ?? undefined}
                                                            personnelEmail={msg.senderEmail ?? undefined}
                                                            personnelDeskPhone={msg.senderDeskPhone ?? undefined}
                                                            personnelCellPhone={msg.senderCellPhone ?? undefined}
                                                            currentUserId={currentPersona?.id}
                                                            onStartDM={handleStartDM}
                                                        >
                                                            <span
                                                                data-testid="message-sender"
                                                                className="font-medium text-sm message-sender cursor-pointer hover:underline"
                                                            >
                                                                {msg.senderName}
                                                            </span>
                                                        </PersonnelPopover>
                                                        <span
                                                            data-testid="message-timestamp"
                                                            className="text-xs text-muted-foreground message-timestamp"
                                                        >
                                                            {new Date(msg.sentAt).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                }
                                                            )}
                                                        </span>
                                                        {/* Add reaction button - shows on hover */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => setEmojiPickerForMessage(
                                                                emojiPickerForMessage === msg.id ? null : msg.id
                                                            )}
                                                            data-testid="add-reaction-button"
                                                        >
                                                            <Smile className="h-3 w-3" />
                                                        </Button>
                                                        {/* Reply button - shows on hover */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            data-testid="reply-button"
                                                            title="Reply in thread"
                                                            onClick={() => setActiveThread({
                                                                messageId: msg.id,
                                                                senderName: msg.senderName,
                                                                content: msg.content
                                                            })}
                                                        >
                                                            <Reply className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <p className="text-sm mt-0.5">
                                                        {(() => {
                                                            // Parse @mentions by looking for exact personnel names
                                                            if (allPersonnel.length === 0) return msg.content;

                                                            // Build regex from personnel names (sorted longest first for greedy match)
                                                            const sortedNames = [...allPersonnel]
                                                                .map(p => p.name)
                                                                .sort((a, b) => b.length - a.length);

                                                            const namesPattern = sortedNames
                                                                .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
                                                                .join('|');
                                                            const mentionRegex = new RegExp(`@(${namesPattern})`, 'gi');

                                                            const parts: React.ReactNode[] = [];
                                                            let lastIndex = 0;
                                                            let match;
                                                            let keyIndex = 0;

                                                            while ((match = mentionRegex.exec(msg.content)) !== null) {
                                                                // Add text before the mention
                                                                if (match.index > lastIndex) {
                                                                    parts.push(msg.content.slice(lastIndex, match.index));
                                                                }

                                                                // Find personnel by name (case-insensitive)
                                                                const mentionedName = match[1];
                                                                const mentionedPerson = allPersonnel.find(
                                                                    p => p.name.toLowerCase() === mentionedName.toLowerCase()
                                                                );

                                                                // Add the mention as a styled span
                                                                parts.push(
                                                                    mentionedPerson ? (
                                                                        <PersonnelPopover
                                                                            key={`mention-${msg.id}-${keyIndex++}`}
                                                                            personnelId={mentionedPerson.id}
                                                                            personnelName={mentionedPerson.name}
                                                                            currentUserId={currentPersona?.id}
                                                                            onStartDM={handleStartDM}
                                                                        >
                                                                            <span
                                                                                data-testid="mention"
                                                                                className="mention text-primary font-medium bg-primary/10 px-1 rounded cursor-pointer hover:bg-primary/20"
                                                                            >
                                                                                @{mentionedPerson.name}
                                                                            </span>
                                                                        </PersonnelPopover>
                                                                    ) : (
                                                                        <span
                                                                            key={`mention-${msg.id}-${keyIndex++}`}
                                                                            data-testid="mention"
                                                                            className="mention text-primary font-medium bg-primary/10 px-1 rounded"
                                                                        >
                                                                            @{mentionedName}
                                                                        </span>
                                                                    )
                                                                );

                                                                lastIndex = match.index + match[0].length;
                                                            }

                                                            // Add remaining text
                                                            if (lastIndex < msg.content.length) {
                                                                parts.push(msg.content.slice(lastIndex));
                                                            }

                                                            return parts.length > 0 ? parts : msg.content;
                                                        })()}
                                                    </p>

                                                    {/* Inline thread replies */}
                                                    {replies.length > 0 && (
                                                        <div className="mt-2 pl-3 border-l-2 border-primary/20 space-y-2">
                                                            {replies.map((reply) => {
                                                                const replyColor = getUserColor(reply.senderId, isDarkMode);
                                                                return (
                                                                    <div
                                                                        key={reply.id}
                                                                        data-testid="thread-reply"
                                                                        className="flex items-start gap-2 text-sm group/reply"
                                                                    >
                                                                        <div
                                                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                                                                            style={{ backgroundColor: replyColor }}
                                                                        >
                                                                            {reply.senderName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-xs">{reply.senderName}</span>
                                                                                <span className="text-muted-foreground text-xs">
                                                                                    {new Date(reply.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                                {/* Reaction button for reply */}
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-5 w-5 opacity-0 group-hover/reply:opacity-100 transition-opacity"
                                                                                    onClick={() => setEmojiPickerForMessage(emojiPickerForMessage === reply.id ? null : reply.id)}
                                                                                >
                                                                                    <Smile className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                            <p className="text-sm mt-0.5">{reply.content}</p>

                                                                            {/* Reply reactions display */}
                                                                            {messageReactions[reply.id] && messageReactions[reply.id].length > 0 && (
                                                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                                                    {messageReactions[reply.id].map((reaction) => (
                                                                                        <button
                                                                                            key={reaction.emoji}
                                                                                            title={reaction.users.map(u => u.name).join(", ")}
                                                                                            onClick={() => handleReactionToggle(reply.id, reaction.emoji)}
                                                                                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border ${reaction.hasReacted
                                                                                                ? "bg-primary/10 border-primary/30"
                                                                                                : "bg-muted/50 border-transparent hover:border-border"
                                                                                                }`}
                                                                                        >
                                                                                            <span>{reaction.emoji}</span>
                                                                                            <span className="text-muted-foreground">{reaction.count}</span>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            {/* Emoji picker for reply */}
                                                                            {emojiPickerForMessage === reply.id && (
                                                                                <div className="mt-1 p-2 bg-popover border rounded-lg shadow-lg flex gap-1 w-fit">
                                                                                    {COMMON_EMOJIS.map((emoji) => (
                                                                                        <button
                                                                                            key={emoji}
                                                                                            onClick={() => handleReactionToggle(reply.id, emoji)}
                                                                                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent text-sm"
                                                                                        >
                                                                                            {emoji}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            <button
                                                                data-testid="reply-count"
                                                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                                                                onClick={() => setActiveThread({
                                                                    messageId: msg.id,
                                                                    senderName: msg.senderName,
                                                                    content: msg.content
                                                                })}
                                                            >
                                                                <Reply className="h-3 w-3" />
                                                                Reply to thread
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Reactions display */}
                                                    {messageReactions[msg.id] && messageReactions[msg.id].length > 0 && (
                                                        <div className="flex gap-1 mt-1 flex-wrap" data-testid="reactions-container">
                                                            {messageReactions[msg.id].map((reaction) => (
                                                                <button
                                                                    key={reaction.emoji}
                                                                    data-testid="reaction-pill"
                                                                    title={reaction.users.map(u => u.name).join(", ")}
                                                                    onClick={() => handleReactionToggle(msg.id, reaction.emoji)}
                                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${reaction.hasReacted
                                                                        ? "bg-primary/10 border-primary/30"
                                                                        : "bg-muted/50 border-transparent hover:border-border"
                                                                        }`}
                                                                >
                                                                    <span>{reaction.emoji}</span>
                                                                    <span className="text-muted-foreground">{reaction.count}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Emoji picker dropdown */}
                                                    {emojiPickerForMessage === msg.id && (
                                                        <div
                                                            className="absolute mt-1 p-2 bg-popover border rounded-lg shadow-lg flex gap-1 z-50"
                                                            data-testid="emoji-picker"
                                                        >
                                                            {COMMON_EMOJIS.map((emoji) => (
                                                                <button
                                                                    key={emoji}
                                                                    data-testid="emoji-option"
                                                                    onClick={() => handleReactionToggle(msg.id, emoji)}
                                                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-lg"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Thread Reply Indicator */}
                        {activeThread && (
                            <div
                                data-testid="thread-reply-bar"
                                className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2 text-sm">
                                    <Reply className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Replying to</span>
                                    <span className="font-medium">{activeThread.senderName}</span>
                                    <span className="text-muted-foreground truncate max-w-[200px]">
                                        &quot;{activeThread.content}&quot;
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => setActiveThread(null)}
                                    data-testid="cancel-reply-button"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* Message Input */}
                        <div className="p-4 border-t">
                            <div className="flex gap-2 relative">
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        data-testid="emoji-button"
                                    >
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                    {/* Emoji picker for message composition */}
                                    {showEmojiPicker && (
                                        <div
                                            className="absolute bottom-full mb-2 p-2 bg-popover border rounded-lg shadow-lg flex gap-1 z-50"
                                            data-testid="compose-emoji-picker"
                                        >
                                            {COMMON_EMOJIS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => {
                                                        setMessageInput((prev) => prev + emoji);
                                                        setShowEmojiPicker(false);
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent text-lg"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 relative">
                                    {/* Styled mention overlay */}
                                    <div
                                        className="absolute inset-0 pointer-events-none px-3 py-2 text-sm overflow-hidden whitespace-pre-wrap break-words"
                                        style={{ color: 'transparent' }}
                                        aria-hidden="true"
                                    >
                                        {messageInput.split(/(@\w+(?:\s+\w+)?)/g).map((part, i) => {
                                            // Check if this is a valid mention
                                            if (part.startsWith('@')) {
                                                const mentionName = part.slice(1);
                                                const isValidMention = allPersonnel.some(p =>
                                                    p.name.toLowerCase() === mentionName.toLowerCase() ||
                                                    p.name.toLowerCase().startsWith(mentionName.toLowerCase())
                                                );
                                                if (isValidMention) {
                                                    return (
                                                        <span
                                                            key={i}
                                                            className="bg-primary/20 rounded-sm"
                                                        >
                                                            {part}
                                                        </span>
                                                    );
                                                }
                                            }
                                            return <span key={i}>{part}</span>;
                                        })}
                                    </div>
                                    <Input
                                        data-testid="message-input"
                                        placeholder={`Message ${selectedChannelInfo?.name ?? ""}...`}
                                        value={messageInput}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setMessageInput(value);

                                            // Check for @ mention trigger
                                            const lastAtIndex = value.lastIndexOf('@');
                                            if (lastAtIndex >= 0) {
                                                const afterAt = value.slice(lastAtIndex + 1);
                                                // Only show if no space after @ (still typing the mention)
                                                if (!afterAt.includes(' ')) {
                                                    setMentionQuery(afterAt.toLowerCase());
                                                    setMentionSelectedIndex(0); // Reset selection on query change
                                                    setShowMentionAutocomplete(true);
                                                } else {
                                                    setShowMentionAutocomplete(false);
                                                }
                                            } else {
                                                setShowMentionAutocomplete(false);
                                            }
                                        }}
                                        onKeyDown={handleKeyPress}
                                        className="flex-1 bg-transparent"
                                    />
                                    {/* Mention Autocomplete */}
                                    {showMentionAutocomplete && (
                                        <div
                                            data-testid="mention-autocomplete"
                                            className="absolute bottom-full mb-2 left-0 w-full max-h-48 overflow-y-auto bg-popover border rounded-lg shadow-lg z-50"
                                        >
                                            {mentionPersonnel
                                                .filter(p => p.name.toLowerCase().includes(mentionQuery))
                                                .slice(0, 5)
                                                .map((person, index) => (
                                                    <button
                                                        key={person.id}
                                                        data-testid="mention-option"
                                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${index === mentionSelectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
                                                            }`}
                                                        onClick={() => handleMentionSelect(person.name)}
                                                    >
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                                            {person.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span>{person.name}</span>
                                                    </button>
                                                ))}
                                            {mentionPersonnel.filter(p => p.name.toLowerCase().includes(mentionQuery)).length === 0 && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    data-testid="send-button"
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim()}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a channel or start a conversation
                    </div>
                )}
            </div>

            {/* Create Channel Dialog */}
            <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Channel</DialogTitle>
                        <DialogDescription>
                            Create a new channel for team conversations
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="channel-name">Name</Label>
                            <Input
                                id="channel-name"
                                placeholder="e.g., general"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="channel-description">
                                Description (optional)
                            </Label>
                            <Input
                                id="channel-description"
                                placeholder="What's this channel about?"
                                value={newChannelDescription}
                                onChange={(e) =>
                                    setNewChannelDescription(e.target.value)
                                }
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowCreateChannel(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateChannel}
                                disabled={!newChannelName.trim()}
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Browse Channels Dialog */}
            <Dialog open={showBrowseChannels} onOpenChange={setShowBrowseChannels}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Browse Channels</DialogTitle>
                        <DialogDescription>
                            Join an existing channel
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 pt-4 max-h-64 overflow-y-auto">
                        {availableChannels.map((channel) => {
                            const isMember = channels.some(
                                (c) => c.id === channel.id
                            );
                            return (
                                <div
                                    key={channel.id}
                                    data-testid="channel-row"
                                    className="flex items-center justify-between p-2 rounded hover:bg-accent"
                                >
                                    <div className="flex items-center gap-2">
                                        <Hash className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium text-sm">
                                                {channel.name}
                                            </div>
                                            {channel.description && (
                                                <div className="text-xs text-muted-foreground">
                                                    {channel.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isMember ? (
                                        <span className="text-xs text-muted-foreground">
                                            Joined
                                        </span>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                handleJoinChannel(channel.id)
                                            }
                                        >
                                            Join
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                        {availableChannels.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No channels available. Create one!
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* New DM Dialog */}
            <Dialog open={showNewDM} onOpenChange={setShowNewDM}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Direct Message</DialogTitle>
                        <DialogDescription>
                            Start a conversation with a colleague
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="person-search">Search</Label>
                            <Input
                                id="person-search"
                                data-testid="person-search"
                                placeholder="Find a colleague..."
                                value={dmSearchQuery}
                                onChange={(e) => setDmSearchQuery(e.target.value)}
                            />
                        </div>
                        <PersonSearch
                            query={dmSearchQuery}
                            currentUserId={currentPersona.id}
                            onSelect={handleStartDM}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ============================================================================
// Person Search Component  
// ============================================================================

function PersonSearch({
    query,
    currentUserId,
    onSelect,
}: {
    query: string;
    currentUserId: string;
    onSelect: (personnelId: string) => void;
}) {
    const [personnel, setPersonnel] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        // Get personnel list (this runs on client, so we need to fetch)
        const loadPersonnel = async () => {
            try {
                const response = await fetch("/api/personnel");
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setPersonnel(
                            data.data
                                .filter((p: { id: string }) => p.id !== currentUserId)
                                .map((p: { id: string; name: string }) => ({
                                    id: p.id,
                                    name: p.name,
                                }))
                        );
                    }
                }
            } catch (error) {
                console.error("Failed to load personnel:", error);
            }
        };
        loadPersonnel();
    }, [currentUserId]);

    const filtered = query
        ? personnel.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase())
        )
        : personnel;

    return (
        <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.slice(0, 10).map((person) => (
                <button
                    key={person.id}
                    role="option"
                    data-testid="person-option"
                    onClick={() => onSelect(person.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-accent text-left"
                >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {person.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{person.name}</span>
                </button>
            ))}
            {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                    No colleagues found
                </p>
            )}
        </div>
    );
}
