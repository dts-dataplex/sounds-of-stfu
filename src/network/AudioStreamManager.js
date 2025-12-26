/**
 * AudioStreamManager - WebRTC audio stream handling
 * Manages local microphone access and remote stream distribution
 * NOTE: Does NOT process audio - that's handled by spatial audio module
 */

export default class AudioStreamManager {
  constructor() {
    this.localStream = null;
    this.remoteStreams = new Map(); // peerId -> MediaStream
    this.isMuted = false;
    this.eventHandlers = new Map();

    // Audio constraints optimized for voice chat
    this.audioConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1, // Mono
        sampleRate: 48000, // 48kHz (Opus standard)
        sampleSize: 16,
      },
      video: false,
    };
  }

  /**
   * Request access to local microphone
   */
  async getLocalAudioStream() {
    if (this.localStream) {
      return this.localStream;
    }

    // Check if getUserMedia is available (requires secure context: HTTPS or localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = new Error(
        'Microphone access requires HTTPS or localhost. ' +
          'Connect via https:// or localhost to enable audio. ' +
          'You can still use the app without audio.'
      );
      console.warn('[AudioStreamManager] getUserMedia not available (insecure context)');
      this.emit('localStreamError', { error });
      throw error;
    }

    try {
      console.log('[AudioStreamManager] Requesting microphone access...');
      this.localStream = await navigator.mediaDevices.getUserMedia(this.audioConstraints);

      console.log('[AudioStreamManager] Microphone access granted');
      this.emit('localStreamReady', { stream: this.localStream });

      return this.localStream;
    } catch (error) {
      console.error('[AudioStreamManager] Microphone access denied:', error);
      this.emit('localStreamError', { error });
      throw error;
    }
  }

  /**
   * Attach local audio stream to peer connection
   */
  attachAudioStreamToPeer(peerConnection, stream = null) {
    const audioStream = stream || this.localStream;

    if (!audioStream) {
      console.warn('[AudioStreamManager] No local stream to attach');
      return false;
    }

    try {
      // Add audio track to peer connection
      const audioTrack = audioStream.getAudioTracks()[0];
      if (audioTrack) {
        peerConnection.addStream(audioStream);
        console.log('[AudioStreamManager] Audio stream attached to peer');
        return true;
      }
    } catch (error) {
      console.error('[AudioStreamManager] Error attaching stream:', error);
    }

    return false;
  }

  /**
   * Handle incoming remote audio stream
   */
  handleRemoteStream(peerId, stream) {
    console.log('[AudioStreamManager] Remote stream received from:', peerId);

    this.remoteStreams.set(peerId, stream);

    // Emit event for audio processing module
    this.emit('remoteStreamReceived', {
      peerId,
      stream,
      tracks: stream.getAudioTracks(),
    });
  }

  /**
   * Remove remote stream when peer disconnects
   */
  removeRemoteStream(peerId) {
    const stream = this.remoteStreams.get(peerId);
    if (stream) {
      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());
      this.remoteStreams.delete(peerId);

      this.emit('remoteStreamRemoved', { peerId });
      console.log('[AudioStreamManager] Remote stream removed:', peerId);
    }
  }

  /**
   * Mute local microphone
   */
  muteLocalAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        this.isMuted = true;
        this.emit('localAudioMuted');
        console.log('[AudioStreamManager] Microphone muted');
      }
    }
  }

  /**
   * Unmute local microphone
   */
  unmuteLocalAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        this.isMuted = false;
        this.emit('localAudioUnmuted');
        console.log('[AudioStreamManager] Microphone unmuted');
      }
    }
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    if (this.isMuted) {
      this.unmuteLocalAudio();
    } else {
      this.muteLocalAudio();
    }
    return this.isMuted;
  }

  /**
   * Get current mute state
   */
  isMicMuted() {
    return this.isMuted;
  }

  /**
   * Get list of all remote peer IDs with active streams
   */
  getRemotePeerIds() {
    return Array.from(this.remoteStreams.keys());
  }

  /**
   * Get remote stream for specific peer
   */
  getRemoteStream(peerId) {
    return this.remoteStreams.get(peerId);
  }

  /**
   * Get all remote streams
   */
  getAllRemoteStreams() {
    return Array.from(this.remoteStreams.entries());
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
   * Clean up all streams and resources
   */
  destroy() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Stop all remote streams
    this.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    this.remoteStreams.clear();

    console.log('[AudioStreamManager] All streams cleaned up');
  }
}
