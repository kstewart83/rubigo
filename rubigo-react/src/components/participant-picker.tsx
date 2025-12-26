"use client";

/**
 * ParticipantPicker - Multi-select for personnel and teams
 * 
 * Supports selecting both individuals and teams as calendar event participants.
 * Displays selected items as chips with role indicators.
 */

import { useState } from "react";
import { Check, ChevronsUpDown, X, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ParticipantRole = "organizer" | "required" | "optional" | "excluded";

export interface ParticipantItem {
    type: "personnel" | "team";
    id: string;
    name: string;
    subtitle?: string; // title for personnel, member count for teams
    role: ParticipantRole;
}

interface PersonnelOption {
    id: string;
    name: string;
    title?: string | null;
    department?: string;
}

interface TeamOption {
    id: string;
    name: string;
    memberCount?: number;
}

interface ParticipantPickerProps {
    value: ParticipantItem[];
    onChange: (value: ParticipantItem[]) => void;
    personnel: PersonnelOption[];
    teams: TeamOption[];
    excludePersonnelIds?: string[];
    excludeTeamIds?: string[];
    placeholder?: string;
    defaultRole?: ParticipantRole;
}

const ROLE_COLORS: Record<ParticipantRole, string> = {
    organizer: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700",
    required: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700",
    optional: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600",
    excluded: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700 line-through",
};

export function ParticipantPicker({
    value,
    onChange,
    personnel,
    teams,
    excludePersonnelIds = [],
    excludeTeamIds = [],
    placeholder = "Add participants...",
    defaultRole = "required",
}: ParticipantPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Filter already selected items
    const selectedPersonnelIds = new Set(
        value.filter(v => v.type === "personnel").map(v => v.id)
    );
    const selectedTeamIds = new Set(
        value.filter(v => v.type === "team").map(v => v.id)
    );

    // Filter and exclude
    const filteredPersonnel = personnel.filter((p) => {
        if (excludePersonnelIds.includes(p.id)) return false;
        if (selectedPersonnelIds.has(p.id)) return false;
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(searchLower) ||
            (p.title && p.title.toLowerCase().includes(searchLower)) ||
            (p.department && p.department.toLowerCase().includes(searchLower))
        );
    });

    const filteredTeams = teams.filter((t) => {
        if (excludeTeamIds.includes(t.id)) return false;
        if (selectedTeamIds.has(t.id)) return false;
        if (!search) return true;
        return t.name.toLowerCase().includes(search.toLowerCase());
    });

    const handleSelect = (type: "personnel" | "team", item: PersonnelOption | TeamOption) => {
        const newItem: ParticipantItem = {
            type,
            id: item.id,
            name: item.name,
            subtitle: type === "personnel"
                ? (item as PersonnelOption).title ?? undefined
                : (item as TeamOption).memberCount
                    ? `${(item as TeamOption).memberCount} members`
                    : undefined,
            role: defaultRole,
        };
        onChange([...value, newItem]);
        setSearch("");
    };

    const handleRemove = (id: string) => {
        onChange(value.filter(v => v.id !== id));
    };

    const handleRoleChange = (id: string, newRole: ParticipantRole) => {
        onChange(value.map(v => v.id === id ? { ...v, role: newRole } : v));
    };

    return (
        <div className="space-y-2">
            {/* Selected participants */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {value.map((participant) => (
                        <Popover key={`${participant.type}-${participant.id}`}>
                            <PopoverTrigger>
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "flex items-center gap-1 pr-1 cursor-pointer hover:opacity-80",
                                        ROLE_COLORS[participant.role]
                                    )}
                                >
                                    {participant.type === "team" ? (
                                        <Users className="h-3 w-3" />
                                    ) : (
                                        <User className="h-3 w-3" />
                                    )}
                                    <span className="max-w-[150px] truncate">{participant.name}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemove(participant.id);
                                        }}
                                        className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground mb-2 font-medium">Change role:</p>
                                    {(["organizer", "required", "optional"] as ParticipantRole[]).map((role) => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => handleRoleChange(participant.id, role)}
                                            className={cn(
                                                "w-full text-left px-3 py-1.5 rounded text-sm transition-colors",
                                                participant.role === role
                                                    ? "bg-accent font-medium"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                            {participant.role === role && (
                                                <Check className="h-3 w-3 inline ml-2" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                    ))}
                </div>
            )}

            {/* Picker dropdown */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                    >
                        <span className="text-muted-foreground">{placeholder}</span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search people or teams..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>

                            {/* Teams section */}
                            {filteredTeams.length > 0 && (
                                <CommandGroup heading="Teams">
                                    {filteredTeams.slice(0, 5).map((team) => (
                                        <CommandItem
                                            key={team.id}
                                            value={team.name}
                                            onSelect={() => handleSelect("team", team)}
                                        >
                                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span>{team.name}</span>
                                                {team.memberCount !== undefined && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {team.memberCount} members
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {filteredTeams.length > 0 && filteredPersonnel.length > 0 && (
                                <CommandSeparator />
                            )}

                            {/* Personnel section */}
                            {filteredPersonnel.length > 0 && (
                                <CommandGroup heading="People">
                                    {filteredPersonnel.slice(0, 8).map((person) => (
                                        <CommandItem
                                            key={person.id}
                                            value={person.name}
                                            onSelect={() => handleSelect("personnel", person)}
                                        >
                                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <div className="flex flex-col">
                                                <span>{person.name}</span>
                                                {person.title && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {person.title}
                                                        {person.department && ` • ${person.department}`}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
