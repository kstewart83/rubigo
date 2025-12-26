"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

// =====================================================================
// Types
// =====================================================================
interface ModuleHeaderProps {
    title: string
    description?: string
    children?: React.ReactNode  // Action buttons, etc.
    className?: string
}

// =====================================================================
// Module Header Component
// =====================================================================
/**
 * Responsive module header that provides consistent layout across all modules.
 * - Shows SidebarTrigger on tablet (for collapsed sidebar)
 * - Hides SidebarTrigger on mobile (bottom nav handles navigation)
 * - Shows title and optional description
 * - Children slot for action buttons (hidden on mobile, collapsed to menu)
 */
export function ModuleHeader({
    title,
    description,
    children,
    className,
}: ModuleHeaderProps) {
    return (
        <header
            className={cn(
                "flex flex-col gap-4 pb-6",
                className
            )}
        >
            <div className="flex items-center gap-4">
                {/* Sidebar trigger - hidden on mobile (< md), visible on tablet/desktop */}
                <SidebarTrigger className="hidden md:flex size-8" />

                {/* Separator between trigger and title on tablet/desktop */}
                <Separator orientation="vertical" className="hidden md:block h-6" />

                {/* Title and description */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {description}
                        </p>
                    )}
                </div>

                {/* Actions - hidden on mobile, visible on sm+ */}
                {children && (
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                        {children}
                    </div>
                )}
            </div>
        </header>
    )
}

// =====================================================================
// Module Header Actions (for consistent action button styling)
// =====================================================================
interface ModuleHeaderActionsProps {
    children: React.ReactNode
    className?: string
}

/**
 * Container for action buttons in the module header.
 * Provides consistent spacing and responsive behavior.
 */
export function ModuleHeaderActions({
    children,
    className,
}: ModuleHeaderActionsProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            {children}
        </div>
    )
}
