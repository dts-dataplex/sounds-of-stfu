/**
 * Device Capability Detection for AI Features
 * Determines if device can run local ML inference efficiently
 */

export const AI_CONFIG = {
  // Sentiment analysis (DistilBERT ~67MB)
  minMemoryGB: 2, // Lowered: navigator.deviceMemory reports rounded values (2, 4, 8)
  minCPUCores: 2, // Lowered: allow dual-core devices
  defaultMemoryGB: 4, // Assume when API unavailable
  defaultCPUCores: 4,
};

// Speech-to-text (Whisper ~39MB + audio processing)
export const STT_CONFIG = {
  minMemoryGB: 4, // Whisper needs more memory for audio processing
  minCPUCores: 4, // Recommend 4+ cores for real-time transcription
  defaultMemoryGB: 4,
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
 * Detect if device is capable of running speech-to-text (Whisper)
 * STT has higher requirements than sentiment analysis
 * @returns {Promise<{capable: boolean, reason: string|null, specs: object}>}
 */
export async function detectSTTCapability() {
  // Get device specs (with fallbacks)
  const memoryGB = navigator.deviceMemory || STT_CONFIG.defaultMemoryGB;
  const cpuCores = navigator.hardwareConcurrency || STT_CONFIG.defaultCPUCores;

  const specs = {
    memoryGB,
    cpuCores,
    memoryAPIAvailable: 'deviceMemory' in navigator,
    cpuAPIAvailable: 'hardwareConcurrency' in navigator,
  };

  // Check minimum requirements for STT
  if (memoryGB < STT_CONFIG.minMemoryGB) {
    return {
      capable: false,
      reason: `Insufficient memory for STT: ${memoryGB}GB (minimum: ${STT_CONFIG.minMemoryGB}GB)`,
      specs,
    };
  }

  if (cpuCores < STT_CONFIG.minCPUCores) {
    return {
      capable: false,
      reason: `Insufficient CPU cores for STT: ${cpuCores} (minimum: ${STT_CONFIG.minCPUCores})`,
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

/**
 * Get STT feature status for display
 * @returns {Promise<string>}
 */
export async function getSTTStatusMessage() {
  const { capable, reason, specs } = await detectSTTCapability();

  if (capable) {
    return `Speech-to-text available (${specs.memoryGB}GB RAM, ${specs.cpuCores} cores)`;
  }

  return `Speech-to-text disabled: ${reason}`;
}
