# ProcessXY Development Roadmap

## Current State

**Version:** 0.6.0 (Phase 5B Complete)
**Status:** AI SDK 6 fully integrated, data flow visualization, all tests passing

---

## Recently Completed

### Phase 5B: AI SDK Full Integration
- [x] Use Output.object() with Zod for structured output (replace NDJSON)
- [x] Create custom useGraphStream hook for graph streaming
  - ✓ Evaluated useChat/useObject: not suitable for graph events (mode/node/edge/remove)
  - ✓ Custom hook provides fine-grained callbacks for progressive rendering
- [x] Evaluated AI Elements for chat UI
  - ✓ Available: Conversation, Message, Prompt Input, Shimmer
  - ✓ Decision: Optional enhancement - current simple UI works well for process commands
  - ✓ Can add later via `npx ai-elements@latest add <component>`
- [x] Add data flow visualization on edges
  - ✓ Created DataFlowEdge component with data type icons
  - ✓ Supports dataType: document, form, data, database, message, user
  - ✓ Shows animated flow particles when animated=true
  - ✓ Updated schema and system prompt

### AI SDK Migration (Phase 5)
- [x] Migrate from @google/generative-ai to AI SDK 6
- [x] Add @ai-sdk/google, @ai-sdk/react, ai packages
- [x] Update to gemini-3-flash-preview (latest model)
- [x] Add Zod schemas for type-safe graph validation
- [x] Fix all TypeScript errors
- [x] Upgrade all packages to latest versions
- [x] 49/49 tests passing

---

## Upcoming Phases

### Phase 6: UX Polish
- [ ] Undo/redo support for patch-based updates
- [ ] Templates for common processes
- [ ] Redesign data flow visualization on edges
  - Current: basic icons/labels on edges
  - Goal: Supabase-style table view, schema inspector, better visual design
- [ ] Data inspector panel for edges

### Phase 7: Advanced Features
- [ ] Node grouping/subprocesses
- [ ] AI integration for SelfConnectingEdge (loop-back flows)
- [ ] Swimlanes/Pools (BPMN)
- [ ] Gateway icons (X for exclusive, + for parallel)

### Phase 8: Collaboration & Scale
- [ ] Collaborative editing (CRDT support)
- [ ] Dual-model architecture (fast + slow AI)
- [ ] Lean/VSM symbols (inventory triangles, kaizen bursts)
- [ ] Multiple edge types (dashed for message flows)

### Lower Priority
- [ ] Export to PNG/PDF
- [ ] Keyboard shortcuts for shape changes

---

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Backend API, AI SDK streaming, system prompt |
| `src/components/ChatInterface.tsx` | Streaming consumer, graph updates |
| `src/components/ProcessMap.tsx` | React Flow wrapper, node/edge types |
| `src/components/DevControlPanel.tsx` | Dev tools panel with test scenarios |
| `src/hooks/useGraphStream.ts` | SSE streaming hook with event callbacks |
| `src/utils/autoLayout.ts` | Height-aware centered-spine layout |
| `src/types/schemas.ts` | Zod schemas for graph validation |
| `src/db/maps.ts` | SQLite persistence |

---

## Tech Stack

| Component | Package | Version |
|-----------|---------|---------|
| AI | ai (AI SDK) | 6.0.3 |
| AI Provider | @ai-sdk/google | 3.0.1 |
| Model | gemini-3-flash-preview | latest |
| Flow | @xyflow/react | 12.10.0 |
| UI | shadcn/ui + Radix | latest |
| Styling | Tailwind CSS | 4.1.18 |
| Validation | Zod | 4.2.1 |
| Runtime | Bun | latest |
| Database | bun:sqlite | built-in |
