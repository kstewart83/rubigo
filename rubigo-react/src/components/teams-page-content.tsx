"use client";

/**
 * Teams Page Content
 * 
 * File-manager style navigation for hierarchical teams with 50/50 split editor.
 */

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAutoPagination } from "@/hooks/use-auto-pagination";
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
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
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
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SecureTableWrapper, ClassificationCell } from "@/components/ui/secure-table-wrapper";
import { SecurityLabelPicker } from "@/components/ui/security-label-picker";
import { usePersona } from "@/contexts/persona-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePagination } from "@/components/mobile-pagination";
import { TeamCard } from "@/components/team-card";
import { PersonCard } from "@/components/person-card";
import { ResponsivePersonnelDetail } from "@/components/responsive-personnel-detail";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { useActiveUsers } from "@/hooks/use-presence";
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
    const isMobile = useIsMobile();

    // Auto-pagination hook
    const {
        containerRef,
        tableBodyRef,
        headerRef,
        paginationRef,
        currentPage,
        setCurrentPage,
        pageSize,
        isAutoMode,
        handlePageSizeChange,
        pageSizeOptions,
    } = useAutoPagination({ additionalBuffer: 70 });

    // Navigation state
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
        { id: null, name: "All Teams" }
    ]);
    const currentTeamId = breadcrumbs[breadcrumbs.length - 1].id;

    // Track which URL team param we've already processed to avoid re-navigation
    const lastProcessedUrlTeam = useRef<string | null>(null);

    // Read team from URL - only navigate if URL param changed
    useEffect(() => {
        const teamIdFromUrl = searchParams.get("team");

        // Only navigate if:
        // 1. There's a team in the URL
        // 2. We haven't already processed this exact team param
        if (teamIdFromUrl && teamIdFromUrl !== lastProcessedUrlTeam.current) {
            const targetTeam = teams.find(t => t.id === teamIdFromUrl);
            if (targetTeam) {
                lastProcessedUrlTeam.current = teamIdFromUrl;

                // Build breadcrumb path by finding parent chain
                const findParentChain = (teamId: string): BreadcrumbItem[] => {
                    const team = teams.find(t => t.id === teamId);
                    if (!team) return [];

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
    }, [searchParams, teams]);

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

    // Track active users for presence indicators
    const { users: activeUsers } = useActiveUsers();
    const presenceMap = useMemo(() => {
        const map = new Map<string, "online" | "away" | "offline">();
        for (const u of activeUsers) {
            map.set(u.personnelId, u.status);
        }
        return map;
    }, [activeUsers]);

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

    // Get team members (when inside a team, not searching)
    const displayedPersonnel = isSearching
        ? [] // Don't show personnel in search mode
        : currentTeamId && currentTeam
            ? allPersonnel.filter(p => currentTeam.members.some(m => m.personnelId === p.id))
            : [];

    // Combined items: teams first, then members (for mobile pagination)
    type CombinedItem = { type: 'team'; data: TeamWithMembers } | { type: 'person'; data: Person };
    const allCombinedItems: CombinedItem[] = [
        ...allFilteredTeams.map(t => ({ type: 'team' as const, data: t })),
        ...displayedPersonnel.map(p => ({ type: 'person' as const, data: p })),
    ];

    // Pagination - now over combined items
    const totalItems = allCombinedItems.length;
    const totalTeams = allFilteredTeams.length;
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedItems = allCombinedItems.slice(startIndex, endIndex);

    // Separate paginated items by type for rendering
    const paginatedTeams = paginatedItems.filter((item): item is CombinedItem & { type: 'team' } => item.type === 'team').map(i => i.data);
    const paginatedPersonnel = paginatedItems.filter((item): item is CombinedItem & { type: 'person' } => item.type === 'person').map(i => i.data);

    // Calculate range for section headers (e.g., "Teams (1-8 of 8)")
    const totalPersonnel = displayedPersonnel.length;

    // Teams range: where in the teams list does this page start/end?
    const teamsStartOnPage = startIndex < totalTeams ? startIndex + 1 : 0;
    const teamsEndOnPage = startIndex < totalTeams ? Math.min(endIndex, totalTeams) : 0;

    // Members range: where in the members list does this page start/end?
    const membersStartOnPage = startIndex >= totalTeams
        ? startIndex - totalTeams + 1
        : (endIndex > totalTeams ? 1 : 0);
    const membersEndOnPage = endIndex > totalTeams
        ? endIndex - totalTeams
        : 0;

    // Reset page when navigating or searching
    useEffect(() => {
        setCurrentPage(1);
    }, [currentTeamId, searchQuery, setCurrentPage]);

    // Navigation - syncs URL with breadcrumbs
    const navigateToTeam = (team: TeamWithMembers) => {
        const newBreadcrumbs = [...breadcrumbs, { id: team.id, name: team.name }];
        setBreadcrumbs(newBreadcrumbs);
        // Update URL to reflect new team
        lastProcessedUrlTeam.current = team.id;
        router.replace(`/personnel/teams?team=${team.id}`, { scroll: false });
    };

    const navigateToBreadcrumb = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        // Update URL - if at root, remove team param; otherwise set to selected team
        const newTeamId = newBreadcrumbs[newBreadcrumbs.length - 1].id;
        lastProcessedUrlTeam.current = newTeamId;
        if (newTeamId) {
            router.replace(`/personnel/teams?team=${newTeamId}`, { scroll: false });
        } else {
            router.replace('/personnel/teams', { scroll: false });
        }
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
        const obj = item as { aco?: string; clearanceLevel?: string };
        // Try aco field first (teams)
        if (obj.aco && typeof obj.aco === 'string') {
            try {
                const parsed = JSON.parse(obj.aco);
                return parsed.sensitivity || 'low';
            } catch {
                return 'low';
            }
        }
        // Fall back to clearanceLevel for personnel
        if (obj.clearanceLevel) {
            // Map clearance levels to sensitivities
            const levelMap: Record<string, string> = {
                public: 'low',
                low: 'low',
                moderate: 'medium',
                high: 'high',
            };
            return levelMap[obj.clearanceLevel] || 'low';
        }
        return 'low';
    };

    // Get tenants for SecureTableWrapper
    const getTenants = (item: unknown) => {
        const obj = item as { aco?: string };
        if (obj.aco && typeof obj.aco === 'string') {
            try {
                const parsed = JSON.parse(obj.aco);
                return parsed.compartments || [];
            } catch {
                return [];
            }
        }
        return [];
    };

    return (
        <div ref={containerRef} className="flex flex-col flex-1 min-h-0 overflow-auto max-w-[1600px] mx-auto w-full">
            {/* Header with breadcrumbs and search */}
            <div ref={headerRef} className={cn(
                "mb-4",
                isMobile ? "flex flex-col gap-3" : "flex items-center justify-between gap-4"
            )}>
                {/* Row 1: Breadcrumbs (and actions on desktop) */}
                <div className={cn(
                    "flex items-center gap-2",
                    isMobile ? "flex-wrap" : "flex-1"
                )}>
                    {/* Breadcrumbs or Search Results indicator */}
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                        {isSearching ? (
                            <span className="font-medium text-muted-foreground">
                                Search Results ({allFilteredTeams.length} team{allFilteredTeams.length !== 1 ? 's' : ''})
                            </span>
                        ) : (
                            breadcrumbs.map((crumb, index) => (
                                <div key={crumb.id ?? "root"} className="flex items-center gap-2">
                                    {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
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

                    {/* Desktop: Actions inline with breadcrumbs */}
                    {!isMobile && (
                        <div className="flex items-center gap-2 ml-auto">
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
                    )}
                </div>

                {/* Row 2: Search (full width on mobile) + New button */}
                <div className={cn(
                    "flex items-center gap-2",
                    isMobile ? "w-full" : "w-64"
                )}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                        <SearchInput
                            placeholder="Search teams..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            inputClassName="pl-9"
                            className="w-full"
                        />
                    </div>

                    {/* Mobile: Icon-only New Team button */}
                    {isMobile && (
                        <Button onClick={openCreateEditor} size="icon" className="shrink-0">
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Owners badge row - only when viewing a team */}
            {currentTeam && currentTeam.owners.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 my-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
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

            {/* Mobile: Card grid with MobilePagination */}
            {isMobile ? (
                <SecureTableWrapper
                    items={[...paginatedTeams, ...paginatedPersonnel]}
                    getSensitivity={getSensitivity}
                    getTenants={getTenants}
                    className="border rounded-lg"
                >
                    {/* Top Pagination */}
                    <MobilePagination
                        page={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => handlePageSizeChange(String(size))}
                        isPending={isPending}
                        showCount={true}
                        showPageSizeSelect={true}
                        total={totalItems}
                        startIndex={startIndex + 1}
                        endIndex={endIndex}
                    />

                    {/* Teams section */}
                    {paginatedTeams.length > 0 && (
                        <div className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                            Teams ({teamsStartOnPage}-{teamsEndOnPage} of {totalTeams})
                        </div>
                    )}

                    {/* Team cards grid */}
                    <div className="grid grid-cols-1 gap-3 p-3 pt-0">
                        {paginatedTeams.length === 0 && paginatedPersonnel.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                {isSearching ? "No teams match your search" : currentTeamId ? "This team is empty" : "No teams created yet"}
                            </div>
                        ) : paginatedTeams.length > 0 ? (
                            paginatedTeams.map((team) => {
                                const teamAco = team.aco ? JSON.parse(team.aco) : { sensitivity: "low" };
                                return (
                                    <TeamCard
                                        key={team.id}
                                        id={team.id}
                                        name={team.name}
                                        description={team.description}
                                        aco={teamAco}
                                        ownerCount={team.owners.length}
                                        memberCount={team.totalPersonnelCount}
                                        childTeamCount={team.childTeamCount}
                                        onClick={() => {
                                            if (isSearching) {
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
                                                lastProcessedUrlTeam.current = team.id;
                                                router.replace(`/personnel/teams?team=${team.id}`, { scroll: false });
                                            } else {
                                                navigateToTeam(team);
                                            }
                                        }}
                                    />
                                );
                            })
                        ) : null}
                    </div>

                    {/* Team Members section */}
                    {paginatedPersonnel.length > 0 && (
                        <>
                            <div className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground border-t">
                                Team Members ({membersStartOnPage}-{membersEndOnPage} of {totalPersonnel})
                            </div>
                            <div className="grid grid-cols-1 gap-3 p-3 pt-0">
                                {paginatedPersonnel.map((person) => {
                                    // Build aco from clearanceLevel and compartmentClearances
                                    type SLevel = 'public' | 'low' | 'moderate' | 'high';
                                    const levelToSensitivity: Record<string, SLevel> = {
                                        public: 'public',
                                        low: 'low',
                                        moderate: 'moderate',
                                        high: 'high',
                                    };
                                    // Parse compartmentClearances if available
                                    let tenants: string[] = [];
                                    if (person.compartmentClearances) {
                                        try {
                                            tenants = JSON.parse(person.compartmentClearances);
                                        } catch {
                                            tenants = [];
                                        }
                                    }
                                    const personAco: { sensitivity: SLevel; tenants?: string[] } = {
                                        sensitivity: levelToSensitivity[person.clearanceLevel || 'low'] || 'low',
                                        tenants,
                                    };
                                    return (
                                        <PersonCard
                                            key={person.id}
                                            id={person.id}
                                            name={person.name}
                                            email={person.email ?? null}
                                            title={person.title ?? null}
                                            department={person.department ?? null}
                                            photo={person.photo ?? null}
                                            aco={personAco}
                                            onClick={() => setSelectedPerson(person)}
                                            presenceStatus={presenceMap.get(person.id)}
                                        />
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Bottom Pagination */}
                    <MobilePagination
                        page={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => handlePageSizeChange(String(size))}
                        isPending={isPending}
                        showCount={true}
                        showPageSizeSelect={true}
                        total={totalItems}
                        startIndex={startIndex + 1}
                        endIndex={endIndex}
                    />
                </SecureTableWrapper>
            ) : (
                /* Desktop: File-manager table */
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
                        <TableBody ref={tableBodyRef}>
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
                                                        // Sync URL
                                                        lastProcessedUrlTeam.current = team.id;
                                                        router.replace(`/personnel/teams?team=${team.id}`, { scroll: false });
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
                                                <PersonAvatar
                                                    photo={person.photo}
                                                    name={person.name}
                                                    size="xs"
                                                    showPresence
                                                    presenceStatus={presenceMap.get(person.id)}
                                                />
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
            )}

            {/* Pagination footer - Desktop only */}
            {totalTeams > 0 && (
                <div ref={paginationRef} className="hidden md:flex items-center justify-between py-3 px-4 border-t bg-muted/30 rounded-b-lg -mt-px">
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
                                    {pageSizeOptions.map((option) => (
                                        <SelectItem key={String(option)} value={String(option)}>
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

            {/* Team Editor - Drawer on mobile, inline panel on desktop */}
            {isMobile ? (
                <Drawer open={showEditor} onOpenChange={(open) => !open && closeEditor()}>
                    <DrawerContent className="max-h-[90vh]">
                        <DrawerHeader className="border-b">
                            <DrawerTitle>
                                {isCreating ? "Create Team" : `Edit: ${editingTeam?.name}`}
                            </DrawerTitle>
                        </DrawerHeader>
                        <div className="flex-1 overflow-auto p-4 space-y-4">
                            {formError && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                                    {formError}
                                </div>
                            )}
                            <div>
                                <Label htmlFor="name-mobile">Team Name</Label>
                                <Input
                                    id="name-mobile"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Engineering Team"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description-mobile">Description</Label>
                                <Textarea
                                    id="description-mobile"
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

                            {/* Tabs for Personnel/Teams/Owners on mobile */}
                            <div className="flex border-b">
                                <button
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'personnel' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                                    onClick={() => setActiveTab('personnel')}
                                >
                                    Personnel ({selectedMembers.length})
                                </button>
                                <button
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'teams' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                                    onClick={() => setActiveTab('teams')}
                                >
                                    Teams ({selectedChildTeams.length})
                                </button>
                                <button
                                    className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'owners' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                                    onClick={() => setActiveTab('owners')}
                                >
                                    <Crown className="h-3 w-3 inline mr-1" />
                                    ({selectedOwners.length})
                                </button>
                            </div>

                            {/* Tab content - simplified for mobile */}
                            {activeTab === 'personnel' && (
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Search personnel..."
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                    />
                                    {filteredPersonnel.length > 0 && (
                                        <div className="border rounded-lg max-h-32 overflow-y-auto">
                                            {filteredPersonnel.map((p) => (
                                                <button
                                                    key={p.id}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                                                    onClick={() => {
                                                        setSelectedMembers([...selectedMembers, { id: p.id, name: p.name, photo: p.photo }]);
                                                        setMemberSearch("");
                                                    }}
                                                >
                                                    <User className="h-4 w-4" />
                                                    {p.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="border rounded max-h-40 overflow-y-auto">
                                        {selectedMembers.length === 0 ? (
                                            <div className="p-3 text-sm text-muted-foreground text-center">No personnel</div>
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

                            {activeTab === 'teams' && (
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Search teams..."
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                    />
                                    {filteredTeams.length > 0 && (
                                        <div className="border rounded-lg max-h-32 overflow-y-auto">
                                            {filteredTeams.map((t) => (
                                                <button
                                                    key={t.id}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                                                    onClick={() => {
                                                        setSelectedChildTeams([...selectedChildTeams, { id: t.id, name: t.name }]);
                                                        setTeamSearch("");
                                                    }}
                                                >
                                                    <UsersRound className="h-4 w-4" />
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="border rounded max-h-40 overflow-y-auto">
                                        {selectedChildTeams.length === 0 ? (
                                            <div className="p-3 text-sm text-muted-foreground text-center">No child teams</div>
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

                            {activeTab === 'owners' && (
                                <div className="space-y-2">
                                    <Input
                                        placeholder="Search personnel..."
                                        value={ownerSearch}
                                        onChange={(e) => setOwnerSearch(e.target.value)}
                                    />
                                    {ownerSearch && (() => {
                                        const filtered = allPersonnel.filter(p =>
                                            p.name.toLowerCase().includes(ownerSearch.toLowerCase()) &&
                                            !selectedOwners.some(o => o.id === p.id)
                                        );
                                        return filtered.length > 0 && (
                                            <div className="border rounded-lg max-h-32 overflow-y-auto">
                                                {filtered.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                                                        onClick={() => {
                                                            setSelectedOwners([...selectedOwners, { id: p.id, name: p.name }]);
                                                            setOwnerSearch("");
                                                        }}
                                                    >
                                                        <Crown className="h-4 w-4 text-amber-500" />
                                                        {p.name}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                    <div className="border rounded max-h-40 overflow-y-auto">
                                        {selectedOwners.length === 0 ? (
                                            <div className="p-3 text-sm text-destructive text-center">At least one owner required</div>
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
                        {/* Footer */}
                        <div className="flex justify-end gap-2 px-4 py-3 border-t">
                            <Button variant="outline" onClick={closeEditor}>Cancel</Button>
                            <Button onClick={handleSave} disabled={!formData.name.trim() || selectedOwners.length === 0}>
                                {isCreating ? "Create" : "Save"}
                            </Button>
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : showEditor && (
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

            {/* Responsive Person Details - Drawer on mobile, Sheet on desktop */}
            <ResponsivePersonnelDetail
                person={selectedPerson ? {
                    ...selectedPerson,
                    title: selectedPerson.title ?? null,
                    site: selectedPerson.site ?? null,
                    building: selectedPerson.building ?? null,
                    level: selectedPerson.level ?? null,
                    space: selectedPerson.space ?? null,
                    manager: selectedPerson.manager ?? null,
                    photo: selectedPerson.photo ?? null,
                    deskPhone: selectedPerson.deskPhone ?? null,
                    cellPhone: selectedPerson.cellPhone ?? null,
                    bio: selectedPerson.bio ?? null,
                    isGlobalAdmin: selectedPerson.isGlobalAdmin ?? false,
                } : null}
                open={!!selectedPerson}
                onOpenChange={(open) => !open && setSelectedPerson(null)}
                teams={personTeams}
                isAdmin={isAdmin}
                presenceStatus={selectedPerson ? presenceMap.get(selectedPerson.id) : undefined}
            />
        </div>
    );
}
