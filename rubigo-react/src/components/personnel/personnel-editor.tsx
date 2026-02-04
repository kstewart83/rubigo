"use client";

/**
 * Personnel Editor
 * 
 * Full-page editor component for creating/editing personnel.
 * Features tabbed interface with Basic Information and Security tabs.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PhotoUpload } from "@/components/photo-upload";
import { PersonnelSelector } from "@/components/personnel-selector";
import { usePersona } from "@/contexts/persona-context";
import { createPersonnel, updatePersonnel } from "@/lib/personnel-actions";
import type { Department, Person } from "@/types/personnel";
import type { SensitivityLevel } from "@/lib/access-control/types";
import { SecurePanelWrapper } from "@/components/ui/secure-panel-wrapper";
import { ArrowLeft, Save, User, Shield, X, Plus } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface PersonnelEditorProps {
    person?: Person;
    allPersonnel: Person[];
    mode: "create" | "edit";
}

interface FormData {
    // Basic Info
    name: string;
    email: string;
    title: string;
    department: Department;
    bio: string;
    deskPhone: string;
    cellPhone: string;
    site: string;
    building: string;
    level: string;
    space: string;
    manager: string;
    photo: string;
    isAgent: boolean;
    // Security
    clearanceLevel: SensitivityLevel;
    compartmentClearances: string[];
    accessRoles: string[];
}

// ============================================================================
// Constants
// ============================================================================

const DEPARTMENTS: Department[] = [
    "Executive",
    "Engineering",
    "IT",
    "HR",
    "Finance",
    "Sales",
    "Operations",
];

const SENSITIVITY_LEVELS: { value: SensitivityLevel; label: string }[] = [
    { value: "public", label: "Public" },
    { value: "low", label: "Low" },
    { value: "moderate", label: "Moderate" },
    { value: "high", label: "High" },
];

const TENANTS = ["🍎", "🍌", "🍊", "🍇", "🍓"];

const DEFAULT_ROLES = ["employee", "manager", "administrator", "executive", "contractor", "security"];

// ============================================================================
// Component
// ============================================================================

export function PersonnelEditor({ person, allPersonnel, mode }: PersonnelEditorProps) {
    const router = useRouter();
    const { currentPersona } = usePersona();
    const [isPending, startTransition] = useTransition();
    const [activeTab, setActiveTab] = useState<"basic" | "security">("basic");
    const [error, setError] = useState("");

    // Parse existing tenant clearances
    const parseCompartmentClearances = (raw?: string): string[] => {
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    };

    // Parse existing roles
    const parseRoles = (raw?: string): string[] => {
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    };

    const [formData, setFormData] = useState<FormData>({
        name: person?.name ?? "",
        email: person?.email ?? "",
        title: person?.title ?? "",
        department: (person?.department as Department) ?? "Engineering",
        bio: person?.bio ?? "",
        deskPhone: person?.deskPhone ?? "",
        cellPhone: person?.cellPhone ?? "",
        site: person?.site ?? "",
        building: person?.building ?? "",
        level: person?.level?.toString() ?? "",
        space: person?.space ?? "",
        manager: person?.manager ?? "",
        photo: person?.photo ?? "",
        isAgent: person?.isAgent ?? false,
        clearanceLevel: (person?.clearanceLevel as SensitivityLevel) ?? "low",
        compartmentClearances: parseCompartmentClearances(person?.compartmentClearances),
        accessRoles: parseRoles(person?.accessRoles),
    });

    const handleSave = async () => {
        if (!currentPersona) return;
        setError("");

        const payload = {
            name: formData.name,
            email: formData.email,
            title: formData.title || undefined,
            department: formData.department,
            bio: formData.bio || undefined,
            deskPhone: formData.deskPhone || undefined,
            cellPhone: formData.cellPhone || undefined,
            site: formData.site || undefined,
            building: formData.building || undefined,
            level: formData.level ? parseInt(formData.level) : undefined,
            space: formData.space || undefined,
            manager: formData.manager || undefined,
            photo: formData.photo || undefined,
            isAgent: formData.isAgent,
            clearanceLevel: formData.clearanceLevel,
            compartmentClearances: JSON.stringify(formData.compartmentClearances),
            accessRoles: JSON.stringify(formData.accessRoles),
            // Record classification (not user clearance) - personnel data is LOW
            aco: JSON.stringify({ sensitivity: "low", tenants: [] }),
        };

        let result;
        if (mode === "edit" && person) {
            result = await updatePersonnel(
                person.id,
                payload,
                currentPersona.id,
                currentPersona.name
            );
        } else {
            result = await createPersonnel(
                payload,
                currentPersona.id,
                currentPersona.name
            );
        }

        if (result.success) {
            startTransition(() => {
                router.push("/personnel");
                router.refresh();
            });
        } else {
            setError(result.error || "Failed to save");
        }
    };

    const handleBack = () => {
        router.push("/personnel");
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="size-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">
                        {mode === "create" ? "Add Personnel" : `Edit ${person?.name}`}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {mode === "create"
                            ? "Create a new personnel record"
                            : "Update personnel information and security settings"}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isPending}>
                    <Save className="size-4 mr-2" />
                    {isPending ? "Saving..." : "Save"}
                </Button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab("basic")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors min-w-[160px] ${activeTab === "basic"
                        ? "border-orange-500 text-orange-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                        }`}
                >
                    <User className="size-4" />
                    Basic Information
                </button>
                <button
                    onClick={() => setActiveTab("security")}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors min-w-[120px] ${activeTab === "security"
                        ? "border-orange-500 text-orange-400"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                        }`}
                >
                    <Shield className="size-4" />
                    Security
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "basic" && (
                <BasicInfoTab
                    formData={formData}
                    setFormData={setFormData}
                    allPersonnel={allPersonnel}
                    personId={person?.id}
                />
            )}
            {activeTab === "security" && (
                <SecurityTab
                    formData={formData}
                    setFormData={setFormData}
                />
            )}
        </div>
    );
}

// ============================================================================
// Basic Info Tab
// ============================================================================

function BasicInfoTab({
    formData,
    setFormData,
    allPersonnel,
    personId,
}: {
    formData: FormData;
    setFormData: (data: FormData) => void;
    allPersonnel: Person[];
    personId?: string;
}) {
    return (
        <SecurePanelWrapper level="low" className="border rounded-lg overflow-hidden">
            <div className="space-y-6 p-6">
                {/* Photo */}
                <div className="flex justify-center">
                    <PhotoUpload
                        value={formData.photo}
                        onChange={(url) => setFormData({ ...formData, photo: url })}
                        personnelId={personId}
                        size="lg"
                    />
                </div>

                {/* AI Agent Toggle */}
                <div className="flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/5 p-4">
                    <div>
                        <Label className="text-base font-medium">AI Agent</Label>
                        <p className="text-sm text-muted-foreground">
                            Enable AI simulation for this personnel
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={formData.isAgent}
                        onClick={() => setFormData({ ...formData, isAgent: !formData.isAgent })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${formData.isAgent ? "bg-purple-600" : "bg-muted"
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg transition-transform ${formData.isAgent ? "translate-x-5" : "translate-x-0"
                                }`}
                        />
                    </button>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john.doe@company.com"
                        />
                    </div>
                </div>

                {/* Title & Department */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Software Engineer"
                        />
                    </div>
                    <div>
                        <Label htmlFor="department">Department *</Label>
                        <Select
                            value={formData.department}
                            onValueChange={(v) => setFormData({ ...formData, department: v as Department })}
                        >
                            <SelectTrigger id="department">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DEPARTMENTS.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                        {dept}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="deskPhone">Desk Phone</Label>
                        <Input
                            id="deskPhone"
                            type="tel"
                            value={formData.deskPhone}
                            onChange={(e) => setFormData({ ...formData, deskPhone: e.target.value })}
                            placeholder="614-555-1234"
                        />
                    </div>
                    <div>
                        <Label htmlFor="cellPhone">Cell Phone</Label>
                        <Input
                            id="cellPhone"
                            type="tel"
                            value={formData.cellPhone}
                            onChange={(e) => setFormData({ ...formData, cellPhone: e.target.value })}
                            placeholder="614-555-5678"
                        />
                    </div>
                </div>

                {/* Location */}
                <div>
                    <Label className="text-sm font-medium mb-2 block">Office Location</Label>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="site" className="text-xs text-zinc-500">Site</Label>
                            <Input
                                id="site"
                                value={formData.site}
                                onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                                placeholder="HQ"
                            />
                        </div>
                        <div>
                            <Label htmlFor="building" className="text-xs text-zinc-500">Building</Label>
                            <Input
                                id="building"
                                value={formData.building}
                                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                placeholder="Main"
                            />
                        </div>
                        <div>
                            <Label htmlFor="level" className="text-xs text-zinc-500">Level</Label>
                            <Input
                                id="level"
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                placeholder="3"
                            />
                        </div>
                        <div>
                            <Label htmlFor="space" className="text-xs text-zinc-500">Space</Label>
                            <Input
                                id="space"
                                value={formData.space}
                                onChange={(e) => setFormData({ ...formData, space: e.target.value })}
                                placeholder="301"
                            />
                        </div>
                    </div>
                </div>

                {/* Manager */}
                <div>
                    <Label>Manager</Label>
                    <PersonnelSelector
                        value={formData.manager}
                        onChange={(v) => setFormData({ ...formData, manager: v })}
                        placeholder="Select manager..."
                        personnel={allPersonnel
                            .filter((p) => p.id !== personId)
                            .map((p) => ({
                                id: p.id,
                                name: p.name,
                                title: p.title || null,
                                department: p.department,
                            }))}
                    />
                </div>

                {/* Bio */}
                <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="A brief description of this person..."
                        rows={4}
                    />
                </div>
            </div>
        </SecurePanelWrapper>
    );
}

// ============================================================================
// Security Tab
// ============================================================================

function SecurityTab({
    formData,
    setFormData,
}: {
    formData: FormData;
    setFormData: (data: FormData) => void;
}) {
    // State for adding new tenant clearance
    const [newTenantLevel, setNewTenantLevel] = useState<SensitivityLevel>("low");
    const [newTenant, setNewTenant] = useState<string>("");

    // Get sensitivity order for filtering available levels
    const SENSITIVITY_ORDER: SensitivityLevel[] = ["public", "low", "moderate", "high"];
    const maxLevelIndex = SENSITIVITY_ORDER.indexOf(formData.clearanceLevel);
    const availableLevels = SENSITIVITY_LEVELS.filter(
        (lvl) => SENSITIVITY_ORDER.indexOf(lvl.value) <= maxLevelIndex
    );

    // Add tenant clearance to list
    const addCompartmentClearance = () => {
        if (!newTenant) return;
        const entry = `${newTenantLevel}:${newTenant}`;
        // Don't add duplicates
        if (formData.compartmentClearances.includes(entry)) return;
        setFormData({
            ...formData,
            compartmentClearances: [...formData.compartmentClearances, entry],
        });
        setNewTenant("");
    };

    // Remove tenant clearance from list
    const removeCompartmentClearance = (entry: string) => {
        setFormData({
            ...formData,
            compartmentClearances: formData.compartmentClearances.filter((tc) => tc !== entry),
        });
    };

    // Toggle role
    const toggleRole = (role: string) => {
        const current = formData.accessRoles;
        if (current.includes(role)) {
            setFormData({
                ...formData,
                accessRoles: current.filter((r) => r !== role),
            });
        } else {
            setFormData({
                ...formData,
                accessRoles: [...current, role],
            });
        }
    };

    // Get color classes for sensitivity level
    const getLevelColors = (level: SensitivityLevel) => {
        switch (level) {
            case "public":
                return "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
            case "low":
                return "bg-sky-500/20 border-sky-500/50 text-sky-400";
            case "moderate":
                return "bg-amber-500/20 border-amber-500/50 text-amber-400";
            case "high":
                return "bg-red-500/20 border-red-500/50 text-red-400";
        }
    };

    return (
        <SecurePanelWrapper level="low" className="border rounded-lg overflow-hidden">
            <div className="space-y-8 p-6">
                {/* Maximum Clearance Level */}
                <div>
                    <Label className="text-base font-medium mb-3 block">Maximum Clearance Level</Label>
                    <p className="text-sm text-zinc-500 mb-4">
                        The maximum sensitivity level this person can access
                    </p>
                    <div className="flex gap-2">
                        {SENSITIVITY_LEVELS.map(({ value, label }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setFormData({ ...formData, clearanceLevel: value })}
                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.clearanceLevel === value
                                    ? getLevelColors(value)
                                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tenant Clearances */}
                <div>
                    <Label className="text-base font-medium mb-3 block">Tenant Clearances</Label>
                    <p className="text-sm text-zinc-500 mb-4">
                        Add access to specific tenants at a specific sensitivity level
                    </p>

                    {/* Add new tenant clearance */}
                    <div className="flex gap-2 mb-4">
                        <Select value={newTenantLevel} onValueChange={(v) => setNewTenantLevel(v as SensitivityLevel)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableLevels.map(({ value, label }) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex gap-1">
                            {TENANTS.map((tenant) => (
                                <button
                                    key={tenant}
                                    type="button"
                                    onClick={() => setNewTenant(tenant)}
                                    className={`w-10 h-10 rounded-lg border text-lg flex items-center justify-center transition-colors ${newTenant === tenant
                                        ? "bg-orange-500/20 border-orange-500/50"
                                        : "border-zinc-700 hover:border-zinc-600"
                                        }`}
                                >
                                    {tenant}
                                </button>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={addCompartmentClearance}
                            disabled={!newTenant}
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>

                    {/* List of tenant clearances */}
                    {formData.compartmentClearances.length > 0 ? (
                        <div className="border border-zinc-700 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-zinc-800/50">
                                    <tr>
                                        <th className="text-left px-4 py-2 font-medium text-zinc-400">Level</th>
                                        <th className="text-left px-4 py-2 font-medium text-zinc-400">Tenant</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.compartmentClearances.map((tc, index) => {
                                        const [level, tenant] = tc.split(":");
                                        return (
                                            <tr key={index} className="border-t border-zinc-700">
                                                <td className="px-4 py-2">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getLevelColors(level as SensitivityLevel)}`}>
                                                        {level.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-lg">{tenant}</td>
                                                <td className="px-2 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCompartmentClearance(tc)}
                                                        className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-6 border border-dashed border-zinc-700 rounded-lg text-zinc-500 text-sm">
                            No tenant clearances assigned
                        </div>
                    )}
                </div>

                {/* Access Roles */}
                <div>
                    <Label className="text-base font-medium mb-3 block">Access Roles</Label>
                    <p className="text-sm text-zinc-500 mb-4">
                        Assign roles that determine what actions this person can perform
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {DEFAULT_ROLES.map((role) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => toggleRole(role)}
                                className={`px-3 py-1.5 rounded-md border text-sm capitalize transition-colors ${formData.accessRoles.includes(role)
                                    ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                    }`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </SecurePanelWrapper>
    );
}
