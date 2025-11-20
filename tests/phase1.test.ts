import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
import { chromium, Browser, Page } from "playwright";

describe("Phase 1: Multi-Node Selection & AI Awareness", () => {
    let browser: Browser;
    let page: Page;
    const APP_URL = "http://localhost:3000";

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
    });

    beforeEach(async () => {
        page = await browser.newPage();
        page.setDefaultTimeout(15000);
    });

    afterEach(async () => {
        await page.close();
    });

    afterAll(async () => {
        await browser.close();
    });

    test("should load the application successfully", async () => {
        await page.goto(APP_URL);

        // Check if the Process Assistant title is present
        const title = await page.textContent('text=Process Assistant');
        expect(title).toBe("Process Assistant");
    });

    test("should display initial process node on canvas", async () => {
        await page.goto(APP_URL);
        await page.waitForLoadState("networkidle");

        // Wait for React Flow canvas
        await page.waitForSelector(".react-flow");

        // Check if "Start Process" node exists
        const startNode = await page.textContent('text=Start Process');
        expect(startNode).toBe("Start Process");
    });

    test("should have input field and send button", async () => {
        await page.goto(APP_URL);

        // Check for input field
        const input = page.locator('input[placeholder="Type a message..."]');
        const inputCount = await input.count();
        expect(inputCount).toBeGreaterThan(0);

        // Check for send button
        const sendButton = page.locator('button[type="submit"]');
        const buttonCount = await sendButton.count();
        expect(buttonCount).toBeGreaterThan(0);
    });

    test("should select a node and show selection in chat UI", async () => {
        await page.goto(APP_URL);
        await page.waitForSelector(".react-flow");

        // Click on the "Start Process" node
        await page.click('text=Start Process');
        await page.waitForTimeout(500);

        // Check if selection chip appears with green background
        const chipCount = await page.locator('.bg-green-100').count();
        expect(chipCount).toBeGreaterThan(0);

        // Check if "1 selected" text appears
        const selectionText = await page.textContent('text=1 selected');
        expect(selectionText).toBeTruthy();
    });

    test("should display chat interface with initial message", async () => {
        await page.goto(APP_URL);

        // Check for initial assistant message
        const welcomeMessage = await page.textContent('text=Hello! I\'m your process mapping assistant');
        expect(welcomeMessage).toContain("process mapping assistant");
    });
});
