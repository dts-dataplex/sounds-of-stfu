// Chatsubo Spatial Audio Demo
import './style.css';
import { ChatsuboScene } from './scene.js';
import { SpatialAudioManager } from './audio.js';
import { getZoneAt } from './zones.js';

// Initialize scene
const container = document.querySelector('#app');
container.innerHTML = `
  <div id="scene-container"></div>
  <div id="ui">
    <div id="status">
      <h2>Chatsubo Bar - Spatial Audio Demo</h2>
      <div id="peer-info">
        <p><strong>Your Peer ID:</strong> <span id="my-peer-id">Connecting...</span></p>
        <p><strong>Position:</strong> <span id="my-position">0, 0</span></p>
        <p><strong>Zone:</strong> <span id="my-zone">-</span></p>
      </div>
      <div id="connect-section">
        <input type="text" id="peer-id-input" placeholder="Enter peer ID to connect" />
        <button id="connect-btn">Connect</button>
      </div>
      <div id="peers">
        <h3>Connected Peers</h3>
        <ul id="peer-list"></ul>
      </div>
    </div>
    <div id="instructions">
      <p>Click anywhere to move your avatar</p>
      <p>Audio volume fades with distance</p>
    </div>
  </div>
`;

const sceneContainer = document.querySelector('#scene-container');
const scene = new ChatsuboScene(sceneContainer);
const audioManager = new SpatialAudioManager();

let myAvatar = null;

// Initialize audio and create avatar
async function init() {
  try {
    const peerId = await audioManager.initialize();
    document.querySelector('#my-peer-id').textContent = peerId;

    // Create my avatar at center
    const startPosition = { x: 0, z: 0 };
    myAvatar = scene.createAvatar('me', startPosition, 0x00ff00);
    audioManager.updateMyPosition(startPosition);
    updatePositionUI(startPosition);

    // Setup audio callbacks
    audioManager.onPeerJoined = (remotePeerId) => {
      console.log('Peer joined:', remotePeerId);
      // Create avatar for peer (random color)
      const color = Math.random() * 0xffffff;
      scene.createAvatar(remotePeerId, { x: 0, z: 0 }, color);
      updatePeerList();
    };

    audioManager.onPeerLeft = (remotePeerId) => {
      console.log('Peer left:', remotePeerId);
      scene.removeAvatar(remotePeerId);
      updatePeerList();
    };

    audioManager.onPositionUpdate = (remotePeerId, position) => {
      scene.updateAvatarPosition(remotePeerId, position);
    };

  } catch (err) {
    alert('Failed to initialize: ' + err.message);
  }
}

// Handle click to move
sceneContainer.addEventListener('click', (event) => {
  const position = scene.getClickPosition(event);
  if (position) {
    scene.updateAvatarPosition('me', position);
    audioManager.updateMyPosition(position);
    updatePositionUI(position);
  }
});

// Connect to peer
document.querySelector('#connect-btn').addEventListener('click', () => {
  const remotePeerId = document.querySelector('#peer-id-input').value.trim();
  if (remotePeerId) {
    audioManager.connectToPeer(remotePeerId);
    document.querySelector('#peer-id-input').value = '';
  }
});

// Update position UI
function updatePositionUI(position) {
  document.querySelector('#my-position').textContent =
    `${position.x.toFixed(1)}, ${position.z.toFixed(1)}`;

  const zone = getZoneAt(position);
  document.querySelector('#my-zone').textContent = zone ? zone.name : 'Outside zones';
}

// Update peer list UI
function updatePeerList() {
  const peerList = document.querySelector('#peer-list');
  peerList.innerHTML = '';

  for (const [peerId, audio] of audioManager.streams) {
    const li = document.createElement('li');
    const peerPosition = audioManager.positions.get(peerId);

    if (peerPosition) {
      const dx = audioManager.myPosition.x - peerPosition.x;
      const dz = audioManager.myPosition.z - peerPosition.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      const volume = audio.volume;

      li.textContent = `${peerId.substring(0, 8)}... - Distance: ${distance.toFixed(1)}ft, Volume: ${(volume * 100).toFixed(0)}%`;
    } else {
      li.textContent = `${peerId.substring(0, 8)}... - Position unknown`;
    }

    peerList.appendChild(li);
  }
}

// Start animation loop
scene.animate();

// Initialize when page loads
init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  audioManager.disconnect();
});
