// Chatsubo Configuration
const Config = {
    // Server endpoints
    API_BASE: window.location.origin,
    WS_BASE: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`,

    // Canvas dimensions
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,

    // User avatar
    AVATAR_RADIUS: 15,
    LOCAL_USER_COLOR: '#00ffff',
    REMOTE_USER_COLOR: '#ff00ff',

    // Position update rate limiting
    POSITION_UPDATE_INTERVAL: 50, // ms (20 updates/sec max)

    // Spatial audio parameters
    AUDIO: {
        MAX_DISTANCE: 400,      // Max distance for audio falloff
        REF_DISTANCE: 50,       // Reference distance for audio
        ROLLOFF_FACTOR: 2,      // How quickly audio falls off
        CONE_INNER_ANGLE: 360,  // Full audio within this angle
        CONE_OUTER_ANGLE: 360,  // Reduced audio outside inner angle
        CONE_OUTER_GAIN: 0.5,   // Gain at outer cone edge

        // Zone acoustic filter profiles (BiquadFilter settings)
        ZONE_FILTERS: {
            gaming_corner: {
                type: 'lowshelf',      // Slightly warm, cozy gaming area
                frequency: 500,
                gain: -2,
                Q: 1.0
            },
            main_bar: {
                type: 'peaking',       // Neutral baseline
                frequency: 1000,
                gain: 0,
                Q: 1.0
            },
            card_tables: {
                type: 'highshelf',     // Focused conversation, clearer mids
                frequency: 2000,
                gain: 1,
                Q: 0.7
            },
            firepit: {
                type: 'lowpass',       // Intimate warmth, fire ambiance
                frequency: 3000,
                gain: 0,
                Q: 0.8
            },
            private_booths: {
                type: 'lowpass',       // Very private, muted external sounds
                frequency: 2000,
                gain: 0,
                Q: 1.2
            },
            stage: {
                type: 'highshelf',     // Amplified, clear projection
                frequency: 3000,
                gain: 3,
                Q: 0.5
            },
            upstairs: {
                type: 'lowpass',       // Muffled floor separation
                frequency: 2500,
                gain: 0,
                Q: 1.0
            }
        }
    },

    // Zone definitions (from design doc)
    ZONES: {
        gaming_corner: {
            name: 'Gaming Corner',
            bounds: { x: 0, y: 0, width: 200, height: 200 },
            acousticMultiplier: 0.8,
            color: 'rgba(255, 100, 100, 0.1)'
        },
        main_bar: {
            name: 'Main Bar',
            bounds: { x: 200, y: 0, width: 400, height: 300 },
            acousticMultiplier: 1.0,
            color: 'rgba(100, 255, 255, 0.1)'
        },
        card_tables: {
            name: 'Card Tables',
            bounds: { x: 600, y: 0, width: 200, height: 200 },
            acousticMultiplier: 0.9,
            color: 'rgba(255, 255, 100, 0.1)'
        },
        firepit: {
            name: 'Firepit',
            bounds: { x: 0, y: 200, width: 200, height: 200 },
            acousticMultiplier: 0.7,
            color: 'rgba(255, 150, 50, 0.15)'
        },
        private_booths: {
            name: 'Private Booths',
            bounds: { x: 200, y: 300, width: 400, height: 200 },
            acousticMultiplier: 0.5,
            color: 'rgba(150, 100, 255, 0.1)'
        },
        stage: {
            name: 'Stage',
            bounds: { x: 600, y: 200, width: 200, height: 200 },
            acousticMultiplier: 1.2,
            color: 'rgba(255, 50, 150, 0.1)'
        },
        upstairs: {
            name: 'Upstairs',
            bounds: { x: 0, y: 400, width: 800, height: 200 },
            acousticMultiplier: 0.6,
            color: 'rgba(100, 100, 100, 0.1)'
        }
    },

    // WebSocket message types
    MSG_TYPES: {
        POSITION_UPDATE: 'position_update',
        PING: 'ping',
        PONG: 'pong',
        ROOM_STATE: 'room_state',
        USER_JOINED: 'user_joined',
        USER_MOVED: 'user_moved',
        USER_LEFT: 'user_left',
        ERROR: 'error'
    },

    // Reconnection settings
    RECONNECT: {
        MAX_ATTEMPTS: 5,
        BASE_DELAY: 1000,
        MAX_DELAY: 30000
    }
};

// Helper to get zone at position
Config.getZoneAt = function(x, y) {
    for (const [id, zone] of Object.entries(this.ZONES)) {
        const b = zone.bounds;
        if (x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height) {
            return { id, ...zone };
        }
    }
    return { id: 'main_bar', ...this.ZONES.main_bar };
};

// Freeze config to prevent accidental modification
Object.freeze(Config);
Object.freeze(Config.AUDIO);
Object.freeze(Config.AUDIO.ZONE_FILTERS);
Object.freeze(Config.MSG_TYPES);
Object.freeze(Config.RECONNECT);
