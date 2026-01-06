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

// Mock navigator.mediaDevices (only in browser-like environments)
// In Node.js, navigator is a getter and can't be overwritten
try {
  if (typeof globalThis.navigator !== 'object' || !Object.getOwnPropertyDescriptor(globalThis, 'navigator')?.get) {
    globalThis.navigator = {
      ...globalThis.navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(new MediaStream()),
      },
    };
  } else if (globalThis.navigator && !globalThis.navigator.mediaDevices) {
    // Browser-like environment but missing mediaDevices - mock it
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(new MediaStream()),
      },
      writable: true,
      configurable: true,
    });
  }
} catch {
  // In pure Node.js environment, skip navigator mocking
}

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

// Mock Web Worker for AI tests
globalThis.Worker = class Worker {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this._events = new Map();
    this._messageHandler = null;

    // Simulate worker ready signal after construction
    setTimeout(() => {
      this._emit('message', { data: { type: 'ready' } });
    }, 5);
  }

  addEventListener(event, handler) {
    if (!this._events.has(event)) {
      this._events.set(event, []);
    }
    this._events.get(event).push(handler);
  }

  removeEventListener(event, handler) {
    const handlers = this._events.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }

  postMessage(data) {
    // Simulate async worker response
    setTimeout(() => {
      if (data.type === 'analyze') {
        this._emit('message', {
          data: {
            id: data.id,
            result: { label: 'POSITIVE', score: 0.95 },
          },
        });
      } else if (data.type === 'analyzeBatch') {
        this._emit('message', {
          data: {
            id: data.id,
            results: data.texts.map(() => ({ label: 'POSITIVE', score: 0.9 })),
          },
        });
      } else if (data.type === 'transcribe') {
        // Mock transcription response for SpeechTranscriber tests
        this._emit('message', {
          data: {
            id: data.id,
            text: 'This is a mock transcription.',
            latency: 150,
          },
        });
      }
    }, 10);
  }

  _emit(event, data) {
    const handlers = this._events.get(event) || [];
    handlers.forEach((h) => h(data));
    if (event === 'message' && this.onmessage) {
      this.onmessage(data);
    }
  }

  terminate() {}
};
