# ProcessXY Development Roadmap

## Current Sprint: Phase 4 - SQLite Persistence

**Status:** COMPLETE - All tests passing (37 tests)

---

## Phase 4.5: Bug Fixes ✅

**Status:** COMPLETE

### Fixes
- [x] Backspace/Delete keys not working in chat input
- [x] SSE parsing error for edges spanning multiple chunks
- [x] Diamond node edge routing (sourceHandle for left/right branches)

---

## Phase 3: Fine-Grained Updates

**Priority:** CRITICAL - Solves regeneration problem

### Decision: Intent-Based Mode Switching ✅
Chose hybrid approach with AI determining "create" vs "update" mode:
- **Create mode**: Replaces entire graph (new process requests)
- **Update mode**: Merges changes with existing nodes (modifications, color changes, status updates)

### Implementation
- [x] Update AI system prompt with mode indicator format
- [x] Add mode detection in system prompt rules
- [x] Create `mergeNodes` utility function in ChatInterface
- [x] Handle `mode` message type in streaming consumer
- [x] Handle `remove_node` message type for deletions
- [x] Progressive merge updates during streaming

### Testing ✅
- [x] Unit tests for `mergeNodes()` function (8 tests)
- [x] Mode detection logic tests (2 tests)
- [x] NDJSON streaming format tests (5 tests)
- [x] Integration test: CREATE mode (new process)
- [x] Integration test: UPDATE mode (modify existing)
- [x] Integration test: Color change verification
- [x] API error handling test

---

## Phase 4: SQLite Persistence ✅

**Status:** COMPLETE - All tests passing

### Implementation
- [x] SQLite database schema (`processxy.db`)
- [x] `maps` table with id, name, nodes (JSON), edges (JSON), timestamps
- [x] CRUD API endpoints (`/api/maps`, `/api/maps/:id`, `/api/maps/recent`)
- [x] `usePersistence` hook with auto-save (2s debounce)
- [x] `MapsPanel` component with dropdown UI
- [x] Load most recent map on startup
- [x] Create/load/delete maps from UI
- [x] 13 persistence tests

---

## Future Enhancements (Backlog)

- [ ] **Dev Control Panel** - Collapsible panel with:
  - Load multiple test scenarios
  - Clear map
  - Toggle grid/guidelines
  - Export/import JSON
  - Performance metrics
- [ ] Custom edge routing for backward flows (SelfConnectingEdge exists but needs AI integration)
- [ ] Undo/redo support for patch-based updates
- [ ] Node grouping/subprocesses
- [ ] Export to PNG/PDF
- [ ] Collaborative editing (CRDT support)
- [ ] Templates for common processes
- [ ] Keyboard shortcuts for shape changes
- [ ] Dual-model architecture (fast + slow AI for suggestions)
- [ ] Swimlanes/Pools (BPMN)
- [ ] Multiple edge types (dashed for message flows, dotted for associations)
- [ ] Gateway icons (X for exclusive, + for parallel)
- [ ] Lean/VSM symbols (inventory triangles, kaizen bursts)

---

## Completed ✅

### Phase 1: Core Streaming & Edges
- [x] Implement streaming for progressive node rendering
- [x] Fix NDJSON parser with brace-counting
- [x] Research fine-grained update strategies
- [x] Research React Flow advanced features
- [x] Add arrow markers (arrowclosed, 25px)
- [x] Add bezier edges (smooth curves)
- [x] Add yes/no decision labels with colors
- [x] Auto-fit viewport during streaming
- [x] Fix marker type normalization (lowercase)

### Phase 2: Node Shapes
- [x] Implement DiamondNode for decision points
- [x] Implement OvalNode for start/end nodes
- [x] Implement RectangleNode for process steps
- [x] Configure diamond handles (dynamic bottom-left/right based on outputCount)
- [x] Register node types in ProcessMap.tsx
- [x] Update AI system prompt to assign shapes based on node function
- [x] Update ProcessNode type to include outputCount

### Infrastructure
- [x] Context menu for node actions (status, color, delete, duplicate)
- [x] Auto-layout with Dagre
- [x] Undo/redo history hook
- [x] Keyboard shortcuts (Ctrl+Z, Ctrl+L, Delete)
- [x] Selection chips in chat interface
- [x] Test data with all node types and edge configurations
- [x] SelfConnectingEdge for loop-back flows
- [x] FloatingEdge for dynamic connection points

---

## Key Files

- `/src/index.ts` - Backend API, streaming, system prompt, maps CRUD
- `/src/components/ChatInterface.tsx` - Streaming consumer, graph updates
- `/src/components/ProcessMap.tsx` - React Flow wrapper, node/edge types
- `/src/components/MapsPanel.tsx` - Map selector dropdown, save status
- `/src/components/nodes/DiamondNode.tsx` - Decision node (diamond shape)
- `/src/components/nodes/OvalNode.tsx` - Start/end node (oval shape)
- `/src/components/nodes/RectangleNode.tsx` - Process step (rectangle)
- `/src/components/edges/SelfConnectingEdge.tsx` - Loop-back edges
- `/src/db/maps.ts` - SQLite database operations
- `/src/hooks/usePersistence.ts` - Auto-save, load, map management
- `/src/hooks/useHistory.ts` - Undo/redo state management
- `/src/types/process.ts` - Type definitions
- `/src/utils/autoLayout.ts` - Dagre layout algorithm
- `/src/utils/testData.ts` - Test nodes and edges

---

## Test Prompt

Use this to test all features:

```
Create a customer approval process with these steps:
1. Customer submits application (start)
2. Review application
3. Check credit score (decision point - yes/no branches)
4. If yes: Approve application
5. If no: Request additional documents, then return to review
6. Final approval (end)

Make sure it has smooth curved edges with arrows, and label the decision branches clearly.
```

Expected results:
- ✅ Bezier edges (smooth curves)
- ✅ Arrow markers (25px, visible)
- ✅ Yes/No labels on decision branches
- ✅ Auto-fit viewport
- ✅ Diamond shape for decision
- ✅ Oval for start/end

---

## Research Resources

- React Flow docs: https://reactflow.dev
- Marker types: https://reactflow.dev/api-reference/types/marker-type
- Edge markers: https://reactflow.dev/api-reference/types/edge-marker
- Edge API: https://reactflow.dev/api-reference/types/edge
- Examples: https://reactflow.dev/examples/edges/markers
- RFC 6902 (JSON Patch): https://datatracker.ietf.org/doc/html/rfc6902
- Aider edit formats: https://aider.chat/docs/more/edit-formats.html
