import { describe, test, expect } from "bun:test";
import { TEST_NODES, TEST_EDGES } from "../src/utils/testData";
import { getLayoutedElements } from "../src/utils/autoLayout";

/**
 * Layout verification tests
 * These tests verify that node positions are mathematically correct
 */

// Layout constants (must match testData.ts and autoLayout.ts)
const CENTER_X = 300;
const LEVEL_HEIGHT = 130;
const BRANCH_OFFSET = 200;

// Node widths (MUST match actual CSS sizes!)
const NODE_WIDTHS: Record<string, number> = {
	oval: 160,     // OvalNode min-w-[160px]
	default: 150,  // RectangleNode min-w-[150px]
	diamond: 160,  // DiamondNode width: 160px
};

function getExpectedCenterX(nodeType: string): number {
	const width = NODE_WIDTHS[nodeType] || 180;
	return CENTER_X - width / 2;
}

describe("Layout Math Verification", () => {
	test("Print expected positions for main flow", () => {
		console.log("\n=== EXPECTED CENTERED POSITIONS ===");
		console.log(`CENTER_X = ${CENTER_X}`);
		console.log(`LEVEL_HEIGHT = ${LEVEL_HEIGHT}`);
		console.log(`BRANCH_OFFSET = ${BRANCH_OFFSET}`);
		console.log("");

		const mainFlow = [
			{ id: "1", type: "oval", label: "Start", level: 0, branch: "center" },
			{ id: "2", type: "default", label: "Review Application", level: 1, branch: "center" },
			{ id: "3", type: "diamond", label: "Credit OK?", level: 2, branch: "center" },
			{ id: "4", type: "default", label: "Request Documents", level: 3, branch: "left" },
			{ id: "5", type: "default", label: "Approve Application", level: 3, branch: "right" },
			{ id: "6", type: "default", label: "Send Notification", level: 4, branch: "center" },
			{ id: "7", type: "oval", label: "End", level: 5, branch: "center" },
		];

		console.log("Node positions should be:");
		console.log("─".repeat(70));

		for (const node of mainFlow) {
			const width = NODE_WIDTHS[node.type];
			let expectedX: number;

			if (node.branch === "center") {
				expectedX = CENTER_X - width / 2;
			} else if (node.branch === "left") {
				expectedX = CENTER_X - BRANCH_OFFSET - width / 2;
			} else {
				expectedX = CENTER_X + BRANCH_OFFSET - width / 2;
			}

			const expectedY = node.level * LEVEL_HEIGHT;
			const visualCenterX = expectedX + width / 2;

			console.log(
				`${node.id}. ${node.label.padEnd(20)} | ` +
				`type: ${node.type.padEnd(7)} | ` +
				`width: ${width} | ` +
				`x: ${expectedX.toString().padStart(4)} | ` +
				`y: ${expectedY.toString().padStart(4)} | ` +
				`visual center: ${visualCenterX}`
			);
		}

		console.log("─".repeat(70));
		console.log("\nAll centered nodes should have visual center at x=300");
		console.log("Left branch should have visual center at x=100");
		console.log("Right branch should have visual center at x=500\n");

		expect(true).toBe(true); // Just to make the test pass
	});

	test("Verify testData.ts positions match expected", () => {
		console.log("\n=== VERIFYING TEST DATA POSITIONS ===\n");

		const mainFlowIds = ["1", "2", "3", "4", "5", "6", "7"];
		const mainFlowNodes = TEST_NODES.filter((n) => mainFlowIds.includes(n.id));

		// With correct widths: oval=160, rect=150, diamond=160
		const expectedPositions: Record<string, { x: number; y: number; visualCenterX: number }> = {
			"1": { x: 220, y: 0, visualCenterX: 300 },      // Start (oval 160, centered): 300-80=220
			"2": { x: 225, y: 130, visualCenterX: 300 },    // Review (rect 150, centered): 300-75=225
			"3": { x: 220, y: 260, visualCenterX: 300 },    // Credit OK (diamond 160, centered): 300-80=220
			"4": { x: 25, y: 390, visualCenterX: 100 },     // Request Docs (rect 150, left): 100-75=25
			"5": { x: 425, y: 390, visualCenterX: 500 },    // Approve (rect 150, right): 500-75=425
			"6": { x: 225, y: 520, visualCenterX: 300 },    // Send Notif (rect 150, centered): 300-75=225
			"7": { x: 220, y: 650, visualCenterX: 300 },    // End (oval 160, centered): 300-80=220
		};

		let allCorrect = true;

		for (const node of mainFlowNodes) {
			const expected = expectedPositions[node.id];
			const actual = node.position;
			const nodeWidth = NODE_WIDTHS[node.type || "default"];
			const actualVisualCenter = actual.x + nodeWidth / 2;

			const xMatch = actual.x === expected.x;
			const yMatch = actual.y === expected.y;
			const status = xMatch && yMatch ? "✓" : "✗";

			if (!xMatch || !yMatch) allCorrect = false;

			console.log(
				`${status} Node ${node.id} (${String(node.data.label).padEnd(20)}): ` +
				`expected (${expected.x}, ${expected.y}), ` +
				`actual (${actual.x}, ${actual.y}), ` +
				`visual center: ${actualVisualCenter} (expected ${expected.visualCenterX})`
			);
		}

		console.log("");
		expect(allCorrect).toBe(true);
	});

	test("Verify auto-layout produces centered positions", async () => {
		console.log("\n=== VERIFYING AUTO-LAYOUT OUTPUT ===\n");

		// Use only main flow nodes and edges (exclude the Priority/Risk examples)
		const mainFlowIds = ["1", "2", "3", "4", "5", "6", "7"];
		const mainFlowEdgeIds = ["e1-2", "e2-3", "e3-4", "e3-5", "e4-2", "e5-6", "e6-7"];

		const mainNodes = TEST_NODES.filter((n) => mainFlowIds.includes(n.id));
		const mainEdges = TEST_EDGES.filter((e) => mainFlowEdgeIds.includes(e.id));

		const { nodes: layoutedNodes } = await getLayoutedElements(mainNodes, mainEdges);

		// Expected visual centers
		const expectedVisualCenters: Record<string, number> = {
			"1": 300, // Start - centered
			"2": 300, // Review - centered
			"3": 300, // Credit OK - centered
			"4": 100, // Request Docs - left (300 - 200)
			"5": 500, // Approve - right (300 + 200)
			"6": 300, // Send Notif - centered
			"7": 300, // End - centered
		};

		let allCorrect = true;

		for (const node of layoutedNodes) {
			const nodeWidth = NODE_WIDTHS[node.type || "default"];
			const actualVisualCenter = node.position.x + nodeWidth / 2;
			const expectedCenter = expectedVisualCenters[node.id];
			const isCorrect = Math.abs(actualVisualCenter - expectedCenter) < 1; // Allow 1px tolerance

			if (!isCorrect) allCorrect = false;

			const status = isCorrect ? "✓" : "✗";
			console.log(
				`${status} Node ${node.id}: ` +
				`visual center = ${actualVisualCenter} ` +
				`(expected ${expectedCenter})`
			);
		}

		console.log("");
		expect(allCorrect).toBe(true);
	});
});
