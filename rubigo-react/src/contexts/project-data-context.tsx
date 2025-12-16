"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useTransition,
    type ReactNode,
} from "react";
import type {
    ProjectData,
    Service,
    Project,
    Objective,
    Feature,
    Metric,
    KPI,
    Initiative,
    Activity,
    Role,
    Assignment,
    Allocation,
} from "@/types/project";
import type { EntityType, ActionType, FieldChange } from "@/types/logs";
import * as actions from "@/lib/project-actions";

// Helper to compute field-level changes
function computeChanges(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>
): FieldChange[] {
    const changes: FieldChange[] = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
        if (key === 'id') continue;
        const oldValue = oldObj[key];
        const newValue = newObj[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
            changes.push({ field: key, oldValue, newValue });
        }
    }
    return changes;
}

// ============================================================================
// Action Callback Type
// ============================================================================

export interface ActionEvent {
    action: ActionType;
    entityType: EntityType;
    entityId: string;
    operationId: string;
    changes?: FieldChange[];
}

// ============================================================================
// Context Types
// ============================================================================

interface ProjectDataContextValue {
    data: ProjectData;
    isLoading: boolean;
    isPending: boolean;

    // Services
    updateService: (id: string, updates: Partial<Service>) => Promise<void>;
    createService: (service: Omit<Service, "id">) => Promise<string>;
    deleteService: (id: string) => Promise<void>;

    // Projects
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    createProject: (project: Omit<Project, "id">) => Promise<string>;
    deleteProject: (id: string) => Promise<void>;

    // Objectives
    updateObjective: (id: string, updates: Partial<Objective>) => Promise<void>;
    createObjective: (objective: Omit<Objective, "id">) => Promise<string>;
    deleteObjective: (id: string) => Promise<void>;

    // Features
    updateFeature: (id: string, updates: Partial<Feature>) => Promise<void>;
    createFeature: (feature: Omit<Feature, "id">) => Promise<string>;
    deleteFeature: (id: string) => Promise<void>;

    // Metrics
    updateMetric: (id: string, updates: Partial<Metric>) => Promise<void>;
    createMetric: (metric: Omit<Metric, "id">) => Promise<string>;
    deleteMetric: (id: string) => Promise<void>;

    // KPIs
    updateKPI: (id: string, updates: Partial<KPI>) => Promise<void>;
    createKPI: (kpi: Omit<KPI, "id">) => Promise<string>;
    deleteKPI: (id: string) => Promise<void>;

    // Initiatives
    updateInitiative: (id: string, updates: Partial<Initiative>) => Promise<void>;
    createInitiative: (initiative: Omit<Initiative, "id">) => Promise<string>;
    deleteInitiative: (id: string) => Promise<void>;

    // Activities
    updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
    createActivity: (activity: Omit<Activity, "id">) => Promise<string>;
    deleteActivity: (id: string) => Promise<void>;

    // Roles
    updateRole: (id: string, updates: Partial<Role>) => Promise<void>;
    createRole: (role: Omit<Role, "id">) => Promise<string>;
    deleteRole: (id: string) => Promise<void>;

    // Assignments
    updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
    createAssignment: (assignment: Omit<Assignment, "id">) => Promise<string>;
    deleteAssignment: (id: string) => Promise<void>;

    // Allocations
    updateAllocation: (id: string, updates: Partial<Allocation>) => Promise<void>;
    createAllocation: (allocation: Omit<Allocation, "id">) => Promise<string>;
    deleteAllocation: (id: string) => Promise<void>;

    // Utility
    refreshData: () => Promise<void>;
}

const ProjectDataContext = createContext<ProjectDataContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface ProjectDataProviderProps {
    children: ReactNode;
    initialData: ProjectData;
    onAction?: (event: ActionEvent) => void;
}

// Map entity names for logging
const entityTypeMap: Record<string, EntityType> = {
    service: 'service',
    project: 'project',
    objective: 'objective',
    feature: 'feature',
    metric: 'metric',
    kpi: 'kpi',
    initiative: 'initiative',
    activity: 'activity',
    role: 'role',
    assignment: 'assignment',
    allocation: 'allocation',
};

export function ProjectDataProvider({ children, initialData, onAction }: ProjectDataProviderProps) {
    const [data, setData] = useState<ProjectData>(initialData);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Helper to log actions
    const logAction = useCallback((
        action: ActionType,
        entityType: EntityType,
        entityId: string,
        changes?: FieldChange[]
    ) => {
        if (onAction) {
            const actionVerb = { create: 'create', read: 'get', update: 'update', delete: 'delete' }[action];
            const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1);
            onAction({
                action,
                entityType,
                entityId,
                operationId: `${actionVerb}${entityName}`,
                changes,
            });
        }
    }, [onAction]);

    // Refresh data from database
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        try {
            const freshData = await actions.getAllProjectDataAction();
            // Helper to convert null to undefined
            const nullToUndef = <T,>(val: T | null): T | undefined => val ?? undefined;

            // Transform to match ProjectData types (SQLite uses null, TS types use undefined)
            setData({
                description: freshData.description,
                services: freshData.services.map(s => ({
                    id: s.id,
                    name: s.name,
                    description: nullToUndef(s.description),
                    status: (s.status ?? "catalog") as Service["status"],
                    isProduct: s.isProduct ?? false,
                    isService: s.isService ?? false,
                })),
                projects: freshData.projects.map(p => ({
                    id: p.id,
                    name: p.name,
                    description: nullToUndef(p.description),
                    serviceId: p.serviceId ?? "",
                    status: (p.status ?? "planning") as Project["status"],
                    startDate: nullToUndef(p.startDate),
                    endDate: nullToUndef(p.endDate),
                })),
                objectives: freshData.objectives.map(o => ({
                    id: o.id,
                    title: o.title,
                    description: nullToUndef(o.description),
                    projectId: o.projectId ?? "",
                    parentId: nullToUndef(o.parentId),
                    status: (o.status ?? "draft") as Objective["status"],
                })),
                features: freshData.features.map(f => ({
                    id: f.id,
                    name: f.name,
                    description: nullToUndef(f.description),
                    objectiveId: f.objectiveId ?? "",
                    status: (f.status ?? "planned") as Feature["status"],
                })),
                metrics: freshData.metrics.map(m => ({
                    id: m.id,
                    name: m.name,
                    description: nullToUndef(m.description),
                    unit: m.unit,
                    currentValue: nullToUndef(m.currentValue),
                    source: nullToUndef(m.source),
                })),
                kpis: freshData.kpis.map(k => ({
                    id: k.id,
                    metricId: k.metricId,
                    objectiveId: nullToUndef(k.objectiveId),
                    targetValue: k.targetValue,
                    direction: k.direction as KPI["direction"],
                    thresholdWarning: nullToUndef(k.thresholdWarning),
                    thresholdCritical: nullToUndef(k.thresholdCritical),
                })),
                initiatives: freshData.initiatives.map(i => ({
                    id: i.id,
                    name: i.name,
                    description: nullToUndef(i.description),
                    kpiId: i.kpiId ?? "",
                    status: (i.status ?? "planned") as Initiative["status"],
                    startDate: nullToUndef(i.startDate),
                    endDate: nullToUndef(i.endDate),
                })),
                activities: freshData.activities.map(a => ({
                    id: a.id,
                    name: a.name,
                    description: nullToUndef(a.description),
                    parentId: nullToUndef(a.parentId),
                    initiativeId: nullToUndef(a.initiativeId),
                    blockedBy: a.blockedBy ? JSON.parse(a.blockedBy) : undefined,
                    status: (a.status ?? "backlog") as Activity["status"],
                })),
                roles: freshData.roles.map(r => ({
                    id: r.id,
                    name: r.name,
                    description: nullToUndef(r.description),
                })),
                assignments: freshData.assignments.map(a => ({
                    id: a.id,
                    activityId: a.activityId,
                    roleId: a.roleId,
                    quantity: a.quantity,
                    unit: a.unit ?? "fte",
                    raciType: (a.raciType ?? "responsible") as Assignment["raciType"],
                })),
                allocations: freshData.allocations.map(a => ({
                    id: a.id,
                    assignmentId: a.assignmentId,
                    personId: a.personId,
                    quantityContributed: a.quantityContributed,
                    startDate: nullToUndef(a.startDate),
                    endDate: nullToUndef(a.endDate),
                })),
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ========================================================================
    // Services
    // ========================================================================
    const createService = useCallback(async (service: Omit<Service, "id">): Promise<string> => {
        const newService = await actions.createServiceAction({
            name: service.name,
            description: service.description,
            status: service.status,
            isProduct: service.isProduct,
            isService: service.isService,
        });
        setData(prev => ({
            ...prev,
            services: [...prev.services, { ...service, id: newService.id, status: newService.status as Service["status"] }],
        }));
        logAction('create', 'service', newService.id);
        return newService.id;
    }, [logAction]);

    const updateService = useCallback(async (id: string, updates: Partial<Service>): Promise<void> => {
        const oldService = data.services.find(s => s.id === id);
        await actions.updateServiceAction(id, updates);
        setData(prev => ({
            ...prev,
            services: prev.services.map(s => s.id === id ? { ...s, ...updates } : s),
        }));
        if (oldService) {
            const changes = computeChanges(oldService as unknown as Record<string, unknown>, { ...oldService, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'service', id, changes);
        }
    }, [data.services, logAction]);

    const deleteService = useCallback(async (id: string): Promise<void> => {
        await actions.deleteServiceAction(id);
        setData(prev => ({
            ...prev,
            services: prev.services.filter(s => s.id !== id),
        }));
        logAction('delete', 'service', id);
    }, [logAction]);

    // ========================================================================
    // Projects
    // ========================================================================
    const createProject = useCallback(async (project: Omit<Project, "id">): Promise<string> => {
        const newProject = await actions.createProjectAction({
            name: project.name,
            description: project.description,
            serviceId: project.serviceId,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
        });
        setData(prev => ({
            ...prev,
            projects: [...prev.projects, { ...project, id: newProject.id }],
        }));
        logAction('create', 'project', newProject.id);
        return newProject.id;
    }, [logAction]);

    const updateProject = useCallback(async (id: string, updates: Partial<Project>): Promise<void> => {
        const oldProject = data.projects.find(p => p.id === id);
        await actions.updateProjectAction(id, updates);
        setData(prev => ({
            ...prev,
            projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p),
        }));
        if (oldProject) {
            const changes = computeChanges(oldProject as unknown as Record<string, unknown>, { ...oldProject, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'project', id, changes);
        }
    }, [data.projects, logAction]);

    const deleteProject = useCallback(async (id: string): Promise<void> => {
        await actions.deleteProjectAction(id);
        setData(prev => ({
            ...prev,
            projects: prev.projects.filter(p => p.id !== id),
        }));
        logAction('delete', 'project', id);
    }, [logAction]);

    // ========================================================================
    // Objectives
    // ========================================================================
    const createObjective = useCallback(async (objective: Omit<Objective, "id">): Promise<string> => {
        const newObjective = await actions.createObjectiveAction({
            title: objective.title,
            description: objective.description,
            projectId: objective.projectId,
            parentId: objective.parentId,
            status: objective.status,
        });
        setData(prev => ({
            ...prev,
            objectives: [...prev.objectives, { ...objective, id: newObjective.id }],
        }));
        logAction('create', 'objective', newObjective.id);
        return newObjective.id;
    }, [logAction]);

    const updateObjective = useCallback(async (id: string, updates: Partial<Objective>): Promise<void> => {
        const oldObjective = data.objectives.find(o => o.id === id);
        await actions.updateObjectiveAction(id, updates);
        setData(prev => ({
            ...prev,
            objectives: prev.objectives.map(o => o.id === id ? { ...o, ...updates } : o),
        }));
        if (oldObjective) {
            const changes = computeChanges(oldObjective as unknown as Record<string, unknown>, { ...oldObjective, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'objective', id, changes);
        }
    }, [data.objectives, logAction]);

    const deleteObjective = useCallback(async (id: string): Promise<void> => {
        await actions.deleteObjectiveAction(id);
        setData(prev => ({
            ...prev,
            objectives: prev.objectives.filter(o => o.id !== id),
        }));
        logAction('delete', 'objective', id);
    }, [logAction]);

    // ========================================================================
    // Features
    // ========================================================================
    const createFeature = useCallback(async (feature: Omit<Feature, "id">): Promise<string> => {
        const newFeature = await actions.createFeatureAction({
            name: feature.name,
            description: feature.description,
            objectiveId: feature.objectiveId,
            status: feature.status,
        });
        setData(prev => ({
            ...prev,
            features: [...prev.features, { ...feature, id: newFeature.id }],
        }));
        logAction('create', 'feature', newFeature.id);
        return newFeature.id;
    }, [logAction]);

    const updateFeature = useCallback(async (id: string, updates: Partial<Feature>): Promise<void> => {
        const oldFeature = data.features.find(f => f.id === id);
        await actions.updateFeatureAction(id, updates);
        setData(prev => ({
            ...prev,
            features: prev.features.map(f => f.id === id ? { ...f, ...updates } : f),
        }));
        if (oldFeature) {
            const changes = computeChanges(oldFeature as unknown as Record<string, unknown>, { ...oldFeature, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'feature', id, changes);
        }
    }, [data.features, logAction]);

    const deleteFeature = useCallback(async (id: string): Promise<void> => {
        await actions.deleteFeatureAction(id);
        setData(prev => ({
            ...prev,
            features: prev.features.filter(f => f.id !== id),
        }));
        logAction('delete', 'feature', id);
    }, [logAction]);

    // ========================================================================
    // Metrics
    // ========================================================================
    const createMetric = useCallback(async (metric: Omit<Metric, "id">): Promise<string> => {
        const newMetric = await actions.createMetricAction({
            name: metric.name,
            description: metric.description,
            unit: metric.unit,
            currentValue: metric.currentValue,
            source: metric.source,
        });
        setData(prev => ({
            ...prev,
            metrics: [...prev.metrics, { ...metric, id: newMetric.id }],
        }));
        logAction('create', 'metric', newMetric.id);
        return newMetric.id;
    }, [logAction]);

    const updateMetric = useCallback(async (id: string, updates: Partial<Metric>): Promise<void> => {
        const oldMetric = data.metrics.find(m => m.id === id);
        await actions.updateMetricAction(id, updates);
        setData(prev => ({
            ...prev,
            metrics: prev.metrics.map(m => m.id === id ? { ...m, ...updates } : m),
        }));
        if (oldMetric) {
            const changes = computeChanges(oldMetric as unknown as Record<string, unknown>, { ...oldMetric, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'metric', id, changes);
        }
    }, [data.metrics, logAction]);

    const deleteMetric = useCallback(async (id: string): Promise<void> => {
        await actions.deleteMetricAction(id);
        setData(prev => ({
            ...prev,
            metrics: prev.metrics.filter(m => m.id !== id),
        }));
        logAction('delete', 'metric', id);
    }, [logAction]);

    // ========================================================================
    // KPIs
    // ========================================================================
    const createKPI = useCallback(async (kpi: Omit<KPI, "id">): Promise<string> => {
        const newKPI = await actions.createKPIAction({
            metricId: kpi.metricId,
            objectiveId: kpi.objectiveId,
            targetValue: kpi.targetValue,
            direction: kpi.direction,
            thresholdWarning: kpi.thresholdWarning,
            thresholdCritical: kpi.thresholdCritical,
        });
        setData(prev => ({
            ...prev,
            kpis: [...prev.kpis, { ...kpi, id: newKPI.id }],
        }));
        logAction('create', 'kpi', newKPI.id);
        return newKPI.id;
    }, [logAction]);

    const updateKPI = useCallback(async (id: string, updates: Partial<KPI>): Promise<void> => {
        const oldKPI = data.kpis.find(k => k.id === id);
        await actions.updateKPIAction(id, updates);
        setData(prev => ({
            ...prev,
            kpis: prev.kpis.map(k => k.id === id ? { ...k, ...updates } : k),
        }));
        if (oldKPI) {
            const changes = computeChanges(oldKPI as unknown as Record<string, unknown>, { ...oldKPI, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'kpi', id, changes);
        }
    }, [data.kpis, logAction]);

    const deleteKPI = useCallback(async (id: string): Promise<void> => {
        await actions.deleteKPIAction(id);
        setData(prev => ({
            ...prev,
            kpis: prev.kpis.filter(k => k.id !== id),
        }));
        logAction('delete', 'kpi', id);
    }, [logAction]);

    // ========================================================================
    // Initiatives
    // ========================================================================
    const createInitiative = useCallback(async (initiative: Omit<Initiative, "id">): Promise<string> => {
        const newInitiative = await actions.createInitiativeAction({
            name: initiative.name,
            description: initiative.description,
            kpiId: initiative.kpiId,
            status: initiative.status,
            startDate: initiative.startDate,
            endDate: initiative.endDate,
        });
        setData(prev => ({
            ...prev,
            initiatives: [...prev.initiatives, { ...initiative, id: newInitiative.id }],
        }));
        logAction('create', 'initiative', newInitiative.id);
        return newInitiative.id;
    }, [logAction]);

    const updateInitiative = useCallback(async (id: string, updates: Partial<Initiative>): Promise<void> => {
        const oldInitiative = data.initiatives.find(i => i.id === id);
        await actions.updateInitiativeAction(id, updates);
        setData(prev => ({
            ...prev,
            initiatives: prev.initiatives.map(i => i.id === id ? { ...i, ...updates } : i),
        }));
        if (oldInitiative) {
            const changes = computeChanges(oldInitiative as unknown as Record<string, unknown>, { ...oldInitiative, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'initiative', id, changes);
        }
    }, [data.initiatives, logAction]);

    const deleteInitiative = useCallback(async (id: string): Promise<void> => {
        await actions.deleteInitiativeAction(id);
        setData(prev => ({
            ...prev,
            initiatives: prev.initiatives.filter(i => i.id !== id),
        }));
        logAction('delete', 'initiative', id);
    }, [logAction]);

    // ========================================================================
    // Activities
    // ========================================================================
    const createActivity = useCallback(async (activity: Omit<Activity, "id">): Promise<string> => {
        const newActivity = await actions.createActivityAction({
            name: activity.name,
            description: activity.description,
            parentId: activity.parentId,
            initiativeId: activity.initiativeId,
            blockedBy: activity.blockedBy ? JSON.stringify(activity.blockedBy) : undefined,
            status: activity.status,
        });
        setData(prev => ({
            ...prev,
            activities: [...prev.activities, { ...activity, id: newActivity.id }],
        }));
        logAction('create', 'activity', newActivity.id);
        return newActivity.id;
    }, [logAction]);

    const updateActivity = useCallback(async (id: string, updates: Partial<Activity>): Promise<void> => {
        const oldActivity = data.activities.find(a => a.id === id);
        const dbUpdates = {
            ...updates,
            blockedBy: updates.blockedBy ? JSON.stringify(updates.blockedBy) : undefined,
        };
        await actions.updateActivityAction(id, dbUpdates);
        setData(prev => ({
            ...prev,
            activities: prev.activities.map(a => a.id === id ? { ...a, ...updates } : a),
        }));
        if (oldActivity) {
            const changes = computeChanges(oldActivity as unknown as Record<string, unknown>, { ...oldActivity, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'activity', id, changes);
        }
    }, [data.activities, logAction]);

    const deleteActivity = useCallback(async (id: string): Promise<void> => {
        await actions.deleteActivityAction(id);
        setData(prev => ({
            ...prev,
            activities: prev.activities.filter(a => a.id !== id),
        }));
        logAction('delete', 'activity', id);
    }, [logAction]);

    // ========================================================================
    // Roles
    // ========================================================================
    const createRole = useCallback(async (role: Omit<Role, "id">): Promise<string> => {
        const newRole = await actions.createRoleAction({
            name: role.name,
            description: role.description,
        });
        setData(prev => ({
            ...prev,
            roles: [...prev.roles, { ...role, id: newRole.id }],
        }));
        logAction('create', 'role', newRole.id);
        return newRole.id;
    }, [logAction]);

    const updateRole = useCallback(async (id: string, updates: Partial<Role>): Promise<void> => {
        const oldRole = data.roles.find(r => r.id === id);
        await actions.updateRoleAction(id, updates);
        setData(prev => ({
            ...prev,
            roles: prev.roles.map(r => r.id === id ? { ...r, ...updates } : r),
        }));
        if (oldRole) {
            const changes = computeChanges(oldRole as unknown as Record<string, unknown>, { ...oldRole, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'role', id, changes);
        }
    }, [data.roles, logAction]);

    const deleteRole = useCallback(async (id: string): Promise<void> => {
        await actions.deleteRoleAction(id);
        setData(prev => ({
            ...prev,
            roles: prev.roles.filter(r => r.id !== id),
        }));
        logAction('delete', 'role', id);
    }, [logAction]);

    // ========================================================================
    // Assignments
    // ========================================================================
    const createAssignment = useCallback(async (assignment: Omit<Assignment, "id">): Promise<string> => {
        const newAssignment = await actions.createAssignmentAction({
            activityId: assignment.activityId,
            roleId: assignment.roleId,
            quantity: assignment.quantity,
            unit: assignment.unit,
            raciType: assignment.raciType,
        });
        setData(prev => ({
            ...prev,
            assignments: [...prev.assignments, { ...assignment, id: newAssignment.id }],
        }));
        logAction('create', 'assignment', newAssignment.id);
        return newAssignment.id;
    }, [logAction]);

    const updateAssignment = useCallback(async (id: string, updates: Partial<Assignment>): Promise<void> => {
        const oldAssignment = data.assignments.find(a => a.id === id);
        await actions.updateAssignmentAction(id, updates);
        setData(prev => ({
            ...prev,
            assignments: prev.assignments.map(a => a.id === id ? { ...a, ...updates } : a),
        }));
        if (oldAssignment) {
            const changes = computeChanges(oldAssignment as unknown as Record<string, unknown>, { ...oldAssignment, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'assignment', id, changes);
        }
    }, [data.assignments, logAction]);

    const deleteAssignment = useCallback(async (id: string): Promise<void> => {
        await actions.deleteAssignmentAction(id);
        setData(prev => ({
            ...prev,
            assignments: prev.assignments.filter(a => a.id !== id),
        }));
        logAction('delete', 'assignment', id);
    }, [logAction]);

    // ========================================================================
    // Allocations
    // ========================================================================
    const createAllocation = useCallback(async (allocation: Omit<Allocation, "id">): Promise<string> => {
        const newAllocation = await actions.createAllocationAction({
            assignmentId: allocation.assignmentId,
            personId: allocation.personId,
            quantityContributed: allocation.quantityContributed,
            startDate: allocation.startDate,
            endDate: allocation.endDate,
        });
        setData(prev => ({
            ...prev,
            allocations: [...prev.allocations, { ...allocation, id: newAllocation.id }],
        }));
        logAction('create', 'allocation', newAllocation.id);
        return newAllocation.id;
    }, [logAction]);

    const updateAllocation = useCallback(async (id: string, updates: Partial<Allocation>): Promise<void> => {
        const oldAllocation = data.allocations.find(a => a.id === id);
        await actions.updateAllocationAction(id, updates);
        setData(prev => ({
            ...prev,
            allocations: prev.allocations.map(a => a.id === id ? { ...a, ...updates } : a),
        }));
        if (oldAllocation) {
            const changes = computeChanges(oldAllocation as unknown as Record<string, unknown>, { ...oldAllocation, ...updates } as unknown as Record<string, unknown>);
            logAction('update', 'allocation', id, changes);
        }
    }, [data.allocations, logAction]);

    const deleteAllocation = useCallback(async (id: string): Promise<void> => {
        await actions.deleteAllocationAction(id);
        setData(prev => ({
            ...prev,
            allocations: prev.allocations.filter(a => a.id !== id),
        }));
        logAction('delete', 'allocation', id);
    }, [logAction]);

    return (
        <ProjectDataContext.Provider
            value={{
                data,
                isLoading,
                isPending,
                createService,
                updateService,
                deleteService,
                createProject,
                updateProject,
                deleteProject,
                createObjective,
                updateObjective,
                deleteObjective,
                createFeature,
                updateFeature,
                deleteFeature,
                createMetric,
                updateMetric,
                deleteMetric,
                createKPI,
                updateKPI,
                deleteKPI,
                createInitiative,
                updateInitiative,
                deleteInitiative,
                createActivity,
                updateActivity,
                deleteActivity,
                createRole,
                updateRole,
                deleteRole,
                createAssignment,
                updateAssignment,
                deleteAssignment,
                createAllocation,
                updateAllocation,
                deleteAllocation,
                refreshData,
            }}
        >
            {children}
        </ProjectDataContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

export function useProjectData(): ProjectDataContextValue {
    const context = useContext(ProjectDataContext);
    if (context === undefined) {
        throw new Error("useProjectData must be used within a ProjectDataProvider");
    }
    return context;
}
