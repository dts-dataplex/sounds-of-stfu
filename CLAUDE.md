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

**Design phase complete - ready for development.** The repository contains:

**Foundational Documents:**
- `STFU-steev.md`: Original design document outlining the vision, problem statement, and desired features
- `PRODUCT_REQUIREMENTS.md`: Comprehensive PRD with user personas, features, user stories, and success metrics
- `BACKLOG.md`: Detailed feature backlog with 150+ prioritized tasks across MVP v1.0, v1.1, and v2.0
- `AGENTIC_DESIGN_PATTERNS.md`: Architectural guidance using established agentic AI patterns

**Complete Floor Plan Design (NEW - 2025-12-24):**
- `docs/plans/CHATSUBO_DESIGN_SUMMARY.md`: Executive summary and design overview (start here)
- `docs/plans/CHATSUBO_FLOOR_PLAN_SPECIFICATIONS.md`: Complete technical specifications (886 lines)
- `docs/plans/FLOOR_PLAN_VISUAL_REFERENCE.md`: ASCII diagrams and quick reference (473 lines)
- `docs/plans/DEVELOPER_QUICK_START.md`: Implementation guide with code examples (869 lines)
- `docs/plans/2025-12-24-bar-layout-and-privacy-architecture.md`: Architecture decisions and user journey

**Chatsubo Virtual Bar Design:**
- 6 distinct zones across 2 floors (gaming, bar, card tables, firepit, booths, stage)
- Wave-based spatial audio with distance falloff formulas
- Isometric 3D view with semi-transparent second floor
- Lighting-based depth perception (Neuromancer cyberpunk aesthetic)
- Privacy-first architecture (PeerJS mesh, E2E encryption, local SLM)
- Complete zone coordinates, acoustic parameters, lighting specs
- Social flow analysis and implementation roadmap

**Status:** No code written yet. Design complete, ready for Phase 1 implementation (Week 1: Core Layout).

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

## Agentic Architecture Patterns

**See `AGENTIC_DESIGN_PATTERNS.md` for comprehensive guidance.**

When designing AI-powered features for this platform, apply established agentic design patterns:

### Core Patterns
1. **Reflection Pattern**: Iterative self-evaluation and refinement (use for conversation summaries, topic detection)
2. **Tool Use Pattern**: LLMs augmented with external tools and APIs (use for data access, integrations)
3. **Planning Pattern**: Decompose complex tasks into structured roadmaps (use for development workflow, multi-step features)
4. **Multi-Agent Collaboration**: Specialized agents coordinated by orchestrator (use for moderator dashboard, AI feature suite)
5. **ReAct Pattern**: Thought → Action → Observation loops (use for conversation recommendations, smart moderation)

### Development Workflow Patterns
- **Use Multi-Agent pattern** for parallel development: Separate teams for Audio, Frontend, Backend, AI/ML, DevOps
- **Use Planning pattern** for sprint execution: Analyze backlog → Decompose → Sequence → Execute → Adapt
- **Use Reflection pattern** for code quality: Self-review → Tests → Peer review → Refine → Merge
- **Leverage superpowers skills**: `brainstorming`, `writing-plans`, `requesting-code-review`, `systematic-debugging`

### Feature Implementation Guidance
- **MVP (v1.0)**: Keep it simple - basic Tool Use + Planning, no complex AI agents yet
- **v1.1**: Add Reflection for quality-critical features (topic detection, recommendations)
- **v2.0**: Full agentic features with Multi-Agent + ReAct (moderator dashboard, smart recommendations)

### Key Principles
- Start simple, evolve complexity only when needed
- Combine patterns thoughtfully (most features use multiple patterns)
- Design for observability (log reasoning traces, agent interactions)
- Handle failures gracefully (fallbacks, human-in-loop, graceful degradation)
- Respect user agency (AI augments, doesn't replace user decisions)

## When Starting Development

Future instances should:
1. **Understand the vision**: Review `STFU-steev.md` for the original concept and `PRODUCT_REQUIREMENTS.md` for detailed features
2. **Review the roadmap**: Check `BACKLOG.md` for prioritized tasks and current development phase
3. **Study agentic patterns**: Read `AGENTIC_DESIGN_PATTERNS.md` before implementing AI features
4. **Research technologies**: Evaluate spatial audio libraries (Web Audio API, Agora, Dolby.io, Janus)
5. **Define architecture**: System design document, tech stack selection, data flow diagrams
6. **Use superpowers**: Leverage `brainstorming` skill before major features, `writing-plans` for complex tasks
7. **Track everything in git**: Commit artifacts incrementally with detailed reasoning in commit messages

## Commands & Development Workflow

### Not Yet Established
No build commands, test runners, or development servers exist yet. These will be established once the tech stack is selected (task RES-005 in BACKLOG.md).

### Git Workflow
- **Configured user**: helpdesk@thisisunsafe.ai (Ann Claude)
- **Commit convention**: Reference backlog IDs (e.g., "feat: implement WebRTC audio (AUD-001)")
- **Branch strategy**: TBD once development begins
