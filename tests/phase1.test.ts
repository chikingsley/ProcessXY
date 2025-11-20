import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

describe("Phase 1: Multi-Node Selection & AI Awareness", () => {
    let stagehand: Stagehand;
    let page: any;
    const APP_URL = "http://localhost:3000";

    beforeAll(async () => {
        // Initialize Stagehand in local mode (no Browserbase required for dev)
        stagehand = new Stagehand({
            env: "LOCAL",
        });
        await stagehand.init();
        page = stagehand.context.pages()[0];
    });

    afterAll(async () => {
        await stagehand.close();
    });

    test("should load the application successfully", async () => {
        await page.goto(APP_URL);

        // Check if the main elements are present
        const title = await page.act("find the text 'Process Assistant'");
        expect(title).toBeDefined();
    });

    test("should display initial process node on canvas", async () => {
        await page.goto(APP_URL);

        // Wait for the canvas to load
        await page.waitForSelector(".react-flow");

        // Check if initial node exists
        const hasNode = await page.evaluate(() => {
            const nodes = document.querySelectorAll('[data-id]');
            return nodes.length > 0;
        });

        expect(hasNode).toBe(true);
    });

    test("should select a node and show selection in chat UI", async () => {
        await page.goto(APP_URL);

        // Wait for canvas to load
        await page.waitForSelector(".react-flow");

        // Click on a node to select it
        await page.act("click on the node labeled 'Start Process'");

        // Wait a bit for selection state to update
        await page.waitForTimeout(500);

        // Check if selected node chip appears in chat interface
        const selectedChip = await page.evaluate(() => {
            const chips = document.querySelectorAll('.bg-green-100, .dark\\:bg-green-900\\/30');
            return chips.length > 0;
        });

        expect(selectedChip).toBe(true);
    });

    test("should show green glow effect on selected node", async () => {
        await page.goto(APP_URL);

        await page.waitForSelector(".react-flow");

        // Click on a node
        await page.act("click on the first node");

        await page.waitForTimeout(500);

        // Check for green ring effect on selected node
        const hasGlowEffect = await page.evaluate(() => {
            const nodes = document.querySelectorAll('[class*="ring-green"]');
            return nodes.length > 0;
        });

        expect(hasGlowEffect).toBe(true);
    });

    test("should create a new process map via chat", async () => {
        await page.goto(APP_URL);

        // Find the input field and type a message
        await page.act("type 'Create a simple login process' in the message input");

        // Click send button
        await page.act("click the send button");

        // Wait for AI response
        await page.waitForTimeout(3000);

        // Check if new nodes were created
        const nodeCount = await page.evaluate(() => {
            const nodes = document.querySelectorAll('[data-id]');
            return nodes.length;
        });

        expect(nodeCount).toBeGreaterThan(1);
    });

    test("should modify selected node color via chat with AI understanding", async () => {
        await page.goto(APP_URL);

        await page.waitForSelector(".react-flow");

        // First create some nodes
        await page.act("type 'Create approval workflow' in the input");
        await page.act("click send");
        await page.waitForTimeout(3000);

        // Select a node
        await page.act("click on a node");
        await page.waitForTimeout(500);

        // Tell AI to make it red
        await page.act("type 'Make this red' in the input");
        await page.act("click send");
        await page.waitForTimeout(3000);

        // Check if node has red styling
        const hasRedNode = await page.evaluate(() => {
            const nodes = document.querySelectorAll('[style*="border"]');
            for (const node of nodes) {
                const style = (node as HTMLElement).style.borderColor;
                if (style && (style.includes('red') || style.includes('#ef4444'))) {
                    return true;
                }
            }
            return false;
        });

        expect(hasRedNode).toBe(true);
    });

    test("should handle multi-node selection", async () => {
        await page.goto(APP_URL);

        await page.waitForSelector(".react-flow");

        // Create a process with multiple nodes
        await page.act("type 'Create a 3-step process' in the input");
        await page.act("click send");
        await page.waitForTimeout(3000);

        // Select multiple nodes using Shift+Click
        await page.keyboard.down('Shift');
        await page.act("click on first node");
        await page.act("click on second node");
        await page.keyboard.up('Shift');

        await page.waitForTimeout(500);

        // Check if multiple chips are displayed
        const selectedCount = await page.evaluate(() => {
            const countText = document.querySelector('.text-muted-foreground')?.textContent;
            return countText?.includes('selected') || false;
        });

        expect(selectedCount).toBe(true);
    });

    test("should display node status indicators", async () => {
        await page.goto(APP_URL);

        await page.waitForSelector(".react-flow");

        // Create nodes and mark one as bottleneck
        await page.act("type 'Create approval process and mark approval as bottleneck' in the input");
        await page.act("click send");
        await page.waitForTimeout(3000);

        // Check for status indicator (colored dot)
        const hasStatusIndicator = await page.evaluate(() => {
            const indicators = document.querySelectorAll('.bg-red-500, .bg-yellow-500, .bg-green-500');
            return indicators.length > 0;
        });

        expect(hasStatusIndicator).toBe(true);
    });

    test("should preserve unselected nodes when modifying selected ones", async () => {
        await page.goto(APP_URL);

        await page.waitForSelector(".react-flow");

        // Create a process
        await page.act("type 'Create a 4-step approval process' in the input");
        await page.act("click send");
        await page.waitForTimeout(3000);

        // Get initial node count
        const initialCount = await page.evaluate(() => {
            return document.querySelectorAll('[data-id]').length;
        });

        // Select one node and modify it
        await page.act("click on first node");
        await page.waitForTimeout(500);
        await page.act("type 'Make this green' in the input");
        await page.act("click send");
        await page.waitForTimeout(3000);

        // Check that node count is the same
        const finalCount = await page.evaluate(() => {
            return document.querySelectorAll('[data-id]').length;
        });

        expect(finalCount).toBe(initialCount);
    });
});
