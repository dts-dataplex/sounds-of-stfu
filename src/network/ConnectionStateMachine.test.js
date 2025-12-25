import { describe, it, expect, beforeEach, vi } from 'vitest';
import ConnectionStateMachine, { ConnectionState } from './ConnectionStateMachine.js';

describe('ConnectionStateMachine', () => {
  let stateMachine;
  let onStateChangeSpy;

  beforeEach(() => {
    onStateChangeSpy = vi.fn();
    stateMachine = new ConnectionStateMachine('peer-123');
    stateMachine.on('stateChange', onStateChangeSpy);
  });

  describe('initialization', () => {
    it('should start in DISCONNECTED state', () => {
      expect(stateMachine.state).toBe(ConnectionState.DISCONNECTED);
    });

    it('should store peer ID', () => {
      expect(stateMachine.peerId).toBe('peer-123');
    });

    it('should initialize with zero reconnect attempts', () => {
      expect(stateMachine.reconnectAttempts).toBe(0);
    });
  });

  describe('state transitions', () => {
    it('should transition from DISCONNECTED to CONNECTING', () => {
      stateMachine.transition(ConnectionState.CONNECTING);

      expect(stateMachine.state).toBe(ConnectionState.CONNECTING);
      expect(onStateChangeSpy).toHaveBeenCalledWith({
        peerId: 'peer-123',
        oldState: ConnectionState.DISCONNECTED,
        newState: ConnectionState.CONNECTING,
        error: null,
      });
    });

    it('should transition from CONNECTING to CONNECTED', () => {
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.CONNECTED);

      expect(stateMachine.state).toBe(ConnectionState.CONNECTED);
    });

    it('should transition from CONNECTING to FAILED', () => {
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.FAILED);

      expect(stateMachine.state).toBe(ConnectionState.FAILED);
    });

    it('should reset reconnect attempts when CONNECTED', () => {
      stateMachine.reconnectAttempts = 5;
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.CONNECTED);

      expect(stateMachine.reconnectAttempts).toBe(0);
    });

    it('should call onStateChange callback for each transition', () => {
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.CONNECTED);

      expect(onStateChangeSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('reconnection logic', () => {
    it('should schedule reconnect when transitioning to FAILED', () => {
      vi.useFakeTimers();

      // Must go through CONNECTING first
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.FAILED);

      expect(stateMachine.reconnectAttempts).toBe(1);

      vi.useRealTimers();
    });

    it('should use exponential backoff for reconnection delays', () => {
      vi.useFakeTimers();

      // First attempt: transition through CONNECTING to FAILED
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.FAILED);
      expect(stateMachine.reconnectAttempts).toBe(1);

      // Wait for automatic RECONNECTING transition (1000ms)
      vi.advanceTimersByTime(1000);

      // Manually transition to FAILED again (simulate failed reconnect)
      stateMachine.transition(ConnectionState.FAILED);
      expect(stateMachine.reconnectAttempts).toBe(2);

      // Wait for next reconnection attempt (2000ms with backoff)
      vi.advanceTimersByTime(2000);

      // Third failure
      stateMachine.transition(ConnectionState.FAILED);
      expect(stateMachine.reconnectAttempts).toBe(3);

      vi.useRealTimers();
    });

    it('should cap maximum reconnection attempts', () => {
      vi.useFakeTimers();

      // Start with CONNECTING -> FAILED
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.FAILED);

      // Simulate multiple reconnect failures up to max
      for (let i = 1; i < 5; i++) {
        // Advance past any reconnection timer
        vi.advanceTimersByTime(30000);

        // If still attempting, trigger another failure
        if (stateMachine.state === ConnectionState.RECONNECTING) {
          stateMachine.transition(ConnectionState.FAILED);
        }
      }

      // Should stop at max attempts (3)
      expect(stateMachine.reconnectAttempts).toBeLessThanOrEqual(3);

      vi.useRealTimers();
    });
  });

  describe('state validation', () => {
    it('should validate state transitions', () => {
      // Cannot go directly from DISCONNECTED to CONNECTED
      expect(
        stateMachine.isValidTransition(ConnectionState.DISCONNECTED, ConnectionState.CONNECTED)
      ).toBe(false);

      // Must go through CONNECTING first
      expect(
        stateMachine.isValidTransition(ConnectionState.DISCONNECTED, ConnectionState.CONNECTING)
      ).toBe(true);
    });

    it('should allow transition to CLOSED from CONNECTED', () => {
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.CONNECTED);
      expect(
        stateMachine.isValidTransition(ConnectionState.CONNECTED, ConnectionState.CLOSED)
      ).toBe(true);
    });

    it('should allow transition to FAILED from CONNECTING', () => {
      stateMachine.transition(ConnectionState.CONNECTING);
      expect(
        stateMachine.isValidTransition(ConnectionState.CONNECTING, ConnectionState.FAILED)
      ).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should transition to CLOSED state', () => {
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.CONNECTED);
      stateMachine.destroy();

      expect(stateMachine.state).toBe(ConnectionState.CLOSED);
    });

    it('should reset reconnect attempts when destroyed', () => {
      stateMachine.reconnectAttempts = 5;
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.CONNECTED);
      stateMachine.destroy();

      expect(stateMachine.reconnectAttempts).toBe(0);
    });
  });

  describe('isConnected', () => {
    it('should return true when in CONNECTED state', () => {
      stateMachine.transition(ConnectionState.CONNECTING);
      stateMachine.transition(ConnectionState.CONNECTED);

      expect(stateMachine.isConnected()).toBe(true);
    });

    it('should return false in other states', () => {
      expect(stateMachine.isConnected()).toBe(false);

      stateMachine.transition(ConnectionState.CONNECTING);
      expect(stateMachine.isConnected()).toBe(false);

      stateMachine.transition(ConnectionState.FAILED);
      expect(stateMachine.isConnected()).toBe(false);
    });
  });
});
