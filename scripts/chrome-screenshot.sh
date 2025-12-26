#!/bin/bash
# Take screenshot of Chrome page via DevTools Protocol
# Requires Chrome to be running with --remote-debugging-port=9222

set -e

DEBUG_PORT=9222
OUTPUT_DIR="screenshots"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create screenshots directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "📸 Taking screenshot via Chrome DevTools Protocol..."

# Get page info
PAGE_INFO=$(curl -s http://localhost:$DEBUG_PORT/json)
PAGE_ID=$(echo "$PAGE_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['id'])")
WS_URL=$(echo "$PAGE_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)[0]['webSocketDebuggerUrl'])")

echo "   Page ID: $PAGE_ID"
echo "   WebSocket: $WS_URL"

# Use Chrome DevTools Protocol to capture screenshot
# This requires a Python script to connect via WebSocket

cat > /tmp/screenshot_cdp.py <<'PYTHON'
import asyncio
import websockets
import json
import base64
import sys

async def take_screenshot(ws_url, output_file):
    async with websockets.connect(ws_url) as websocket:
        # Enable Page domain
        await websocket.send(json.dumps({
            "id": 1,
            "method": "Page.enable"
        }))
        response = await websocket.recv()

        # Capture screenshot
        await websocket.send(json.dumps({
            "id": 2,
            "method": "Page.captureScreenshot",
            "params": {
                "format": "png",
                "quality": 100
            }
        }))
        response = await websocket.recv()
        result = json.loads(response)

        if "result" in result and "data" in result["result"]:
            image_data = base64.b64decode(result["result"]["data"])
            with open(output_file, "wb") as f:
                f.write(image_data)
            print(f"✅ Screenshot saved to: {output_file}")
            return True
        else:
            print(f"❌ Error: {result}")
            return False

if __name__ == "__main__":
    ws_url = sys.argv[1]
    output_file = sys.argv[2]
    asyncio.run(take_screenshot(ws_url, output_file))
PYTHON

# Check if websockets module is available
if ! python3 -c "import websockets" 2>/dev/null; then
    echo "⚠️  Installing websockets module..."
    pip3 install websockets
fi

# Run the screenshot script
OUTPUT_FILE="$OUTPUT_DIR/chatsubo-$TIMESTAMP.png"
python3 /tmp/screenshot_cdp.py "$WS_URL" "$OUTPUT_FILE"

# Cleanup
rm /tmp/screenshot_cdp.py

echo ""
echo "Screenshot location: $OUTPUT_FILE"
