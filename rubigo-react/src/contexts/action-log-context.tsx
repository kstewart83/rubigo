"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { ActionLog, ActionLogInput, EntityType, ActionType } from "@/types/logs";
import * as actions from "@/lib/project-actions";

interface ActionLogContextValue {
    logs: ActionLog[];
    logAction: (input: ActionLogInput) => Promise<void>;
    getLogsForEntity: (entityType: EntityType, entityId: string) => ActionLog[];
    getLogsByAction: (action: ActionType) => ActionLog[];
    getLogsByActor: (actorId: string) => ActionLog[];
    clearLogs: () => void;
    refreshLogs: () => Promise<void>;
    isLoading: boolean;
}

const ActionLogContext = createContext<ActionLogContextValue | null>(null);

export function useActionLog() {
    const context = useContext(ActionLogContext);
    if (!context) {
        throw new Error("useActionLog must be used within an ActionLogProvider");
    }
    return context;
}

interface ActionLogProviderProps {
    children: ReactNode;
}

export function ActionLogProvider({ children }: ActionLogProviderProps) {
    const [logs, setLogs] = useState<ActionLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load logs from database on mount
    useEffect(() => {
        let mounted = true;

        async function loadLogs() {
            try {
                const dbLogs = await actions.getAllActionLogsAction();
                if (mounted) {
                    // Convert null to undefined for timestamp types and reverse for most recent first
                    const typedLogs: ActionLog[] = dbLogs.reverse().map(log => ({
                        id: log.id,
                        timestamp: log.timestamp,
                        operationId: log.operationId,
                        entityType: log.entityType as EntityType,
                        entityId: log.entityId,
                        action: log.action as ActionType,
                        actorId: log.actorId,
                        actorName: log.actorName,
                        requestId: log.requestId ?? undefined,
                        changes: log.changes ? JSON.parse(log.changes) : undefined,
                        metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
                    }));
                    setLogs(typedLogs);
                }
            } catch (error) {
                console.error("Failed to load action logs:", error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }

        loadLogs();
        return () => { mounted = false; };
    }, []);

    // Persist action to database and update local state
    const logAction = useCallback(async (input: ActionLogInput) => {
        try {
            const timestamp = new Date().toISOString();
            const newLog = await actions.createActionLogAction({
                timestamp,
                operationId: input.operationId,
                entityType: input.entityType,
                entityId: input.entityId,
                action: input.action,
                actorId: input.actorId,
                actorName: input.actorName,
                requestId: input.requestId ?? null,
                changes: input.changes ? JSON.stringify(input.changes) : null,
                metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            });

            // Add to local state (most recent first)
            const typedLog: ActionLog = {
                id: newLog.id,
                timestamp: newLog.timestamp,
                operationId: newLog.operationId,
                entityType: newLog.entityType as EntityType,
                entityId: newLog.entityId,
                action: newLog.action as ActionType,
                actorId: newLog.actorId,
                actorName: newLog.actorName,
                requestId: newLog.requestId ?? undefined,
                changes: input.changes,
                metadata: input.metadata,
            };
            setLogs(prev => [typedLog, ...prev]);
        } catch (error) {
            console.error("Failed to log action:", error);
        }
    }, []);

    const refreshLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const dbLogs = await actions.getAllActionLogsAction();
            const typedLogs: ActionLog[] = dbLogs.reverse().map(log => ({
                id: log.id,
                timestamp: log.timestamp,
                operationId: log.operationId,
                entityType: log.entityType as EntityType,
                entityId: log.entityId,
                action: log.action as ActionType,
                actorId: log.actorId,
                actorName: log.actorName,
                requestId: log.requestId ?? undefined,
                changes: log.changes ? JSON.parse(log.changes) : undefined,
                metadata: log.metadata ? JSON.parse(log.metadata) : undefined,
            }));
            setLogs(typedLogs);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getLogsForEntity = useCallback(
        (entityType: EntityType, entityId: string) => {
            return logs.filter((log) => log.entityType === entityType && log.entityId === entityId);
        },
        [logs]
    );

    const getLogsByAction = useCallback(
        (action: ActionType) => {
            return logs.filter((log) => log.action === action);
        },
        [logs]
    );

    const getLogsByActor = useCallback(
        (actorId: string) => {
            return logs.filter((log) => log.actorId === actorId);
        },
        [logs]
    );

    const clearLogs = useCallback(() => {
        // TODO: Add server action to clear logs from database
        setLogs([]);
    }, []);

    return (
        <ActionLogContext.Provider
            value={{
                logs,
                logAction,
                getLogsForEntity,
                getLogsByAction,
                getLogsByActor,
                clearLogs,
                refreshLogs,
                isLoading,
            }}
        >
            {children}
        </ActionLogContext.Provider>
    );
}

/**
 * Helper to create an operationId from entity type and action
 */
export function createOperationId(entityType: EntityType, action: ActionType): string {
    const actionVerb = {
        create: 'create',
        read: 'get',
        update: 'update',
        delete: 'delete',
    }[action];

    const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
    return `${actionVerb}${entityName}`;
}

/**
 * Helper to compute field-level changes between old and new objects
 */
export function computeChanges(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>
): { field: string; oldValue: unknown; newValue: unknown }[] {
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
        const oldValue = oldObj[key];
        const newValue = newObj[key];

        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({ field: key, oldValue, newValue });
        }
    }

    return changes;
}
