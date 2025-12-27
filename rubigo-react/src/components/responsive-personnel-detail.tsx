"use client";

/**
 * ResponsivePersonnelDetail - Responsive detail panel
 * 
 * Uses ShadCN responsive dialog pattern:
 * - Mobile (< md): Drawer from bottom
 * - Desktop (≥ md): Sheet from right
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Crown, UsersRound } from "lucide-react";
import { AgentBadge } from "@/components/ui/agent-badge";

interface PersonnelData {
    id: string;
    name: string;
    email: string;
    title: string | null;
    department: string;
    site: string | null;
    building: string | null;
    level: number | null;
    space: string | null;
    manager: string | null;
    photo: string | null;
    deskPhone: string | null;
    cellPhone: string | null;
    bio: string | null;
    isGlobalAdmin: boolean;
    isAgent?: boolean;
}

interface TeamInfo {
    id: string;
    name: string;
    description: string | null;
    isOwner: boolean;
}

interface ResponsivePersonnelDetailProps {
    person: PersonnelData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teams: TeamInfo[];
    isAdmin: boolean;
    onDelete?: (person: PersonnelData) => void;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function DetailContent({
    person,
    teams,
    isAdmin,
    onDelete,
    isMobile,
}: {
    person: PersonnelData;
    teams: TeamInfo[];
    isAdmin: boolean;
    onDelete?: (person: PersonnelData) => void;
    isMobile: boolean;
}) {
    const router = useRouter();

    return (
        <div className={`space-y-6 overflow-y-auto ${isMobile ? "px-4 pb-4" : "px-4"}`}>
            {/* Photo */}
            <div className="flex justify-center">
                {person.photo ? (
                    person.isAgent ? (
                        // AI Agent: Layered neon glow + glassmorphism + avatar
                        <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
                            {/* Layer 1: Subtle neon glow orb */}
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 200,
                                    height: 200,
                                    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(124, 58, 237, 0.08) 100%)',
                                    boxShadow: `
                                        0 0 20px rgba(168, 85, 247, 0.35),
                                        0 0 40px rgba(147, 51, 234, 0.25),
                                        0 0 70px rgba(124, 58, 237, 0.18),
                                        0 0 100px rgba(109, 40, 217, 0.12)
                                    `,
                                    animation: 'neon-pulse 3s ease-in-out infinite',
                                }}
                            />
                            {/* Layer 2: Glassmorphism overlay */}
                            <div
                                className="absolute rounded-full"
                                style={{
                                    width: 180,
                                    height: 180,
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                            />
                            {/* Layer 3: Avatar image - zoomed and clipped */}
                            <div
                                className="rounded-full overflow-hidden relative z-10"
                                style={{
                                    width: 190,
                                    height: 190,
                                    maskImage: 'radial-gradient(circle at center, black 0%, black 45%, transparent 75%)',
                                    WebkitMaskImage: 'radial-gradient(circle at center, black 0%, black 45%, transparent 75%)',
                                }}
                            >
                                <Image
                                    src={person.photo}
                                    alt={person.name}
                                    width={180}
                                    height={180}
                                    style={{
                                        objectFit: 'cover',
                                        transform: 'scale(1.4) translate(1%, 2%)',
                                    }}
                                />
                            </div>
                            <style jsx>{`
                                @keyframes neon-pulse {
                                    0%, 100% { 
                                        box-shadow: 
                                            0 0 20px rgba(168, 85, 247, 0.35),
                                            0 0 40px rgba(147, 51, 234, 0.25),
                                            0 0 70px rgba(124, 58, 237, 0.18),
                                            0 0 100px rgba(109, 40, 217, 0.12);
                                    }
                                    50% { 
                                        box-shadow: 
                                            0 0 25px rgba(168, 85, 247, 0.45),
                                            0 0 50px rgba(147, 51, 234, 0.35),
                                            0 0 85px rgba(124, 58, 237, 0.25),
                                            0 0 120px rgba(109, 40, 217, 0.18);
                                    }
                                }
                            `}</style>
                        </div>
                    ) : (
                        // Human: rounded square, larger image
                        <Image
                            src={person.photo}
                            alt={person.name}
                            width={240}
                            height={240}
                            className="rounded-lg"
                        />
                    )
                ) : (
                    <div className="w-28 h-28 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-2xl">
                        {getInitials(person.name)}
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="space-y-4">
                <div>
                    <div className="text-sm text-muted-foreground">Title</div>
                    <div>{person.title || "-"}</div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground">Department</div>
                    <div>{person.department}</div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div>{person.email}</div>
                </div>

                {/* Contact Info */}
                {(person.deskPhone || person.cellPhone) && (
                    <div className="pt-2 border-t">
                        <div className="text-sm font-medium mb-2">Contact</div>
                        {person.deskPhone && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Desk:</span>
                                <a href={`tel:${person.deskPhone}`} className="text-blue-600 hover:underline">
                                    {person.deskPhone}
                                </a>
                            </div>
                        )}
                        {person.cellPhone && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Cell:</span>
                                <a href={`tel:${person.cellPhone}`} className="text-blue-600 hover:underline">
                                    {person.cellPhone}
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Location */}
                {(person.site || person.building) && (
                    <div className="pt-2 border-t">
                        <div className="text-sm font-medium mb-2">Office Location</div>
                        <div className="text-sm">
                            {[
                                person.site,
                                person.building,
                                person.level && `Level ${person.level}`,
                                person.space && `Space ${person.space}`,
                            ].filter(Boolean).join(", ")}
                        </div>
                    </div>
                )}

                {/* Manager */}
                {person.manager && (
                    <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground">Manager</div>
                        <div>{person.manager}</div>
                    </div>
                )}

                {person.bio && (
                    <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground">Bio</div>
                        <div className="text-sm">{person.bio}</div>
                    </div>
                )}

                {/* Teams section */}
                <div className="pt-2 border-t">
                    <div className="text-sm font-medium mb-2">Teams</div>
                    {teams.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Not a member of any teams</div>
                    ) : (
                        <div className="space-y-1">
                            {teams.map(team => (
                                <div
                                    key={team.id}
                                    className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer"
                                    onClick={() => router.push(`/personnel/teams?team=${team.id}`)}
                                >
                                    <UsersRound className="h-4 w-4 text-primary" />
                                    <span>{team.name}</span>
                                    {team.isOwner && (
                                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Admin actions */}
            {isAdmin && !person.isGlobalAdmin && (
                <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => router.push(`/personnel/${person.id}/edit`)}>
                        Edit
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete?.(person)}>
                        Delete
                    </Button>
                </div>
            )}
        </div>
    );
}

export function ResponsivePersonnelDetail({
    person,
    open,
    onOpenChange,
    teams,
    isAdmin,
    onDelete,
}: ResponsivePersonnelDetailProps) {
    const isMobile = useIsMobile();

    if (!person) return null;

    // Mobile: Drawer from bottom
    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader className="text-left">
                        <DrawerTitle className="flex items-center gap-2">
                            {person.name}
                            {person.isAgent && <AgentBadge size="xs" />}
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto">
                        <DetailContent
                            person={person}
                            teams={teams}
                            isAdmin={isAdmin}
                            onDelete={onDelete}
                            isMobile={true}
                        />
                    </div>
                    <DrawerFooter className="pt-2">
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    // Desktop: Sheet from right
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        {person.name}
                        {person.isAgent && <AgentBadge size="xs" />}
                    </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                    <DetailContent
                        person={person}
                        teams={teams}
                        isAdmin={isAdmin}
                        onDelete={onDelete}
                        isMobile={false}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
