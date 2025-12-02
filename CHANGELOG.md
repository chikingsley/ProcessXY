# Changelog

All notable changes to ProcessXY will be documented in this file.

## [Unreleased]

### Dev Control Panel & UX Improvements

**Added:**
- **Dev Control Panel** - Collapsible floating panel (bottom-right) with:
  - Test scenario selector (Simple Flow, Linear Process, Single Decision, Main Flow, Full Test)
  - Live node positions display (toggle with Positions button)
  - Node/edge count display
  - Quick actions: Auto-layout, Clear map, Export JSON
  - Keyboard shortcuts reference
- **Parent-aligned positioning** - Nodes now align vertically with their parent branch instead of always returning to center
- **Shift+drag selection** - Draw selection box to select multiple nodes
- **Partial selection mode** - Nodes partially inside selection box are included

**Fixed:**
- **Proper spacing between decision nodes and branch nodes** - Layout now uses cumulative height calculation instead of fixed level heights. Diamond nodes (160px tall) now have proper 60px gap before branch nodes below them
- **Selection bounding box hidden** - Blue box around selected nodes no longer appears
- **SelfConnectingEdge selection issue** - Fixed edge rendering to use BaseEdge component, preventing selection box glitches
- **Initial view fits all nodes** - Map now starts zoomed to show all nodes instead of zoomed in
- Centered spine alignment in auto-layout (Ctrl+L) now works correctly
- Node widths in `autoLayout.ts` now match actual CSS dimensions

**Changed:**
- **"Branch nodes" terminology** - Formal naming for nodes that follow decision nodes
- Layout preset system with `verticalGap` parameter (replaces fixed `levelHeight`)
- Default scenario changed to "Main Flow" (7-node flow without disconnected subgraphs)

**Technical:**
- Height-aware vertical positioning: Y = sum of previous node heights + gaps
- Parent-aware horizontal positioning: Single-child nodes align with off-center parents
- Custom centered-spine layout algorithm (replaced Dagre)
- Union-Find algorithm for handling disconnected subgraphs
- SelfConnectingEdge uses BaseEdge and EdgeLabelRenderer for proper React Flow integration

## [0.3.0] - 2025-11-25

### Phase 4: SQLite Persistence & Bug Fixes

**Added:**
- SQLite persistence for saving/loading process maps
- `MapsPanel` component with dropdown UI for map management
- `usePersistence` hook with auto-save (2s debounce)
- CRUD API endpoints (`/api/maps`, `/api/maps/:id`, `/api/maps/recent`)
- Load most recent map on startup
- 13 persistence tests

**Fixed:**
- Backspace/Delete keys now work in chat input (keyboard shortcuts skip input fields)
- SSE parsing now handles JSON spanning multiple network chunks (brace-counting)
- Diamond node edge routing - edges now exit from correct left/right handles
- System prompt updated with `sourceHandle` requirements for decision branches

**Technical:**
- Client-side NDJSON parser with brace counting for partial JSON accumulation
- `useKeyboardShortcuts` hook checks for INPUT/TEXTAREA/contentEditable focus

## [0.2.0] - 2025-11-24

### Phase 3: Fine-Grained Updates

**Added:**
- Intent-based mode switching (AI determines "create" vs "update" mode)
- `mergeNodes()` utility for progressive graph updates
- Edge preservation in UPDATE mode (prevents accidental edge deletion)
- 18 phase 3 tests + 6 integration tests

**Features:**
- Create mode: Replaces entire graph for new process requests
- Update mode: Merges changes with existing nodes for modifications
- Progressive streaming updates during AI response

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
