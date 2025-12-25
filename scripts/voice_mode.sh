#!/usr/bin/env bash

export OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"

# Install VoiceMode MCP python package and dependencies
curl -LsSf https://astral.sh/uv/install.sh | sh
uvx voice-mode-install

# Optional: Set OpenAI API key (backup if local services unavailable)
# export OPENAI_API_KEY=your-openai-key

# Add VoiceMode to Claude
claude mcp add --scope user voicemode -- uvx --refresh voice-mode

# Start a voice conversation
claude converse
