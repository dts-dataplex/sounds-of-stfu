// Canvas Renderer for Room Visualization
class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.users = new Map(); // username -> { position, targetPosition, zone, isLocal, isSpeaking, audioLevel }
        this.localUser = null;
        this.isDragging = false;
        this.animationFrame = null;
        this.lastFrameTime = 0;

        // Interpolation settings
        this.interpolationSpeed = 8; // Higher = faster catch-up

        // Audio visualization
        this.showAudioRanges = true;
        this.speakingPulsePhase = 0;

        // Conversation clusters (heat map visualization)
        this.conversationClusters = [];
        this.showConversationClusters = true;
        this.clusterPulsePhase = 0;

        // Keyboard navigation
        this.keyboardMoveSpeed = 8; // Pixels per frame
        this.keysPressed = new Set();

        // Touch interaction state
        this.touchStartPos = null;
        this.touchStartTime = 0;
        this.isTouchDragging = false;
        this.touchMoveThreshold = 10; // Pixels - distinguishes tap from drag
        this.tapMaxDuration = 300; // ms - max time for a tap
        this.touchHitAreaMultiplier = 2; // Larger hit area for touch devices

        // Hover/tooltip state
        this.hoveredUser = null;
        this.tooltip = null;

        // Callbacks
        this.onPositionChange = null;

        // Set up event listeners
        this.setupEventListeners();
    }

    // Initialize canvas
    initialize() {
        // Set canvas size
        this.canvas.width = Config.CANVAS_WIDTH;
        this.canvas.height = Config.CANVAS_HEIGHT;

        // Create tooltip element
        this.createTooltip();

        // Start render loop
        this.startRenderLoop();
    }

    // Create tooltip DOM element
    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.id = 'user-tooltip';
        this.tooltip.className = 'user-tooltip hidden';
        this.tooltip.innerHTML = `
            <div class="tooltip-username"></div>
            <div class="tooltip-zone"></div>
            <div class="tooltip-status"></div>
        `;
        this.canvas.parentElement.appendChild(this.tooltip);
    }

    // Update tooltip content and position
    updateTooltip(username, user, mouseX, mouseY) {
        if (!this.tooltip) return;

        const usernameEl = this.tooltip.querySelector('.tooltip-username');
        const zoneEl = this.tooltip.querySelector('.tooltip-zone');
        const statusEl = this.tooltip.querySelector('.tooltip-status');

        // Update content
        usernameEl.textContent = username;
        const zone = Config.ZONES[user.zone];
        zoneEl.textContent = zone ? zone.name : 'Unknown Zone';
        statusEl.textContent = user.isSpeaking ? '🎤 Speaking' : user.isLocal ? '📍 You' : '👤 Online';

        // Position tooltip near cursor but within canvas bounds
        const rect = this.canvas.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        let left = mouseX + 15; // Offset from cursor
        let top = mouseY - 10;

        // Keep tooltip within canvas container
        if (left + tooltipRect.width > rect.right - rect.left) {
            left = mouseX - tooltipRect.width - 15;
        }
        if (top + tooltipRect.height > rect.bottom - rect.top) {
            top = mouseY - tooltipRect.height - 10;
        }
        if (top < 0) top = 5;

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.classList.remove('hidden');
    }

    // Hide tooltip
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.add('hidden');
        }
        this.hoveredUser = null;
    }

    // Set up mouse/touch/keyboard event listeners
    setupEventListeners() {
        // Make canvas focusable for keyboard events
        this.canvas.tabIndex = 0;
        this.canvas.style.outline = 'none'; // Hide focus outline (we'll show our own indicator)

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => {
            this.handleMouseUp();
            this.hideTooltip();
        });

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });

        // Click to move
        this.canvas.addEventListener('click', (e) => this.handleClick(e));

        // Keyboard events for arrow keys and WASD movement
        this.canvas.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.canvas.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Also listen on window for keyboard when canvas is in view
        window.addEventListener('keydown', (e) => {
            // Only handle if room screen is visible and not typing in an input
            if (document.activeElement.tagName !== 'INPUT' &&
                document.activeElement.tagName !== 'TEXTAREA') {
                this.handleKeyDown(e);
            }
        });
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    // Get canvas-relative coordinates
    getCanvasCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // Handle mouse down
    handleMouseDown(e) {
        if (!this.localUser) return;

        const coords = this.getCanvasCoords(e.clientX, e.clientY);
        const user = this.users.get(this.localUser);

        if (user && this.isPointOnUser(coords, user.position)) {
            this.isDragging = true;
        }
    }

    // Handle mouse move
    handleMouseMove(e) {
        const coords = this.getCanvasCoords(e.clientX, e.clientY);

        // Handle dragging
        if (this.isDragging && this.localUser) {
            this.moveLocalUser(coords.x, coords.y);
            this.hideTooltip();
            return;
        }

        // Check for user hover (tooltip)
        let foundHover = false;
        for (const [username, user] of this.users) {
            if (this.isPointOnUser(coords, user.position)) {
                if (this.hoveredUser !== username) {
                    this.hoveredUser = username;
                }
                // Get mouse position relative to canvas container
                const rect = this.canvas.getBoundingClientRect();
                const containerX = e.clientX - rect.left;
                const containerY = e.clientY - rect.top;
                this.updateTooltip(username, user, containerX, containerY);
                foundHover = true;
                break;
            }
        }

        if (!foundHover && this.hoveredUser) {
            this.hideTooltip();
        }
    }

    // Handle mouse up
    handleMouseUp() {
        this.isDragging = false;
    }

    // Handle touch start
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            e.preventDefault(); // Prevent scroll/zoom on canvas
            const touch = e.touches[0];
            const coords = this.getCanvasCoords(touch.clientX, touch.clientY);

            // Store touch start info for tap vs drag detection
            this.touchStartPos = coords;
            this.touchStartTime = Date.now();
            this.isTouchDragging = false;

            // Check if touching local user avatar (with larger hit area for touch)
            if (this.localUser) {
                const user = this.users.get(this.localUser);
                if (user && this.isPointOnUserTouch(coords, user.position)) {
                    this.isDragging = true;
                }
            }
        }
    }

    // Handle touch move
    handleTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault(); // Prevent scroll/zoom
            const touch = e.touches[0];
            const coords = this.getCanvasCoords(touch.clientX, touch.clientY);

            // Check if we've moved enough to be considered dragging
            if (this.touchStartPos) {
                const dx = coords.x - this.touchStartPos.x;
                const dy = coords.y - this.touchStartPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > this.touchMoveThreshold) {
                    this.isTouchDragging = true;
                }
            }

            // If dragging the avatar, move it
            if (this.isDragging && this.localUser) {
                this.moveLocalUser(coords.x, coords.y);
            }
        }
    }

    // Handle touch end
    handleTouchEnd(e) {
        e.preventDefault();

        // Check for tap (short duration, minimal movement)
        const touchDuration = Date.now() - this.touchStartTime;
        const wasTap = touchDuration < this.tapMaxDuration && !this.isTouchDragging;

        if (wasTap && this.touchStartPos && !this.isDragging) {
            // Tap to move - move avatar to tap location
            this.moveLocalUser(this.touchStartPos.x, this.touchStartPos.y);
        }

        // Reset state
        this.isDragging = false;
        this.isTouchDragging = false;
        this.touchStartPos = null;
    }

    // Check if point is on user avatar (with larger hit area for touch)
    isPointOnUserTouch(point, userPos) {
        const dx = point.x - userPos.x;
        const dy = point.y - userPos.y;
        const hitRadius = Config.AVATAR_RADIUS * this.touchHitAreaMultiplier;
        return Math.sqrt(dx * dx + dy * dy) <= hitRadius;
    }

    // Handle click (click to move)
    handleClick(e) {
        if (this.isDragging) return; // Don't trigger on drag end

        const coords = this.getCanvasCoords(e.clientX, e.clientY);
        this.moveLocalUser(coords.x, coords.y);
    }

    // Handle keyboard key down
    handleKeyDown(e) {
        const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];

        if (movementKeys.includes(e.key)) {
            e.preventDefault(); // Prevent page scrolling
            this.keysPressed.add(e.key.toLowerCase());
        }
    }

    // Handle keyboard key up
    handleKeyUp(e) {
        if (e.key) {
            this.keysPressed.delete(e.key.toLowerCase());
        }
    }

    // Process keyboard movement (called each frame)
    processKeyboardMovement() {
        if (!this.localUser || this.keysPressed.size === 0) return;

        const user = this.users.get(this.localUser);
        if (!user) return;

        let dx = 0;
        let dy = 0;

        // Arrow keys and WASD
        if (this.keysPressed.has('arrowup') || this.keysPressed.has('w')) {
            dy -= this.keyboardMoveSpeed;
        }
        if (this.keysPressed.has('arrowdown') || this.keysPressed.has('s')) {
            dy += this.keyboardMoveSpeed;
        }
        if (this.keysPressed.has('arrowleft') || this.keysPressed.has('a')) {
            dx -= this.keyboardMoveSpeed;
        }
        if (this.keysPressed.has('arrowright') || this.keysPressed.has('d')) {
            dx += this.keyboardMoveSpeed;
        }

        // Apply diagonal movement normalization (so diagonal isn't faster)
        if (dx !== 0 && dy !== 0) {
            const factor = Math.SQRT1_2; // 1/sqrt(2) ≈ 0.707
            dx *= factor;
            dy *= factor;
        }

        // Move if there's input
        if (dx !== 0 || dy !== 0) {
            const newX = user.position.x + dx;
            const newY = user.position.y + dy;
            this.moveLocalUser(newX, newY);
        }
    }

    // Check if point is on user avatar
    isPointOnUser(point, userPos) {
        const dx = point.x - userPos.x;
        const dy = point.y - userPos.y;
        return Math.sqrt(dx * dx + dy * dy) <= Config.AVATAR_RADIUS;
    }

    // Move local user to position
    moveLocalUser(x, y) {
        // Clamp to canvas bounds
        x = Math.max(Config.AVATAR_RADIUS, Math.min(Config.CANVAS_WIDTH - Config.AVATAR_RADIUS, x));
        y = Math.max(Config.AVATAR_RADIUS, Math.min(Config.CANVAS_HEIGHT - Config.AVATAR_RADIUS, y));

        // Update local user position
        if (this.localUser) {
            const user = this.users.get(this.localUser);
            if (user) {
                user.position = { x, y };
                user.zone = Config.getZoneAt(x, y).id;
            }
        }

        // Notify callback
        if (this.onPositionChange) {
            this.onPositionChange({ x, y });
        }
    }

    // Set local user
    setLocalUser(username, position) {
        this.localUser = username;
        this.users.set(username, {
            position: position || { x: Config.CANVAS_WIDTH / 2, y: Config.CANVAS_HEIGHT / 2 },
            zone: Config.getZoneAt(position?.x || 400, position?.y || 300).id,
            isLocal: true
        });
    }

    // Update user position (for remote users) - uses interpolation
    updateUser(username, position, zone) {
        if (this.users.has(username)) {
            const user = this.users.get(username);
            // Set target position for interpolation (remote users only)
            if (!user.isLocal) {
                user.targetPosition = { x: position.x, y: position.y };
            } else {
                user.position = position;
            }
            user.zone = zone || Config.getZoneAt(position.x, position.y).id;
        } else {
            this.users.set(username, {
                position: { x: position.x, y: position.y },
                targetPosition: { x: position.x, y: position.y },
                zone: zone || Config.getZoneAt(position.x, position.y).id,
                isLocal: username === this.localUser,
                isSpeaking: false,
                audioLevel: 0
            });
        }
    }

    // Update speaking state for a user
    setSpeakingState(username, isSpeaking, audioLevel = 0) {
        const user = this.users.get(username);
        if (user) {
            user.isSpeaking = isSpeaking;
            user.audioLevel = audioLevel;
        }
    }

    // Set conversation clusters for heat map visualization
    setConversationClusters(clusters) {
        this.conversationClusters = clusters || [];
    }

    // Remove user
    removeUser(username) {
        this.users.delete(username);
    }

    // Clear all users
    clearUsers() {
        this.users.clear();
        this.localUser = null;
        this.conversationClusters = [];
    }

    // Start render loop
    startRenderLoop() {
        const render = (timestamp) => {
            // Calculate delta time for smooth interpolation
            const deltaTime = this.lastFrameTime ? (timestamp - this.lastFrameTime) / 1000 : 0.016;
            this.lastFrameTime = timestamp;

            // Process keyboard movement
            this.processKeyboardMovement();

            // Update interpolation
            this.updateInterpolation(deltaTime);

            // Update speaking pulse animation
            this.speakingPulsePhase += deltaTime * 4; // 4 Hz pulse

            // Update cluster pulse animation (slower, more ambient)
            this.clusterPulsePhase += deltaTime * 1.5; // 1.5 Hz pulse

            this.render();
            this.animationFrame = requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    // Interpolate remote user positions for smooth movement
    updateInterpolation(deltaTime) {
        const lerpFactor = 1 - Math.exp(-this.interpolationSpeed * deltaTime);

        for (const [username, user] of this.users) {
            if (!user.isLocal && user.targetPosition) {
                // Lerp position towards target
                user.position.x += (user.targetPosition.x - user.position.x) * lerpFactor;
                user.position.y += (user.targetPosition.y - user.position.y) * lerpFactor;
            }
        }
    }

    // Stop render loop
    stopRenderLoop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Main render function
    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#12121a';
        ctx.fillRect(0, 0, Config.CANVAS_WIDTH, Config.CANVAS_HEIGHT);

        // Draw zones
        this.drawZones();

        // Draw grid
        this.drawGrid();

        // Draw conversation clusters (heat map) - behind audio ranges and users
        if (this.showConversationClusters && this.conversationClusters.length > 0) {
            this.drawConversationClusters();
        }

        // Draw audio range visualization for local user
        if (this.showAudioRanges && this.localUser) {
            this.drawAudioRanges();
        }

        // Draw users
        this.drawUsers();
    }

    // Draw audio range circles around local user
    drawAudioRanges() {
        const localUserData = this.users.get(this.localUser);
        if (!localUserData) return;

        const ctx = this.ctx;
        const pos = localUserData.position;

        // Draw max distance circle (faint)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Config.AUDIO.MAX_DISTANCE, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw reference distance circle (clearer)
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Config.AUDIO.REF_DISTANCE, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw gradient fill for audio falloff
        const gradient = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, Config.AUDIO.MAX_DISTANCE
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.08)');
        gradient.addColorStop(Config.AUDIO.REF_DISTANCE / Config.AUDIO.MAX_DISTANCE, 'rgba(0, 255, 255, 0.04)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Config.AUDIO.MAX_DISTANCE, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Draw conversation clusters as heat map visualization
    drawConversationClusters() {
        const ctx = this.ctx;

        for (const cluster of this.conversationClusters) {
            const { centroid, intensity, size, speakingCount, activity } = cluster;

            // Calculate visual parameters based on cluster properties
            const baseRadius = 40 + size * 15; // Larger clusters = bigger radius
            const pulseAmount = (Math.sin(this.clusterPulsePhase + cluster.id) + 1) / 2;
            const activeBoost = activity > 0.1 ? 1 + activity * 0.5 : 1;
            const radius = baseRadius * activeBoost + pulseAmount * 10;

            // Color based on activity - orange/red spectrum for heat map
            const hue = 30 - Math.min(intensity, 1) * 30; // Orange (30) to red (0)
            const saturation = 80 + intensity * 20;
            const alpha = 0.15 + intensity * 0.15 + (speakingCount > 0 ? 0.1 : 0);

            // Draw outer glow gradient
            const gradient = ctx.createRadialGradient(
                centroid.x, centroid.y, 0,
                centroid.x, centroid.y, radius
            );
            gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, 50%, ${alpha})`);
            gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, 50%, ${alpha * 0.6})`);
            gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, 50%, 0)`);

            ctx.beginPath();
            ctx.arc(centroid.x, centroid.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Draw inner core if speaking is happening
            if (speakingCount > 0) {
                const coreRadius = 20 + speakingCount * 5;
                const coreGradient = ctx.createRadialGradient(
                    centroid.x, centroid.y, 0,
                    centroid.x, centroid.y, coreRadius
                );
                coreGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, 60%, ${0.3 + pulseAmount * 0.2})`);
                coreGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, 60%, 0)`);

                ctx.beginPath();
                ctx.arc(centroid.x, centroid.y, coreRadius, 0, Math.PI * 2);
                ctx.fillStyle = coreGradient;
                ctx.fill();
            }

            // Draw subtle connecting lines between cluster participants
            const participantPositions = [];
            for (const participantId of cluster.participants) {
                const user = this.users.get(participantId);
                if (user) {
                    participantPositions.push(user.position);
                }
            }

            if (participantPositions.length >= 2) {
                ctx.strokeStyle = `hsla(${hue}, ${saturation}%, 50%, 0.15)`;
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 6]);

                // Draw lines from centroid to each participant
                for (const pos of participantPositions) {
                    ctx.beginPath();
                    ctx.moveTo(centroid.x, centroid.y);
                    ctx.lineTo(pos.x, pos.y);
                    ctx.stroke();
                }

                ctx.setLineDash([]);
            }
        }
    }

    // Draw zone backgrounds
    drawZones() {
        const ctx = this.ctx;

        for (const [id, zone] of Object.entries(Config.ZONES)) {
            const b = zone.bounds;

            // Zone background
            ctx.fillStyle = zone.color;
            ctx.fillRect(b.x, b.y, b.width, b.height);

            // Zone border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(b.x, b.y, b.width, b.height);

            // Zone label
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(zone.name, b.x + b.width / 2, b.y + 20);
        }
    }

    // Draw background grid
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= Config.CANVAS_WIDTH; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, Config.CANVAS_HEIGHT);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= Config.CANVAS_HEIGHT; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(Config.CANVAS_WIDTH, y);
            ctx.stroke();
        }
    }

    // Draw all users
    drawUsers() {
        const ctx = this.ctx;

        for (const [username, user] of this.users) {
            const { position, isLocal, isSpeaking, audioLevel } = user;

            // Draw speaking indicator (pulsing ring) if speaking
            if (isSpeaking && !isLocal) {
                this.drawSpeakingIndicator(ctx, position, audioLevel);
            }

            // Draw avatar circle
            ctx.beginPath();
            ctx.arc(position.x, position.y, Config.AVATAR_RADIUS, 0, Math.PI * 2);

            if (isLocal) {
                // Local user - cyan with glow
                ctx.fillStyle = Config.LOCAL_USER_COLOR;
                ctx.shadowColor = Config.LOCAL_USER_COLOR;
                ctx.shadowBlur = 15;
            } else {
                // Remote user - magenta, brighter if speaking
                const brightness = isSpeaking ? 1.0 : 0.7;
                ctx.fillStyle = isSpeaking ? '#ff00ff' : Config.REMOTE_USER_COLOR;
                ctx.shadowColor = Config.REMOTE_USER_COLOR;
                ctx.shadowBlur = isSpeaking ? 20 : 10;
            }

            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw border
            ctx.strokeStyle = isLocal ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw audio level bar for speaking users
            if (isSpeaking && audioLevel > 0) {
                this.drawAudioLevelBar(ctx, position, audioLevel);
            }

            // Draw username
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(username, position.x, position.y + Config.AVATAR_RADIUS + 15);
        }
    }

    // Draw pulsing speaking indicator
    drawSpeakingIndicator(ctx, position, audioLevel) {
        const pulseAmount = (Math.sin(this.speakingPulsePhase) + 1) / 2; // 0 to 1
        const baseRadius = Config.AVATAR_RADIUS + 5;
        const pulseRadius = baseRadius + pulseAmount * 10 * (0.5 + audioLevel);

        // Outer pulsing ring
        ctx.beginPath();
        ctx.arc(position.x, position.y, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + audioLevel * 0.5})`;
        ctx.lineWidth = 2 + audioLevel * 2;
        ctx.stroke();

        // Inner static ring
        ctx.beginPath();
        ctx.arc(position.x, position.y, baseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Draw audio level bar under user
    drawAudioLevelBar(ctx, position, audioLevel) {
        const barWidth = Config.AVATAR_RADIUS * 2;
        const barHeight = 4;
        const barX = position.x - barWidth / 2;
        const barY = position.y + Config.AVATAR_RADIUS + 20;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Level indicator
        const levelWidth = barWidth * Math.min(1, audioLevel * 5); // Scale up for visibility
        const gradient = ctx.createLinearGradient(barX, barY, barX + levelWidth, barY);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.6, '#ffff00');
        gradient.addColorStop(1, '#ff0000');

        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, levelWidth, barHeight);
    }

    // Get local user position
    getLocalPosition() {
        if (!this.localUser) return null;
        const user = this.users.get(this.localUser);
        return user ? user.position : null;
    }

    // Get local user zone
    getLocalZone() {
        if (!this.localUser) return null;
        const user = this.users.get(this.localUser);
        return user ? user.zone : null;
    }

    // Destroy renderer
    destroy() {
        this.stopRenderLoop();
        this.clearUsers();
    }
}

// Export for use
window.CanvasRenderer = CanvasRenderer;
