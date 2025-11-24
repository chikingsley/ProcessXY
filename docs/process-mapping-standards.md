# ProcessXY: Process Mapping Standards

**Version:** 1.0
**Last Updated:** 2024-11-24

This document defines the standards and conventions for process mapping in ProcessXY, based on industry best practices from BPMN, Value Stream Mapping, and standard flowchart conventions.

---

## Node Types

### Standard Shapes

| Shape | Type | Usage | When to Use |
|-------|------|-------|-------------|
| **Rectangle** | `default` | Process step/task | Any discrete activity or action |
| **Diamond** | `diamond` | Decision point | Yes/No questions, routing, conditional logic |
| **Oval** | `oval` | Start/End terminator | Process boundaries only |

**Rules:**
- Use `type: "oval"` for START and END nodes only
- Use `type: "diamond"` for decision points (requires `outputCount` in data)
- Use `type: "default"` (or omit type field) for all other process steps

---

## Node Labels

### Primary Label Format

**Pattern:** Action Verb + Object (2-5 words)

**Examples:**
- ✓ "Review Application"
- ✓ "Send Notification"
- ✓ "Approve Request"
- ✓ "Submit Documents"
- ✗ "Application Review" (noun phrase)
- ✗ "Notification" (no action verb)

**Guidelines:**
- Start with action verb in imperative form
- Keep concise: 30-50 characters maximum
- Use plain language, avoid jargon
- Be specific: "Submit expense report" > "Submit form"

### Description (Optional)

**Use descriptions ONLY when needed for:**
- Complex context requiring clarification
- Key parameters or conditions
- Disambiguation of similar steps

**Examples:**
- "Review Application" → Description: "Verify compliance with SOX regulations" ✓
- "Wait for Approval" → Description: "24-48 hour SLA" ✓
- "Send Notification" → Description: "Notify customer" ✗ (redundant!)

**Guidelines:**
- Maximum 80-120 characters
- Omit if label is self-explanatory
- Avoid repeating the label in different words

---

## Status System

### Status Colors

| Status | Color | Hex Code | Meaning |
|--------|-------|----------|---------|
| **Bottleneck** | Red | `#ef4444` | Urgent attention needed, process constraint |
| **Issue** | Yellow | `#eab308` | Problem identified, needs attention |
| **Normal** | Gray | `#6b7280` | Standard state, no issues |
| ~~Complete~~ | ~~Green~~ | ~~`#22c55e`~~ | (Not currently used) |

**Usage Rules:**
- Red: Critical bottlenecks, blockers, urgent issues
- Yellow: Non-critical issues, warnings, needs review
- Gray: Default state for all normal operations
- Green: Reserved for future use

**Application:**
- Status colors appear as background tints and border emphasis
- Small indicator badge in top-right corner of node
- Color conveys process state, not node type

---

## Edge Types

### Available Types

| Type | Usage | When to Use |
|------|-------|-------------|
| `bezier` | Standard curved edge | Regular sequential flow |
| `floating` | Auto-bowing edge | Edges from diamond nodes (optional) |
| `selfConnecting` | Smart loop-back routing | Retry flows, error handling loops |

**Guidelines:**
- **Regular flow:** Use `"bezier"` for standard node-to-node connections
- **Diamond outputs:** Use `"bezier"` (or `"floating"` for auto-curving)
- **Loop-backs:** Use `"selfConnecting"` when edge goes backward to previous node

### Edge Styling

**Standard edge structure:**
```javascript
{
  id: "edge-id",
  source: "source-node-id",
  target: "target-node-id",
  type: "bezier",
  style: {
    strokeWidth: 2,
    stroke: "#64748b"  // Default gray
  },
  markerEnd: {
    type: "arrowclosed",
    width: 25,
    height: 25,
    color: "#64748b"
  }
}
```

### Edge Colors for Decisions

**2-Way Decisions (Yes/No):**
- **"Yes" branch:** Green (#22c55e) - success/approval path
- **"No" branch:** Red (#ef4444) - rejection/alternative path

```javascript
// Yes branch
{
  label: "Yes",
  labelStyle: { fill: "#22c55e", fontWeight: 600 },
  labelShowBg: true,
  style: { strokeWidth: 2, stroke: "#22c55e" },
  markerEnd: { type: "arrowclosed", color: "#22c55e" }
}

// No branch
{
  label: "No",
  labelStyle: { fill: "#ef4444", fontWeight: 600 },
  labelShowBg: true,
  style: { strokeWidth: 2, stroke: "#ef4444" },
  markerEnd: { type: "arrowclosed", color: "#ef4444" }
}
```

**3+ Way Decisions:**
- Use **neutral gray** for all edges
- Differentiate with labels only ("Low", "Medium", "High")
- Avoid rainbow coloring (reduces visual clutter)

### Edge Labels

**Use edge labels for:**
- Decision branch identification ("Yes", "No", "Approved", "Rejected")
- Wait times and delays ("Wait 24 hours", "2-3 business days")
- Conditions or criteria ("If amount > $1000")
- Flow type indicators ("Retry", "Escalate")

**Format:**
```javascript
{
  label: "Label text",
  labelStyle: { fill: "#color", fontWeight: 600 },
  labelShowBg: true  // Adds white background for readability
}
```

---

## Diamond Nodes (Decisions)

### Output Count

**Required field:** `outputCount` specifies number of decision branches

```javascript
{
  type: "diamond",
  data: {
    label: "Credit OK?",
    outputCount: 2  // REQUIRED for diamonds
  }
}
```

**Standard counts:**
- `outputCount: 2` → Yes/No decisions (most common)
- `outputCount: 3` → Low/Medium/High, Priority routing
- `outputCount: 4+` → Multi-way routing

### Handle IDs for Diamond Outputs

**2 outputs:**
- `sourceHandle: "left"` → Typically "No" branch
- `sourceHandle: "right"` → Typically "Yes" branch

**3+ outputs:**
- `sourceHandle: "output-0"` → First branch (leftmost)
- `sourceHandle: "output-1"` → Second branch
- `sourceHandle: "output-2"` → Third branch
- etc.

---

## Layout and Spacing

### Vertical Spacing

- **Between levels:** 200-280px
- **Start node:** y = 0
- **Subsequent levels:** Increment by 200-280px

**Example:**
```
Level 1 (Start):     y = 0
Level 2:             y = 200
Level 3 (Decision):  y = 480
Level 4 (Branches):  y = 760
```

### Horizontal Spacing

- **Sequential flow:** Center-aligned when possible (same x coordinate)
- **Branches:** 150-350px between parallel paths
- **Multi-way splits:** Distribute evenly with adequate spacing

**Example for 2-branch decision:**
```
Decision:        x = 200 (centered)
Left branch:     x = 50  (150px left of center)
Right branch:    x = 400 (200px right of center)
```

---

## Swim Lanes

### Guidelines

**Optimal lane count:** 3-7 lanes
- **< 3 lanes:** Probably don't need swim lanes
- **> 7 lanes:** Too complex, consider alternative organization

**Layout:**
- **Horizontal lanes** (rows) - Default for desktop
- Lanes represent departments, roles, or systems
- Each node belongs to one lane via `laneId` property

**Future implementation:**
```javascript
{
  data: {
    label: "Process Step",
    laneId: "sales"  // Associates node with "sales" lane
  }
}
```

---

## Time Metrics

### Cycle Time and Lead Time

**Definitions:**
- **Cycle Time:** Time to complete a specific task/node (active work time)
- **Lead Time:** Total elapsed time including waits (end-to-end time)

**Placement:**
- **Cycle time:** Node property (time to complete that specific step)
- **Lead time:** Can be calculated as sum of cycle times + wait times
- **Wait/delay times:** Edge labels between nodes

**Display:**
- Show in node tooltip/details panel
- Optional: Display as small metric below node label
- Edge labels for inter-step delays: "Wait 24 hours"

**Future implementation:**
```javascript
{
  data: {
    label: "Review Application",
    cycleTime: "2 hours",      // Time to complete this step
    leadTime: "3 days"          // Total time including upstream waits
  }
}
```

---

## Best Practices Summary

### Do's ✓
- Use action verbs for all process step labels
- Keep labels concise (2-5 words)
- Use descriptions sparingly (complex context only)
- Apply red/yellow status colors meaningfully (bottlenecks/issues)
- Color Yes/No decision edges (green/red)
- Use neutral colors for 3+ way decisions
- Include `outputCount` for all diamond nodes
- Specify `sourceHandle` for diamond outputs

### Don'ts ✗
- Don't use noun phrases for labels
- Don't add redundant descriptions
- Don't overuse colors (reduces meaning)
- Don't create rainbow diagrams (3+ colored edges from one node)
- Don't omit `outputCount` on diamond nodes
- Don't use green status (reserved for future)

---

## Reference Standards

This document draws from:
- **BPMN 2.0** (ISO/IEC 19510:2013) - Business process notation
- **Value Stream Mapping** (Lean Enterprise Institute) - Flow optimization
- **ANSI/ISO Flowchart Standards** - Universal symbol conventions

**Guiding Principle:** Consistency and clarity over strict standard adherence. Choose conventions that work for your team and apply them consistently across all process maps.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-11-24 | Initial standards documentation |

