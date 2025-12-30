import { describe, test, expect } from "bun:test";
import { mergeNodes } from "../src/hooks/useGraphStream";
import type { Node } from "@xyflow/react";

// Helper to create test nodes
function createNode(id: string, label: string, x = 0, y = 0): Node {
	return {
		id,
		type: "default",
		position: { x, y },
		data: { label },
	};
}

describe("mergeNodes - UPDATE mode node merging", () => {
	test("should return existing nodes unchanged when no updates", () => {
		const existing = [createNode("1", "Node 1"), createNode("2", "Node 2")];
		const updated: Node[] = [];
		const toRemove = new Set<string>();

		const result = mergeNodes(existing, updated, toRemove);

		expect(result).toHaveLength(2);
		expect(result[0].id).toBe("1");
		expect(result[1].id).toBe("2");
	});

	test("should update existing node with new data", () => {
		const existing = [createNode("1", "Old Label", 0, 0)];
		const updated = [createNode("1", "New Label", 100, 100)];
		const toRemove = new Set<string>();

		const result = mergeNodes(existing, updated, toRemove);

		expect(result).toHaveLength(1);
		expect(result[0].data.label).toBe("New Label");
		expect(result[0].position.x).toBe(100);
	});

	test("should remove nodes in toRemove set", () => {
		const existing = [
			createNode("1", "Keep"),
			createNode("2", "Remove"),
			createNode("3", "Keep"),
		];
		const updated: Node[] = [];
		const toRemove = new Set(["2"]);

		const result = mergeNodes(existing, updated, toRemove);

		expect(result).toHaveLength(2);
		expect(result.find((n) => n.id === "2")).toBeUndefined();
	});

	test("should add new nodes that don't exist", () => {
		const existing = [createNode("1", "Existing")];
		const updated = [createNode("2", "New Node")];
		const toRemove = new Set<string>();

		const result = mergeNodes(existing, updated, toRemove);

		expect(result).toHaveLength(2);
		expect(result[1].id).toBe("2");
		expect(result[1].data.label).toBe("New Node");
	});

	test("should handle complex merge scenario", () => {
		// Existing: 1, 2, 3
		// Updated: 2 (modified), 4 (new)
		// Remove: 3
		// Expected result: 1, 2 (modified), 4 (new)
		const existing = [
			createNode("1", "Keep Original"),
			createNode("2", "Old Version"),
			createNode("3", "Will Remove"),
		];
		const updated = [
			createNode("2", "Updated Version"),
			createNode("4", "Brand New"),
		];
		const toRemove = new Set(["3"]);

		const result = mergeNodes(existing, updated, toRemove);

		expect(result).toHaveLength(3);
		expect(result[0].data.label).toBe("Keep Original");
		expect(result[1].data.label).toBe("Updated Version");
		expect(result[2].data.label).toBe("Brand New");
		expect(result.find((n) => n.id === "3")).toBeUndefined();
	});

	test("should preserve order: existing first, then new", () => {
		const existing = [createNode("a", "A"), createNode("c", "C")];
		const updated = [createNode("b", "B"), createNode("d", "D")];
		const toRemove = new Set<string>();

		const result = mergeNodes(existing, updated, toRemove);

		expect(result.map((n) => n.id)).toEqual(["a", "c", "b", "d"]);
	});

	test("should handle empty existing nodes", () => {
		const existing: Node[] = [];
		const updated = [createNode("1", "New")];
		const toRemove = new Set<string>();

		const result = mergeNodes(existing, updated, toRemove);

		expect(result).toHaveLength(1);
		expect(result[0].id).toBe("1");
	});

	test("should handle removing all nodes", () => {
		const existing = [createNode("1", "A"), createNode("2", "B")];
		const updated: Node[] = [];
		const toRemove = new Set(["1", "2"]);

		const result = mergeNodes(existing, updated, toRemove);

		expect(result).toHaveLength(0);
	});
});

describe("mergeNodes - Edge Cases", () => {
	test("should not add duplicates when update contains existing id", () => {
		const existing = [createNode("1", "Original")];
		const updated = [createNode("1", "Updated")];
		const toRemove = new Set<string>();

		const result = mergeNodes(existing, updated, toRemove);

		expect(result).toHaveLength(1);
		expect(result[0].data.label).toBe("Updated");
	});

	test("should handle node with complex data", () => {
		const existing: Node[] = [
			{
				id: "1",
				type: "diamond",
				position: { x: 100, y: 200 },
				data: {
					label: "Decision",
					description: "A complex decision",
					status: "bottleneck",
					outputCount: 2,
				},
			},
		];
		const updated: Node[] = [
			{
				id: "1",
				type: "diamond",
				position: { x: 100, y: 200 },
				data: {
					label: "Decision",
					description: "Updated description",
					status: "complete",
					outputCount: 2,
				},
			},
		];
		const toRemove = new Set<string>();

		const result = mergeNodes(existing, updated, toRemove);

		expect(result[0].data.status).toBe("complete");
		expect(result[0].data.description).toBe("Updated description");
	});
});
