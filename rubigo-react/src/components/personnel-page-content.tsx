"use client";

/**
 * Personnel Page Content
 * 
 * Client component that handles pagination UI and navigation.
 * Receives paginated data from the server component.
 */

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePersona } from "@/contexts/persona-context";
import { createPersonnel, updatePersonnel, deletePersonnel } from "@/lib/personnel-actions";
import type { Department } from "@/types/personnel";

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
}

interface Props {
    data: PersonnelData[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    search: string;
    department: string;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const departments: Department[] = [
    "Executive",
    "Engineering",
    "IT",
    "HR",
    "Finance",
    "Sales",
    "Operations",
];

export function PersonnelPageContent({
    data,
    total,
    page,
    pageSize,
    totalPages,
    search: initialSearch,
    department: initialDepartment,
}: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentPersona } = usePersona();
    const [isPending, startTransition] = useTransition();

    // Local state for filters (debounced)
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [selectedPerson, setSelectedPerson] = useState<PersonnelData | null>(null);

    // CRUD dialogs
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [editingPerson, setEditingPerson] = useState<PersonnelData | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        title: "",
        department: "Engineering" as Department,
        bio: "",
    });
    const [formError, setFormError] = useState("");

    const isAdmin = currentPersona?.isGlobalAdmin ?? false;

    // Navigation helper
    const updateUrl = (updates: Record<string, string | number | undefined>) => {
        const params = new URLSearchParams(searchParams.toString());

        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined && value !== "" && value !== "all") {
                params.set(key, String(value));
            } else {
                params.delete(key);
            }
        });

        startTransition(() => {
            router.push(`/personnel?${params.toString()}`);
        });
    };

    // Handlers
    const handleSearch = () => {
        updateUrl({ search: searchInput, page: 1 });
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleDepartmentChange = (value: string) => {
        updateUrl({ department: value, page: 1 });
    };

    const handlePageSizeChange = (value: string) => {
        updateUrl({ pageSize: parseInt(value, 10), page: 1 });
    };

    const handlePageChange = (newPage: number) => {
        updateUrl({ page: newPage });
    };

    // CRUD handlers
    const handleCreate = async () => {
        if (!currentPersona) return;

        const result = await createPersonnel(
            {
                name: formData.name,
                email: formData.email,
                title: formData.title || undefined,
                department: formData.department,
                bio: formData.bio || undefined,
            },
            currentPersona.id,
            currentPersona.name
        );

        if (result.success) {
            setShowCreateDialog(false);
            setFormData({ name: "", email: "", title: "", department: "Engineering", bio: "" });
            router.refresh();
        } else {
            setFormError(result.error || "Failed to create");
        }
    };

    const handleEdit = async () => {
        if (!currentPersona || !editingPerson) return;

        const result = await updatePersonnel(
            editingPerson.id,
            {
                name: formData.name,
                email: formData.email,
                title: formData.title || undefined,
                department: formData.department,
                bio: formData.bio || undefined,
            },
            currentPersona.id,
            currentPersona.name
        );

        if (result.success) {
            setShowEditDialog(false);
            setEditingPerson(null);
            router.refresh();
        } else {
            setFormError(result.error || "Failed to update");
        }
    };

    const handleDelete = async () => {
        if (!currentPersona || !editingPerson) return;

        const result = await deletePersonnel(
            editingPerson.id,
            currentPersona.id,
            currentPersona.name
        );

        if (result.success) {
            setShowDeleteDialog(false);
            setEditingPerson(null);
            setSelectedPerson(null);
            router.refresh();
        } else {
            setFormError(result.error || "Failed to delete");
        }
    };

    const openEdit = (person: PersonnelData) => {
        setEditingPerson(person);
        setFormData({
            name: person.name,
            email: person.email,
            title: person.title || "",
            department: person.department as Department,
            bio: person.bio || "",
        });
        setFormError("");
        setShowEditDialog(true);
    };

    const openDelete = (person: PersonnelData) => {
        setEditingPerson(person);
        setShowDeleteDialog(true);
    };

    // Calculate display range
    const startIndex = (page - 1) * pageSize + 1;
    const endIndex = Math.min(page * pageSize, total);

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Personnel Directory</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {total === 0 ? "No personnel found" : `Showing ${startIndex}-${endIndex} of ${total} people`}
                    </p>
                </div>
                {isAdmin && (
                    <Button
                        onClick={() => {
                            setFormData({ name: "", email: "", title: "", department: "Engineering", bio: "" });
                            setFormError("");
                            setShowCreateDialog(true);
                        }}
                    >
                        Add Personnel
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 flex gap-2">
                    <Input
                        placeholder="Search by name, title, or email..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="flex-1"
                    />
                    <Button variant="outline" onClick={handleSearch} disabled={isPending}>
                        Search
                    </Button>
                </div>
                <Select value={initialDepartment} onValueChange={handleDepartmentChange}>
                    <SelectTrigger className="w-[180px]">
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

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Email</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                                    No personnel found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((person) => (
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
                                                className="rounded-full"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs">
                                                {person.name.split(" ").map((n) => n[0]).join("")}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{person.name}</TableCell>
                                    <TableCell>{person.title || "-"}</TableCell>
                                    <TableCell>{person.department}</TableCell>
                                    <TableCell>{person.email}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Rows per page:</span>
                    <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                        <SelectTrigger className="w-[70px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PAGE_SIZE_OPTIONS.map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1 || isPending}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-zinc-500">
                        Page {page} of {totalPages || 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages || isPending}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Detail Sheet */}
            <Sheet open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
                <SheetContent>
                    {selectedPerson && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedPerson.name}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-6">
                                {/* Photo */}
                                <div className="flex justify-center">
                                    {selectedPerson.photo ? (
                                        <Image
                                            src={selectedPerson.photo}
                                            alt={selectedPerson.name}
                                            width={120}
                                            height={120}
                                            className="rounded-full"
                                        />
                                    ) : (
                                        <div className="w-28 h-28 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-2xl">
                                            {selectedPerson.name.split(" ").map((n) => n[0]).join("")}
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm text-zinc-500">Title</div>
                                        <div>{selectedPerson.title || "-"}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-zinc-500">Department</div>
                                        <div>{selectedPerson.department}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-zinc-500">Email</div>
                                        <div>{selectedPerson.email}</div>
                                    </div>
                                    {selectedPerson.bio && (
                                        <div>
                                            <div className="text-sm text-zinc-500">Bio</div>
                                            <div className="text-sm">{selectedPerson.bio}</div>
                                        </div>
                                    )}
                                </div>

                                {/* Admin actions */}
                                {isAdmin && !selectedPerson.isGlobalAdmin && (
                                    <div className="flex gap-2 pt-4 border-t">
                                        <Button variant="outline" onClick={() => openEdit(selectedPerson)}>
                                            Edit
                                        </Button>
                                        <Button variant="destructive" onClick={() => openDelete(selectedPerson)}>
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Personnel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {formError && (
                            <div className="text-sm text-red-600 dark:text-red-400 p-3 rounded-md bg-red-50 dark:bg-red-950">
                                {formError}
                            </div>
                        )}
                        <div>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Select
                                value={formData.department}
                                onValueChange={(v) => setFormData({ ...formData, department: v as Department })}
                            >
                                <SelectTrigger id="department">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Personnel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {formError && (
                            <div className="text-sm text-red-600 dark:text-red-400 p-3 rounded-md bg-red-50 dark:bg-red-950">
                                {formError}
                            </div>
                        )}
                        <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-title">Title</Label>
                            <Input
                                id="edit-title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-department">Department</Label>
                            <Select
                                value={formData.department}
                                onValueChange={(v) => setFormData({ ...formData, department: v as Department })}
                            >
                                <SelectTrigger id="edit-department">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>
                                            {dept}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="edit-bio">Bio</Label>
                            <Textarea
                                id="edit-bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Personnel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {editingPerson?.name}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
