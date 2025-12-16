"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
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

// Generate a simple 6-char hex ID
function generateId(): string {
    return Math.random().toString(16).substring(2, 8);
}

// ============================================================================
// Context Types
// ============================================================================

interface ProjectDataContextValue {
    data: ProjectData;
    isLoading: boolean;

    // Services
    updateService: (id: string, updates: Partial<Service>) => void;
    createService: (service: Omit<Service, "id">) => string;
    deleteService: (id: string) => void;

    // Projects
    updateProject: (id: string, updates: Partial<Project>) => void;
    createProject: (project: Omit<Project, "id">) => string;
    deleteProject: (id: string) => void;

    // Objectives
    updateObjective: (id: string, updates: Partial<Objective>) => void;
    createObjective: (objective: Omit<Objective, "id">) => string;
    deleteObjective: (id: string) => void;

    // Features
    updateFeature: (id: string, updates: Partial<Feature>) => void;
    createFeature: (feature: Omit<Feature, "id">) => string;
    deleteFeature: (id: string) => void;

    // Metrics
    updateMetric: (id: string, updates: Partial<Metric>) => void;
    createMetric: (metric: Omit<Metric, "id">) => string;
    deleteMetric: (id: string) => void;

    // KPIs
    updateKPI: (id: string, updates: Partial<KPI>) => void;
    createKPI: (kpi: Omit<KPI, "id">) => string;
    deleteKPI: (id: string) => void;

    // Initiatives
    updateInitiative: (id: string, updates: Partial<Initiative>) => void;
    createInitiative: (initiative: Omit<Initiative, "id">) => string;
    deleteInitiative: (id: string) => void;

    // Activities
    updateActivity: (id: string, updates: Partial<Activity>) => void;
    createActivity: (activity: Omit<Activity, "id">) => string;
    deleteActivity: (id: string) => void;

    // Roles
    updateRole: (id: string, updates: Partial<Role>) => void;
    createRole: (role: Omit<Role, "id">) => string;
    deleteRole: (id: string) => void;

    // Assignments
    updateAssignment: (id: string, updates: Partial<Assignment>) => void;
    createAssignment: (assignment: Omit<Assignment, "id">) => string;
    deleteAssignment: (id: string) => void;

    // Allocations
    updateAllocation: (id: string, updates: Partial<Allocation>) => void;
    createAllocation: (allocation: Omit<Allocation, "id">) => string;
    deleteAllocation: (id: string) => void;

    // Utility
    exportToTOML: () => string;
    hasUnsavedChanges: boolean;
}

const ProjectDataContext = createContext<ProjectDataContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface ProjectDataProviderProps {
    children: ReactNode;
    initialData: ProjectData;
}

export function ProjectDataProvider({ children, initialData }: ProjectDataProviderProps) {
    const [data, setData] = useState<ProjectData>(initialData);
    const [originalData] = useState<ProjectData>(initialData);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Check if data has changed from original
    const hasUnsavedChanges = JSON.stringify(data) !== JSON.stringify(originalData);

    // Generic update helper
    const updateEntity = useCallback(<T extends { id: string }>(
        key: keyof ProjectData,
        id: string,
        updates: Partial<T>
    ) => {
        setData((prev) => ({
            ...prev,
            [key]: (prev[key] as unknown as T[]).map((item) =>
                item.id === id ? { ...item, ...updates } : item
            ),
        }));
    }, []);

    // Generic create helper
    const createEntity = useCallback(<T extends { id: string }>(
        key: keyof ProjectData,
        entity: Omit<T, "id">
    ): string => {
        const id = generateId();
        setData((prev) => ({
            ...prev,
            [key]: [...(prev[key] as unknown as T[]), { ...entity, id } as T],
        }));
        return id;
    }, []);

    // Generic delete helper
    const deleteEntity = useCallback(<T extends { id: string }>(
        key: keyof ProjectData,
        id: string
    ) => {
        setData((prev) => ({
            ...prev,
            [key]: (prev[key] as unknown as T[]).filter((item) => item.id !== id),
        }));
    }, []);

    // Services
    const updateService = useCallback((id: string, updates: Partial<Service>) => {
        updateEntity<Service>("services", id, updates);
    }, [updateEntity]);

    const createService = useCallback((service: Omit<Service, "id">): string => {
        return createEntity<Service>("services", service);
    }, [createEntity]);

    const deleteService = useCallback((id: string) => {
        deleteEntity<Service>("services", id);
    }, [deleteEntity]);

    // Projects
    const updateProject = useCallback((id: string, updates: Partial<Project>) => {
        updateEntity<Project>("projects", id, updates);
    }, [updateEntity]);

    const createProject = useCallback((project: Omit<Project, "id">): string => {
        return createEntity<Project>("projects", project);
    }, [createEntity]);

    const deleteProject = useCallback((id: string) => {
        deleteEntity<Project>("projects", id);
    }, [deleteEntity]);

    // Objectives
    const updateObjective = useCallback((id: string, updates: Partial<Objective>) => {
        updateEntity<Objective>("objectives", id, updates);
    }, [updateEntity]);

    const createObjective = useCallback((objective: Omit<Objective, "id">): string => {
        return createEntity<Objective>("objectives", objective);
    }, [createEntity]);

    const deleteObjective = useCallback((id: string) => {
        deleteEntity<Objective>("objectives", id);
    }, [deleteEntity]);

    // Features
    const updateFeature = useCallback((id: string, updates: Partial<Feature>) => {
        updateEntity<Feature>("features", id, updates);
    }, [updateEntity]);

    const createFeature = useCallback((feature: Omit<Feature, "id">): string => {
        return createEntity<Feature>("features", feature);
    }, [createEntity]);

    const deleteFeature = useCallback((id: string) => {
        deleteEntity<Feature>("features", id);
    }, [deleteEntity]);

    // Metrics
    const updateMetric = useCallback((id: string, updates: Partial<Metric>) => {
        updateEntity<Metric>("metrics", id, updates);
    }, [updateEntity]);

    const createMetric = useCallback((metric: Omit<Metric, "id">): string => {
        return createEntity<Metric>("metrics", metric);
    }, [createEntity]);

    const deleteMetric = useCallback((id: string) => {
        deleteEntity<Metric>("metrics", id);
    }, [deleteEntity]);

    // KPIs
    const updateKPI = useCallback((id: string, updates: Partial<KPI>) => {
        updateEntity<KPI>("kpis", id, updates);
    }, [updateEntity]);

    const createKPI = useCallback((kpi: Omit<KPI, "id">): string => {
        return createEntity<KPI>("kpis", kpi);
    }, [createEntity]);

    const deleteKPI = useCallback((id: string) => {
        deleteEntity<KPI>("kpis", id);
    }, [deleteEntity]);

    // Initiatives
    const updateInitiative = useCallback((id: string, updates: Partial<Initiative>) => {
        updateEntity<Initiative>("initiatives", id, updates);
    }, [updateEntity]);

    const createInitiative = useCallback((initiative: Omit<Initiative, "id">): string => {
        return createEntity<Initiative>("initiatives", initiative);
    }, [createEntity]);

    const deleteInitiative = useCallback((id: string) => {
        deleteEntity<Initiative>("initiatives", id);
    }, [deleteEntity]);

    // Activities
    const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
        updateEntity<Activity>("activities", id, updates);
    }, [updateEntity]);

    const createActivity = useCallback((activity: Omit<Activity, "id">): string => {
        return createEntity<Activity>("activities", activity);
    }, [createEntity]);

    const deleteActivity = useCallback((id: string) => {
        deleteEntity<Activity>("activities", id);
    }, [deleteEntity]);

    // Roles
    const updateRole = useCallback((id: string, updates: Partial<Role>) => {
        updateEntity<Role>("roles", id, updates);
    }, [updateEntity]);

    const createRole = useCallback((role: Omit<Role, "id">): string => {
        return createEntity<Role>("roles", role);
    }, [createEntity]);

    const deleteRole = useCallback((id: string) => {
        deleteEntity<Role>("roles", id);
    }, [deleteEntity]);

    // Assignments
    const updateAssignment = useCallback((id: string, updates: Partial<Assignment>) => {
        updateEntity<Assignment>("assignments", id, updates);
    }, [updateEntity]);

    const createAssignment = useCallback((assignment: Omit<Assignment, "id">): string => {
        return createEntity<Assignment>("assignments", assignment);
    }, [createEntity]);

    const deleteAssignment = useCallback((id: string) => {
        deleteEntity<Assignment>("assignments", id);
    }, [deleteEntity]);

    // Allocations
    const updateAllocation = useCallback((id: string, updates: Partial<Allocation>) => {
        updateEntity<Allocation>("allocations", id, updates);
    }, [updateEntity]);

    const createAllocation = useCallback((allocation: Omit<Allocation, "id">): string => {
        return createEntity<Allocation>("allocations", allocation);
    }, [createEntity]);

    const deleteAllocation = useCallback((id: string) => {
        deleteEntity<Allocation>("allocations", id);
    }, [deleteEntity]);

    // Export to TOML format
    const exportToTOML = useCallback((): string => {
        const toSnakeCase = (str: string) =>
            str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

        const formatValue = (value: unknown): string => {
            if (typeof value === "string") return `"${value}"`;
            if (typeof value === "number") return String(value);
            if (typeof value === "boolean") return String(value);
            if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`;
            return String(value);
        };

        const formatEntity = (entity: Record<string, unknown>): string => {
            return Object.entries(entity)
                .filter(([, v]) => v !== undefined && v !== null)
                .map(([k, v]) => `${toSnakeCase(k)} = ${formatValue(v)}`)
                .join("\n");
        };

        let toml = `# Exported Project Management Data\n\n`;

        const sections: [keyof ProjectData, string][] = [
            ["services", "services"],
            ["projects", "projects"],
            ["objectives", "objectives"],
            ["features", "features"],
            ["metrics", "metrics"],
            ["kpis", "kpis"],
            ["initiatives", "initiatives"],
            ["activities", "activities"],
            ["roles", "roles"],
            ["assignments", "assignments"],
            ["allocations", "allocations"],
        ];

        for (const [key, name] of sections) {
            const items = data[key] as unknown as Record<string, unknown>[];
            if (items.length > 0) {
                for (const item of items) {
                    toml += `[[${name}]]\n${formatEntity(item)}\n\n`;
                }
            }
        }

        return toml;
    }, [data]);

    return (
        <ProjectDataContext.Provider
            value={{
                data,
                isLoading,
                hasUnsavedChanges,
                updateService,
                createService,
                deleteService,
                updateProject,
                createProject,
                deleteProject,
                updateObjective,
                createObjective,
                deleteObjective,
                updateFeature,
                createFeature,
                deleteFeature,
                updateMetric,
                createMetric,
                deleteMetric,
                updateKPI,
                createKPI,
                deleteKPI,
                updateInitiative,
                createInitiative,
                deleteInitiative,
                updateActivity,
                createActivity,
                deleteActivity,
                updateRole,
                createRole,
                deleteRole,
                updateAssignment,
                createAssignment,
                deleteAssignment,
                updateAllocation,
                createAllocation,
                deleteAllocation,
                exportToTOML,
            }}
        >
            {children}
        </ProjectDataContext.Provider>
    );
}

export function useProjectData() {
    const context = useContext(ProjectDataContext);
    if (context === undefined) {
        throw new Error("useProjectData must be used within a ProjectDataProvider");
    }
    return context;
}
