/**
 * Access Control Module
 *
 * Re-exports all access control types and functions for convenient imports.
 */

// Types
export type {
    AccessControlObject,
    AccessDecision,
    ClassificationGuide,
    ClassificationGuideStatus,
    SecurityContextObject,
    SensitivityGuidance,
    SensitivityLevel,
    Subject,
} from "./types";

// Constants
export {
    DEFAULT_ACO,
    SENSITIVITY_ORDER,
} from "./types";

// Type helpers
export {
    formatTenantClearance,
    parseTenantClearance,
    sensitivityIndex,
} from "./types";

// Decision functions
export {
    canAccess,
    canModifyACO,
    filterByAccess,
} from "./decision";

// Session resolution
export {
    createDevSubject,
    createTestSubject,
    resolveSubjectFromPersona,
} from "./session-resolver";
