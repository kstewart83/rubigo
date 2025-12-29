/**
 * Personnel Popover Component
 *
 * Mini-card popup showing personnel info when clicking on avatar/name.
 * Uses shadcn Popover for consistent UI.
 */

"use client";

import { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AgentBadge } from "@/components/ui/agent-badge";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { MessageSquare, Mail, Phone, Smartphone } from "lucide-react";

interface PersonnelPopoverProps {
    personnelId: string;
    personnelName: string;
    personnelPhoto?: string | null;
    personnelTitle?: string;
    personnelDepartment?: string;
    personnelEmail?: string;
    personnelDeskPhone?: string;
    personnelCellPhone?: string;
    personnelIsAgent?: boolean;
    presenceStatus?: "online" | "away" | "offline";
    children: React.ReactNode;
    onStartDM?: (personnelId: string) => void;
    currentUserId?: string;
}

export function PersonnelPopover({
    personnelId,
    personnelName,
    personnelPhoto,
    personnelTitle,
    personnelDepartment,
    personnelEmail,
    personnelDeskPhone,
    personnelCellPhone,
    personnelIsAgent,
    presenceStatus,
    children,
    onStartDM,
    currentUserId,
}: PersonnelPopoverProps) {
    const [open, setOpen] = useState(false);

    const handleDMClick = () => {
        if (onStartDM) {
            onStartDM(personnelId);
            setOpen(false);
        }
    };

    const isOwnProfile = currentUserId === personnelId;
    const hasContactInfo = personnelEmail || personnelDeskPhone || personnelCellPhone;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger data-testid="personnel-popup-trigger" className="focus:outline-none">
                {children}
            </PopoverTrigger>
            <PopoverContent
                data-testid="personnel-popup"
                className="w-80 p-4"
                align="start"
            >
                <div className="space-y-3">
                    {/* Photo/Avatar */}
                    <div className="flex items-center gap-3">
                        <div data-testid="popup-avatar">
                            <PersonAvatar
                                photo={personnelPhoto}
                                name={personnelName}
                                isAgent={personnelIsAgent}
                                size="lg"
                                showPresence
                                presenceStatus={presenceStatus}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div
                                data-testid="popup-name"
                                className="font-semibold text-sm truncate flex items-center gap-2"
                            >
                                {personnelName}
                                {personnelIsAgent && <AgentBadge size="xs" />}
                            </div>
                            {personnelTitle && (
                                <div
                                    data-testid="popup-title"
                                    className="text-xs text-muted-foreground truncate"
                                >
                                    {personnelTitle}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Department */}
                    {personnelDepartment && (
                        <div
                            data-testid="popup-department"
                            className="text-xs text-muted-foreground border-t pt-2"
                        >
                            {personnelDepartment}
                        </div>
                    )}

                    {/* Contact Info */}
                    {hasContactInfo && (
                        <div className="border-t pt-2 space-y-1.5">
                            {personnelEmail && (
                                <div
                                    data-testid="popup-email"
                                    className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                    <Mail className="h-3 w-3" />
                                    {personnelEmail}
                                </div>
                            )}
                            {personnelDeskPhone && (
                                <a
                                    href={`tel:${personnelDeskPhone}`}
                                    data-testid="popup-desk-phone"
                                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <Phone className="h-3 w-3" />
                                    {personnelDeskPhone}
                                </a>
                            )}
                            {personnelCellPhone && (
                                <a
                                    href={`tel:${personnelCellPhone}`}
                                    data-testid="popup-cell-phone"
                                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <Smartphone className="h-3 w-3" />
                                    {personnelCellPhone}
                                </a>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {!isOwnProfile && onStartDM && (
                        <div className="border-t pt-3">
                            <Button
                                data-testid="popup-dm-button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={handleDMClick}
                            >
                                <MessageSquare className="h-3 w-3 mr-2" />
                                Send Message
                            </Button>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
