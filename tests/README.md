# ProcessXY Testing Guide

## Overview

This directory contains comprehensive tests for ProcessXY, using Bun's built-in test runner and Stagehand for browser automation testing.

## Test Structure

```
tests/
├── README.md           # This file
├── unit.test.ts        # Unit tests for types, logic, and utilities
└── phase1.test.ts      # E2E tests for Phase 1 features
```

## Test Types

### Unit Tests (`unit.test.ts`)

Fast, isolated tests that verify:
- Type definitions (ProcessNode, ProcessEdge, NodeStatus)
- API request/response contracts
- Node selection logic
- Styling class determination

**Run with:**
```bash
bun test:unit
```

### E2E Tests (`phase1.test.ts`)

Browser automation tests using Stagehand that verify:
- Application loading
- Canvas rendering
- Node selection (single and multi-node)
- Visual feedback (glow effects)
- AI chat interaction
- Selected node display in UI
- Status indicators
- Node modification via AI

**Run with:**
```bash
bun test:e2e
```

**Note:** E2E tests require the application to be running on `http://localhost:3000`

## Running Tests

### Run All Tests
```bash
bun test
```

### Run Unit Tests Only
```bash
bun run test:unit
```

### Run E2E Tests Only
```bash
# First, start the dev server in another terminal
bun run dev

# Then run E2E tests
bun run test:e2e
```

### Watch Mode
```bash
bun run test:watch
```

## Test Configuration

### Stagehand Configuration

The E2E tests use Stagehand in LOCAL mode, which means:
- Tests run in a local Chromium browser
- No Browserbase account required for development
- Set `headless: false` to see the browser (useful for debugging)
- Set `headless: true` for CI/CD environments

### Environment Variables

For E2E tests, you'll need:
- `GOOGLE_API_KEY`: Your Google Gemini API key (in `.env` file)

## Phase 1 Test Coverage

Phase 1 tests verify the following features:

### 1. Multi-Node Selection State Management ✅
- **Test:** "should select a node and show selection in chat UI"
- Verifies selection state propagates from canvas to chat interface

### 2. Selection-Aware AI Context ✅
- **Test:** "should modify selected node color via chat with AI understanding"
- Verifies AI understands "this" refers to selected nodes

### 3. Custom Node Styling ✅
- **Test:** "should display node status indicators"
- Verifies bottleneck, issue, and complete statuses display correctly

### 4. Visual Selection Feedback ✅
- **Test:** "should show green glow effect on selected node"
- Verifies green ring/glow appears on selected nodes

### 5. Chat UI Integration ✅
- **Test:** "should display selected nodes as chips"
- Verifies selected nodes show as chips above input field

### 6. Multi-Node Selection ✅
- **Test:** "should handle multi-node selection"
- Verifies Shift+Click for multiple selection works

### 7. Node Preservation ✅
- **Test:** "should preserve unselected nodes when modifying selected ones"
- Verifies AI only modifies selected nodes, not entire graph

## Writing New Tests

### Unit Test Example

```typescript
import { describe, test, expect } from "bun:test";

describe("Feature Name", () => {
    test("should do something", () => {
        // Arrange
        const input = "test";

        // Act
        const result = someFunction(input);

        // Assert
        expect(result).toBe("expected");
    });
});
```

### E2E Test Example

```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Stagehand } from "@browserbasehq/stagehand";

describe("Feature E2E Tests", () => {
    let stagehand: Stagehand;
    let page: any;

    beforeAll(async () => {
        stagehand = new Stagehand({ env: "LOCAL", headless: false });
        await stagehand.init();
        page = stagehand.page;
    });

    afterAll(async () => {
        await stagehand.close();
    });

    test("should interact with UI", async () => {
        await page.goto("http://localhost:3000");
        await page.act("click on the button");
        // assertions...
    });
});
```

## Troubleshooting

### E2E Tests Failing

1. **Check if dev server is running:**
   ```bash
   bun run dev
   ```

2. **Check if port 3000 is available:**
   ```bash
   lsof -i :3000
   ```

3. **Run with visible browser for debugging:**
   Edit `phase1.test.ts` and set `headless: false`

### Unit Tests Failing

1. **Check TypeScript types:**
   ```bash
   bunx tsc --noEmit
   ```

2. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules bun.lockb
   bun install
   ```

## CI/CD Integration

For CI/CD pipelines, use:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    bun install
    bun run build
    bun run test:unit

    # For E2E tests
    bun run dev &
    sleep 5
    bun run test:e2e
```

Set `headless: true` in Stagehand configuration for headless CI environments.

## Best Practices

1. **Keep tests isolated** - Each test should be independent
2. **Use descriptive names** - Test names should explain what they verify
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Clean up resources** - Use beforeAll/afterAll for setup/teardown
5. **Mock external dependencies** - Don't rely on real APIs in unit tests
6. **Test user journeys** - E2E tests should mimic real user behavior

## Future Test Additions

As new features are added, create corresponding test files:

- `tests/phase2.test.ts` - Tooltips, context menus, node metadata
- `tests/phase3.test.ts` - Process simulation, analytics
- `tests/integration.test.ts` - Full integration tests
- `tests/performance.test.ts` - Performance benchmarks

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Stagehand Documentation](https://docs.stagehand.dev)
- [XyFlow Testing Guide](https://reactflow.dev/learn/advanced-use/testing)
