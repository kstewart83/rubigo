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
    formatCompartmentClearance,
    parseCompartmentClearance,
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

// ACO Registry (normalized)
export {
    canonicalizeAco,
    hashAco,
    getOrCreateAcoId,
    getAcoById,
    type AcoInput,
} from "./aco-registry";

// Session Manager
export {
    getOrCreateSession,
    isSessionStale,
    refreshSessionAcos,
    ensureFreshSession,
    type SecuritySession,
} from "./session-manager";

// Secure Extensions
export {
    getExtension,
    setExtension,
    getDescription,
    setDescription,
    deleteExtension,
    type ExtensionResult,
    type ExtensionType,
} from "./secure-extensions";
