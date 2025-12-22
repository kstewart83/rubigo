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
import { MessageSquare } from "lucide-react";

interface PersonnelPopoverProps {
    personnelId: string;
    personnelName: string;
    personnelTitle?: string;
    personnelDepartment?: string;
    children: React.ReactNode;
    onStartDM?: (personnelId: string) => void;
    currentUserId?: string;
}

export function PersonnelPopover({
    personnelId,
    personnelName,
    personnelTitle,
    personnelDepartment,
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

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger data-testid="personnel-popup-trigger" className="focus:outline-none">
                {children}
            </PopoverTrigger>
            <PopoverContent
                data-testid="personnel-popup"
                className="w-72 p-4"
                align="start"
            >
                <div className="space-y-3">
                    {/* Photo/Avatar */}
                    <div className="flex items-center gap-3">
                        <div
                            data-testid="popup-avatar"
                            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium overflow-hidden"
                        >
                            {personnelName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div
                                data-testid="popup-name"
                                className="font-semibold text-sm truncate"
                            >
                                {personnelName}
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

