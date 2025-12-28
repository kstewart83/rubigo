/**
 * VDI Module Index
 *
 * Re-exports all VDI functionality
 */

export {
    ensureCloudHypervisor,
    getCloudHypervisorPath,
    getCloudHypervisorInfo,
    isCloudHypervisorInstalled,
    verifyCloudHypervisor,
} from "./cloud-hypervisor";

export {
    createVm,
    startVm,
    stopVm,
    destroyVm,
    getVm,
    listVms,
    getVmStatus,
    isVmRunning,
    type VmConfig,
} from "./vm-manager";
