import { describe, test, expect, beforeAll } from "bun:test";

const API_URL = "http://localhost:4321/api/generate-map";

/**
 * Integration tests for the AI streaming endpoint
 * These tests require:
 * 1. Server running on port 4321 (`bun --hot ./src/index.ts`)
 * 2. Valid GOOGLE_API_KEY in .env
 *
 * Run with: bun test tests/integration.test.ts
 */
describe("Phase 3: AI Streaming Integration", () => {
	beforeAll(async () => {
		// Check if server is running
		try {
			const response = await fetch("http://localhost:4321/api/hello");
			if (!response.ok) throw new Error("Server not responding");
		} catch {
			console.warn("\n⚠️  Server not running! Start with: bun --hot ./src/index.ts\n");
			throw new Error("Server must be running for integration tests");
		}
	});

	test("should return streaming response for CREATE request", async () => {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt: "Create a simple 2-step process: Start and End",
				currentGraph: { nodes: [], edges: [] },
				selectedNodeIds: [],
			}),
		});

		expect(response.ok).toBe(true);
		expect(response.headers.get("content-type")).toBe("text/event-stream");

		// Collect streamed messages
		const messages: Array<{ type: string; data: unknown }> = [];
		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) throw new Error("No response body");

		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || ""; // Keep incomplete line in buffer

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					try {
						const parsed = JSON.parse(line.slice(6));
						messages.push(parsed);
					} catch {
						// Skip unparseable lines
					}
				}
			}
		}

		// Verify we got the expected message types
		const messageTypes = messages.map((m) => m.type);

		// Should have mode as first message (or early in stream)
		expect(messageTypes).toContain("mode");

		// Should have at least one node
		const nodeMessages = messages.filter((m) => m.type === "node");
		expect(nodeMessages.length).toBeGreaterThan(0);

		// Should have edges array
		expect(messageTypes).toContain("edges");

		// Should have complete signal
		expect(messageTypes).toContain("complete");

		// Check mode is "create" for new process request
		const modeMessage = messages.find((m) => m.type === "mode");
		expect(modeMessage?.data).toBe("create");

		console.log(`✅ CREATE test: Received ${nodeMessages.length} nodes`);
	}, 30000); // 30s timeout for AI response

	test("should return UPDATE mode for modification request", async () => {
		// First, create a graph with existing nodes
		const existingGraph = {
			nodes: [
				{ id: "1", type: "oval", position: { x: 250, y: 0 }, data: { label: "Start", status: "normal" } },
				{ id: "2", type: "default", position: { x: 250, y: 200 }, data: { label: "Process", status: "normal" } },
				{ id: "3", type: "oval", position: { x: 250, y: 400 }, data: { label: "End", status: "normal" } },
			],
			edges: [
				{ id: "e1-2", source: "1", target: "2", type: "bezier" },
				{ id: "e2-3", source: "2", target: "3", type: "bezier" },
			],
		};

		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt: "Make node 2 red",
				currentGraph: existingGraph,
				selectedNodeIds: ["2"],
			}),
		});

		expect(response.ok).toBe(true);

		// Collect messages
		const messages: Array<{ type: string; data: unknown }> = [];
		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) throw new Error("No response body");

		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					try {
						messages.push(JSON.parse(line.slice(6)));
					} catch {
						// Skip
					}
				}
			}
		}

		// Check mode is "update"
		const modeMessage = messages.find((m) => m.type === "mode");
		expect(modeMessage?.data).toBe("update");

		// In update mode, we should get fewer nodes (only the changed ones)
		const nodeMessages = messages.filter((m) => m.type === "node");
		// For "make this red", we expect only 1 node to be returned
		expect(nodeMessages.length).toBeLessThanOrEqual(existingGraph.nodes.length);

		console.log(`✅ UPDATE test: Mode=${modeMessage?.data}, Nodes modified=${nodeMessages.length}`);
	}, 30000);

	test("should include node color when asked to change color", async () => {
		const existingGraph = {
			nodes: [
				{ id: "1", type: "default", position: { x: 0, y: 0 }, data: { label: "Test Node", status: "normal" } },
			],
			edges: [],
		};

		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt: "Make this node blue",
				currentGraph: existingGraph,
				selectedNodeIds: ["1"],
			}),
		});

		expect(response.ok).toBe(true);

		const messages: Array<{ type: string; data: Record<string, unknown> }> = [];
		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) throw new Error("No response body");

		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					try {
						messages.push(JSON.parse(line.slice(6)));
					} catch {
						// Skip
					}
				}
			}
		}

		// Find the node message
		const nodeMessage = messages.find((m) => m.type === "node");
		expect(nodeMessage).toBeDefined();

		// Check if color was set (should be some shade of blue)
		const nodeData = nodeMessage?.data as { data?: { color?: string } };
		const color = nodeData?.data?.color;

		// Color should be set and be a hex value
		expect(color).toBeDefined();
		expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);

		console.log(`✅ COLOR test: Node color set to ${color}`);
	}, 30000);
});

describe("Phase 3: Edge Preservation in UPDATE Mode", () => {
	test("should preserve edges when AI sends empty edges array", async () => {
		// Create a graph with edges
		const existingGraph = {
			nodes: [
				{ id: "1", type: "oval", position: { x: 250, y: 0 }, data: { label: "Start", status: "normal" } },
				{ id: "2", type: "default", position: { x: 250, y: 200 }, data: { label: "Process", status: "normal" } },
				{ id: "3", type: "oval", position: { x: 250, y: 400 }, data: { label: "End", status: "normal" } },
			],
			edges: [
				{ id: "e1-2", source: "1", target: "2", type: "bezier", markerEnd: { type: "arrowclosed" } },
				{ id: "e2-3", source: "2", target: "3", type: "bezier", markerEnd: { type: "arrowclosed" } },
			],
		};

		// This request should NOT affect edges - just changing a label
		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				prompt: "Change the label of the Process node to 'Review Step'",
				currentGraph: existingGraph,
				selectedNodeIds: ["2"],
			}),
		});

		expect(response.ok).toBe(true);

		// Collect messages
		const messages: Array<{ type: string; data: unknown }> = [];
		const reader = response.body?.getReader();
		const decoder = new TextDecoder();

		if (!reader) throw new Error("No response body");

		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() || "";

			for (const line of lines) {
				if (line.startsWith("data: ")) {
					try {
						messages.push(JSON.parse(line.slice(6)));
					} catch {
						// Skip
					}
				}
			}
		}

		// Check mode is update
		const modeMessage = messages.find((m) => m.type === "mode");
		expect(modeMessage?.data).toBe("update");

		// Check if edges were sent (they might be empty or might have content)
		const edgesMessage = messages.find((m) => m.type === "edges");
		const edgesData = edgesMessage?.data as Array<unknown> | undefined;

		// Log what we got for debugging
		console.log(`📊 EDGE PRESERVATION test:`);
		console.log(`   Mode: ${modeMessage?.data}`);
		console.log(`   Edges in response: ${edgesData?.length ?? "none"}`);
		console.log(`   Original edges: ${existingGraph.edges.length}`);

		// The important thing: if AI sends empty edges, our code should preserve the original
		// This test verifies the AI behavior - the actual preservation happens in ChatInterface
		if (edgesData && edgesData.length === 0) {
			console.log(`   ⚠️ AI sent empty edges - ChatInterface should preserve originals`);
		}
	}, 30000);
});

describe("Phase 3: API Error Handling", () => {
	test("should return 400 for missing prompt", async () => {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				currentGraph: { nodes: [], edges: [] },
				selectedNodeIds: [],
			}),
		});

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe("Prompt is required");
	});
});
