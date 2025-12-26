/**
 * Test setup file - runs before all tests
 * Sets up global mocks and test utilities
 */

// Mock Web Crypto API for encryption tests
if (!globalThis.crypto) {
  const { webcrypto } = await import('crypto');
  globalThis.crypto = webcrypto;
}

// Mock Web Audio API
globalThis.AudioContext = class AudioContext {
  constructor() {
    this.destination = {};
    this.state = 'running';
  }

  createMediaStreamSource() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: { value: 1.0 },
    };
  }

  createPanner() {
    return {
      connect: vi.fn(),
      disconnect: vi.fn(),
      setPosition: vi.fn(),
      panningModel: 'HRTF',
      distanceModel: 'inverse',
    };
  }

  resume() {
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
};

// Mock MediaStream
globalThis.MediaStream = class MediaStream {
  constructor() {
    this.id = Math.random().toString(36);
  }

  getTracks() {
    return [];
  }
};

// Mock navigator.mediaDevices
globalThis.navigator = {
  ...globalThis.navigator,
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue(new MediaStream()),
  },
};

// Mock PeerJS (will be overridden in specific tests)
globalThis.Peer = class Peer {
  constructor(id) {
    this.id = id || Math.random().toString(36).substring(7);
    this._events = new Map();
  }

  on(event, handler) {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event).push(handler);
    return this;
  }

  emit(event, data) {
    const handlers = this._events.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }

  connect() {
    return {
      on: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };
  }

  disconnect() {
    this.emit('disconnected');
  }

  destroy() {
    this.emit('close');
  }
};

// Mock requestAnimationFrame for Three.js tests
let frameId = 0;
globalThis.requestAnimationFrame = vi.fn((callback) => {
  frameId++;
  setTimeout(() => callback(Date.now()), 16);
  return frameId;
});

globalThis.cancelAnimationFrame = vi.fn((_id) => {
  // No-op for tests
});
