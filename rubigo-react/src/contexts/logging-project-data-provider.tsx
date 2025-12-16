"use client";

import { type ReactNode, useCallback } from "react";
import { ProjectDataProvider, type ActionEvent } from "./project-data-context";
import { ActionLogProvider, useActionLog } from "./action-log-context";
import { usePersona } from "./persona-context";
import type { ProjectData } from "@/types/project";
import type { ActionLogInput } from "@/types/logs";

interface LoggingProjectDataProviderProps {
    children: ReactNode;
    initialData: ProjectData;
}

/**
 * Inner component that has access to both ActionLog and Persona contexts
 * to wire up the logging callback
 */
function ProjectDataWithLogging({ children, initialData }: LoggingProjectDataProviderProps) {
    const { logAction } = useActionLog();
    const { currentPersona } = usePersona();

    const handleAction = useCallback(async (event: ActionEvent) => {
        const logInput: ActionLogInput = {
            operationId: event.operationId,
            entityType: event.entityType,
            entityId: event.entityId,
            action: event.action,
            actorId: currentPersona?.id ?? "system",
            actorName: currentPersona?.name ?? "System",
            changes: event.changes,
        };
        await logAction(logInput);
    }, [logAction, currentPersona]);

    return (
        <ProjectDataProvider
            initialData={initialData}
            onAction={handleAction}
        >
            {children}
        </ProjectDataProvider>
    );
}

/**
 * Combined provider that wraps ActionLogProvider and ProjectDataProvider
 * so that all CRUD operations are automatically logged with actor info
 */
export function LoggingProjectDataProvider({ children, initialData }: LoggingProjectDataProviderProps) {
    return (
        <ActionLogProvider>
            <ProjectDataWithLogging initialData={initialData}>
                {children}
            </ProjectDataWithLogging>
        </ActionLogProvider>
    );
}
