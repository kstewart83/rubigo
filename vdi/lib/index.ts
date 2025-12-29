/**
 * VDI Orchestration Library
 * 
 * TypeScript implementation of VDI image building and VM management.
 * Replaces bash scripts with programmatic control.
 */

// Types
export * from "./types";

// SSH Client
export { sshExec, scpTo, waitForSsh, getLocalSshConfig } from "./ssh-client";
export type { SshConfig } from "./ssh-client";

// Template Builder
export { buildTemplate, templateExists, getTemplatePath } from "./template-builder";

// Image Baker
export { bakeImage, verifyBake } from "./image-baker";
export type { BakeOptions } from "./image-baker";

// Image Finalizer
export { finalizeImage, getImageInfo, cleanupBackups } from "./image-finalizer";
export { isVmRunning } from "./image-finalizer"; // Use finalizer version (simpler check)
export type { FinalizeOptions, FinalizeResult } from "./image-finalizer";

// VM Controller
export {
    startVm,
    startVmBakeMode,
    startVmFromGolden,
    startVmDevMode,
    stopVm,
    getVmStatus,
    waitForVmReady,
} from "./vm-controller";
export type { VmOptions } from "./vm-controller";

