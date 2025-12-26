"use client";

/**
 * PersonCard - Mobile-friendly card view for personnel
 * 
 * Layout: Photo+Badge column | Info+Actions column
 * Used in place of table rows on mobile breakpoints (< md)
 */

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentBadge } from "@/components/ui/agent-badge";
import { MessageCircle, Smartphone, Phone, Mail } from "lucide-react";

interface PersonCardProps {
    id: string;
    name: string;
    email: string;
    title: string | null;
    department: string;
    photo: string | null;
    isAgent?: boolean;
    cellPhone?: string | null;
    deskPhone?: string | null;
    onClick?: () => void;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function PersonCard({
    id,
    name,
    email,
    title,
    department,
    photo,
    isAgent,
    cellPhone,
    deskPhone,
    onClick,
}: PersonCardProps) {
    const router = useRouter();

    const handleDM = (e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger card click
        router.push(`/chat?dm=${id}`);
    };

    return (
        <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99] py-0 gap-0"
            onClick={onClick}
        >
            <CardContent className="p-2">
                {/* 2-column grid: Photo+Badge | Info+Actions */}
                <div className="grid grid-cols-[2fr_3fr] gap-3">
                    {/* Left column - Photo with badge below */}
                    <div className="flex flex-col gap-1">
                        <div className="aspect-[4/3] w-full">
                            <Avatar className="h-full w-full rounded-lg">
                                {photo && <AvatarImage src={photo} alt={name} className="rounded-lg object-cover h-full w-full" />}
                                <AvatarFallback className="text-xl rounded-lg bg-primary/10 text-primary font-semibold h-full w-full">
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        {/* Department badge below photo */}
                        <Badge variant="secondary" className="text-xs w-full justify-center rounded-lg">
                            {department}
                        </Badge>
                    </div>

                    {/* Right column - Name, Title, and Action icons */}
                    <div className="flex flex-col justify-between min-w-0">
                        {/* Name and Title - centered vertically in remaining space */}
                        <div className="flex-1 flex flex-col justify-center">
                            {/* Name with agent badge */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xl font-semibold">{name}</p>
                                {isAgent && <AgentBadge size="xs" />}
                            </div>
                            {/* Title */}
                            {title && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {title}
                                </p>
                            )}
                        </div>

                        {/* Action icons row at bottom - spread horizontally */}
                        <div className="flex items-center justify-around mt-2">
                            {/* DM - Active */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                                onClick={handleDM}
                                title={`Message ${name}`}
                            >
                                <MessageCircle className="h-4 w-4" />
                            </Button>

                            {/* Email - Disabled/grayed */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground/40 rounded-full cursor-not-allowed"
                                disabled
                                title={email || "No email"}
                            >
                                <Mail className="h-4 w-4" />
                            </Button>

                            {/* Mobile Phone - Disabled/grayed */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground/40 rounded-full cursor-not-allowed"
                                disabled
                                title={cellPhone || "No mobile number"}
                            >
                                <Smartphone className="h-4 w-4" />
                            </Button>

                            {/* Desk Phone - Disabled/grayed */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground/40 rounded-full cursor-not-allowed"
                                disabled
                                title={deskPhone || "No desk number"}
                            >
                                <Phone className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
