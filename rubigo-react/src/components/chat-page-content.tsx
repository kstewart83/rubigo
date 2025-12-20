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
    type ChatChannelWithMembers,
    type ChatMessageWithSender,
    type ReactionGroup,
} from "@/lib/chat-actions";
import type { ChatChannel } from "@/db/schema";

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

    // State
    const [channels, setChannels] = useState<ChannelListItem[]>([]);
    const [availableChannels, setAvailableChannels] = useState<ChatChannel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Load messages when channel selected
    useEffect(() => {
        if (!selectedChannel) {
            setMessages([]);
            setMessageReactions({});
            return;
        }

        const loadMessages = async () => {
            const msgs = await getMessages(selectedChannel);
            // Only update if messages actually changed (compare IDs to avoid re-renders)
            setMessages((prev) => {
                const prevIds = prev.map(m => m.id).join(',');
                const newIds = msgs.map(m => m.id).join(',');
                if (prevIds === newIds) return prev; // No change
                return msgs;
            });

            // Load reactions for each message
            if (currentPersona) {
                const reactionsMap: Record<string, ReactionGroup[]> = {};
                for (const msg of msgs) {
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
        };

        loadMessages();

        // Poll for new messages every 5 seconds (increased from 3s)
        const interval = setInterval(loadMessages, 5000);
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
            messageInput.trim()
        );

        if (result.success) {
            setMessageInput("");
            // Reload messages
            const msgs = await getMessages(selectedChannel);
            setMessages(msgs);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
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
        <div className="flex h-full" data-testid="chat-container">
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
            <div className="flex-1 flex flex-col">
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
                        <ScrollArea className="flex-1 p-4">
                            <div
                                data-testid="message-list"
                                className="space-y-4 message-list"
                            >
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        data-testid="message-bubble"
                                        className="flex gap-3 group"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                                            {msg.senderName.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span
                                                    data-testid="message-sender"
                                                    className="font-medium text-sm message-sender"
                                                >
                                                    {msg.senderName}
                                                </span>
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
                                            </div>
                                            <p className="text-sm mt-0.5">{msg.content}</p>

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
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

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
                                <Input
                                    data-testid="message-input"
                                    placeholder={`Message ${selectedChannelInfo?.name ?? ""}...`}
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    className="flex-1"
                                />
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

import { getAllPersonnel } from "@/lib/personnel";

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
