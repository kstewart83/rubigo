/**
 * Simulation Control Panel - Controls for agent simulation loop
 * 
 * Displays simulation status and provides start/stop/tick/reset controls.
 * Uses static LOW classification since controls are administrative.
 */

"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SecurePanelWrapper } from "./secure-panel-wrapper";
import { Play, Square, SkipForward, Trash2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface SimulationState {
    running: boolean;
    ollamaAvailable: boolean;
    ollamaModel?: string;
    tickRateMs: number;
    totalTicks: number;
}

export interface OllamaModel {
    name: string;
    size: number;
    modifiedAt: string;
}

export interface SimulationControlPanelProps {
    simulation: SimulationState;
    activeAgents: number;
    totalAgents: number;
    availableModels?: OllamaModel[];
    selectedModel?: string;
    onModelChange?: (model: string) => void;
    onStart?: () => void;
    onStop?: () => void;
    onTick?: () => void;
    onReset?: () => void;
    className?: string;
}

/**
 * Control panel for managing simulation loop
 */
export function SimulationControlPanel({
    simulation,
    activeAgents,
    totalAgents,
    availableModels = [],
    selectedModel,
    onModelChange,
    onStart,
    onStop,
    onTick,
    onReset,
    className,
}: SimulationControlPanelProps) {
    return (
        <SecurePanelWrapper
            level="low"
            tenants={[]}
            className={cn("rounded-lg overflow-hidden", className)}
        >
            <div className="p-2">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                    <span className="text-lg font-semibold">Simulation Control</span>
                </div>

                {/* Status Overview */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4 px-1">
                    <div>
                        <span className="text-muted-foreground">Status:</span>
                        <span
                            className={cn(
                                "ml-2 font-medium",
                                simulation.running ? "text-green-400" : "text-gray-400"
                            )}
                        >
                            {simulation.running ? "Running" : "Stopped"}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Ollama:</span>
                        <span
                            className={cn(
                                "ml-2 font-medium",
                                simulation.ollamaAvailable ? "text-green-400" : "text-red-400"
                            )}
                        >
                            {simulation.ollamaAvailable ? "Connected" : "Unavailable"}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Agents:</span>
                        <span className="ml-2 font-medium">
                            {activeAgents}/{totalAgents} active
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Ticks:</span>
                        <span className="ml-2 font-medium">
                            {simulation.totalTicks}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2 px-1">
                    {simulation.running ? (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={onStop}
                            className="flex-1"
                        >
                            <Square className="h-3 w-3 mr-1.5" />
                            Stop
                        </Button>
                    ) : (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onStart}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={!simulation.ollamaAvailable}
                        >
                            <Play className="h-3 w-3 mr-1.5" />
                            Start
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onTick}
                    >
                        <SkipForward className="h-3 w-3 mr-1.5" />
                        Tick
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 className="h-3 w-3 mr-1.5" />
                        Reset
                    </Button>
                </div>

                {/* Model Selector */}
                <div className="border-t pt-3 mt-3 mx-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Model:</span>
                        <Select
                            value={selectedModel || simulation.ollamaModel}
                            onValueChange={(value) => onModelChange?.(value)}
                            disabled={simulation.running || availableModels.length === 0}
                        >
                            <SelectTrigger className="h-7 text-xs flex-1">
                                <SelectValue placeholder={simulation.ollamaModel || "Select model"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModels.map((model) => (
                                    <SelectItem key={model.name} value={model.name} className="text-xs">
                                        {model.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-[10px] text-muted-foreground text-center mt-1">
                        Tick rate: {simulation.tickRateMs}ms
                    </div>
                </div>
            </div>
        </SecurePanelWrapper>
    );
}
