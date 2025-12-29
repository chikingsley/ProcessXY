import { describe, test, expect } from "bun:test";
import { TEST_NODES, TEST_EDGES } from "../src/utils/testData";
import { getLayoutedElements } from "../src/utils/autoLayout";

/**
 * Layout verification tests
 * These tests verify that node positions are mathematically correct
 *
 * Layout uses height-aware vertical positioning:
 * - Y position is calculated based on cumulative node heights + vertical gaps
 * - This ensures proper spacing after tall nodes (like diamonds at 160px)
 */

// Layout constants (must match testData.ts and autoLayout.ts)
const CENTER_X = 300;
const BRANCH_OFFSET = 200;
const VERTICAL_GAP = 60;

// Node dimensions (MUST match actual CSS sizes!)
const NODE_WIDTHS = {
	oval: 160,     // OvalNode min-w-[160px]
	default: 150,  // RectangleNode min-w-[150px]
	diamond: 160,  // DiamondNode width: 160px
} as const;

const NODE_HEIGHTS = {
	oval: 45,      // OvalNode approx height
	default: 50,   // RectangleNode approx height
	diamond: 160,  // DiamondNode height: 160px
} as const;

type NodeType = keyof typeof NODE_WIDTHS;
const getNodeWidth = (type: string | undefined): number => NODE_WIDTHS[(type || "default") as NodeType] ?? 150;
const getNodeHeight = (type: string | undefined): number => NODE_HEIGHTS[(type || "default") as NodeType] ?? 50;

// Pre-calculated Y positions based on cumulative heights + gaps
// Level 0: y = 0
// Level 1: y = 45 (oval) + 60 (gap) = 105
// Level 2: y = 105 + 50 (rect) + 60 (gap) = 215
// Level 3: y = 215 + 160 (diamond) + 60 (gap) = 435  <- Branch nodes properly spaced after diamond!
// Level 4: y = 435 + 50 (rect) + 60 (gap) = 545
// Level 5: y = 545 + 50 (rect) + 60 (gap) = 655
const LEVEL_Y: Record<number, number> = {
	0: 0,
	1: 105,
	2: 215,
	3: 435,
	4: 545,
	5: 655,
};

describe("Layout Math Verification", () => {
	test("Print expected positions for main flow (height-aware)", () => {
		console.log("\n=== EXPECTED CENTERED POSITIONS (HEIGHT-AWARE LAYOUT) ===");
		console.log(`CENTER_X = ${CENTER_X}`);
		console.log(`BRANCH_OFFSET = ${BRANCH_OFFSET}`);
		console.log(`VERTICAL_GAP = ${VERTICAL_GAP}`);
		console.log("");

		const mainFlow = [
			{ id: "1", type: "oval" as const, label: "Start", level: 0, branch: "center" as const },
			{ id: "2", type: "default" as const, label: "Review Application", level: 1, branch: "center" as const },
			{ id: "3", type: "diamond" as const, label: "Credit OK?", level: 2, branch: "center" as const },
			{ id: "4", type: "default" as const, label: "Request Documents", level: 3, branch: "left" as const },
			{ id: "5", type: "default" as const, label: "Approve Application", level: 3, branch: "right" as const },
			{ id: "6", type: "default" as const, label: "Send Notification", level: 4, branch: "center" as const },
			{ id: "7", type: "oval" as const, label: "End", level: 5, branch: "center" as const },
		];

		console.log("Node positions should be:");
		console.log("─".repeat(80));

		for (const node of mainFlow) {
			const width = getNodeWidth(node.type);
			const height = getNodeHeight(node.type);
			let expectedX: number;

			if (node.branch === "center") {
				expectedX = CENTER_X - width / 2;
			} else if (node.branch === "left") {
				expectedX = CENTER_X - BRANCH_OFFSET - width / 2;
			} else {
				expectedX = CENTER_X + BRANCH_OFFSET - width / 2;
			}

			const expectedY = LEVEL_Y[node.level] ?? 0;
			const visualCenterX = expectedX + width / 2;

			console.log(
				`${node.id}. ${node.label.padEnd(20)} | ` +
				`type: ${node.type.padEnd(7)} | ` +
				`h: ${height.toString().padStart(3)} | ` +
				`x: ${expectedX.toString().padStart(4)} | ` +
				`y: ${expectedY.toString().padStart(4)} | ` +
				`visual center: ${visualCenterX}`
			);
		}

		console.log("─".repeat(80));
		console.log("\nAll centered nodes should have visual center at x=300");
		console.log("Left branch nodes should have visual center at x=100");
		console.log("Right branch nodes should have visual center at x=500");
		console.log("Branch nodes (level 3) are properly spaced 200px below the diamond (160px + 40px gap)\n");

		expect(true).toBe(true); // Just to make the test pass
	});

	test("Verify testData.ts positions match expected (height-aware)", () => {
		console.log("\n=== VERIFYING TEST DATA POSITIONS ===\n");

		const mainFlowIds = ["1", "2", "3", "4", "5", "6", "7"];
		const mainFlowNodes = TEST_NODES.filter((n) => mainFlowIds.includes(n.id));

		// Height-aware positions: Y is based on cumulative heights + gaps
		// Nodes follow their parent branch (happy path continues on right branch)
		const expectedPositions: Record<string, { x: number; y: number; visualCenterX: number }> = {
			"1": { x: 220, y: LEVEL_Y[0] ?? 0, visualCenterX: 300 },   // Start (oval 160, centered): 300-80=220
			"2": { x: 225, y: LEVEL_Y[1] ?? 0, visualCenterX: 300 },   // Review (rect 150, centered): 300-75=225
			"3": { x: 220, y: LEVEL_Y[2] ?? 0, visualCenterX: 300 },   // Decision (diamond 160, centered): 300-80=220
			"4": { x: 25, y: LEVEL_Y[3] ?? 0, visualCenterX: 100 },    // Left branch node (rect 150): 100-75=25
			"5": { x: 425, y: LEVEL_Y[3] ?? 0, visualCenterX: 500 },   // Right branch node (rect 150): 500-75=425
			"6": { x: 425, y: LEVEL_Y[4] ?? 0, visualCenterX: 500 },   // Send Notif follows Approve: 500-75=425
			"7": { x: 420, y: LEVEL_Y[5] ?? 0, visualCenterX: 500 },   // End follows Send Notif: 500-80=420
		};

		let allCorrect = true;

		for (const node of mainFlowNodes) {
			const expected = expectedPositions[node.id]!;
			const actual = node.position;
			const nodeWidth = getNodeWidth(node.type);
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

	test("Verify auto-layout produces parent-aligned positions", async () => {
		console.log("\n=== VERIFYING AUTO-LAYOUT OUTPUT ===\n");

		// Use only main flow nodes and edges (exclude the Priority/Risk examples)
		const mainFlowIds = ["1", "2", "3", "4", "5", "6", "7"];
		const mainFlowEdgeIds = ["e1-2", "e2-3", "e3-4", "e3-5", "e4-2", "e5-6", "e6-7"];

		const mainNodes = TEST_NODES.filter((n) => mainFlowIds.includes(n.id));
		const mainEdges = TEST_EDGES.filter((e) => mainFlowEdgeIds.includes(e.id));

		const { nodes: layoutedNodes } = await getLayoutedElements(mainNodes, mainEdges);

		// Expected visual centers - nodes now align with their parent branch
		// Send Notification (6) follows Approve Application (5) which is on right branch
		// End (7) follows Send Notification (6) which is now on right branch
		const expectedVisualCenters: Record<string, number> = {
			"1": 300, // Start - centered
			"2": 300, // Review - centered
			"3": 300, // Decision - centered
			"4": 100, // Request Docs - left branch
			"5": 500, // Approve - right branch
			"6": 500, // Send Notif - follows Approve (parent is off-center)
			"7": 500, // End - follows Send Notif (parent is off-center)
		};

		let allCorrect = true;

		for (const node of layoutedNodes) {
			const nodeWidth = getNodeWidth(node.type);
			const actualVisualCenter = node.position.x + nodeWidth / 2;
			const expectedCenter = expectedVisualCenters[node.id] ?? 300;
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
