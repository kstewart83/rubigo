"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Person, Department } from "@/types/personnel";

interface PersonnelTableProps {
    personnel: Person[];
    onEdit?: (person: Person) => void;
    onDelete?: (person: Person) => void;
}

const ITEMS_PER_PAGE = 10;

const departments: Department[] = [
    "Executive",
    "Engineering",
    "IT",
    "HR",
    "Finance",
    "Sales",
    "Operations",
];

export function PersonnelTable({ personnel, onEdit, onDelete }: PersonnelTableProps) {
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    // Filter personnel
    const filteredPersonnel = useMemo(() => {
        return personnel.filter((person) => {
            const matchesSearch =
                search === "" ||
                person.name.toLowerCase().includes(search.toLowerCase()) ||
                person.title?.toLowerCase().includes(search.toLowerCase()) ||
                person.email.toLowerCase().includes(search.toLowerCase());

            const matchesDepartment =
                departmentFilter === "all" || person.department === departmentFilter;

            return matchesSearch && matchesDepartment;
        });
    }, [personnel, search, departmentFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredPersonnel.length / ITEMS_PER_PAGE);
    const paginatedPersonnel = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredPersonnel.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredPersonnel, currentPage]);

    // Reset page when filters change
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    const handleDepartmentChange = (value: string) => {
        setDepartmentFilter(value);
        setCurrentPage(1);
    };

    return (
        <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <Input
                        placeholder="Search by name, title, or email..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full"
                    />
                </div>
                <Select value={departmentFilter} onValueChange={handleDepartmentChange}>
                    <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                                {dept}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Results count */}
            <div className="text-sm text-zinc-500 mb-4">
                Showing {paginatedPersonnel.length} of {filteredPersonnel.length} employees
                {search && ` matching "${search}"`}
                {departmentFilter !== "all" && ` in ${departmentFilter}`}
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Title</TableHead>
                            <TableHead className="hidden lg:table-cell">Department</TableHead>
                            <TableHead className="hidden xl:table-cell">Site</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedPersonnel.map((person) => (
                            <TableRow
                                key={person.id}
                                className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                onClick={() => setSelectedPerson(person)}
                            >
                                <TableCell>
                                    {person.photo ? (
                                        <Image
                                            src={person.photo}
                                            alt={person.name}
                                            width={32}
                                            height={32}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium">
                                            {person.name.split(" ").map((n) => n[0]).join("")}
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{person.name}</div>
                                    <div className="text-sm text-zinc-500 md:hidden">{person.title}</div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-zinc-600 dark:text-zinc-400">
                                    {person.title}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                        {person.department}
                                    </span>
                                </TableCell>
                                <TableCell className="hidden xl:table-cell text-zinc-500">
                                    {person.site}
                                </TableCell>
                            </TableRow>
                        ))}
                        {paginatedPersonnel.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                    No employees found matching your criteria
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-zinc-500">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Detail Sheet */}
            <Sheet open={!!selectedPerson} onOpenChange={() => setSelectedPerson(null)}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto pl-8">
                    {selectedPerson && (
                        <>
                            <SheetHeader>
                                <div className="flex items-center gap-4 mb-4">
                                    {selectedPerson.photo ? (
                                        <Image
                                            src={selectedPerson.photo}
                                            alt={selectedPerson.name}
                                            width={80}
                                            height={80}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-2xl font-medium">
                                            {selectedPerson.name.split(" ").map((n) => n[0]).join("")}
                                        </div>
                                    )}
                                    <div>
                                        <SheetTitle className="text-xl">{selectedPerson.name}</SheetTitle>
                                        <p className="text-zinc-500">{selectedPerson.title}</p>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="space-y-6 mt-6">
                                {/* Contact Info */}
                                <section>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                                        Contact
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex gap-3">
                                            <span className="text-zinc-500 w-20">Email</span>
                                            <a href={`mailto:${selectedPerson.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                                {selectedPerson.email}
                                            </a>
                                        </div>
                                        {selectedPerson.deskPhone && (
                                            <div className="flex gap-3">
                                                <span className="text-zinc-500 w-20">Desk</span>
                                                <span>{selectedPerson.deskPhone}</span>
                                            </div>
                                        )}
                                        {selectedPerson.cellPhone && (
                                            <div className="flex gap-3">
                                                <span className="text-zinc-500 w-20">Mobile</span>
                                                <span>{selectedPerson.cellPhone}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Organization */}
                                <section>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                                        Organization
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex gap-3">
                                            <span className="text-zinc-500 w-20">Department</span>
                                            <span>{selectedPerson.department}</span>
                                        </div>
                                        {selectedPerson.manager && (
                                            <div className="flex gap-3">
                                                <span className="text-zinc-500 w-20">Reports to</span>
                                                <span>{selectedPerson.manager}</span>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Location */}
                                {selectedPerson.site && (
                                    <section>
                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                                            Location
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex gap-3">
                                                <span className="text-zinc-500 w-20">Site</span>
                                                <span>{selectedPerson.site}</span>
                                            </div>
                                            {selectedPerson.building && (
                                                <div className="flex gap-3">
                                                    <span className="text-zinc-500 w-20">Building</span>
                                                    <span>{selectedPerson.building}</span>
                                                </div>
                                            )}
                                            {selectedPerson.space && (
                                                <div className="flex gap-3">
                                                    <span className="text-zinc-500 w-20">Space</span>
                                                    <span>
                                                        {selectedPerson.level && `Floor ${selectedPerson.level}, `}
                                                        {selectedPerson.space}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}

                                {/* Bio */}
                                {selectedPerson.bio && (
                                    <section>
                                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                                            About
                                        </h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                            {selectedPerson.bio}
                                        </p>
                                    </section>
                                )}

                                {/* Admin Actions */}
                                {(onEdit || onDelete) && !selectedPerson.isGlobalAdmin && (
                                    <section className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                        <div className="flex gap-2">
                                            {onEdit && (
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        onEdit(selectedPerson);
                                                        setSelectedPerson(null);
                                                    }}
                                                >
                                                    Edit
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={() => {
                                                        onDelete(selectedPerson);
                                                        setSelectedPerson(null);
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
