# ProcessXY: Process Mapping Standards

**Version:** 1.1
**Last Updated:** 2025-12-01

This document defines the standards and conventions for process mapping in ProcessXY, based on industry best practices from BPMN, Value Stream Mapping, and standard flowchart conventions.

---

## Node Types

### Standard Shapes

| Shape | Type | Usage | When to Use |
|-------|------|-------|-------------|
| **Rectangle** | `default` | Process step/task | Any discrete activity or action |
| **Diamond** | `diamond` | Decision point | Yes/No questions, routing, conditional logic |
| **Oval** | `oval` | Start/End terminator | Process boundaries only |

### Terminology

- **Decision node**: A diamond-shaped node representing a conditional branch point
- **Branch nodes**: The nodes that follow a decision node (the outcomes of the decision). These are typically rectangles representing the actions taken for each decision outcome (e.g., "Approve" vs "Reject")

**Rules:**

- Use `type: "oval"` for START and END nodes only
- Use `type: "diamond"` for decision points (requires `outputCount` in data)
- Use `type: "default"` (or omit type field) for all other process steps, including branch nodes

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
| `smoothstep` | Standard right-angle edge | Regular sequential flow (straight lines with corners) |
| `floating` | Auto-bowing edge | Edges from diamond nodes (optional) |
| `selfConnecting` | Smart loop-back routing | Retry flows, error handling loops |

**Guidelines:**

- **Regular flow:** Use `"smoothstep"` for standard node-to-node connections (cleaner than bezier)
- **Diamond outputs:** Use `"smoothstep"` for decision branches
- **Loop-backs:** Use `"selfConnecting"` when edge goes backward to previous node

### Edge Styling

**Standard edge structure:**

```javascript
{
  id: "edge-id",
  source: "source-node-id",
  target: "target-node-id",
  type: "smoothstep",
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

### Height-Aware Vertical Spacing

The layout system uses **cumulative height calculation** to ensure proper spacing between nodes. This is especially important for decision nodes (diamonds), which are taller (160px) than other nodes.

**Layout Constants:**

- `VERTICAL_GAP = 40` - Minimum gap between bottom of one node and top of the next
- Node heights: Oval (45px), Rectangle (50px), Diamond (160px)

**How Y positions are calculated:**

```text
Level 0 (Start oval):     y = 0
Level 1 (Process rect):   y = 45 + 40 = 85         (prev height + gap)
Level 2 (Decision):       y = 85 + 50 + 40 = 175   (prev height + gap)
Level 3 (Branch nodes):   y = 175 + 160 + 40 = 375 (diamond height + gap!)
Level 4 (Next step):      y = 375 + 50 + 40 = 465
Level 5 (End):            y = 465 + 50 + 40 = 555
```

**Key insight:** Branch nodes (level 3) are positioned 200px below the decision node (175 + 160 + 40 = 375), ensuring proper visual clearance after the tall diamond shape.

### Horizontal Spacing (Centered Spine)

- `CENTER_X = 300` - Main vertical spine position
- `BRANCH_OFFSET = 200` - Distance from center to branch nodes

**Positioning rules:**

- **Sequential flow:** Centered at `x = CENTER_X - (nodeWidth / 2)`
- **2-way branches:** Symmetric at `x = CENTER_X ± BRANCH_OFFSET - (nodeWidth / 2)`
- **3+ branches:** Evenly distributed around center

**Example for 2-way decision:**

```text
Decision (diamond 160px): x = 300 - 80 = 220  (visual center: 300)
Left branch (rect 150px): x = 100 - 75 = 25   (visual center: 100)
Right branch (rect 150px): x = 500 - 75 = 425 (visual center: 500)
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

## Future Roadmap (Standards Additions)

- **Scenario metadata** - Add optional `cost`, `duration`, and `resourceLoad` fields per node/edge to support simulation and ROI comparisons.
- **Baseline vs. target states** - Allow `state: "as-is" | "to-be"` tagging plus `variantId` to track proposals side-by-side.
- **Persona views** - Introduce `personaId` tags for nodes/edges to drive filtered views for roles (analyst, operator, exec).
- **Import mapping** - Document mapping from BPMN/Visio/CSV fields to ProcessXY types to keep labels, IDs, and handles stable on ingest.
- **Automation markers** - Reserve `automationHint` and `systemOwner` fields to flag steps that will be automated or owned by specific systems.
- **Outcome metrics** - Standardize `successRate`, `errorRate`, and `sla` fields to feed dashboards and what-if reporting.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-11-24 | Initial standards documentation |
