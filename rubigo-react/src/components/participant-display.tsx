"use client";

/**
 * ParticipantDisplay - Shows resolved participants with grouping
 * 
 * Displays participants in a grouped format:
 * - Teams shown with member counts
 * - Individuals listed separately
 * - Organizers highlighted
 */

import { User, Users, Crown, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResolvedParticipant, ParticipantRole } from "@/lib/participant-resolver";

interface ParticipantDisplayProps {
    participants: ResolvedParticipant[];
    showWarnings?: boolean;
    compact?: boolean;
}

const ROLE_STYLES: Record<ParticipantRole, string> = {
    organizer: "text-purple-700 bg-purple-50",
    required: "text-blue-700 bg-blue-50",
    optional: "text-gray-600 bg-gray-50",
    excluded: "text-red-700 bg-red-50 line-through opacity-60",
};

export function ParticipantDisplay({
    participants,
    showWarnings = false,
    compact = false,
}: ParticipantDisplayProps) {
    // Group by source (teams vs direct invites)
    const organizers = participants.filter(p => p.role === "organizer");
    const fromTeams = participants.filter(p => p.role !== "organizer" && p.sourceTeamIds && p.sourceTeamIds.length > 0);
    const directInvites = participants.filter(p => p.role !== "organizer" && (!p.sourceTeamIds || p.sourceTeamIds.length === 0));

    // Count by team
    const teamCounts = new Map<string, { name: string; count: number }>();
    for (const p of fromTeams) {
        for (const teamId of p.sourceTeamIds || []) {
            const existing = teamCounts.get(teamId);
            if (existing) {
                existing.count++;
            } else {
                teamCounts.set(teamId, { name: p.sourceTeamNames?.[0] || teamId, count: 1 });
            }
        }
    }

    if (compact) {
        const total = participants.filter(p => p.role !== "excluded").length;
        const teamCount = teamCounts.size;
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                    {total} participant{total !== 1 ? "s" : ""}
                    {teamCount > 0 && ` from ${teamCount} team${teamCount !== 1 ? "s" : ""}`}
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Organizers */}
            {organizers.length > 0 && (
                <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Organizer{organizers.length !== 1 ? "s" : ""}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {organizers.map((p) => (
                            <Badge
                                key={p.personnelId}
                                variant="outline"
                                className={cn("flex items-center gap-1", ROLE_STYLES.organizer)}
                            >
                                <Crown className="h-3 w-3" />
                                <span>{p.name}</span>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* From Teams */}
            {teamCounts.size > 0 && (
                <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Teams
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {Array.from(teamCounts.entries()).map(([teamId, info]) => (
                            <Badge
                                key={teamId}
                                variant="outline"
                                className="flex items-center gap-1 bg-blue-50 text-blue-700"
                            >
                                <Users className="h-3 w-3" />
                                <span>{info.name}</span>
                                <span className="text-xs opacity-70">({info.count})</span>
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Direct Invites */}
            {directInvites.length > 0 && (
                <div className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {organizers.length > 0 || teamCounts.size > 0 ? "Also Invited" : "Participants"}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {directInvites.map((p) => (
                            <Badge
                                key={p.personnelId}
                                variant="outline"
                                className={cn("flex items-center gap-1", ROLE_STYLES[p.role])}
                            >
                                <User className="h-3 w-3" />
                                <span>{p.name}</span>
                                {p.role === "optional" && (
                                    <span className="text-xs opacity-60">(optional)</span>
                                )}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Warnings section */}
            {showWarnings && (
                <ParticipantWarnings participants={participants} />
            )}
        </div>
    );
}

interface ParticipantWarningsProps {
    participants: ResolvedParticipant[];
}

function ParticipantWarnings({ participants }: ParticipantWarningsProps) {
    // Check for clearance issues (placeholder - would need ACO context)
    const warnings: string[] = [];

    // Check for excluded participants
    const excluded = participants.filter(p => p.role === "excluded");
    if (excluded.length > 0) {
        warnings.push(`${excluded.length} participant${excluded.length !== 1 ? "s" : ""} excluded`);
    }

    if (warnings.length === 0) return null;

    return (
        <div className="flex items-start gap-2 p-2 bg-amber-50 text-amber-800 rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
                {warnings.map((warning, i) => (
                    <div key={i}>{warning}</div>
                ))}
            </div>
        </div>
    );
}
