import { describe, it, expect, beforeEach } from 'vitest';
import EncryptionLayer from './EncryptionLayer.js';

describe('EncryptionLayer', () => {
  let encryption;

  beforeEach(() => {
    encryption = new EncryptionLayer();
  });

  describe('key generation', () => {
    it('should generate RSA key pair', async () => {
      await encryption.generateKeyPair();

      expect(encryption.keyPair).toBeDefined();
      expect(encryption.keyPair.publicKey).toBeDefined();
      expect(encryption.keyPair.privateKey).toBeDefined();
    });

    it('should generate 2048-bit RSA-OAEP keys', async () => {
      await encryption.generateKeyPair();

      const publicKey = encryption.keyPair.publicKey;
      expect(publicKey.algorithm.name).toBe('RSA-OAEP');
      expect(publicKey.algorithm.modulusLength).toBe(2048);
    });
  });

  describe('public key export/import', () => {
    it('should export public key as base64', async () => {
      await encryption.generateKeyPair();
      const exportedKey = await encryption.exportPublicKey();

      expect(typeof exportedKey).toBe('string');
      expect(exportedKey.length).toBeGreaterThan(0);
      // Base64 string should only contain valid base64 characters
      expect(exportedKey).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should import peer public key', async () => {
      // Create another encryption instance as a peer
      const peerEncryption = new EncryptionLayer();
      await peerEncryption.generateKeyPair();
      const peerPublicKey = await peerEncryption.exportPublicKey();

      // Import peer's public key
      await encryption.storePeerPublicKey('peer-123', peerPublicKey);

      expect(encryption.peerKeys.has('peer-123')).toBe(true);
    });

    it('should auto-generate key pair on export if not exists', async () => {
      expect(encryption.keyPair).toBeNull();

      const exportedKey = await encryption.exportPublicKey();

      expect(encryption.keyPair).toBeDefined();
      expect(exportedKey).toBeTruthy();
    });
  });

  describe('message encryption/decryption', () => {
    it('should encrypt and decrypt messages', async () => {
      // Setup two encryption instances
      const alice = new EncryptionLayer();
      const bob = new EncryptionLayer();

      await alice.generateKeyPair();
      await bob.generateKeyPair();

      // Exchange public keys
      const alicePublicKey = await alice.exportPublicKey();
      const bobPublicKey = await bob.exportPublicKey();

      await alice.storePeerPublicKey('bob', bobPublicKey);
      await bob.storePeerPublicKey('alice', alicePublicKey);

      // Alice sends encrypted message to Bob
      const message = { type: 'test', content: 'Hello Bob!' };
      const encrypted = await alice.encryptMessage(message, 'bob');

      expect(typeof encrypted).toBe('string');
      expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64

      // Bob decrypts message from Alice
      const decrypted = await bob.decryptMessage(encrypted, 'alice');

      expect(decrypted).toEqual(message);
    });

    it('should handle complex message objects', async () => {
      const alice = new EncryptionLayer();
      const bob = new EncryptionLayer();

      await alice.generateKeyPair();
      await bob.generateKeyPair();

      await alice.storePeerPublicKey('bob', await bob.exportPublicKey());
      await bob.storePeerPublicKey('alice', await alice.exportPublicKey());

      const complexMessage = {
        type: 'position_update',
        position: { x: 24.5, y: 0, z: 18.3 },
        timestamp: Date.now(),
        metadata: {
          zone: 'bar',
          velocity: [0.1, 0, 0.2],
        },
      };

      const encrypted = await alice.encryptMessage(complexMessage, 'bob');
      const decrypted = await bob.decryptMessage(encrypted, 'alice');

      expect(decrypted).toEqual(complexMessage);
    });

    it('should throw error when encrypting without peer key', async () => {
      await encryption.generateKeyPair();

      const message = { type: 'test' };

      await expect(encryption.encryptMessage(message, 'unknown-peer')).rejects.toThrow(
        'No public key for peer'
      );
    });

    it('should throw error when decrypting without own key pair', async () => {
      await expect(encryption.decryptMessage('encrypted-data', 'peer-123')).rejects.toThrow(
        'Key pair not initialized'
      );
    });
  });

  describe('key management', () => {
    it('should store multiple peer keys', async () => {
      await encryption.generateKeyPair();

      const peer1 = new EncryptionLayer();
      const peer2 = new EncryptionLayer();
      const peer3 = new EncryptionLayer();

      await peer1.generateKeyPair();
      await peer2.generateKeyPair();
      await peer3.generateKeyPair();

      await encryption.storePeerPublicKey('peer-1', await peer1.exportPublicKey());
      await encryption.storePeerPublicKey('peer-2', await peer2.exportPublicKey());
      await encryption.storePeerPublicKey('peer-3', await peer3.exportPublicKey());

      expect(encryption.peerKeys.size).toBe(3);
      expect(encryption.peerKeys.has('peer-1')).toBe(true);
      expect(encryption.peerKeys.has('peer-2')).toBe(true);
      expect(encryption.peerKeys.has('peer-3')).toBe(true);
    });

    it('should remove peer key', () => {
      encryption.peerKeys.set('peer-123', {});
      encryption.removePeerKey('peer-123');

      expect(encryption.peerKeys.has('peer-123')).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should clear all keys', async () => {
      await encryption.generateKeyPair();
      await encryption.storePeerPublicKey('peer-1', await encryption.exportPublicKey());

      encryption.destroy();

      expect(encryption.keyPair).toBeNull();
      expect(encryption.peerKeys.size).toBe(0);
    });
  });
});
