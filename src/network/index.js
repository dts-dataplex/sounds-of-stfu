/**
 * Network Module - Public API
 * Exports the core networking components for P2P mesh communication
 */

export { default as PeerConnectionManager } from './PeerConnectionManager.js';
export { default as AudioStreamManager } from './AudioStreamManager.js';
export { default as MeshNetworkCoordinator } from './MeshNetworkCoordinator.js';
export { default as EncryptionLayer } from './EncryptionLayer.js';
export { default as ConnectionStateMachine, ConnectionState } from './ConnectionStateMachine.js';

/**
 * Convenience function to create a new mesh network
 *
 * @param {Object} config - Configuration options
 * @returns {MeshNetworkCoordinator} Configured mesh network coordinator
 *
 * @example
 * import { createMeshNetwork } from './network/index.js';
 *
 * const network = createMeshNetwork();
 * await network.joinRoom('chatsubo-main-room');
 *
 * network.on('remoteAudioStream', ({ peerId, stream }) => {
 *   // Handle remote audio for spatial processing
 * });
 */
export async function createMeshNetwork(config = {}) {
  const { default: MeshNetworkCoordinator } = await import('./MeshNetworkCoordinator.js');
  return new MeshNetworkCoordinator(config);
}
