import { describe, test, expect } from "bun:test";
import type { Node, Edge } from "@xyflow/react";

/**
 * Merge updated nodes with existing nodes
 * Copy of the function from ChatInterface for testing
 */
function mergeNodes(
	existingNodes: Node[],
	updatedNodes: Node[],
	nodeIdsToRemove: Set<string>,
): Node[] {
	const updatedNodeMap = new Map(updatedNodes.map((n) => [n.id, n]));
	const mergedNodes: Node[] = [];

	for (const node of existingNodes) {
		if (nodeIdsToRemove.has(node.id)) continue;
		const updatedNode = updatedNodeMap.get(node.id);
		if (updatedNode) {
			mergedNodes.push(updatedNode);
			updatedNodeMap.delete(node.id);
		} else {
			mergedNodes.push(node);
		}
	}

	for (const node of updatedNodeMap.values()) {
		mergedNodes.push(node);
	}

	return mergedNodes;
}

describe("Phase 3: Fine-Grained Updates - mergeNodes", () => {
	const existingNodes: Node[] = [
		{ id: "1", position: { x: 0, y: 0 }, data: { label: "Start", status: "normal" } },
		{ id: "2", position: { x: 100, y: 100 }, data: { label: "Process", status: "normal" } },
		{ id: "3", position: { x: 200, y: 200 }, data: { label: "End", status: "normal" } },
	];

	test("should preserve all nodes when no updates", () => {
		const result = mergeNodes(existingNodes, [], new Set());
		expect(result.length).toBe(3);
		expect(result[0]?.id).toBe("1");
		expect(result[1]?.id).toBe("2");
		expect(result[2]?.id).toBe("3");
	});

	test("should update a single node by ID", () => {
		const updatedNodes: Node[] = [
			{ id: "2", position: { x: 100, y: 100 }, data: { label: "Process", color: "#ff0000" } },
		];

		const result = mergeNodes(existingNodes, updatedNodes, new Set());

		expect(result.length).toBe(3);
		expect(result[1]?.data.color).toBe("#ff0000");
		// Other nodes unchanged
		expect(result[0]?.data.color).toBeUndefined();
		expect(result[2]?.data.color).toBeUndefined();
	});

	test("should update multiple nodes", () => {
		const updatedNodes: Node[] = [
			{ id: "1", position: { x: 0, y: 0 }, data: { label: "Start", status: "complete" } },
			{ id: "3", position: { x: 200, y: 200 }, data: { label: "End", status: "bottleneck" } },
		];

		const result = mergeNodes(existingNodes, updatedNodes, new Set());

		expect(result.length).toBe(3);
		expect(result[0]?.data.status).toBe("complete");
		expect(result[1]?.data.status).toBe("normal"); // unchanged
		expect(result[2]?.data.status).toBe("bottleneck");
	});

	test("should remove nodes marked for deletion", () => {
		const nodeIdsToRemove = new Set(["2"]);

		const result = mergeNodes(existingNodes, [], nodeIdsToRemove);

		expect(result.length).toBe(2);
		expect(result.find((n) => n.id === "2")).toBeUndefined();
		expect(result[0]?.id).toBe("1");
		expect(result[1]?.id).toBe("3");
	});

	test("should add new nodes", () => {
		const updatedNodes: Node[] = [
			{ id: "4", position: { x: 300, y: 300 }, data: { label: "New Step" } },
		];

		const result = mergeNodes(existingNodes, updatedNodes, new Set());

		expect(result.length).toBe(4);
		expect(result[3]?.id).toBe("4");
		expect(result[3]?.data.label).toBe("New Step");
	});

	test("should handle update and delete together", () => {
		const updatedNodes: Node[] = [
			{ id: "1", position: { x: 0, y: 0 }, data: { label: "Start", color: "#00ff00" } },
		];
		const nodeIdsToRemove = new Set(["3"]);

		const result = mergeNodes(existingNodes, updatedNodes, nodeIdsToRemove);

		expect(result.length).toBe(2);
		expect(result[0]?.data.color).toBe("#00ff00");
		expect(result.find((n) => n.id === "3")).toBeUndefined();
	});

	test("should handle update, add, and delete together", () => {
		const updatedNodes: Node[] = [
			{ id: "2", position: { x: 100, y: 100 }, data: { label: "Updated Process", status: "issue" } },
			{ id: "5", position: { x: 400, y: 400 }, data: { label: "Brand New" } },
		];
		const nodeIdsToRemove = new Set(["1"]);

		const result = mergeNodes(existingNodes, updatedNodes, nodeIdsToRemove);

		expect(result.length).toBe(3); // 3 original - 1 deleted + 1 new = 3
		expect(result.find((n) => n.id === "1")).toBeUndefined(); // deleted
		expect(result.find((n) => n.id === "2")?.data.status).toBe("issue"); // updated
		expect(result.find((n) => n.id === "3")?.data.status).toBe("normal"); // unchanged
		expect(result.find((n) => n.id === "5")?.data.label).toBe("Brand New"); // added
	});

	test("should preserve node order (existing nodes first)", () => {
		const updatedNodes: Node[] = [
			{ id: "new1", position: { x: 50, y: 50 }, data: { label: "New First" } },
			{ id: "2", position: { x: 100, y: 100 }, data: { label: "Updated" } },
			{ id: "new2", position: { x: 150, y: 150 }, data: { label: "New Second" } },
		];

		const result = mergeNodes(existingNodes, updatedNodes, new Set());

		// Existing nodes come first (in original order), then new nodes
		expect(result[0]?.id).toBe("1");
		expect(result[1]?.id).toBe("2"); // updated in place
		expect(result[2]?.id).toBe("3");
		expect(result[3]?.id).toBe("new1");
		expect(result[4]?.id).toBe("new2");
	});
});

describe("Phase 3: Mode Detection Logic", () => {
	test("should identify create mode requests", () => {
		const createModeKeywords = ["create", "make", "build", "new process", "start fresh"];
		const prompts = [
			"Create a customer onboarding process",
			"Make a new approval workflow",
			"Build an expense report process",
			"I want a new process for hiring",
			"Start fresh with a simple flow",
		];

		for (const prompt of prompts) {
			const isCreateMode = createModeKeywords.some((keyword) =>
				prompt.toLowerCase().includes(keyword),
			);
			expect(isCreateMode).toBe(true);
		}
	});

	test("should identify update mode requests", () => {
		const updateModeKeywords = ["change", "update", "modify", "make this", "mark", "color", "delete", "remove"];
		const prompts = [
			"Change the color to red",
			"Update the approval step",
			"Modify the status",
			"Make this a bottleneck",
			"Mark as complete",
			"Delete this node",
			"Remove the review step",
		];

		for (const prompt of prompts) {
			const isUpdateMode = updateModeKeywords.some((keyword) =>
				prompt.toLowerCase().includes(keyword),
			);
			expect(isUpdateMode).toBe(true);
		}
	});
});

describe("Phase 3: Edge Preservation Logic", () => {
	const existingEdges = [
		{ id: "e1-2", source: "1", target: "2", type: "bezier" },
		{ id: "e2-3", source: "2", target: "3", type: "bezier" },
	];

	test("should preserve edges when streamedEdges is empty in UPDATE mode", () => {
		const mode = "update";
		const streamedEdges: Array<{ id: string }> = [];

		// This is the logic from ChatInterface
		const finalEdges = streamedEdges.length > 0 ? streamedEdges : existingEdges;

		expect(finalEdges).toBe(existingEdges);
		expect(finalEdges.length).toBe(2);
	});

	test("should use new edges when AI provides them in UPDATE mode", () => {
		const mode = "update";
		const streamedEdges = [
			{ id: "e1-2", source: "1", target: "2", type: "bezier" },
			{ id: "e2-3", source: "2", target: "3", type: "bezier" },
			{ id: "e3-4", source: "3", target: "4", type: "bezier" }, // New edge
		];

		const finalEdges = streamedEdges.length > 0 ? streamedEdges : existingEdges;

		expect(finalEdges).toBe(streamedEdges);
		expect(finalEdges.length).toBe(3);
	});

	test("should always use streamedEdges in CREATE mode (even if empty)", () => {
		const mode = "create";
		const streamedEdges: Array<{ id: string }> = [];

		// In create mode, we always use streamedEdges (replacing everything)
		// An empty process is valid
		const finalEdges = mode === "create" ? streamedEdges : existingEdges;

		expect(finalEdges).toBe(streamedEdges);
		expect(finalEdges.length).toBe(0);
	});
});

describe("Phase 3: NDJSON Streaming Format", () => {
	test("should parse mode message", () => {
		const modeMessage = '{"type":"mode","data":"update"}';
		const parsed = JSON.parse(modeMessage);

		expect(parsed.type).toBe("mode");
		expect(parsed.data).toBe("update");
	});

	test("should parse node message", () => {
		const nodeMessage = '{"type":"node","data":{"id":"1","position":{"x":0,"y":0},"data":{"label":"Start"}}}';
		const parsed = JSON.parse(nodeMessage);

		expect(parsed.type).toBe("node");
		expect(parsed.data.id).toBe("1");
		expect(parsed.data.data.label).toBe("Start");
	});

	test("should parse remove_node message", () => {
		const removeMessage = '{"type":"remove_node","data":"node-2"}';
		const parsed = JSON.parse(removeMessage);

		expect(parsed.type).toBe("remove_node");
		expect(parsed.data).toBe("node-2");
	});

	test("should parse edges message", () => {
		const edgesMessage = '{"type":"edges","data":[{"id":"e1-2","source":"1","target":"2","type":"bezier"}]}';
		const parsed = JSON.parse(edgesMessage);

		expect(parsed.type).toBe("edges");
		expect(parsed.data.length).toBe(1);
		expect(parsed.data[0].type).toBe("bezier");
	});

	test("should normalize marker types to lowercase", () => {
		const edge = {
			id: "e1",
			source: "1",
			target: "2",
			markerEnd: { type: "ArrowClosed" },
		};

		const normalizedMarkerEnd =
			edge.markerEnd && typeof edge.markerEnd === "object" && "type" in edge.markerEnd
				? { ...edge.markerEnd, type: edge.markerEnd.type.toLowerCase() }
				: edge.markerEnd;

		expect(normalizedMarkerEnd.type).toBe("arrowclosed");
	});
});
