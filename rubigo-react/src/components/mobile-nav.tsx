"use client"

/**
 * Mobile Navigation
 * 
 * Bottom nav bar for mobile with:
 * - Primary nav items as tabs
 * - "More" drawer for additional items
 * - Submodule Popover: tap active module again to reveal submodules
 * - Last-used submodule persistence via localStorage
 */

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    Home,
    Calendar,
    Users,
    LayoutDashboard,
    MoreHorizontal,
    BarChart3,
    FileText,
    Settings,
    Sun,
    Moon,
    LogOut,
    UsersRound,
    UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"

// =====================================================================
// Types
// =====================================================================
interface Submodule {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}

interface NavItem {
    id: string
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    submodules?: Submodule[]
}

// =====================================================================
// Navigation Configuration
// =====================================================================
const primaryNavItems: NavItem[] = [
    { id: "home", label: "Home", href: "/dashboard", icon: Home },
    { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
    {
        id: "personnel",
        label: "People",
        href: "/personnel",
        icon: Users,
        submodules: [
            { label: "Directory", href: "/personnel", icon: UserCircle },
            { label: "Teams", href: "/personnel/teams", icon: UsersRound },
        ]
    },
    { id: "projects", label: "Projects", href: "/projects", icon: LayoutDashboard },
]

const moreNavItems: NavItem[] = [
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "logs", label: "Logs", href: "/logs", icon: FileText },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
]

// localStorage key prefix for last-used submodule
const LAST_SUBMODULE_KEY_PREFIX = "rubigo-last-submodule-"

// =====================================================================
// Mobile Nav Component
// =====================================================================
export function MobileNav() {
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()
    const [moreOpen, setMoreOpen] = React.useState(false)
    const [openPopoverId, setOpenPopoverId] = React.useState<string | null>(null)

    // Check if a route is active
    const isActive = React.useCallback((href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard" || pathname === "/"
        }
        return pathname.startsWith(href)
    }, [pathname])

    // Check if a module (base path) is currently active
    const isModuleActive = React.useCallback((item: NavItem) => {
        if (item.submodules) {
            return item.submodules.some(sub => isActive(sub.href))
        }
        return isActive(item.href)
    }, [isActive])

    // Get last-used submodule from localStorage
    const getLastSubmodule = (moduleId: string): string | null => {
        if (typeof window === "undefined") return null
        return localStorage.getItem(LAST_SUBMODULE_KEY_PREFIX + moduleId)
    }

    // Save last-used submodule to localStorage
    const saveLastSubmodule = (moduleId: string, href: string) => {
        if (typeof window === "undefined") return
        localStorage.setItem(LAST_SUBMODULE_KEY_PREFIX + moduleId, href)
    }

    // Handle nav item click
    const handleNavClick = (item: NavItem, e: React.MouseEvent) => {
        e.preventDefault()

        if (item.submodules && item.submodules.length > 0) {
            const moduleActive = isModuleActive(item)

            if (moduleActive) {
                // Already in this module - show submodule popover
                setOpenPopoverId(openPopoverId === item.id ? null : item.id)
            } else {
                // Not in this module - navigate to last-used submodule or default
                const lastUsed = getLastSubmodule(item.id)
                const targetHref = lastUsed || item.href
                router.push(targetHref)
            }
        } else {
            // No submodules - direct navigation
            router.push(item.href)
        }
    }

    // Handle submodule click
    const handleSubmoduleClick = (item: NavItem, submodule: Submodule) => {
        saveLastSubmodule(item.id, submodule.href)
        setOpenPopoverId(null)
        router.push(submodule.href)
    }

    const isMoreActive = moreNavItems.some(item => isActive(item.href))

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border md:hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="flex items-center justify-around h-16 px-2">
                {/* Primary Nav Items */}
                {primaryNavItems.map((item) => {
                    const Icon = item.icon
                    const active = isModuleActive(item)
                    const hasSubmodules = item.submodules && item.submodules.length > 0

                    if (hasSubmodules) {
                        return (
                            <Popover
                                key={item.id}
                                open={openPopoverId === item.id}
                                onOpenChange={(open) => setOpenPopoverId(open ? item.id : null)}
                            >
                                <PopoverTrigger asChild>
                                    <button
                                        onClick={(e) => handleNavClick(item, e)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-lg transition-colors",
                                            active
                                                ? "text-primary bg-primary/10"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-[10px] font-medium">{item.label}</span>
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-48 p-2"
                                    align="center"
                                    side="top"
                                    sideOffset={8}
                                >
                                    <div className="space-y-1">
                                        {item.submodules?.map((sub) => {
                                            const SubIcon = sub.icon
                                            const subActive = pathname === sub.href ||
                                                (sub.href !== "/personnel" && pathname.startsWith(sub.href))

                                            return (
                                                <button
                                                    key={sub.href}
                                                    onClick={() => handleSubmoduleClick(item, sub)}
                                                    className={cn(
                                                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-md transition-colors text-sm",
                                                        subActive
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "hover:bg-muted text-foreground"
                                                    )}
                                                >
                                                    <SubIcon className="h-4 w-4" />
                                                    {sub.label}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )
                    }

                    return (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-lg transition-colors",
                                active
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}

                {/* More Button with Drawer */}
                <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
                    <DrawerTrigger asChild>
                        <button
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[64px] py-2 px-3 rounded-lg transition-colors",
                                isMoreActive
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <MoreHorizontal className="h-5 w-5" />
                            <span className="text-[10px] font-medium">More</span>
                        </button>
                    </DrawerTrigger>

                    <DrawerContent>
                        <DrawerHeader className="sr-only">
                            <DrawerTitle>More Options</DrawerTitle>
                            <DrawerDescription>Additional navigation and settings</DrawerDescription>
                        </DrawerHeader>

                        <div className="px-4 py-2">
                            {/* More Navigation Items */}
                            <div className="space-y-1">
                                {moreNavItems.map((item) => {
                                    const Icon = item.icon
                                    const active = isActive(item.href)

                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            onClick={() => setMoreOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                                active
                                                    ? "text-primary bg-primary/10"
                                                    : "text-foreground hover:bg-muted"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    )
                                })}
                            </div>

                            <Separator className="my-4" />

                            {/* Theme Toggle */}
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-foreground hover:bg-muted transition-colors"
                            >
                                {theme === "dark" ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                                <span className="font-medium">
                                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                                </span>
                            </button>

                            {/* Sign Out */}
                            <button
                                onClick={() => {
                                    // TODO: Implement sign out
                                    setMoreOpen(false)
                                }}
                                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>

                        <DrawerFooter className="pt-0">
                            <DrawerClose asChild>
                                <Button variant="outline" className="w-full">
                                    Close
                                </Button>
                            </DrawerClose>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>
            </div>
        </nav>
    )
}
