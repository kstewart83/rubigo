"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Home,
    Users,
    LayoutDashboard,
    Package,
    Target,
    Layers,
    TrendingUp,
    Rocket,
    Activity,
    FileText,
    ChevronUp,
    ChevronDown,
    LogOut,
    RefreshCcw,
    Sun,
    Moon,
    Laptop,
    ChevronsLeft,
    ChevronsRight,
    Handshake,
    Calendar,
    Mail,
    MessageCircle,
    MonitorPlay,
    Radio,

    Bot,
    FolderOpen,
    UsersRound,

    Presentation,

    BarChart3,
    Gauge,
    PieChart,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { usePersona } from "@/contexts/persona-context";
import { useTheme } from "@/components/theme-provider";
import { useStatusSnooze } from "@/hooks/use-status-snooze";
import type { Person } from "@/types/personnel";

// =====================================================================
// Types
// =====================================================================

interface SubPage {
    id: string;
    label: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface SidebarModule {
    id: string;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    subPages?: SubPage[];
}

// =====================================================================
// Module Configuration
// =====================================================================

const sidebarModules: SidebarModule[] = [
    {
        id: "home",
        label: "Home",
        href: "/dashboard",
        icon: Home,
    },
    {
        id: "collaboration",
        label: "Collaboration",
        href: "/calendar",
        icon: Handshake,
        subPages: [
            { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
            { id: "email", label: "Email", href: "/email", icon: Mail },
            { id: "chat", label: "Chat", href: "/chat", icon: MessageCircle },
            { id: "files", label: "Files", href: "/files", icon: FolderOpen },
            { id: "screen-share", label: "Screen Share", href: "/screen-share", icon: MonitorPlay },
            { id: "presentations", label: "Presentations", href: "/presentations", icon: Presentation },
        ],
    },
    {
        id: "personnel",
        label: "Personnel",
        href: "/personnel",
        icon: Users,
        subPages: [
            { id: "directory", label: "Directory", href: "/personnel", icon: Users },
            { id: "teams", label: "Teams", href: "/personnel/teams", icon: UsersRound },
            { id: "agents", label: "AI Agents", href: "/agents", icon: Bot },
        ],
    },
    {
        id: "projects",
        label: "Projects",
        href: "/projects",
        icon: LayoutDashboard,
        subPages: [
            { id: "dashboard", label: "Dashboard", href: "/projects", icon: LayoutDashboard },
            { id: "services", label: "Products & Services", href: "/projects/services", icon: Package },
            { id: "objectives", label: "Objectives", href: "/projects/objectives", icon: Target },
            { id: "features", label: "Features", href: "/projects/features", icon: Layers },
            { id: "metrics", label: "Metrics & KPIs", href: "/projects/metrics", icon: TrendingUp },
            { id: "initiatives", label: "Initiatives", href: "/projects/initiatives", icon: Rocket },
            { id: "activities", label: "Activities", href: "/projects/activities", icon: Activity },
        ],
    },
    {
        id: "logs",
        label: "Logs",
        href: "/logs",
        icon: FileText,
        subPages: [
            { id: "actions", label: "Actions", href: "/logs/actions", icon: Activity },
            { id: "events", label: "Events (Debug)", href: "/events", icon: Radio },
        ],
    },
    {
        id: "analytics",
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        subPages: [
            { id: "overview", label: "Overview", href: "/analytics/overview", icon: BarChart3 },
            { id: "performance", label: "Performance", href: "/analytics/performance", icon: Gauge },
            { id: "usage", label: "Usage", href: "/analytics/usage", icon: PieChart },
        ],
    },
];

// =====================================================================
// App Sidebar Component
// =====================================================================

interface AppSidebarProps {
    personnel: Person[];
    version?: string;
    variant?: "sidebar" | "floating" | "inset";
}

export function AppSidebar({ personnel, version = "0.1.0", variant = "sidebar" }: AppSidebarProps) {
    const pathname = usePathname();
    const { currentPersona, signOut } = usePersona();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { state, toggleSidebar } = useSidebar();
    const [showSwitcher, setShowSwitcher] = useState(false);
    const { currentStatus, isSnoozing, formattedTime, setStatus, extendSnooze } = useStatusSnooze();
    const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
        // Auto-expand modules based on current path
        const expanded = new Set<string>();
        for (const module of sidebarModules) {
            if (module.subPages && pathname.startsWith(module.href)) {
                expanded.add(module.id);
            }
        }
        return expanded;
    });

    // Keep module expanded when navigating to any of its sub-pages
    useEffect(() => {
        for (const module of sidebarModules) {
            if (module.subPages) {
                const isPathInModule = module.subPages.some(
                    (subPage) => pathname === subPage.href || pathname.startsWith(subPage.href + "/")
                );
                if (isPathInModule && !expandedModules.has(module.id)) {
                    setExpandedModules((prev) => new Set(prev).add(module.id));
                }
            }
        }
    }, [pathname, expandedModules]);

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    const isCollapsed = state === "collapsed";

    return (
        <>
            <Sidebar collapsible="icon" variant={variant}>
                {/* Header with Logo */}
                <SidebarHeader className="border-b border-sidebar-border">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent"
                            >
                                <Link href="/dashboard">
                                    <div className="flex aspect-square size-8 items-center justify-center">
                                        <Image
                                            src="/rubigo-logo.svg"
                                            alt="Rubigo"
                                            width={28}
                                            height={28}
                                            className="dark:invert"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span
                                            className="font-semibold"
                                            style={{ fontFamily: "var(--font-outfit)" }}
                                        >
                                            Rubigo
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            v{version}
                                        </span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                            {/* Collapse toggle - only visible when expanded */}
                            {!isCollapsed && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 size-7 hover:bg-sidebar-accent"
                                            onClick={toggleSidebar}
                                        >
                                            <ChevronsLeft className="size-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Collapse sidebar</TooltipContent>
                                </Tooltip>
                            )}
                        </SidebarMenuItem>
                        {/* Expand button - only visible when collapsed */}
                        {isCollapsed && (
                            <SidebarMenuItem>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SidebarMenuButton
                                            onClick={toggleSidebar}
                                            tooltip="Expand sidebar"
                                        >
                                            <ChevronsRight className="size-4" />
                                        </SidebarMenuButton>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Expand sidebar</TooltipContent>
                                </Tooltip>
                            </SidebarMenuItem>
                        )}
                    </SidebarMenu>
                </SidebarHeader>

                {/* Navigation Content */}
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {sidebarModules.map((module) => {
                                    const isModuleActive =
                                        pathname === module.href ||
                                        (module.href !== "/dashboard" && pathname.startsWith(module.href));
                                    const hasSubPages = module.subPages && module.subPages.length > 0;
                                    const isExpanded = expandedModules.has(module.id);

                                    return (
                                        <SidebarMenuItem key={module.id}>
                                            {hasSubPages ? (
                                                <>
                                                    <SidebarMenuButton
                                                        isActive={isModuleActive && !isExpanded}
                                                        tooltip={module.label}
                                                        onClick={() => toggleModule(module.id)}
                                                    >
                                                        <module.icon className="size-4" />
                                                        <span>{module.label}</span>
                                                        {isExpanded ? (
                                                            <ChevronDown className="ml-auto size-4" />
                                                        ) : (
                                                            <ChevronUp className="ml-auto size-4 rotate-180" />
                                                        )}
                                                    </SidebarMenuButton>
                                                    {isExpanded && (
                                                        <SidebarMenuSub>
                                                            {module.subPages!.map((subPage) => {
                                                                const isSubPageActive = pathname === subPage.href;
                                                                return (
                                                                    <SidebarMenuSubItem key={subPage.id}>
                                                                        <SidebarMenuSubButton
                                                                            asChild
                                                                            isActive={isSubPageActive}
                                                                        >
                                                                            <Link href={subPage.href} className="flex items-center gap-2 w-full">
                                                                                {subPage.icon && (
                                                                                    <subPage.icon className="size-4" />
                                                                                )}
                                                                                <span>{subPage.label}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                );
                                                            })}
                                                        </SidebarMenuSub>
                                                    )}
                                                </>
                                            ) : (
                                                <SidebarMenuButton
                                                    asChild
                                                    isActive={isModuleActive}
                                                    tooltip={module.label}
                                                >
                                                    <Link href={module.href}>
                                                        <module.icon className="size-4" />
                                                        <span>{module.label}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                {/* Footer with User */}
                <SidebarFooter className="border-t border-sidebar-border">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            {currentPersona && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <SidebarMenuButton
                                            size="lg"
                                            className="data-[state=open]:bg-sidebar-accent"
                                            tooltip={isCollapsed ? currentPersona.name : undefined}
                                        >
                                            {currentPersona.photo ? (
                                                <Image
                                                    src={currentPersona.photo}
                                                    alt={currentPersona.name}
                                                    width={32}
                                                    height={32}
                                                    className="size-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
                                                    {currentPersona.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </div>
                                            )}
                                            {!isCollapsed && (
                                                <>
                                                    <div className="flex flex-col gap-0.5 leading-none text-left">
                                                        <span className="font-semibold truncate">
                                                            {currentPersona.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground truncate">
                                                            {currentPersona.title}
                                                        </span>
                                                    </div>
                                                    <ChevronUp className="ml-auto size-4" />
                                                </>
                                            )}
                                        </SidebarMenuButton>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        side={isCollapsed ? "right" : "top"}
                                        align={isCollapsed ? "start" : "end"}
                                        className="w-[--radix-popper-anchor-width] min-w-56"
                                    >
                                        <div className="px-2 py-1.5">
                                            <p className="font-medium">{currentPersona.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {currentPersona.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {currentPersona.department}
                                            </p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setShowSwitcher(true)}>
                                            <RefreshCcw className="mr-2 size-4" />
                                            Switch Persona
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <div className="px-2 py-1.5">
                                            <p className="text-xs font-medium text-muted-foreground">Status</p>
                                        </div>
                                        <DropdownMenuItem onClick={() => setStatus("online")}>
                                            <span className="mr-2 w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                                            Online
                                            {currentStatus === "online" && <span className="ml-auto text-xs">✓</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setStatus("away")}>
                                            <span className="mr-2 w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                                            Away
                                            {currentStatus === "away" && <span className="ml-auto text-xs">✓</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setStatus("offline")}>
                                            <span className="mr-2 w-3 h-3 rounded-full border-[1.5px] border-zinc-400" />
                                            Appear Offline
                                            {currentStatus === "offline" && <span className="ml-auto text-xs">✓</span>}
                                        </DropdownMenuItem>
                                        {/* Snooze timer and extend options */}
                                        {isSnoozing && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                                    Auto-resume in <span className="font-mono font-medium text-foreground">{formattedTime}</span>
                                                </div>
                                                <div className="px-2 py-1 flex gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); extendSnooze(1); }}
                                                        className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-accent"
                                                    >
                                                        +1h
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); extendSnooze(2); }}
                                                        className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-accent"
                                                    >
                                                        +2h
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); extendSnooze(4); }}
                                                        className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-accent"
                                                    >
                                                        +4h
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); extendSnooze(8); }}
                                                        className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-accent"
                                                    >
                                                        +8h
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                        <DropdownMenuSeparator />
                                        <div className="px-2 py-1.5">
                                            <p className="text-xs font-medium text-muted-foreground">Theme</p>
                                        </div>
                                        <DropdownMenuItem onClick={() => setTheme("light")}>
                                            <Sun className="mr-2 size-4" />
                                            Light
                                            {theme === "light" && <span className="ml-auto text-xs">✓</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                                            <Moon className="mr-2 size-4" />
                                            Dark
                                            {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("system")}>
                                            <Laptop className="mr-2 size-4" />
                                            Auto
                                            {theme === "system" && <span className="ml-auto text-xs">✓</span>}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={signOut}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <LogOut className="mr-2 size-4" />
                                            Sign Out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <PersonaSwitcher
                personnel={personnel}
                open={showSwitcher}
                onOpenChange={setShowSwitcher}
            />
        </>
    );
}
