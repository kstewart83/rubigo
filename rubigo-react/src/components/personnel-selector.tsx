"use client";

/**
 * PersonnelSelector - Searchable dropdown for selecting personnel
 * 
 * Used for selecting managers and other personnel relationships.
 * Features real-time search and displays name with title.
 */

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Personnel {
    id: string;
    name: string;
    title: string | null;
    department: string;
}

interface PersonnelSelectorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    excludeId?: string; // Exclude this person from the list (e.g., self)
    personnel: Personnel[];
}

export function PersonnelSelector({
    value,
    onChange,
    placeholder = "Select person...",
    excludeId,
    personnel,
}: PersonnelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    // Filter personnel based on search and exclude
    const filteredPersonnel = personnel.filter((p) => {
        if (excludeId && p.id === excludeId) return false;
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            p.name.toLowerCase().includes(searchLower) ||
            (p.title && p.title.toLowerCase().includes(searchLower)) ||
            p.department.toLowerCase().includes(searchLower)
        );
    });

    // Find selected person by name (value is the name string)
    const selectedPerson = personnel.find((p) => p.name === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    {value ? (
                        <span className="truncate">{value}</span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                        {value && (
                            <X
                                className="h-4 w-4 opacity-50 hover:opacity-100"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange("");
                                }}
                            />
                        )}
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search by name, title, or department..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>No personnel found.</CommandEmpty>
                        <CommandGroup>
                            {filteredPersonnel.map((person) => (
                                <CommandItem
                                    key={person.id}
                                    value={person.name}
                                    onSelect={() => {
                                        onChange(person.name);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === person.name ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{person.name}</span>
                                        {person.title && (
                                            <span className="text-xs text-muted-foreground">
                                                {person.title} • {person.department}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
