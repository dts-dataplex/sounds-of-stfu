# Chatsubo - Spatial Audio Chat

A spatial audio communication platform that simulates a virtual bar environment. Users can move around a 2D space and hear other users based on their virtual distance and zone.

## Features

- **Spatial Audio**: Distance-based audio falloff using Web Audio API PannerNode
- **Zone System**: Different acoustic environments (Main Bar, Gaming Corner, Private Booths, etc.)
- **Real-time Position Sync**: See and hear others move in real-time via WebSocket
- **LiveKit Integration**: WebRTC audio routing via self-hosted LiveKit SFU
- **Cyberpunk Aesthetic**: Neuromancer-inspired visual design

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Modern web browser with WebRTC support

### Running with Docker

```bash
# Clone the repository
git clone https://github.com/your-org/sounds-of-stfu.git
cd sounds-of-stfu

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

The application will be available at `http://localhost:8080`

### Development Setup

```bash
# Install Go 1.23+
# Clone and run locally
go run ./cmd/server/
```

## Usage

### Joining a Room

1. Open `http://localhost:8080` in your browser
2. Enter your username (will be saved for next visit)
3. Enter a room name (default: "chatsubo")
4. Click "Enter Bar"

### Controls

| Action | Control |
|--------|---------|
| Move to location | Click on canvas |
| Move continuously | Arrow keys or WASD |
| Toggle microphone | Click mic button |
| Adjust volume | Use volume slider |
| Open debug console | Press `~` (tilde) |

### Debug Console Commands

| Command | Description |
|---------|-------------|
| `/help` | Show all commands |
| `/tp <x> <y>` | Teleport to position |
| `/users` | List connected users |
| `/volume <0-1>` | Set master volume |
| `/zone` | Show current zone info |
| `/status` | Show connection status |
| `/clear` | Clear console output |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Go Backend Server                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ HTTP Server  │  │ WebSocket    │  │ LiveKit          │  │
│  │ Static files │  │ Position sync│  │ Token service    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Browser Client                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ 2D Canvas    │  │ LiveKit JS   │  │ Web Audio API    │  │
│  │ Renderer     │  │ Client SDK   │  │ Spatial Audio    │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Zone Layout

```
┌────────────────────────────────────────────────────────────┐
│                        CHATSUBO                             │
│  ┌─────────────┐                    ┌─────────────────┐    │
│  │   GAMING    │                    │    CARD         │    │
│  │   CORNER    │    MAIN BAR        │    TABLES       │    │
│  │   (0.8x)    │    (1.0x)          │    (0.9x)       │    │
│  └─────────────┘                    └─────────────────┘    │
│  ┌─────────────┐                    ┌─────────────────┐    │
│  │   FIREPIT   │   PRIVATE BOOTHS   │     STAGE       │    │
│  │   (0.7x)    │   (0.5x)           │     (1.2x)      │    │
│  └─────────────┘                    └─────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  UPSTAIRS (0.6x)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

Zone multipliers affect audio volume in addition to distance falloff.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |
| `LIVEKIT_URL` | LiveKit server URL | ws://livekit:7880 |
| `LIVEKIT_API_KEY` | LiveKit API key | devkey |
| `LIVEKIT_API_SECRET` | LiveKit API secret | secret |

### Audio Parameters

Audio settings are configured in `web/js/config.js`:

```javascript
AUDIO: {
    MAX_DISTANCE: 400,      // Max distance for audio falloff
    REF_DISTANCE: 50,       // Reference distance (full volume)
    ROLLOFF_FACTOR: 2,      // Falloff rate (exponential)
}
```

## Project Structure

```
sounds-of-stfu/
├── cmd/server/main.go      # Go entry point
├── internal/
│   ├── api/handlers.go     # HTTP and WebSocket handlers
│   ├── room/               # Room state management
│   ├── livekit/tokens.go   # LiveKit token generation
│   └── config/config.go    # Server configuration
├── web/
│   ├── index.html          # Main HTML page
│   ├── css/main.css        # Cyberpunk styles
│   └── js/
│       ├── app.js          # Main application logic
│       ├── config.js       # Client configuration
│       ├── audio.js        # Spatial audio processing
│       ├── canvas.js       # 2D canvas rendering
│       └── livekit.js      # LiveKit client wrapper
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Go app container
└── livekit.yaml            # LiveKit server config
```

## Troubleshooting

### LiveKit Connection Issues

If voice setup fails:
1. Check that LiveKit container is running: `docker-compose ps`
2. Verify ports 7880-7881 and 50000-50100 are accessible
3. Check LiveKit logs: `docker-compose logs livekit`

### WebSocket Disconnections

The app automatically attempts to reconnect with exponential backoff. Check the debug console (`~`) for connection status.

### Audio Not Working

1. Ensure microphone permissions are granted
2. Check browser console for errors
3. Verify LiveKit connection status in debug console

## License

MIT License - see LICENSE file for details.

## Credits

- [LiveKit](https://livekit.io/) - WebRTC infrastructure
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Spatial audio
- Inspired by the Chatsubo bar from William Gibson's Neuromancer
