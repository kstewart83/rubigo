"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"
import { useSidebar } from "@/components/ui/sidebar"

// =====================================================================
// Types
// =====================================================================
interface NavItem {
    id: string
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
}

// =====================================================================
// Navigation Configuration
// =====================================================================
const primaryNavItems: NavItem[] = [
    { id: "home", label: "Home", href: "/dashboard", icon: Home },
    { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
    { id: "personnel", label: "People", href: "/personnel", icon: Users },
    { id: "projects", label: "Projects", href: "/projects", icon: LayoutDashboard },
]

const moreNavItems: NavItem[] = [
    { id: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
    { id: "logs", label: "Logs", href: "/logs", icon: FileText },
    { id: "settings", label: "Settings", href: "/settings", icon: Settings },
]

// =====================================================================
// Mobile Nav Component
// =====================================================================
export function MobileNav() {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const [moreOpen, setMoreOpen] = React.useState(false)

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard" || pathname === "/"
        }
        return pathname.startsWith(href)
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
                    const active = isActive(item.href)

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
