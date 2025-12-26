/**
 * Spatial Audio Controls Component
 * Chatsubo Virtual Bar - Sounds of STFU
 *
 * Provides UI controls for spatial audio settings including:
 * - Master volume slider
 * - Spatial audio toggle (enable/disable distance-based falloff)
 * - Distance falloff visualization
 *
 * @module SpatialAudioControls
 */

/**
 * SpatialAudioControls manages the UI for spatial audio configuration.
 * Integrates with SpatialAudioEngine to provide real-time audio control.
 */
export class SpatialAudioControls {
  /**
   * @param {Object} options - Configuration options
   * @param {SpatialAudioEngine} options.spatialAudio - The spatial audio engine instance
   * @param {string} options.containerId - DOM element ID where controls will be rendered
   * @param {Function} [options.onVolumeChange] - Callback when volume changes
   * @param {Function} [options.onSpatialToggle] - Callback when spatial audio is toggled
   */
  constructor(options = {}) {
    this.spatialAudio = options.spatialAudio;
    this.containerId = options.containerId || 'audio-controls';
    this.onVolumeChange = options.onVolumeChange;
    this.onSpatialToggle = options.onSpatialToggle;

    this.container = null;
    this.volumeSlider = null;
    this.spatialToggle = null;
    this.falloffVisualization = null;
    this.peerDistanceList = null;

    this.peerDistances = new Map(); // peerId -> {distance, volume, name}
  }

  /**
   * Render the spatial audio controls UI.
   * Creates the DOM structure and attaches event listeners.
   */
  render() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`[SpatialAudioControls] Container not found: ${this.containerId}`);
      return;
    }

    // Build the control panel HTML
    this.container.innerHTML = `
      <div class="spatial-controls-panel">
        <h2>// Spatial Audio</h2>

        <!-- Master Volume Control -->
        <div class="control-group">
          <label for="master-volume">
            Master Volume: <span id="volume-value">100%</span>
          </label>
          <input
            type="range"
            id="master-volume"
            min="0"
            max="100"
            value="100"
            class="volume-slider"
          />
        </div>

        <!-- Spatial Audio Toggle -->
        <div class="control-group">
          <label class="toggle-label">
            <input
              type="checkbox"
              id="spatial-toggle"
              checked
              class="spatial-checkbox"
            />
            <span>Spatial Audio Enabled</span>
          </label>
          <p class="control-hint">
            When enabled, volume decreases with distance
          </p>
        </div>

        <!-- Distance Falloff Visualization -->
        <div class="control-group">
          <h3>Distance Falloff Curve</h3>
          <div id="falloff-visualization" class="falloff-canvas-container">
            <canvas id="falloff-canvas" width="250" height="120"></canvas>
          </div>
          <div class="falloff-legend">
            <span class="legend-item">
              <span class="color-box" style="background: #44ff88"></span>
              Close (0-50px)
            </span>
            <span class="legend-item">
              <span class="color-box" style="background: #ffaa44"></span>
              Medium (50-250px)
            </span>
            <span class="legend-item">
              <span class="color-box" style="background: #ff4444"></span>
              Far (250-500px)
            </span>
          </div>
        </div>

        <!-- Peer Distance Display -->
        <div class="control-group">
          <h3>Connected Peers</h3>
          <div id="peer-distances" class="peer-distance-list">
            <p class="no-peers-message">No peers connected</p>
          </div>
        </div>
      </div>
    `;

    // Store references to interactive elements
    this.volumeSlider = document.getElementById('master-volume');
    this.spatialToggle = document.getElementById('spatial-toggle');
    this.falloffVisualization = document.getElementById('falloff-canvas');
    this.peerDistanceList = document.getElementById('peer-distances');

    // Attach event listeners
    this.attachEventListeners();

    // Initial render
    this.drawFalloffCurve();

    console.log('[SpatialAudioControls] Rendered successfully');
  }

  /**
   * Attach event listeners to interactive controls.
   */
  attachEventListeners() {
    // Master volume slider
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value) / 100;
        this.handleVolumeChange(volume);
      });
    }

    // Spatial audio toggle
    if (this.spatialToggle) {
      this.spatialToggle.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        this.handleSpatialToggle(enabled);
      });
    }
  }

  /**
   * Handle master volume change.
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  handleVolumeChange(volume) {
    if (this.spatialAudio) {
      this.spatialAudio.setMasterVolume(volume);
    }

    // Update volume display
    const volumeValue = document.getElementById('volume-value');
    if (volumeValue) {
      volumeValue.textContent = `${Math.round(volume * 100)}%`;
    }

    // Callback
    if (this.onVolumeChange) {
      this.onVolumeChange(volume);
    }
  }

  /**
   * Handle spatial audio toggle.
   * @param {boolean} enabled - Whether spatial audio is enabled
   */
  handleSpatialToggle(enabled) {
    if (this.spatialAudio) {
      this.spatialAudio.setSpatialEnabled(enabled);
    }

    // Update UI state
    this.updateFalloffVisualization(enabled);

    // Callback
    if (this.onSpatialToggle) {
      this.onSpatialToggle(enabled);
    }
  }

  /**
   * Draw the distance falloff curve visualization.
   * Shows how volume changes with distance.
   */
  drawFalloffCurve() {
    const canvas = this.falloffVisualization;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Get spatial config from engine
    const config = this.spatialAudio?.config || {
      minDistance: 50,
      maxDistance: 500,
      rolloffFactor: 2.0,
    };

    // Draw axes
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 10);
    ctx.lineTo(30, height - 20);
    ctx.lineTo(width - 10, height - 20);
    ctx.stroke();

    // Draw falloff curve
    ctx.strokeStyle = '#44ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const maxDistance = config.maxDistance;
    const points = 100;

    for (let i = 0; i <= points; i++) {
      const distance = (i / points) * maxDistance;
      const volume = this.calculateFalloff(distance, config);

      // Map to canvas coordinates
      const x = 30 + (distance / maxDistance) * (width - 40);
      const y = height - 20 - volume * (height - 30);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw distance markers
    ctx.fillStyle = '#888';
    ctx.font = '10px Courier New';
    ctx.textAlign = 'center';

    const markers = [0, config.minDistance, maxDistance / 2, maxDistance];
    markers.forEach((dist) => {
      const x = 30 + (dist / maxDistance) * (width - 40);
      ctx.fillText(`${dist}px`, x, height - 5);
    });

    // Draw volume markers
    ctx.textAlign = 'right';
    [0, 0.5, 1.0].forEach((vol) => {
      const y = height - 20 - vol * (height - 30);
      ctx.fillText(`${Math.round(vol * 100)}%`, 25, y + 3);
    });

    // Add labels
    ctx.fillStyle = '#44ff88';
    ctx.textAlign = 'center';
    ctx.fillText('Distance', width / 2, height - 5);

    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Volume', 0, 0);
    ctx.restore();
  }

  /**
   * Calculate volume falloff for visualization.
   * Simplified version of spatial-falloff.js logic.
   *
   * @param {number} distance - Distance in pixels
   * @param {Object} config - Spatial config
   * @returns {number} Volume level (0.0 to 1.0)
   */
  calculateFalloff(distance, config) {
    if (distance < config.minDistance) {
      return 1.0;
    }
    if (distance > config.maxDistance) {
      return 0.0;
    }

    // Inverse square law with rolloff factor
    const normalizedDistance =
      (distance - config.minDistance) / (config.maxDistance - config.minDistance);
    const falloff = 1 - Math.pow(normalizedDistance, config.rolloffFactor);

    return Math.max(0, Math.min(1, falloff));
  }

  /**
   * Update falloff visualization when spatial audio is toggled.
   * @param {boolean} enabled - Whether spatial audio is enabled
   */
  updateFalloffVisualization(enabled) {
    const canvas = this.falloffVisualization;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Add visual indicator when disabled
    if (!enabled) {
      ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('SPATIAL DISABLED', canvas.width / 2, canvas.height / 2);
    } else {
      this.drawFalloffCurve();
    }
  }

  /**
   * Update peer distance display.
   * Called periodically to show real-time distance and volume for each peer.
   *
   * @param {Map<string, Object>} peerData - Map of peerId -> {distance, volume, name}
   */
  updatePeerDistances(peerData) {
    if (!this.peerDistanceList) return;

    this.peerDistances = peerData;

    if (peerData.size === 0) {
      this.peerDistanceList.innerHTML = '<p class="no-peers-message">No peers connected</p>';
      return;
    }

    // Build peer list HTML
    let html = '';
    for (const [peerId, data] of peerData.entries()) {
      const distanceDisplay = data.distance !== null ? `${Math.round(data.distance)}px` : 'N/A';
      const volumeDisplay = data.volume !== null ? `${Math.round(data.volume * 100)}%` : 'N/A';
      const peerName = data.name || peerId.substring(0, 12);

      // Color code volume indicator
      let volumeClass = 'volume-high';
      if (data.volume < 0.3) volumeClass = 'volume-low';
      else if (data.volume < 0.7) volumeClass = 'volume-medium';

      html += `
        <div class="peer-distance-item">
          <div class="peer-info">
            <span class="peer-name">${peerName}</span>
            <span class="peer-stats">
              📏 ${distanceDisplay} | 🔊 <span class="${volumeClass}">${volumeDisplay}</span>
            </span>
          </div>
          <div class="volume-bar-container">
            <div class="volume-bar" style="width: ${(data.volume || 0) * 100}%"></div>
          </div>
        </div>
      `;
    }

    this.peerDistanceList.innerHTML = html;
  }

  /**
   * Enable or disable all controls.
   * @param {boolean} enabled - Whether controls should be enabled
   */
  setEnabled(enabled) {
    if (this.volumeSlider) this.volumeSlider.disabled = !enabled;
    if (this.spatialToggle) this.spatialToggle.disabled = !enabled;
  }

  /**
   * Clean up and remove the component.
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.peerDistances.clear();
  }
}
