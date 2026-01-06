/**
 * Device Capability Detection for AI Features
 * Determines if device can run local ML inference efficiently
 */

export const AI_CONFIG = {
  minMemoryGB: 2, // Lowered: navigator.deviceMemory reports rounded values (2, 4, 8)
  minCPUCores: 2, // Lowered: allow dual-core devices
  defaultMemoryGB: 4, // Assume when API unavailable
  defaultCPUCores: 4,
};

/**
 * Detect if device is capable of running AI features
 * @returns {Promise<{capable: boolean, reason: string|null, specs: object}>}
 */
export async function detectAICapability() {
  // Get device specs (with fallbacks)
  const memoryGB = navigator.deviceMemory || AI_CONFIG.defaultMemoryGB;
  const cpuCores = navigator.hardwareConcurrency || AI_CONFIG.defaultCPUCores;

  const specs = {
    memoryGB,
    cpuCores,
    memoryAPIAvailable: 'deviceMemory' in navigator,
    cpuAPIAvailable: 'hardwareConcurrency' in navigator,
  };

  // Check minimum requirements
  if (memoryGB < AI_CONFIG.minMemoryGB) {
    return {
      capable: false,
      reason: `Insufficient memory: ${memoryGB}GB (minimum: ${AI_CONFIG.minMemoryGB}GB)`,
      specs,
    };
  }

  if (cpuCores < AI_CONFIG.minCPUCores) {
    return {
      capable: false,
      reason: `Insufficient CPU cores: ${cpuCores} (minimum: ${AI_CONFIG.minCPUCores})`,
      specs,
    };
  }

  return {
    capable: true,
    reason: null,
    specs,
  };
}

/**
 * Get AI feature status for display
 * @returns {Promise<string>}
 */
export async function getAIStatusMessage() {
  const { capable, reason, specs } = await detectAICapability();

  if (capable) {
    return `AI features available (${specs.memoryGB}GB RAM, ${specs.cpuCores} cores)`;
  }

  return `AI features disabled: ${reason}`;
}
