"use client";

/**
 * Personnel CRUD Component
 * 
 * Wraps PersonnelTable with admin-only create/edit/delete capabilities
 */

import { useState, useTransition } from "react";
import { PersonnelTable } from "./personnel-table";
import { usePersona } from "@/contexts/persona-context";
import type { Person, Department } from "@/types/personnel";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    type PersonnelInput,
} from "@/lib/personnel-actions";
import { Plus } from "lucide-react";

interface PersonnelCRUDProps {
    personnel: Person[];
}

const departments: Department[] = [
    "Executive",
    "Engineering",
    "IT",
    "HR",
    "Finance",
    "Sales",
    "Operations",
];

interface FormData {
    name: string;
    email: string;
    title: string;
    department: Department;
    site: string;
    building: string;
    level: string;
    space: string;
    manager: string;
    deskPhone: string;
    cellPhone: string;
    bio: string;
}

const emptyForm: FormData = {
    name: "",
    email: "",
    title: "",
    department: "Executive",
    site: "",
    building: "",
    level: "",
    space: "",
    manager: "",
    deskPhone: "",
    cellPhone: "",
    bio: "",
};

export function PersonnelCRUD({ personnel }: PersonnelCRUDProps) {
    const { currentPersona } = usePersona();
    const [isPending, startTransition] = useTransition();

    // Is admin check
    const isAdmin = currentPersona?.isGlobalAdmin === true;

    // Dialog states
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    // Form state
    const [formData, setFormData] = useState<FormData>(emptyForm);
    const [error, setError] = useState<string | null>(null);

    // Handle opening edit dialog
    const handleEdit = (person: Person) => {
        setSelectedPerson(person);
        setFormData({
            name: person.name,
            email: person.email,
            title: person.title || "",
            department: person.department,
            site: person.site || "",
            building: person.building || "",
            level: person.level?.toString() || "",
            space: person.space || "",
            manager: person.manager || "",
            deskPhone: person.deskPhone || "",
            cellPhone: person.cellPhone || "",
            bio: person.bio || "",
        });
        setError(null);
        setShowEditDialog(true);
    };

    // Handle opening delete dialog
    const handleDelete = (person: Person) => {
        setSelectedPerson(person);
        setShowDeleteDialog(true);
    };

    // Handle creating personnel
    const handleCreate = () => {
        startTransition(async () => {
            const input: PersonnelInput = {
                name: formData.name,
                email: formData.email,
                title: formData.title || undefined,
                department: formData.department,
                site: formData.site || undefined,
                building: formData.building || undefined,
                level: formData.level ? parseInt(formData.level) : undefined,
                space: formData.space || undefined,
                manager: formData.manager || undefined,
                deskPhone: formData.deskPhone || undefined,
                cellPhone: formData.cellPhone || undefined,
                bio: formData.bio || undefined,
            };

            const result = await createPersonnel(
                input,
                currentPersona?.id || "unknown",
                currentPersona?.name || "Unknown"
            );

            if (result.success) {
                setShowCreateDialog(false);
                setFormData(emptyForm);
                setError(null);
            } else {
                setError(result.error || "Failed to create personnel");
            }
        });
    };

    // Handle updating personnel
    const handleUpdate = () => {
        if (!selectedPerson) return;

        startTransition(async () => {
            const input: Partial<PersonnelInput> = {
                name: formData.name,
                email: formData.email,
                title: formData.title || undefined,
                department: formData.department,
                site: formData.site || undefined,
                building: formData.building || undefined,
                level: formData.level ? parseInt(formData.level) : undefined,
                space: formData.space || undefined,
                manager: formData.manager || undefined,
                deskPhone: formData.deskPhone || undefined,
                cellPhone: formData.cellPhone || undefined,
                bio: formData.bio || undefined,
            };

            const result = await updatePersonnel(
                selectedPerson.id,
                input,
                currentPersona?.id || "unknown",
                currentPersona?.name || "Unknown"
            );

            if (result.success) {
                setShowEditDialog(false);
                setSelectedPerson(null);
                setFormData(emptyForm);
                setError(null);
            } else {
                setError(result.error || "Failed to update personnel");
            }
        });
    };

    // Handle deleting personnel
    const handleConfirmDelete = () => {
        if (!selectedPerson) return;

        startTransition(async () => {
            const result = await deletePersonnel(
                selectedPerson.id,
                currentPersona?.id || "unknown",
                currentPersona?.name || "Unknown"
            );

            if (result.success) {
                setShowDeleteDialog(false);
                setSelectedPerson(null);
            } else {
                setError(result.error || "Failed to delete personnel");
            }
        });
    };

    // Render form fields
    const renderForm = () => (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Smith"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jsmith@company.com"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Software Engineer"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select
                        value={formData.department}
                        onValueChange={(value: Department) => setFormData({ ...formData, department: value })}
                    >
                        <SelectTrigger>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="site">Site</Label>
                    <Input
                        id="site"
                        value={formData.site}
                        onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                        placeholder="HQ"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="building">Building</Label>
                    <Input
                        id="building"
                        value={formData.building}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                        placeholder="Main Building"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input
                        id="level"
                        type="number"
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        placeholder="1"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="space">Space</Label>
                    <Input
                        id="space"
                        value={formData.space}
                        onChange={(e) => setFormData({ ...formData, space: e.target.value })}
                        placeholder="101"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Input
                        id="manager"
                        value={formData.manager}
                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                        placeholder="Manager name"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="deskPhone">Desk Phone</Label>
                    <Input
                        id="deskPhone"
                        value={formData.deskPhone}
                        onChange={(e) => setFormData({ ...formData, deskPhone: e.target.value })}
                        placeholder="555-0100"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cellPhone">Cell Phone</Label>
                    <Input
                        id="cellPhone"
                        value={formData.cellPhone}
                        onChange={(e) => setFormData({ ...formData, cellPhone: e.target.value })}
                        placeholder="555-0101"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Brief biography..."
                    rows={3}
                />
            </div>

            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}
        </div>
    );

    return (
        <>
            {/* Header with Add button */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                        Personnel Directory
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        {isAdmin
                            ? "Manage employee directory - add, edit, or remove personnel"
                            : "Browse and search the employee directory"}
                    </p>
                </div>

                {isAdmin && (
                    <Button
                        onClick={() => {
                            setFormData(emptyForm);
                            setError(null);
                            setShowCreateDialog(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Personnel
                    </Button>
                )}
            </div>

            {/* Personnel Table */}
            <PersonnelTable
                personnel={personnel}
                onEdit={isAdmin ? handleEdit : undefined}
                onDelete={isAdmin ? handleDelete : undefined}
            />

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Personnel</DialogTitle>
                    </DialogHeader>
                    {renderForm()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate} disabled={isPending}>
                            {isPending ? "Creating..." : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Personnel</DialogTitle>
                    </DialogHeader>
                    {renderForm()}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate} disabled={isPending}>
                            {isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Personnel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedPerson?.name}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
