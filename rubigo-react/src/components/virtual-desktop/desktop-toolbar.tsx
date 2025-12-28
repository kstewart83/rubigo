"use client";

/**
 * Desktop Toolbar Component
 *
 * Control bar for the virtual desktop viewer.
 * Provides connection controls, zoom, fullscreen, and special keys.
 */

import {
    ArrowLeft,
    Maximize,
    Minimize,
    Power,
    ZoomIn,
    ZoomOut,
    Keyboard,
    Clipboard,
    Settings,
    MonitorUp,
} from "lucide-react";
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
import type { ConnectionState } from "@/hooks/use-desktop-viewer";
import type { VirtualDesktop } from "@/types/virtual-desktop";
import { cn } from "@/lib/utils";

interface DesktopToolbarProps {
    desktop: VirtualDesktop;
    connectionState: ConnectionState;
    scale: number;
    onScaleChange: (scale: number) => void;
    onDisconnect: () => void;
    onFullscreen: () => void;
    onBack: () => void;
}

export function DesktopToolbar({
    desktop,
    connectionState,
    scale,
    onScaleChange,
    onDisconnect,
    onFullscreen,
    onBack,
}: DesktopToolbarProps) {
    const isConnected = connectionState === "connected";

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
            {/* Left: Back button and desktop name */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="text-zinc-400 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2">
                    <MonitorUp className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-white">{desktop.name}</span>
                    <span
                        className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            connectionState === "connected" && "bg-green-500/20 text-green-400",
                            connectionState === "connecting" && "bg-yellow-500/20 text-yellow-400",
                            connectionState === "disconnected" && "bg-zinc-500/20 text-zinc-400",
                            connectionState === "error" && "bg-red-500/20 text-red-400"
                        )}
                    >
                        {connectionState}
                    </span>
                </div>
            </div>

            {/* Center: View controls */}
            <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onScaleChange(Math.max(0.25, scale - 0.1))}
                            disabled={!isConnected}
                            className="text-zinc-400 hover:text-white"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom Out</TooltipContent>
                </Tooltip>

                <span className="px-2 text-sm text-zinc-400 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                </span>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onScaleChange(Math.min(2, scale + 0.1))}
                            disabled={!isConnected}
                            className="text-zinc-400 hover:text-white"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom In</TooltipContent>
                </Tooltip>

                <div className="w-px h-6 bg-zinc-700 mx-2" />

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onFullscreen}
                            disabled={!isConnected}
                            className="text-zinc-400 hover:text-white"
                        >
                            <Maximize className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fullscreen</TooltipContent>
                </Tooltip>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!isConnected}
                            className="text-zinc-400 hover:text-white"
                        >
                            <Clipboard className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clipboard Sync</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!isConnected}
                            className="text-zinc-400 hover:text-white"
                        >
                            <Keyboard className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>Ctrl+Alt+Del</DropdownMenuItem>
                        <DropdownMenuItem>Win/Super Key</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Alt+Tab</DropdownMenuItem>
                        <DropdownMenuItem>Ctrl+Esc</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-zinc-400 hover:text-white"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>Display Settings</DropdownMenuItem>
                        <DropdownMenuItem>Input Settings</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Connection Info</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="w-px h-6 bg-zinc-700 mx-2" />

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDisconnect}
                    disabled={connectionState === "disconnected"}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                    <Power className="h-4 w-4 mr-1" />
                    Disconnect
                </Button>
            </div>
        </div>
    );
}
