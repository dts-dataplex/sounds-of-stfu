# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sounds of STFU** is a conceptual project for creating a spatial audio communication platform that improves upon Discord's limitations. The goal is to simulate a real-world bar/social space where multiple conversations can happen simultaneously without requiring users to switch between separate channels.

### Core Concept

The platform aims to solve the problem of spatial audio in digital communication by:
- Allowing multiple conversation groups to coexist in the same "room" with audio that fades based on virtual distance
- Creating a heat map visualization of conversations to help users navigate social spaces
- Implementing features like "talking sticks" for moderation
- Supporting audio mixing where users can tune different groups to "overheard", "audible", or "off"
- Simulating a two-story bar with gaming areas, discussion spaces, a central bar, private booths, and a small stage

### Current State

**This repository is in the conceptual/planning phase.** Currently it contains only:
- `STFU-steev.md`: Comprehensive design document outlining the vision, problem statement, and desired features

No code has been written yet. The project is ready for initial architecture and implementation.

## Key Design Requirements

From the design document, any implementation should consider:

1. **Spatial Audio Engine**: Technology to handle multi-party audio streams with distance-based volume/mixing
2. **Distributed & Secure**: Support for secure multi-party digital communications
3. **Visual Heat Map**: Real-time visualization of conversation activity and topics
4. **User Controls**: Ability to adjust audio levels per conversation group, move between groups
5. **Moderation Tools**: "Talking stick" mechanism for managing heated discussions
6. **Privacy & Security**: Transparent technology usage with strong privacy/security protections

## Development Approach

Per the design document, the project emphasizes:
- **Iterative development**: Refine, reflect, decide, implement, improve
- **Git discipline**: Commit artifacts incrementally with clear reasoning in commit messages
- **Sequential thinking**: Think through problems completely before implementing solutions
- **Stakeholder communication**: Check with project leaders when decisions require clarification
- **Cost-effectiveness**: Balance quality with resource usage

## When Starting Development

Future instances should:
1. Review `STFU-steev.md` thoroughly to understand the vision
2. Research existing spatial audio technologies and platforms
3. Define technical architecture (client-server model, audio streaming protocols, etc.)
4. Create initial project structure with appropriate build tools and dependencies
5. Use git to track all decisions and implementations with detailed commit messages
