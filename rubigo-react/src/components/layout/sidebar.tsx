"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

// ============================================================================
// Types
// ============================================================================

interface SubPage {
    id: string;
    label: string;
    href: string;
}

interface SidebarModule {
    id: string;
    label: string;
    href: string;
    icon: string;
    subPages?: SubPage[];
}

// ============================================================================
// Module Configuration
// ============================================================================

const sidebarModules: SidebarModule[] = [
    {
        id: "home",
        label: "Home",
        href: "/dashboard",
        icon: "🏠"
    },
    {
        id: "personnel",
        label: "Personnel",
        href: "/personnel",
        icon: "👥",
        // Future sub-pages
        // subPages: [
        //     { id: "directory", label: "Directory", href: "/personnel" },
        //     { id: "org-chart", label: "Org Chart", href: "/personnel/org-chart" },
        // ]
    },
    {
        id: "projects",
        label: "Projects",
        href: "/projects",
        icon: "📊",
        subPages: [
            { id: "dashboard", label: "Dashboard", href: "/projects" },
            { id: "services", label: "Products & Services", href: "/projects/services" },
            { id: "objectives", label: "Objectives", href: "/projects/objectives" },
            { id: "features", label: "Features", href: "/projects/features" },
            { id: "metrics", label: "Metrics & KPIs", href: "/projects/metrics" },
            { id: "initiatives", label: "Initiatives", href: "/projects/initiatives" },
            { id: "activities", label: "Activities", href: "/projects/activities" },
        ]
    },
    {
        id: "logs",
        label: "Logs",
        href: "/logs",
        icon: "📋",
        subPages: [
            { id: "actions", label: "Actions", href: "/logs/actions" },
        ]
    },
    // Future modules with sub-pages
    // { id: "calendar", label: "Calendar", href: "/calendar", icon: "📅" },
    // { id: "chat", label: "Chat", href: "/chat", icon: "💬" },
    // { id: "security", label: "Security", href: "/security", icon: "🔐" },
    // { id: "logistics", label: "Logistics", href: "/logistics", icon: "📦" },
];

// ============================================================================
// Sidebar Component
// ============================================================================

interface SidebarProps {
    version?: string;
}

export function Sidebar({ version = "0.1.0" }: SidebarProps) {
    const pathname = usePathname();
    const [expandedModule, setExpandedModule] = useState<string | null>(null);

    // Auto-expand module based on current path
    useEffect(() => {
        for (const module of sidebarModules) {
            if (module.subPages && pathname.startsWith(module.href)) {
                setExpandedModule(module.id);
                break;
            }
        }
    }, [pathname]);

    const handleModuleClick = (module: SidebarModule) => {
        if (module.subPages) {
            // Toggle expansion, but don't collapse if clicking the same module
            setExpandedModule(expandedModule === module.id ? null : module.id);
        }
    };

    return (
        <aside className="w-64 h-screen bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <Image
                        src="/rubigo-logo.svg"
                        alt="Rubigo"
                        width={32}
                        height={32}
                        className="dark:invert"
                    />
                    <span
                        className="text-xl font-semibold text-zinc-900 dark:text-zinc-100"
                        style={{ fontFamily: "var(--font-outfit)" }}
                    >
                        Rubigo
                    </span>
                    <span className="ml-1 text-xs text-zinc-400">v{version}</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 overflow-y-auto">
                <ul className="space-y-1">
                    {sidebarModules.map((module) => {
                        const isModuleActive = pathname === module.href ||
                            (module.href !== "/dashboard" && pathname.startsWith(module.href));
                        const isExpanded = expandedModule === module.id;
                        const hasSubPages = module.subPages && module.subPages.length > 0;

                        return (
                            <li key={module.id}>
                                {/* Module Header */}
                                <div className="flex items-center">
                                    <Link
                                        href={module.href}
                                        onClick={() => handleModuleClick(module)}
                                        className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isModuleActive && !isExpanded
                                            ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50"
                                            : isExpanded
                                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                            }`}
                                    >
                                        <span className="text-xl">{module.icon}</span>
                                        <span className="font-medium flex-1">{module.label}</span>
                                        {hasSubPages && (
                                            <span
                                                className={`text-xs transition-transform duration-200 ${isExpanded ? "rotate-90" : ""
                                                    }`}
                                            >
                                                ▶
                                            </span>
                                        )}
                                    </Link>
                                </div>

                                {/* Sub-pages (Accordion Content) */}
                                {hasSubPages && isExpanded && (
                                    <ul className="mt-1 ml-6 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-0.5">
                                        {module.subPages!.map((subPage) => {
                                            const isSubPageActive = pathname === subPage.href;

                                            return (
                                                <li key={subPage.id}>
                                                    <Link
                                                        href={subPage.href}
                                                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${isSubPageActive
                                                            ? "bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 font-medium"
                                                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                            }`}
                                                    >
                                                        {subPage.label}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </nav>


        </aside>
    );
}
