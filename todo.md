# ProcessXY Development Roadmap

## Current Sprint: Phase 1 Completion

### Research Tasks (In Progress)
- [x] Research all React Flow marker types (Arrow, ArrowClosed)
- [x] Research marker sizing options (width, height, color, strokeWidth)
- [x] Research official React Flow edge documentation
- [x] Confirmed: MarkerType.ArrowClosed = "arrowclosed" (lowercase)
- [x] Confirmed: Default arrow size ~12-15px, can go up to 30-40px
- [ ] Create comprehensive test prompt for all features

### Implementation Tasks
- [x] Add arrow markers to edges
- [x] Change edges to smoothstep type
- [x] Add yes/no labels for decision branches
- [x] Auto-fit viewport during streaming (Option A)
- [x] Normalize marker types in code (ArrowClosed → arrowclosed)
- [ ] **Make arrows bigger** (increase width/height from default to 20-25px)
- [ ] **Implement diamond shape for decision nodes**
- [ ] **Configure diamond edges to exit from bottom-left and bottom-right**
- [ ] **Implement oval shape for start/end nodes**
- [ ] Review and clean up system prompt (match React Flow conventions)

### Testing
- [x] Arrows display correctly
- [x] Smoothstep routing works
- [x] Yes/No labels appear
- [x] Auto-fit works during streaming
- [ ] Test arrows are visible and appropriately sized
- [ ] Test diamond shapes render correctly
- [ ] Test oval shapes render correctly
- [ ] Test complete process map with all shapes

---

## Phase 2: Node Shapes (Priority)

**Status:** IN PROGRESS (moved up from later phase)

### Shape Implementation
- [ ] Create ShapeNode component with SVG:
  - **Oval** for start/end nodes
  - **Rectangle** for process steps (current default)
  - **Diamond** for decision points (PRIORITY)
  - Circle for connectors (optional)
- [ ] Handle positioning for diamond nodes:
  - Source handles at bottom-left and bottom-right
  - Target handle at top center
  - Prevents edges from overlapping
- [ ] Register node types in ProcessMap.tsx
- [ ] Update AI system prompt to assign shapes based on node function
- [ ] Update ProcessNode type definition to include shape property

---

## Phase 3: Fine-Grained Updates

**Status:** Pending
**Priority:** CRITICAL - Solves regeneration problem

### Research & Decision (30 min)
- [ ] Review JSON Patch (RFC 6902) approach in detail
- [ ] Review Search/Replace blocks approach (Aider-style)
- [ ] Review Hybrid approach (intent-based switching)
- [ ] **DECIDE:** Which approach fits ProcessXY best
- [ ] Document decision and rationale

### Implementation
- [ ] Install required libraries (e.g., `rfc6902` if using JSON Patch)
- [ ] Create patch application utility
- [ ] Update AI system prompt for patch format
- [ ] Modify backend endpoint to handle patches
- [ ] Update ChatInterface to apply patches
- [ ] Add intent detection
- [ ] Test: "make this red", "mark as bottleneck"
- [ ] Test: "add node after this"
- [ ] Test: "create new process"

---

## Research Findings

### React Flow Marker Types (Official)
```typescript
enum MarkerType {
  Arrow = "arrow",           // Open arrow
  ArrowClosed = "arrowclosed" // Filled arrow (recommended)
}
```

### Marker Properties Available
```typescript
markerEnd: {
  type: "arrowclosed",  // or "arrow"
  width: 20,            // Default ~12-15, recommended 20-30
  height: 20,           // Match width for proportional arrows
  color: "#000000",     // Hex color
  strokeWidth: 2,       // Line thickness
}
```

### Edge Properties We're Using
- **type**: "smoothstep" (curved, avoids nodes)
- **markerEnd**: Arrow configuration
- **label**: "Yes", "No", etc.
- **labelStyle**: Color, fontWeight
- **labelShowBg**: true (readability)

### Edge Properties Available (Not Yet Used)
- animated: Edge animation
- sourceHandle/targetHandle: Specific connection points
- pathOptions: { offset, borderRadius }
- style: Custom CSS
- interactionWidth: Click area

---

## Test Prompt

Use this comprehensive prompt to test all Phase 1 features:

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

Expected to test:
- ✅ Smoothstep edges (curved)
- ✅ Arrow markers (should be visible)
- ✅ Yes/No labels on decision branches
- ✅ Auto-fit viewport
- 🔲 Diamond shape (once implemented)
- 🔲 Oval start/end (once implemented)

---

## Future Enhancements (Backlog)

- [ ] **Dev Control Panel** - Collapsible panel with:
  - Load multiple test scenarios
  - Clear map
  - Toggle grid/guidelines
  - Export/import JSON
  - Performance metrics
- [ ] Custom edge routing for backward flows
- [ ] Undo/redo support for patch-based updates
- [ ] Node grouping/subprocesses
- [ ] Export to PNG/PDF
- [ ] Collaborative editing (CRDT support)
- [ ] Templates for common processes
- [ ] Keyboard shortcuts for shape changes
- [ ] Dual-model architecture (fast + slow AI for suggestions)

---

## Completed ✅

- [x] Implement streaming for progressive node rendering
- [x] Fix NDJSON parser with brace-counting
- [x] Research fine-grained update strategies
- [x] Research React Flow advanced features
- [x] Add arrow markers (ArrowClosed)
- [x] Add smoothstep edges
- [x] Add yes/no decision labels
- [x] Auto-fit viewport during streaming
- [x] Fix marker type normalization

---

## Key Files

- `/src/index.ts` - Backend API, streaming, system prompt
- `/src/components/ChatInterface.tsx` - Streaming consumer, marker normalization
- `/src/components/CustomNode.tsx` - Node rendering (to be expanded for shapes)
- `/src/components/ProcessMap.tsx` - React Flow wrapper
- `/src/types/process.ts` - Type definitions

---

## Research Resources

- React Flow docs: https://reactflow.dev
- Marker types: https://reactflow.dev/api-reference/types/marker-type
- Edge markers: https://reactflow.dev/api-reference/types/edge-marker
- Edge API: https://reactflow.dev/api-reference/types/edge
- Examples: https://reactflow.dev/examples/edges/markers
- RFC 6902 (JSON Patch): https://datatracker.ietf.org/doc/html/rfc6902
- Aider edit formats: https://aider.chat/docs/more/edit-formats.html
