/**
 * EncryptionLayer - E2E encryption for peer connections
 * Uses WebCrypto API for browser-native encryption
 * Basic implementation for MVP (can be enhanced later)
 */

export default class EncryptionLayer {
  constructor() {
    this.keyPair = null;
    this.peerKeys = new Map(); // peerId -> public key
    this.algorithm = {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    };
  }

  /**
   * Generate RSA key pair for this peer
   */
  async generateKeyPair() {
    console.log('[EncryptionLayer] Generating key pair...');

    this.keyPair = await window.crypto.subtle.generateKey(
      this.algorithm,
      true, // extractable
      ['encrypt', 'decrypt']
    );

    console.log('[EncryptionLayer] Key pair generated');
    return this.keyPair.publicKey;
  }

  /**
   * Export public key for sharing with peers
   */
  async exportPublicKey() {
    if (!this.keyPair) {
      await this.generateKeyPair();
    }

    const exported = await window.crypto.subtle.exportKey('spki', this.keyPair.publicKey);

    // Convert to base64 for transmission
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Import and store a peer's public key
   */
  async storePeerPublicKey(peerId, publicKeyBase64) {
    // Convert from base64
    const binaryKey = atob(publicKeyBase64);
    const keyData = new Uint8Array(binaryKey.length);
    for (let i = 0; i < binaryKey.length; i++) {
      keyData[i] = binaryKey.charCodeAt(i);
    }

    // Import the key
    const publicKey = await window.crypto.subtle.importKey('spki', keyData, this.algorithm, true, [
      'encrypt',
    ]);

    this.peerKeys.set(peerId, publicKey);
    console.log(`[EncryptionLayer] Stored public key for peer: ${peerId}`);
  }

  /**
   * Encrypt message for specific peer
   */
  async encryptMessage(message, recipientPeerId) {
    const publicKey = this.peerKeys.get(recipientPeerId);
    if (!publicKey) {
      throw new Error(`No public key for peer: ${recipientPeerId}`);
    }

    // Convert message to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(message));

    // Encrypt
    const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data);

    // Convert to base64 for transmission
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  /**
   * Decrypt message from peer
   */
  async decryptMessage(encryptedBase64, _senderPeerId) {
    if (!this.keyPair) {
      throw new Error('Key pair not initialized');
    }

    // Convert from base64
    const binaryData = atob(encryptedBase64);
    const encrypted = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      encrypted[i] = binaryData.charCodeAt(i);
    }

    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      this.keyPair.privateKey,
      encrypted
    );

    // Convert back to string and parse JSON
    const decoder = new TextDecoder();
    const messageStr = decoder.decode(decrypted);
    return JSON.parse(messageStr);
  }

  /**
   * Exchange keys with a peer
   * Returns promise that resolves when exchange is complete
   */
  async exchangeKeys(peerId, sendKeyCallback) {
    // Export our public key
    const ourPublicKey = await this.exportPublicKey();

    // Send to peer and get their key back
    const peerPublicKey = await sendKeyCallback(ourPublicKey);

    // Store peer's key
    await this.storePeerPublicKey(peerId, peerPublicKey);

    console.log(`[EncryptionLayer] Key exchange complete with ${peerId}`);
  }

  /**
   * Remove peer's key on disconnect
   */
  removePeerKey(peerId) {
    this.peerKeys.delete(peerId);
    console.log(`[EncryptionLayer] Removed key for peer: ${peerId}`);
  }

  /**
   * Clean up all keys
   */
  destroy() {
    this.keyPair = null;
    this.peerKeys.clear();
    console.log('[EncryptionLayer] Cleaned up all keys');
  }
}
