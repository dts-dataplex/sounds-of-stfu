#!/bin/bash
# Launch Chrome with remote debugging enabled for browser automation
# This allows direct browser control without Docker MCP server

set -e

CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEBUG_PORT=9222
USER_DATA_DIR="$HOME/chrome-debug-claude"

echo "🚀 Launching Chrome with remote debugging..."
echo "   Debug port: $DEBUG_PORT"
echo "   User data: $USER_DATA_DIR"
echo ""

# Check if Chrome is already running with debug port
if lsof -i :$DEBUG_PORT >/dev/null 2>&1; then
    echo "⚠️  Chrome debug port $DEBUG_PORT is already in use."
    echo "   If you need to restart, run: pkill -f 'remote-debugging-port=$DEBUG_PORT'"
    exit 1
fi

# Launch Chrome with remote debugging
"$CHROME_PATH" \
    --remote-debugging-port=$DEBUG_PORT \
    --user-data-dir="$USER_DATA_DIR" \
    --no-first-run \
    --no-default-browser-check \
    http://localhost:5176/ &

CHROME_PID=$!

echo "✅ Chrome launched (PID: $CHROME_PID)"
echo "   Remote debugging: http://localhost:$DEBUG_PORT"
echo "   Page: http://localhost:5176/"
echo ""
echo "To stop: pkill -f 'remote-debugging-port=$DEBUG_PORT'"
echo "Or just close the Chrome window"
