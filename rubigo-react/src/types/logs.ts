/**
 * Action Log Types
 * 
 * These types define the structure for audit logging of all CRUD operations.
 * Action logs are persisted alongside other data in the TOML store.
 */

export type ActionType = 'create' | 'read' | 'update' | 'delete';

export type EntityType =
    | 'service'
    | 'project'
    | 'objective'
    | 'feature'
    | 'metric'
    | 'kpi'
    | 'initiative'
    | 'activity'
    | 'role'
    | 'assignment'
    | 'allocation';

export interface FieldChange {
    field: string;
    oldValue: unknown;
    newValue: unknown;
}

export interface ActionLog {
    /** Unique identifier for this log entry */
    id: string;

    /** ISO 8601 timestamp when action occurred */
    timestamp: string;

    /** OpenAPI operationId (e.g., 'createObjective', 'updateService') */
    operationId: string;

    /** Type of entity affected */
    entityType: EntityType;

    /** ID of the affected entity */
    entityId: string;

    /** CRUD action type */
    action: ActionType;

    /** ID of the person who performed the action */
    actorId: string;

    /** Display name of the actor (denormalized for display) */
    actorName: string;

    /** Optional request ID for traceability (from X-Request-ID header) */
    requestId?: string;

    /** Field-level changes for update operations */
    changes?: FieldChange[];

    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Aggregated log data structure (for storage/context)
 */
export interface ActionLogData {
    logs: ActionLog[];
}

/**
 * Input for creating a new action log (ID and timestamp auto-generated)
 */
export type ActionLogInput = Omit<ActionLog, 'id' | 'timestamp'>;
