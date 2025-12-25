/**
 * Main Entry Point - Chatsubo Virtual Bar
 * Initializes and manages the complete application
 */

import ChatsuboApp from './ChatsuboApp.js';

console.log('🍺 Chatsubo Virtual Bar - Initializing...');

let app = null;
let isInRoom = false;

// UI Elements
const getElement = (id) => document.getElementById(id);

/**
 * Update status text
 */
function updateStatus(message) {
  const statusText = getElement('status-text');
  if (statusText) {
    statusText.textContent = message;
  }
  console.log(`[Status] ${message}`);
}

/**
 * Initialize the application
 */
async function initialize() {
  updateStatus('Loading...');

  try {
    const canvas = getElement('scene-canvas');
    app = new ChatsuboApp(canvas);

    // Set up UI callbacks
    app.onStatusUpdate = updateStatus;
    app.onPeerListUpdate = updatePeerList;
    app.onHeatedConversation = showHeatedAlert;

    // Initialize app
    await app.initialize();

    // Enable join button
    const joinButton = getElement('join-button');
    if (joinButton) joinButton.disabled = false;
  } catch (error) {
    console.error('[Main] Initialization error:', error);
    updateStatus(`Error: ${error.message}`);
  }
}

/**
 * Join a room
 */
async function joinRoom() {
  if (!app || isInRoom) return;

  const roomIdInput = getElement('room-id');
  const roomId = roomIdInput?.value.trim() || 'chatsubo-main';

  try {
    const joinButton = getElement('join-button');
    if (joinButton) joinButton.disabled = true;

    await app.joinRoom(roomId);

    // Update UI
    isInRoom = true;
    updateButtonVisibility();
    addSystemMessage(`Joined room: ${roomId}`);

    // Hide status dialog
    const statusDialog = getElement('status');
    if (statusDialog) {
      statusDialog.classList.add('hidden');
    }

    // Enable zone movement buttons
    enableZoneButtons();

    // Start connection metrics tracking
    startConnectionMetrics();
  } catch (error) {
    console.error('[Main] Failed to join room:', error);
    updateStatus(`Failed to join: ${error.message}`);
    const joinButton = getElement('join-button');
    if (joinButton) joinButton.disabled = false;
  }
}

/**
 * Leave the room
 */
function leaveRoom() {
  if (!app || !isInRoom) return;

  app.destroy();
  isInRoom = false;

  // Stop connection metrics tracking
  stopConnectionMetrics();

  // Show status dialog again
  const statusDialog = getElement('status');
  if (statusDialog) {
    statusDialog.classList.remove('hidden');
  }

  updateButtonVisibility();
  updateStatus('Left room');
  updatePeerList([]);
  addSystemMessage('Left room');

  // Reinitialize
  initialize();
}

/**
 * Toggle microphone mute
 */
function toggleMute() {
  if (!app) return;

  const isMuted = app.toggleMicrophone();
  const muteButton = getElement('mute-button');
  if (muteButton) {
    muteButton.textContent = isMuted ? '🔇 Unmute' : '🎤 Mute';
    muteButton.classList.toggle('muted', isMuted);
  }
}

/**
 * Send chat message
 */
function sendMessage() {
  if (!app || !isInRoom) return;

  const chatInput = getElement('chat-input');
  const text = chatInput?.value.trim();
  if (!text) return;

  app.sendMessage(text);
  addChatMessage('You', text);
  chatInput.value = '';
}

/**
 * Update button visibility based on room state
 */
function updateButtonVisibility() {
  const joinButton = getElement('join-button');
  const leaveButton = getElement('leave-button');
  const muteButton = getElement('mute-button');
  const chatInput = getElement('chat-input');
  const sendButton = getElement('send-button');
  const roomIdInput = getElement('room-id');

  if (joinButton) joinButton.style.display = isInRoom ? 'none' : 'inline-block';
  if (leaveButton) leaveButton.style.display = isInRoom ? 'inline-block' : 'none';
  if (muteButton) muteButton.disabled = !isInRoom;
  if (chatInput) chatInput.disabled = !isInRoom;
  if (sendButton) sendButton.disabled = !isInRoom;
  if (roomIdInput) roomIdInput.disabled = isInRoom;
  if (joinButton && !isInRoom) joinButton.disabled = false;

  // Update zone buttons
  const zoneButtons = document.querySelectorAll('.zone-button');
  zoneButtons.forEach((button) => {
    button.disabled = !isInRoom;
  });
}

/**
 * Enable zone movement buttons
 */
function enableZoneButtons() {
  const zoneButtons = document.querySelectorAll('.zone-button');
  zoneButtons.forEach((button) => {
    button.disabled = false;
  });
}

/**
 * Update peer list
 */
function updatePeerList(peers) {
  const peerCountElement = getElement('peer-count');
  const peerListElement = getElement('peer-list');

  if (peerCountElement) {
    peerCountElement.textContent = peers.length;
  }

  if (peerListElement) {
    peerListElement.innerHTML = '';
    peers.forEach((peerId) => {
      const li = document.createElement('li');
      li.textContent = peerId.substring(0, 12) + '...';
      peerListElement.appendChild(li);
    });
  }
}

/**
 * Add chat message to UI
 */
function addChatMessage(sender, text) {
  const messagesContainer = getElement('messages');
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.innerHTML = `<strong>${sender}:</strong> ${escapeHtml(text)}`;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Add system message to UI
 */
function addSystemMessage(text) {
  const messagesContainer = getElement('messages');
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message system';
  messageDiv.textContent = text;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Show heated conversation alert
 */
function showHeatedAlert() {
  const alertDiv = getElement('heated-alert');
  if (alertDiv) {
    alertDiv.style.display = 'block';
    setTimeout(() => {
      alertDiv.style.display = 'none';
    }, 10000);
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Movement controls
 */
function moveToZone(x, z) {
  if (!app || !isInRoom) return;
  app.moveTo(x, 0, z);
  addSystemMessage(`Moved to (${x}, ${z})`);
}

/**
 * Connection metrics tracking
 */
let metricsInterval = null;

function startConnectionMetrics() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }

  // Update metrics every 2 seconds
  metricsInterval = setInterval(() => {
    if (!app || !isInRoom) {
      stopConnectionMetrics();
      return;
    }

    updateConnectionMetrics();
  }, 2000);

  // Initial update
  updateConnectionMetrics();
}

function stopConnectionMetrics() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

function updateConnectionMetrics() {
  const connectionStatus = getElement('connection-status');
  const connectionState = getElement('connection-state');
  const connectionLatency = getElement('connection-latency');

  if (!connectionStatus || !app) return;

  const peerCount = app.getPeerCount();
  const isConnected = app.networkCoordinator && app.localPeerId;

  // Connection state
  if (connectionState) {
    connectionState.textContent = isConnected ? 'Connected' : 'Disconnected';
    connectionState.style.color = isConnected ? '#44ff88' : '#ff4444';
  }

  // Latency (simulated for now - PeerJS doesn't expose direct latency)
  if (connectionLatency) {
    // In a real implementation, you would measure actual RTT
    const simulatedLatency = isConnected ? Math.floor(Math.random() * 30) + 20 : 0;
    connectionLatency.textContent = isConnected ? `${simulatedLatency}ms` : 'N/A';
    connectionLatency.style.color =
      simulatedLatency < 50 ? '#44ff88' : simulatedLatency < 100 ? '#ffaa44' : '#ff4444';
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize when page loads
  initialize();

  // Button events
  const joinButton = getElement('join-button');
  const leaveButton = getElement('leave-button');
  const muteButton = getElement('mute-button');
  const sendButton = getElement('send-button');
  const chatInput = getElement('chat-input');

  if (joinButton) joinButton.addEventListener('click', joinRoom);
  if (leaveButton) leaveButton.addEventListener('click', leaveRoom);
  if (muteButton) muteButton.addEventListener('click', toggleMute);
  if (sendButton) sendButton.addEventListener('click', sendMessage);

  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Zone movement buttons
  const moveButtons = {
    'move-gaming': () => moveToZone(8, 7),
    'move-bar': () => moveToZone(24, 18),
    'move-card-tables': () => moveToZone(40, 7),
    'move-firepit': () => moveToZone(24, 32),
    'move-booth1': () => moveToZone(8, 21),
    'move-booth2': () => moveToZone(24, 6),
    'move-stage': () => moveToZone(40, 32),
  };

  Object.entries(moveButtons).forEach(([id, handler]) => {
    const button = getElement(id);
    if (button) button.addEventListener('click', handler);
  });
});

// Export for console debugging
window.chatsuboApp = app;
window.moveToZone = moveToZone;
