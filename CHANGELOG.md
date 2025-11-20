# Changelog

All notable changes to ProcessXY will be documented in this file.

## [Unreleased]

## [0.1.0] - 2025-01-20

### ✨ Phase 1: Multi-Node Selection with AI Awareness

**Added:**
- Multi-node selection state management
- Custom node component with visual feedback
- Selected nodes display in chat UI with green chips
- Selection-aware AI context for natural language commands
- E2E testing with Playwright (5 tests)
- Unit tests (11 tests)
- CI/CD pipeline with GitHub Actions
- Auto-fix workflow for failed tests
- Comprehensive documentation

**Features:**
- Click nodes to select them (green glow effect)
- Shift+Click for multi-select
- AI understands "this" and "these" referring to selected nodes
- Status indicators (bottleneck/issue/complete) with colored dots
- Natural language commands like "make this red" or "mark these as complete"

**Technical:**
- Replaced Stagehand with Playwright for E2E testing
- Fixed React Flow node styling (hidden default background)
- Using Google Gemini Flash for AI
- Built with Bun, React 19, XyFlow, Tailwind

**Tests:**
- 16/16 tests passing (11 unit + 5 E2E)
- All tests run in CI/CD pipeline
- No API keys required for testing

## [0.0.1] - 2025-01-15

### Initial Release

**Added:**
- Basic AI-powered process map generation
- Chat interface for natural language input
- Process visualization with XyFlow
- Google Gemini integration
- Basic node and edge creation

---

Format based on [Keep a Changelog](https://keepachangelog.com/)
