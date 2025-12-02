# ProcessXY Development Roadmap

## Current State

**Version:** 0.4.x (Unreleased)
**Status:** Dev Control Panel complete, selection/interaction improvements

---

## Phase 6: UX Polish

- [ ] Undo/redo support for patch-based updates
- [ ] Export to PNG/PDF
- [ ] Templates for common processes
- [ ] Keyboard shortcuts for shape changes

## Phase 7: Advanced Features

- [ ] Node grouping/subprocesses
- [ ] AI integration for SelfConnectingEdge (loop-back flows)
- [ ] Swimlanes/Pools (BPMN)
- [ ] Gateway icons (X for exclusive, + for parallel)

## Phase 8: Collaboration & Scale

- [ ] Collaborative editing (CRDT support)
- [ ] Dual-model architecture (fast + slow AI)
- [ ] Lean/VSM symbols (inventory triangles, kaizen bursts)
- [ ] Multiple edge types (dashed for message flows)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Backend API, streaming, system prompt |
| `src/components/ChatInterface.tsx` | Streaming consumer, graph updates |
| `src/components/ProcessMap.tsx` | React Flow wrapper, node/edge types |
| `src/components/DevControlPanel.tsx` | Dev tools panel with test scenarios |
| `src/utils/autoLayout.ts` | Height-aware centered-spine layout |
| `src/utils/testData.ts` | Test nodes and edges |
| `src/db/maps.ts` | SQLite persistence |

