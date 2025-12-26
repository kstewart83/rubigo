"use client";

/**
 * Team Card - Mobile card for team display
 * 
 * A compact card for displaying teams in a mobile grid layout.
 * Uses ClassificationCell for consistent security badge display.
 */

import { UsersRound, Crown, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AccessControlObject } from "@/lib/access-control/types";
import { ClassificationCell } from "@/components/ui/secure-table-wrapper";

interface TeamCardProps {
    id: string;
    name: string;
    description?: string | null;
    aco?: AccessControlObject;
    ownerCount: number;
    memberCount: number;
    childTeamCount: number;
    onClick?: () => void;
    className?: string;
}

export function TeamCard({
    name,
    description,
    aco,
    ownerCount,
    memberCount,
    childTeamCount,
    onClick,
    className,
}: TeamCardProps) {
    return (
        <Card
            className={cn(
                "cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden py-0 gap-0",
                className
            )}
            onClick={onClick}
        >
            <CardContent className="p-2">
                {/* 2-column layout */}
                <div className="grid grid-cols-[auto_1fr] gap-2">
                    {/* Left column - Icon with classification badge */}
                    <div className="flex flex-col items-center gap-1">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UsersRound className="h-6 w-6 text-primary" />
                        </div>
                        {/* Classification badge using ClassificationCell */}
                        <ClassificationCell aco={aco} />
                    </div>

                    {/* Right column - Name, description, counts */}
                    <div className="flex flex-col min-w-0">
                        {/* Name */}
                        <h3 className="font-semibold text-sm truncate">{name}</h3>

                        {/* Description */}
                        {description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {description}
                            </p>
                        )}

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {/* Owners */}
                            <span className="flex items-center gap-1">
                                <Crown className="h-3 w-3 text-amber-500" />
                                {ownerCount}
                            </span>

                            {/* Members */}
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {memberCount}
                            </span>

                            {/* Child teams */}
                            {childTeamCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <UsersRound className="h-3 w-3" />
                                    {childTeamCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
