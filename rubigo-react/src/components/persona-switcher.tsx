"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePersona } from "@/contexts/persona-context";
import type { Person, Department } from "@/types/personnel";
import Image from "next/image";

interface PersonaSwitcherProps {
    personnel: Person[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const departmentOrder: Department[] = [
    "Executive",
    "Engineering",
    "IT",
    "HR",
    "Finance",
    "Sales",
    "Operations",
];

export function PersonaSwitcher({ personnel, open, onOpenChange }: PersonaSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { setPersona } = usePersona();
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");

    // Filter personnel
    const filteredPersonnel = useMemo(() => {
        return personnel.filter((p) => {
            const matchesSearch =
                search === "" ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.title?.toLowerCase().includes(search.toLowerCase()) ||
                p.email.toLowerCase().includes(search.toLowerCase());

            const matchesDepartment =
                departmentFilter === "all" || p.department === departmentFilter;

            return matchesSearch && matchesDepartment;
        });
    }, [personnel, search, departmentFilter]);

    // Group by department
    const byDepartment = useMemo(() => {
        return departmentOrder.reduce((acc, dept) => {
            const people = filteredPersonnel.filter((p) => p.department === dept);
            if (people.length > 0) {
                acc[dept] = people;
            }
            return acc;
        }, {} as Record<string, Person[]>);
    }, [filteredPersonnel]);

    const handleSelect = (person: Person) => {
        setPersona(person);
        onOpenChange(false);
        setSearch("");
        setDepartmentFilter("all");

        // Navigate to dashboard if on landing page
        if (pathname === "/") {
            router.push("/dashboard");
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setSearch("");
            setDepartmentFilter("all");
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Sign In as Persona</DialogTitle>
                </DialogHeader>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 py-2">
                    <div className="flex-1">
                        <Input
                            placeholder="Search by name, title, or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departmentOrder.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                    {dept}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Results count */}
                <div className="text-sm text-zinc-500 pb-2">
                    {filteredPersonnel.length} of {personnel.length} people
                    {search && ` matching "${search}"`}
                    {departmentFilter !== "all" && ` in ${departmentFilter}`}
                </div>

                {/* Personnel list */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {Object.entries(byDepartment).map(([dept, people]) => (
                        <div key={dept}>
                            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2 sticky top-0 bg-white dark:bg-zinc-950 py-1">
                                {dept}
                                <span className="ml-2 font-normal">({people.length})</span>
                            </h3>
                            <div className="grid gap-2">
                                {people.map((person) => (
                                    <button
                                        key={person.id}
                                        onClick={() => handleSelect(person)}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left w-full"
                                    >
                                        {person.photo ? (
                                            <Image
                                                src={person.photo}
                                                alt={person.name}
                                                width={40}
                                                height={40}
                                                className="rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-sm font-medium">
                                                {person.name.split(" ").map((n) => n[0]).join("")}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                {person.name}
                                            </div>
                                            <div className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                                                {person.title}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}

                    {Object.keys(byDepartment).length === 0 && (
                        <div className="text-center py-8 text-zinc-500">
                            No personnel found matching your criteria
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
