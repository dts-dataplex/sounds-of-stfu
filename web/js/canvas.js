// Canvas Renderer for Room Visualization
class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.users = new Map(); // username -> { position, zone, isLocal }
        this.localUser = null;
        this.isDragging = false;
        this.animationFrame = null;

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

        // Start render loop
        this.startRenderLoop();
    }

    // Set up mouse/touch event listeners
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleMouseUp());

        // Click to move
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
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
        if (!this.isDragging || !this.localUser) return;

        const coords = this.getCanvasCoords(e.clientX, e.clientY);
        this.moveLocalUser(coords.x, coords.y);
    }

    // Handle mouse up
    handleMouseUp() {
        this.isDragging = false;
    }

    // Handle touch start
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    // Handle touch move
    handleTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            const coords = this.getCanvasCoords(touch.clientX, touch.clientY);
            this.moveLocalUser(coords.x, coords.y);
        }
    }

    // Handle click (click to move)
    handleClick(e) {
        if (this.isDragging) return; // Don't trigger on drag end

        const coords = this.getCanvasCoords(e.clientX, e.clientY);
        this.moveLocalUser(coords.x, coords.y);
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

    // Update user position (for remote users)
    updateUser(username, position, zone) {
        if (this.users.has(username)) {
            const user = this.users.get(username);
            user.position = position;
            user.zone = zone || Config.getZoneAt(position.x, position.y).id;
        } else {
            this.users.set(username, {
                position,
                zone: zone || Config.getZoneAt(position.x, position.y).id,
                isLocal: username === this.localUser
            });
        }
    }

    // Remove user
    removeUser(username) {
        this.users.delete(username);
    }

    // Clear all users
    clearUsers() {
        this.users.clear();
        this.localUser = null;
    }

    // Start render loop
    startRenderLoop() {
        const render = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(render);
        };
        render();
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

        // Draw users
        this.drawUsers();
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
            const { position, isLocal } = user;

            // Draw avatar circle
            ctx.beginPath();
            ctx.arc(position.x, position.y, Config.AVATAR_RADIUS, 0, Math.PI * 2);

            if (isLocal) {
                // Local user - cyan with glow
                ctx.fillStyle = Config.LOCAL_USER_COLOR;
                ctx.shadowColor = Config.LOCAL_USER_COLOR;
                ctx.shadowBlur = 15;
            } else {
                // Remote user - magenta
                ctx.fillStyle = Config.REMOTE_USER_COLOR;
                ctx.shadowColor = Config.REMOTE_USER_COLOR;
                ctx.shadowBlur = 10;
            }

            ctx.fill();
            ctx.shadowBlur = 0;

            // Draw border
            ctx.strokeStyle = isLocal ? '#ffffff' : 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw username
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(username, position.x, position.y + Config.AVATAR_RADIUS + 15);
        }
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
