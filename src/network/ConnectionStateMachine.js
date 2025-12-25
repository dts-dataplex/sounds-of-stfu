/**
 * ConnectionStateMachine - Tracks connection lifecycle states
 * Handles state transitions and reconnection logic
 */

export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
  CLOSED: 'closed',
};

export default class ConnectionStateMachine {
  constructor(peerId) {
    this.peerId = peerId;
    this.state = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.eventHandlers = new Map();
    this.lastError = null;
  }

  /**
   * Transition to a new state
   */
  transition(newState, error = null) {
    const oldState = this.state;

    if (!this.isValidTransition(oldState, newState)) {
      console.warn(`[StateMachine] Invalid transition: ${oldState} -> ${newState}`);
      return false;
    }

    this.state = newState;
    if (error) {
      this.lastError = error;
    }

    console.log(`[StateMachine] ${this.peerId}: ${oldState} -> ${newState}`);
    this.emit('stateChange', {
      peerId: this.peerId,
      oldState,
      newState,
      error,
    });

    // Handle automatic state transitions
    this.handleStateEntered(newState);

    return true;
  }

  /**
   * Check if state transition is valid
   */
  isValidTransition(fromState, toState) {
    const validTransitions = {
      [ConnectionState.DISCONNECTED]: [ConnectionState.CONNECTING],
      [ConnectionState.CONNECTING]: [
        ConnectionState.CONNECTED,
        ConnectionState.FAILED,
        ConnectionState.DISCONNECTED,
      ],
      [ConnectionState.CONNECTED]: [
        ConnectionState.DISCONNECTED,
        ConnectionState.RECONNECTING,
        ConnectionState.CLOSED,
      ],
      [ConnectionState.RECONNECTING]: [
        ConnectionState.CONNECTED,
        ConnectionState.FAILED,
        ConnectionState.DISCONNECTED,
      ],
      [ConnectionState.FAILED]: [ConnectionState.DISCONNECTED, ConnectionState.RECONNECTING],
      [ConnectionState.CLOSED]: [ConnectionState.DISCONNECTED],
    };

    return validTransitions[fromState]?.includes(toState) || false;
  }

  /**
   * Handle actions when entering a new state
   */
  handleStateEntered(state) {
    switch (state) {
      case ConnectionState.FAILED:
        // Attempt reconnection if not exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error(`[StateMachine] ${this.peerId}: Max reconnection attempts reached`);
          this.emit('reconnectFailed', { peerId: this.peerId });
        }
        break;

      case ConnectionState.CONNECTED:
        // Reset reconnection tracking on successful connection
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.lastError = null;
        break;

      case ConnectionState.CLOSED:
        // Clean shutdown - reset everything
        this.reconnectAttempts = 0;
        this.lastError = null;
        break;
    }
  }

  /**
   * Schedule reconnection attempt with exponential backoff
   */
  scheduleReconnect() {
    this.reconnectAttempts++;

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(
      `[StateMachine] ${this.peerId}: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (this.state === ConnectionState.FAILED) {
        this.transition(ConnectionState.RECONNECTING);
        this.emit('reconnectAttempt', {
          peerId: this.peerId,
          attempt: this.reconnectAttempts,
          delay,
        });
      }
    }, delay);
  }

  /**
   * Manual reconnection trigger
   */
  requestReconnect() {
    if (this.state === ConnectionState.CONNECTED) {
      console.warn(`[StateMachine] ${this.peerId}: Already connected`);
      return false;
    }

    this.reconnectAttempts = 0;
    return this.transition(ConnectionState.RECONNECTING);
  }

  /**
   * Check if currently connected
   */
  isConnected() {
    return this.state === ConnectionState.CONNECTED;
  }

  /**
   * Check if connection is active (connecting or connected)
   */
  isActive() {
    return (
      this.state === ConnectionState.CONNECTING ||
      this.state === ConnectionState.CONNECTED ||
      this.state === ConnectionState.RECONNECTING
    );
  }

  /**
   * Get current state
   */
  getState() {
    return this.state;
  }

  /**
   * Get last error
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Event handling
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(data));
  }

  /**
   * Reset state machine
   */
  reset() {
    this.state = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.lastError = null;
    console.log(`[StateMachine] ${this.peerId}: Reset to disconnected`);
  }

  /**
   * Clean up
   */
  destroy() {
    this.transition(ConnectionState.CLOSED);
    this.eventHandlers.clear();
  }
}
