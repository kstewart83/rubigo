"use client";

/**
 * Teams Page Content
 * 
 * File-manager style navigation for hierarchical teams with 50/50 split editor.
 */

import { useState, useTransition, useEffect, useRef, useCallback, useLayoutEffect } from "react";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SecureTableWrapper, ClassificationCell } from "@/components/ui/secure-table-wrapper";
import { SecurityLabelPicker } from "@/components/ui/security-label-picker";
import { usePersona } from "@/contexts/persona-context";
import {
    createTeam,
    updateTeam,
    deleteTeam,
    setTeamMembers,
    setTeamOwners,
    addChildTeam,
    removeChildTeam,
    getTeamsForPersonnel,
    type TeamWithMembers
} from "@/lib/teams-actions";
import {
    UsersRound,
    Plus,
    Pencil,
    Trash2,
    ChevronRight,
    Home,
    X,
    User,
    Crown,
    Search,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Person } from "@/types/personnel";
import type { AccessControlObject } from "@/lib/access-control/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Props {
    teams: TeamWithMembers[];
    allPersonnel: Person[];
}

// Pagination constants
const PAGE_SIZE_OPTIONS = ["auto", 10, 25, 50, 100] as const;
const ROW_HEIGHT = 49; // Approximate height of a table row in pixels
const TABLE_OVERHEAD = 160; // Header + breadcrumbs + classification banners + pagination footer

// Breadcrumb item type
interface BreadcrumbItem {
    id: string | null;  // null = root
    name: string;
}

export function TeamsPageContent({ teams, allPersonnel }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentPersona } = usePersona();
    const [isPending, startTransition] = useTransition();

    // Pagination state
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [autoPageSize, setAutoPageSize] = useState(25);
    const [isAutoMode, setIsAutoMode] = useState(true);

    // Calculate optimal page size based on container height
    const calculateAutoPageSize = useCallback(() => {
        if (!containerRef.current) return 25;
        const containerHeight = containerRef.current.clientHeight;
        const availableHeight = containerHeight - TABLE_OVERHEAD;
        const fittingRows = Math.floor(availableHeight / ROW_HEIGHT);
        return Math.max(5, fittingRows);
    }, []);

    // Setup ResizeObserver for auto mode
    const lastCalculatedSize = useRef<number>(pageSize);

    useLayoutEffect(() => {
        if (!isAutoMode || !containerRef.current) return;

        const updatePageSize = () => {
            const newSize = calculateAutoPageSize();
            if (newSize !== lastCalculatedSize.current && newSize > 0) {
                lastCalculatedSize.current = newSize;
                setAutoPageSize(newSize);
                setPageSize(newSize);
                setCurrentPage(1); // Reset to first page on resize
            }
        };

        const observer = new ResizeObserver(() => {
            updatePageSize();
        });

        observer.observe(containerRef.current);
        // Initial calculation (delayed to let layout settle)
        const timer = setTimeout(updatePageSize, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timer);
        };
    }, [isAutoMode, calculateAutoPageSize]);

    // Handle page size change
    const handlePageSizeChange = (value: string) => {
        if (value === "auto") {
            setIsAutoMode(true);
            const autoSize = calculateAutoPageSize();
            setPageSize(autoSize);
            setAutoPageSize(autoSize);
        } else {
            setIsAutoMode(false);
            setPageSize(Number(value));
        }
        setCurrentPage(1);
    };

    // Navigation state
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
        { id: null, name: "All Teams" }
    ]);
    const currentTeamId = breadcrumbs[breadcrumbs.length - 1].id;

    // Read team from URL on initial load
    useEffect(() => {
        const teamIdFromUrl = searchParams.get("team");
        if (teamIdFromUrl && breadcrumbs.length === 1) { // Only on initial load
            const targetTeam = teams.find(t => t.id === teamIdFromUrl);
            if (targetTeam) {
                // Build breadcrumb path by finding parent chain
                // A team's parent is the team that has it as a child
                const findParentChain = (teamId: string): BreadcrumbItem[] => {
                    const team = teams.find(t => t.id === teamId);
                    if (!team) return [];

                    // Find parent team (one that has this team as child)
                    const parentTeam = teams.find(t =>
                        t.childTeams.some(ct => ct.childTeamId === teamId)
                    );

                    if (parentTeam) {
                        return [...findParentChain(parentTeam.id), { id: team.id, name: team.name }];
                    }

                    return [{ id: team.id, name: team.name }];
                };

                const path = findParentChain(targetTeam.id);
                setBreadcrumbs([
                    { id: null, name: "All Teams" },
                    ...path
                ]);
            }
        }
    }, [searchParams, teams, breadcrumbs.length]);

    // Editor panel state
    const [showEditor, setShowEditor] = useState(false);
    const [editingTeam, setEditingTeam] = useState<TeamWithMembers | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        aco: { sensitivity: "low" } as AccessControlObject,
    });
    const [formError, setFormError] = useState("");

    // Member management  
    const [memberSearch, setMemberSearch] = useState("");
    const [teamSearch, setTeamSearch] = useState("");
    const [memberHighlight, setMemberHighlight] = useState(0);
    const [teamHighlight, setTeamHighlight] = useState(0);
    const [selectedMembers, setSelectedMembers] = useState<Array<{ id: string; name: string; photo?: string | null }>>([]);
    const [selectedChildTeams, setSelectedChildTeams] = useState<Array<{ id: string; name: string }>>([]);

    // Delete confirmation
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<TeamWithMembers | null>(null);

    // Editor tabs
    const [activeTab, setActiveTab] = useState<"personnel" | "teams" | "owners">("personnel");

    // Owners state
    const [ownerSearch, setOwnerSearch] = useState("");
    const [ownerHighlight, setOwnerHighlight] = useState(0);
    const [selectedOwners, setSelectedOwners] = useState<Array<{ id: string; name: string }>>([]);

    // Person details sheet state
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [personTeams, setPersonTeams] = useState<Array<{ id: string; name: string; description: string | null; isOwner: boolean }>>([]);

    // Fetch teams when person is selected
    useEffect(() => {
        if (selectedPerson) {
            getTeamsForPersonnel(selectedPerson.id).then(result => {
                if (result.success && result.data) {
                    setPersonTeams(result.data);
                } else {
                    setPersonTeams([]);
                }
            });
        } else {
            setPersonTeams([]);
        }
    }, [selectedPerson]);

    const isAdmin = currentPersona?.isGlobalAdmin ?? false;

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const isSearching = searchQuery.trim().length > 0;

    // Helper: Get parent team (the team that has this team as a child)
    const getParentTeam = (teamId: string): TeamWithMembers | null => {
        return teams.find(t => t.childTeams.some(ct => ct.childTeamId === teamId)) || null;
    };

    // Helper: Get full hierarchy path as string
    const getHierarchyPath = (teamId: string): string => {
        const buildPath = (id: string): string[] => {
            const team = teams.find(t => t.id === id);
            if (!team) return [];
            const parent = getParentTeam(id);
            if (parent) {
                return [...buildPath(parent.id), team.name];
            }
            return [team.name];
        };
        return ["All Teams", ...buildPath(teamId)].join(" > ");
    };

    // Get current view items
    const getCurrentTeam = () => teams.find(t => t.id === currentTeamId);
    const currentTeam = getCurrentTeam();

    // Get items to display - depends on search mode or hierarchy mode
    const allFilteredTeams = isSearching
        ? teams.filter(t =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : currentTeamId
            ? teams.filter(t => currentTeam?.childTeams.some(ct => ct.childTeamId === t.id))
            : teams.filter(t => !teams.some(parent => parent.childTeams.some(ct => ct.childTeamId === t.id)));

    // Pagination
    const totalTeams = allFilteredTeams.length;
    const totalPages = Math.ceil(totalTeams / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalTeams);
    const paginatedTeams = allFilteredTeams.slice(startIndex, endIndex);

    // Reset page when navigating or searching
    useEffect(() => {
        setCurrentPage(1);
    }, [currentTeamId, searchQuery]);

    const displayedPersonnel = isSearching
        ? [] // Don't show personnel in search mode
        : currentTeamId && currentTeam
            ? allPersonnel.filter(p => currentTeam.members.some(m => m.personnelId === p.id))
            : [];

    // Navigation
    const navigateToTeam = (team: TeamWithMembers) => {
        setBreadcrumbs([...breadcrumbs, { id: team.id, name: team.name }]);
    };

    const navigateToBreadcrumb = (index: number) => {
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    };

    // Editor handlers
    const openCreateEditor = () => {
        setIsCreating(true);
        setEditingTeam(null);
        setFormData({ name: "", description: "", aco: { sensitivity: "low" } });
        setSelectedMembers([]);
        setSelectedChildTeams([]);
        // Auto-add creator as owner
        if (currentPersona) {
            setSelectedOwners([{ id: currentPersona.id, name: currentPersona.name }]);
        } else {
            setSelectedOwners([]);
        }
        setFormError("");
        setActiveTab("personnel");
        setShowEditor(true);
    };

    const openEditEditor = (team: TeamWithMembers) => {
        setIsCreating(false);
        setEditingTeam(team);
        const aco = team.aco ? JSON.parse(team.aco) : { sensitivity: "low" };
        setFormData({ name: team.name, description: team.description || "", aco });
        setSelectedMembers(team.members.map(m => ({
            id: m.personnelId,
            name: m.personnelName,
            photo: m.personnelPhoto,
        })));
        setSelectedChildTeams(team.childTeams.map(ct => ({
            id: ct.childTeamId,
            name: ct.childTeamName,
        })));
        setSelectedOwners(team.owners.map(o => ({
            id: o.personnelId,
            name: o.personnelName,
        })));
        setFormError("");
        setActiveTab("personnel");
        setShowEditor(true);
    };

    const closeEditor = () => {
        setShowEditor(false);
        setEditingTeam(null);
        setIsCreating(false);
        setOwnerSearch("");
        setOwnerHighlight(0);
    };

    const handleSave = async () => {
        if (!currentPersona) return;
        setFormError("");

        if (isCreating) {
            const result = await createTeam({
                name: formData.name,
                description: formData.description || undefined,
                createdBy: currentPersona.id,
                memberIds: selectedMembers.map(m => m.id),
                aco: JSON.stringify(formData.aco),
            });

            if (result.success && result.data) {
                // Add child teams
                for (const ct of selectedChildTeams) {
                    await addChildTeam(result.data.id, ct.id);
                }
                // Set owners (creator is auto-added, but we may have more)
                await setTeamOwners(result.data.id, selectedOwners.map(o => o.id));
                closeEditor();
                router.refresh();
            } else {
                setFormError(result.error || "Failed to create team");
            }
        } else if (editingTeam) {
            const result = await updateTeam(editingTeam.id, {
                name: formData.name,
                description: formData.description || undefined,
                aco: JSON.stringify(formData.aco),
            });

            if (result.success) {
                await setTeamMembers(editingTeam.id, selectedMembers.map(m => m.id));

                // Update child teams
                const currentChildIds = new Set(editingTeam.childTeams.map(ct => ct.childTeamId));
                const newChildIds = new Set(selectedChildTeams.map(ct => ct.id));

                for (const ct of editingTeam.childTeams) {
                    if (!newChildIds.has(ct.childTeamId)) {
                        await removeChildTeam(editingTeam.id, ct.childTeamId);
                    }
                }
                for (const ct of selectedChildTeams) {
                    if (!currentChildIds.has(ct.id)) {
                        const addResult = await addChildTeam(editingTeam.id, ct.id);
                        if (!addResult.success) {
                            setFormError(addResult.error || "Failed to add child team");
                            return;
                        }
                    }
                }

                // Update owners
                await setTeamOwners(editingTeam.id, selectedOwners.map(o => o.id));

                closeEditor();
                router.refresh();
            } else {
                setFormError(result.error || "Failed to update team");
            }
        }
    };

    const handleDelete = async () => {
        if (!teamToDelete) return;
        const result = await deleteTeam(teamToDelete.id);
        if (result.success) {
            setShowDeleteDialog(false);
            setTeamToDelete(null);
            router.refresh();
        }
    };

    // Search helpers
    const filteredPersonnel = memberSearch.length >= 2
        ? allPersonnel
            .filter(p =>
                p.name.toLowerCase().includes(memberSearch.toLowerCase()) &&
                !selectedMembers.some(m => m.id === p.id)
            )
            .slice(0, 10)
        : [];

    const filteredTeams = teamSearch.length >= 2
        ? teams
            .filter(t =>
                t.name.toLowerCase().includes(teamSearch.toLowerCase()) &&
                !selectedChildTeams.some(ct => ct.id === t.id) &&
                t.id !== editingTeam?.id
            )
            .slice(0, 10)
        : [];

    // Get sensitivity for SecureTableWrapper
    const getSensitivity = (item: unknown) => {
        const obj = item as { aco?: string };
        if (obj.aco && typeof obj.aco === 'string') {
            try {
                const parsed = JSON.parse(obj.aco);
                return parsed.sensitivity || 'low';
            } catch {
                return 'low';
            }
        }
        return 'low';
    };

    // Get tenants for SecureTableWrapper
    const getTenants = (item: unknown) => {
        const obj = item as { aco?: string };
        if (obj.aco && typeof obj.aco === 'string') {
            try {
                const parsed = JSON.parse(obj.aco);
                return parsed.tenants || [];
            } catch {
                return [];
            }
        }
        return [];
    };

    return (
        <div ref={containerRef} className="flex flex-col flex-1 min-h-0 overflow-auto">
            {/* Header with breadcrumbs and search */}
            <div className="flex items-center justify-between mb-4 gap-4">
                {/* Breadcrumbs or Search Results indicator */}
                <div className="flex items-center gap-2 text-sm flex-1">
                    {isSearching ? (
                        <span className="font-medium text-muted-foreground">
                            Search Results ({allFilteredTeams.length} team{allFilteredTeams.length !== 1 ? 's' : ''})
                        </span>
                    ) : (
                        breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id ?? "root"} className="flex items-center gap-2">
                                {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                <button
                                    onClick={() => navigateToBreadcrumb(index)}
                                    className={`flex items-center gap-1 hover:text-primary ${index === breadcrumbs.length - 1 ? 'font-medium' : 'text-muted-foreground'
                                        }`}
                                >
                                    {index === 0 && <Home className="h-4 w-4" />}
                                    {crumb.name}
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Search input */}
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-8"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Edit/Delete buttons when viewing a team user can manage (not in search mode) */}
                    {!isSearching && currentTeam && (isAdmin || currentTeam.owners.some(o => o.personnelId === currentPersona?.id)) && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => openEditEditor(currentTeam)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                    setTeamToDelete(currentTeam);
                                    setShowDeleteDialog(true);
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </>
                    )}
                    <Button onClick={openCreateEditor} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        New Team
                    </Button>
                </div>
            </div>

            {/* Owners badge row - only when viewing a team */}
            {currentTeam && currentTeam.owners.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Owners:</span>
                    <div className="flex flex-wrap gap-2">
                        {currentTeam.owners.map(owner => (
                            <span key={owner.personnelId} className="text-sm text-amber-600 dark:text-amber-300">
                                {owner.personnelName}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* File-manager table */}
            <SecureTableWrapper
                items={[...paginatedTeams, ...displayedPersonnel]}
                getSensitivity={getSensitivity}
                getTenants={getTenants}
                className="border rounded-lg"
            >
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">Classification</TableHead>
                            <TableHead className="w-12"></TableHead>
                            <TableHead>Name</TableHead>
                            {isSearching && <TableHead>Parent</TableHead>}
                            <TableHead className="min-w-[150px]">Description</TableHead>
                            <TableHead className="text-center">Owners</TableHead>
                            <TableHead className="text-center">Personnel</TableHead>
                            <TableHead className="text-center">Teams</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedTeams.length === 0 && displayedPersonnel.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isSearching ? 9 : 8} className="text-center py-8 text-muted-foreground">
                                    {isSearching ? "No teams match your search" : currentTeamId ? "This team is empty" : "No teams created yet"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {/* Teams (folders) */}
                                {paginatedTeams.map((team) => {
                                    const teamAco = team.aco ? JSON.parse(team.aco) : { sensitivity: "low" };
                                    const parentTeam = getParentTeam(team.id);
                                    return (
                                        <TableRow
                                            key={team.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => {
                                                if (isSearching) {
                                                    // Clear search and navigate properly with full path
                                                    setSearchQuery("");
                                                    const findParentChain = (teamId: string): BreadcrumbItem[] => {
                                                        const t = teams.find(x => x.id === teamId);
                                                        if (!t) return [];
                                                        const parent = teams.find(x => x.childTeams.some(ct => ct.childTeamId === teamId));
                                                        if (parent) {
                                                            return [...findParentChain(parent.id), { id: t.id, name: t.name }];
                                                        }
                                                        return [{ id: t.id, name: t.name }];
                                                    };
                                                    const path = findParentChain(team.id);
                                                    setBreadcrumbs([{ id: null, name: "All Teams" }, ...path]);
                                                } else {
                                                    navigateToTeam(team);
                                                }
                                            }}
                                        >
                                            <TableCell>
                                                <ClassificationCell aco={teamAco} />
                                            </TableCell>
                                            <TableCell>
                                                <UsersRound className="h-5 w-5 text-primary" />
                                            </TableCell>
                                            <TableCell className="font-medium">{team.name}</TableCell>
                                            {isSearching && (
                                                <TableCell className="text-muted-foreground text-sm">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <span className="cursor-help hover:text-foreground">
                                                                    {parentTeam?.name || "—"}
                                                                </span>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">{getHierarchyPath(team.id)}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                            )}
                                            <TableCell className="text-muted-foreground text-sm whitespace-normal">
                                                {team.description || '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    {team.owners.length}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted">
                                                    {team.totalPersonnelCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted">
                                                    {team.childTeamCount}
                                                </span>
                                            </TableCell>
                                            {/* Show actions if admin or owner */}
                                            {(isAdmin || team.owners.some(o => o.personnelId === currentPersona?.id)) && (
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => openEditEditor(team)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => {
                                                                setTeamToDelete(team);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                            {/* Empty cell for non-owners/non-admins to maintain column alignment */}
                                            {!isAdmin && !team.owners.some(o => o.personnelId === currentPersona?.id) && (
                                                <TableCell></TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}

                                {/* Personnel (files) */}
                                {displayedPersonnel.map((person) => (
                                    <TableRow
                                        key={person.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => setSelectedPerson(person)}
                                    >
                                        <TableCell className="text-center text-muted-foreground text-xs">-</TableCell>
                                        <TableCell>
                                            {person.photo ? (
                                                <Image
                                                    src={person.photo}
                                                    alt={person.name}
                                                    width={20}
                                                    height={20}
                                                    className="rounded-full"
                                                />
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs">
                                                    {person.name.charAt(0)}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="flex items-center gap-1.5">
                                                {person.name}
                                                {currentTeam?.owners.some(o => o.personnelId === person.id) && (
                                                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell className="text-center">-</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </SecureTableWrapper>

            {/* Pagination footer */}
            {totalTeams > 0 && (
                <div className="flex items-center justify-between py-3 px-4 border-t bg-muted/30 rounded-b-lg -mt-px">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Rows per page:</span>
                            <Select
                                value={isAutoMode ? "auto" : String(pageSize)}
                                onValueChange={handlePageSizeChange}
                            >
                                <SelectTrigger className="w-20 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZE_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={String(option)}>
                                            {option === "auto" ? "Auto" : option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {totalTeams === 0
                                ? "No teams"
                                : `${startIndex + 1}-${endIndex} of ${totalTeams} teams`}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* 50/50 Editor Panel */}
            {showEditor && (
                <div className="h-1/2 border-t bg-background flex flex-col">
                    <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
                        <h3 className="font-semibold">
                            {isCreating ? "Create Team" : `Edit: ${editingTeam?.name}`}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={closeEditor}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto p-6">
                        <div className="grid grid-cols-2 gap-6 h-full">
                            {/* Left column: Basic info + Security */}
                            <div className="space-y-4">
                                {formError && (
                                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                                        {formError}
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="name">Team Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Engineering Team"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description..."
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <Label>Classification</Label>
                                    <SecurityLabelPicker
                                        value={formData.aco}
                                        onChange={(aco) => setFormData({ ...formData, aco })}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            {/* Right column: Members tabs */}
                            <div className="flex flex-col min-h-0">
                                {/* Tab buttons */}
                                <div className="flex border-b shrink-0">
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'personnel' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setActiveTab('personnel')}
                                    >
                                        Personnel ({selectedMembers.length})
                                    </button>
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'teams' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setActiveTab('teams')}
                                    >
                                        Teams ({selectedChildTeams.length})
                                    </button>
                                    <button
                                        className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'owners' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setActiveTab('owners')}
                                    >
                                        <span className="flex items-center justify-center gap-1">
                                            <Crown className="h-3 w-3" />
                                            Owners ({selectedOwners.length})
                                        </span>
                                    </button>
                                </div>

                                {/* Personnel tab content */}
                                {activeTab === 'personnel' && (
                                    <div className="flex flex-col flex-1 min-h-0 gap-2 pt-2">
                                        <div className="relative">
                                            <Input
                                                placeholder="Search personnel..."
                                                value={memberSearch}
                                                onChange={(e) => {
                                                    setMemberSearch(e.target.value);
                                                    setMemberHighlight(0);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (filteredPersonnel.length === 0) return;
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setMemberHighlight(prev => Math.min(prev + 1, filteredPersonnel.length - 1));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setMemberHighlight(prev => Math.max(prev - 1, 0));
                                                    } else if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const p = filteredPersonnel[memberHighlight];
                                                        setSelectedMembers([...selectedMembers, { id: p.id, name: p.name, photo: p.photo }]);
                                                        setMemberSearch("");
                                                        setMemberHighlight(0);
                                                    }
                                                }}
                                            />
                                            {filteredPersonnel.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                                    {filteredPersonnel.map((p, idx) => (
                                                        <button
                                                            key={p.id}
                                                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${idx === memberHighlight ? 'bg-accent' : 'hover:bg-accent'}`}
                                                            onClick={() => {
                                                                setSelectedMembers([...selectedMembers, { id: p.id, name: p.name, photo: p.photo }]);
                                                                setMemberSearch("");
                                                                setMemberHighlight(0);
                                                            }}
                                                            onMouseEnter={() => setMemberHighlight(idx)}
                                                        >
                                                            <User className="h-4 w-4" />
                                                            {p.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="border rounded flex-1 min-h-0 overflow-y-auto">
                                            {selectedMembers.length === 0 ? (
                                                <div className="p-3 text-sm text-muted-foreground text-center">No personnel added</div>
                                            ) : (
                                                selectedMembers.map((m) => (
                                                    <div key={m.id} className="flex items-center justify-between px-3 py-1.5 border-b last:border-b-0">
                                                        <span className="text-sm">{m.name}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedMembers(selectedMembers.filter(x => x.id !== m.id))}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Teams tab content */}
                                {activeTab === 'teams' && (
                                    <div className="flex flex-col flex-1 min-h-0 gap-2 pt-2">
                                        <div className="relative">
                                            <Input
                                                placeholder="Search teams..."
                                                value={teamSearch}
                                                onChange={(e) => {
                                                    setTeamSearch(e.target.value);
                                                    setTeamHighlight(0);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (filteredTeams.length === 0) return;
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setTeamHighlight(prev => Math.min(prev + 1, filteredTeams.length - 1));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setTeamHighlight(prev => Math.max(prev - 1, 0));
                                                    } else if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const t = filteredTeams[teamHighlight];
                                                        setSelectedChildTeams([...selectedChildTeams, { id: t.id, name: t.name }]);
                                                        setTeamSearch("");
                                                        setTeamHighlight(0);
                                                    }
                                                }}
                                            />
                                            {filteredTeams.length > 0 && (
                                                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                                    {filteredTeams.map((t, idx) => (
                                                        <button
                                                            key={t.id}
                                                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${idx === teamHighlight ? 'bg-accent' : 'hover:bg-accent'}`}
                                                            onClick={() => {
                                                                setSelectedChildTeams([...selectedChildTeams, { id: t.id, name: t.name }]);
                                                                setTeamSearch("");
                                                                setTeamHighlight(0);
                                                            }}
                                                            onMouseEnter={() => setTeamHighlight(idx)}
                                                        >
                                                            <UsersRound className="h-4 w-4" />
                                                            {t.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="border rounded flex-1 min-h-0 overflow-y-auto">
                                            {selectedChildTeams.length === 0 ? (
                                                <div className="p-3 text-sm text-muted-foreground text-center">No child teams added</div>
                                            ) : (
                                                selectedChildTeams.map((t) => (
                                                    <div key={t.id} className="flex items-center justify-between px-3 py-1.5 border-b last:border-b-0">
                                                        <span className="text-sm">{t.name}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedChildTeams(selectedChildTeams.filter(x => x.id !== t.id))}>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Owners tab content */}
                                {activeTab === 'owners' && (
                                    <div className="flex flex-col flex-1 min-h-0 gap-2 pt-2">
                                        <div className="relative">
                                            <Input
                                                placeholder="Search personnel..."
                                                value={ownerSearch}
                                                onChange={(e) => {
                                                    setOwnerSearch(e.target.value);
                                                    setOwnerHighlight(0);
                                                }}
                                                onKeyDown={(e) => {
                                                    const filtered = allPersonnel.filter(p =>
                                                        p.name.toLowerCase().includes(ownerSearch.toLowerCase()) &&
                                                        !selectedOwners.some(o => o.id === p.id)
                                                    );
                                                    if (filtered.length === 0) return;
                                                    if (e.key === 'ArrowDown') {
                                                        e.preventDefault();
                                                        setOwnerHighlight(prev => Math.min(prev + 1, filtered.length - 1));
                                                    } else if (e.key === 'ArrowUp') {
                                                        e.preventDefault();
                                                        setOwnerHighlight(prev => Math.max(prev - 1, 0));
                                                    } else if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const p = filtered[ownerHighlight];
                                                        setSelectedOwners([...selectedOwners, { id: p.id, name: p.name }]);
                                                        setOwnerSearch("");
                                                        setOwnerHighlight(0);
                                                    }
                                                }}
                                            />
                                            {ownerSearch && (() => {
                                                const filtered = allPersonnel.filter(p =>
                                                    p.name.toLowerCase().includes(ownerSearch.toLowerCase()) &&
                                                    !selectedOwners.some(o => o.id === p.id)
                                                );
                                                return filtered.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                                        {filtered.map((p, idx) => (
                                                            <button
                                                                key={p.id}
                                                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${idx === ownerHighlight ? 'bg-accent' : 'hover:bg-accent'}`}
                                                                onClick={() => {
                                                                    setSelectedOwners([...selectedOwners, { id: p.id, name: p.name }]);
                                                                    setOwnerSearch("");
                                                                    setOwnerHighlight(0);
                                                                }}
                                                                onMouseEnter={() => setOwnerHighlight(idx)}
                                                            >
                                                                <Crown className="h-4 w-4" />
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="border rounded flex-1 min-h-0 overflow-y-auto">
                                            {selectedOwners.length === 0 ? (
                                                <div className="p-3 text-sm text-destructive text-center">At least one owner is required</div>
                                            ) : (
                                                selectedOwners.map((o) => (
                                                    <div key={o.id} className="flex items-center justify-between px-3 py-1.5 border-b last:border-b-0">
                                                        <span className="text-sm flex items-center gap-2">
                                                            <Crown className="h-3 w-3 text-amber-500" />
                                                            {o.name}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => setSelectedOwners(selectedOwners.filter(x => x.id !== o.id))}
                                                            disabled={selectedOwners.length === 1}
                                                            title={selectedOwners.length === 1 ? "Cannot remove last owner" : "Remove owner"}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 px-6 py-3 border-t">
                        <Button variant="outline" onClick={closeEditor}>Cancel</Button>
                        <Button onClick={handleSave} disabled={!formData.name.trim() || selectedOwners.length === 0}>
                            {isCreating ? "Create" : "Save"}
                        </Button>
                    </div>
                </div>
            )
            }

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Team</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{teamToDelete?.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Person Details Sheet */}
            <Sheet open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
                <SheetContent>
                    {selectedPerson && (
                        <>
                            <SheetHeader>
                                <SheetTitle>{selectedPerson.name}</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 space-y-6 px-4 overflow-y-auto">
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

                                    {/* Teams section */}
                                    <div className="pt-2 border-t">
                                        <div className="text-sm font-medium mb-2">Teams</div>
                                        {personTeams.length === 0 ? (
                                            <div className="text-sm text-zinc-500">Not a member of any teams</div>
                                        ) : (
                                            <div className="space-y-1">
                                                {personTeams.map(team => (
                                                    <div
                                                        key={team.id}
                                                        className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedPerson(null);
                                                            router.push(`/personnel/teams?team=${team.id}`);
                                                        }}
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
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
