import { describe, test, expect } from "bun:test";
import {
	nodeSchema,
	edgeSchema,
	graphUpdateSchema,
	nodeStatusSchema,
	nodeTypeSchema,
} from "../src/types/schemas";

describe("Graph Schemas", () => {
	describe("nodeStatusSchema", () => {
		test("accepts valid statuses", () => {
			expect(nodeStatusSchema.parse("normal")).toBe("normal");
			expect(nodeStatusSchema.parse("bottleneck")).toBe("bottleneck");
			expect(nodeStatusSchema.parse("issue")).toBe("issue");
			expect(nodeStatusSchema.parse("complete")).toBe("complete");
		});

		test("rejects invalid status", () => {
			expect(() => nodeStatusSchema.parse("invalid")).toThrow();
		});
	});

	describe("nodeTypeSchema", () => {
		test("accepts valid types", () => {
			expect(nodeTypeSchema.parse("default")).toBe("default");
			expect(nodeTypeSchema.parse("oval")).toBe("oval");
			expect(nodeTypeSchema.parse("diamond")).toBe("diamond");
		});

		test("rejects invalid type", () => {
			expect(() => nodeTypeSchema.parse("circle")).toThrow();
		});
	});

	describe("nodeSchema", () => {
		test("parses valid node", () => {
			const node = {
				id: "1",
				type: "oval",
				position: { x: 100, y: 200 },
				data: { label: "Start" },
			};
			const parsed = nodeSchema.parse(node);
			expect(parsed.id).toBe("1");
			expect(parsed.type).toBe("oval");
			expect(parsed.position.x).toBe(100);
			expect(parsed.data.label).toBe("Start");
		});

		test("applies default type", () => {
			const node = {
				id: "2",
				position: { x: 100, y: 200 },
				data: { label: "Process" },
			};
			const parsed = nodeSchema.parse(node);
			expect(parsed.type).toBe("default");
		});

		test("parses node with all optional fields", () => {
			const node = {
				id: "3",
				type: "diamond",
				position: { x: 300, y: 400 },
				data: {
					label: "Decision",
					description: "Check approval status",
					status: "bottleneck",
					color: "#ff0000",
					issueDetails: "Slow approval process",
					outputCount: 2,
				},
			};
			const parsed = nodeSchema.parse(node);
			expect(parsed.data.status).toBe("bottleneck");
			expect(parsed.data.outputCount).toBe(2);
		});

		test("rejects node without required fields", () => {
			expect(() => nodeSchema.parse({ id: "1" })).toThrow();
			expect(() =>
				nodeSchema.parse({
					id: "1",
					position: { x: 0, y: 0 },
				}),
			).toThrow();
		});

		test("rejects label over 50 characters", () => {
			const node = {
				id: "1",
				position: { x: 0, y: 0 },
				data: { label: "x".repeat(51) },
			};
			expect(() => nodeSchema.parse(node)).toThrow();
		});
	});

	describe("edgeSchema", () => {
		test("parses valid edge", () => {
			const edge = {
				id: "e1-2",
				source: "1",
				target: "2",
			};
			const parsed = edgeSchema.parse(edge);
			expect(parsed.id).toBe("e1-2");
			expect(parsed.source).toBe("1");
			expect(parsed.target).toBe("2");
		});

		test("parses edge with all optional fields", () => {
			const edge = {
				id: "e1-2",
				source: "1",
				target: "2",
				type: "bezier",
				sourceHandle: "right",
				targetHandle: "left",
				markerEnd: { type: "arrowclosed" },
				label: "Yes",
				labelStyle: { fill: "#22c55e", fontWeight: 600 },
				labelShowBg: true,
				animated: true,
			};
			const parsed = edgeSchema.parse(edge);
			expect(parsed.type).toBe("bezier");
			expect(parsed.label).toBe("Yes");
			expect(parsed.animated).toBe(true);
		});

		test("accepts selfConnecting edge type", () => {
			const edge = {
				id: "e-loop",
				source: "1",
				target: "1",
				type: "selfConnecting",
			};
			const parsed = edgeSchema.parse(edge);
			expect(parsed.type).toBe("selfConnecting");
		});

		test("accepts dataFlow edge type with data", () => {
			const edge = {
				id: "e-data",
				source: "1",
				target: "2",
				type: "dataFlow",
				data: {
					dataType: "document",
					dataLabel: "Application Form",
				},
			};
			const parsed = edgeSchema.parse(edge);
			expect(parsed.type).toBe("dataFlow");
			expect(parsed.data?.dataType).toBe("document");
			expect(parsed.data?.dataLabel).toBe("Application Form");
		});

		test("accepts all valid data types", () => {
			const dataTypes = ["document", "form", "data", "database", "message", "email", "user", "customer", "package"];
			for (const dataType of dataTypes) {
				const edge = {
					id: `e-${dataType}`,
					source: "1",
					target: "2",
					type: "dataFlow",
					data: { dataType },
				};
				const parsed = edgeSchema.parse(edge);
				expect(parsed.data?.dataType).toBe(dataType);
			}
		});

		test("rejects invalid data type", () => {
			const edge = {
				id: "e-invalid",
				source: "1",
				target: "2",
				type: "dataFlow",
				data: { dataType: "invalid" },
			};
			expect(() => edgeSchema.parse(edge)).toThrow();
		});
	});

	describe("graphUpdateSchema", () => {
		test("parses create mode update", () => {
			const update = {
				mode: "create",
				nodes: [
					{
						id: "1",
						type: "oval",
						position: { x: 300, y: 0 },
						data: { label: "Start" },
					},
					{
						id: "2",
						type: "default",
						position: { x: 300, y: 100 },
						data: { label: "Process" },
					},
				],
				edges: [{ id: "e1-2", source: "1", target: "2" }],
			};
			const parsed = graphUpdateSchema.parse(update);
			expect(parsed.mode).toBe("create");
			expect(parsed.nodes).toHaveLength(2);
			expect(parsed.edges).toHaveLength(1);
		});

		test("parses update mode with removals", () => {
			const update = {
				mode: "update",
				nodes: [
					{
						id: "3",
						position: { x: 300, y: 200 },
						data: { label: "New Step" },
					},
				],
				edges: [],
				removedNodeIds: ["2"],
			};
			const parsed = graphUpdateSchema.parse(update);
			expect(parsed.mode).toBe("update");
			expect(parsed.removedNodeIds).toEqual(["2"]);
		});

		test("rejects invalid mode", () => {
			expect(() =>
				graphUpdateSchema.parse({
					mode: "invalid",
					nodes: [],
					edges: [],
				}),
			).toThrow();
		});
	});
});

describe("Schema Validation - AI Response Simulation", () => {
	test("validates typical AI-generated process flow", () => {
		// Simulate what the AI would return
		const aiResponse = {
			mode: "create",
			nodes: [
				{
					id: "start",
					type: "oval",
					position: { x: 300, y: 0 },
					data: { label: "Start" },
				},
				{
					id: "step1",
					type: "default",
					position: { x: 300, y: 100 },
					data: { label: "Review Request" },
				},
				{
					id: "decision1",
					type: "diamond",
					position: { x: 300, y: 200 },
					data: { label: "Approved?", outputCount: 2 },
				},
				{
					id: "yes-path",
					type: "default",
					position: { x: 500, y: 400 },
					data: { label: "Process" },
				},
				{
					id: "no-path",
					type: "default",
					position: { x: 100, y: 400 },
					data: { label: "Reject" },
				},
				{
					id: "end",
					type: "oval",
					position: { x: 300, y: 600 },
					data: { label: "End" },
				},
			],
			edges: [
				{ id: "e-start-step1", source: "start", target: "step1", type: "straight" },
				{ id: "e-step1-decision", source: "step1", target: "decision1", type: "straight" },
				{
					id: "e-decision-yes",
					source: "decision1",
					target: "yes-path",
					type: "bezier",
					sourceHandle: "right",
					label: "Yes",
					labelStyle: { fill: "#22c55e", fontWeight: 600 },
				},
				{
					id: "e-decision-no",
					source: "decision1",
					target: "no-path",
					type: "bezier",
					sourceHandle: "left",
					label: "No",
					labelStyle: { fill: "#ef4444", fontWeight: 600 },
				},
				{ id: "e-yes-end", source: "yes-path", target: "end", type: "straight" },
				{ id: "e-no-end", source: "no-path", target: "end", type: "straight" },
			],
		};

		const parsed = graphUpdateSchema.parse(aiResponse);
		expect(parsed.nodes).toHaveLength(6);
		expect(parsed.edges).toHaveLength(6);

		// Verify diamond has outputCount
		const diamond = parsed.nodes.find((n) => n.type === "diamond");
		expect(diamond?.data.outputCount).toBe(2);

		// Verify edge labels
		const yesEdge = parsed.edges.find((e) => e.label === "Yes");
		expect(yesEdge?.sourceHandle).toBe("right");
	});

	test("validates node status updates", () => {
		const update = {
			mode: "update",
			nodes: [
				{
					id: "step1",
					position: { x: 300, y: 100 },
					data: {
						label: "Review Request",
						status: "bottleneck",
						color: "#ef4444",
					},
				},
			],
			edges: [],
		};

		const parsed = graphUpdateSchema.parse(update);
		expect(parsed.nodes[0]?.data.status).toBe("bottleneck");
		expect(parsed.nodes[0]?.data.color).toBe("#ef4444");
	});
});
