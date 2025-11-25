import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";

const API_URL = "http://localhost:4321";

/**
 * Integration tests for the Maps persistence API
 * These tests require the server to be running
 *
 * Run with: bun test tests/persistence.test.ts
 */
describe("Maps Persistence API", () => {
	const createdMapIds: string[] = [];

	beforeAll(async () => {
		// Check if server is running
		try {
			const response = await fetch(`${API_URL}/api/hello`);
			if (!response.ok) throw new Error("Server not responding");
		} catch {
			console.warn("\n⚠️  Server not running! Start with: bun --hot ./src/index.ts\n");
			throw new Error("Server must be running for persistence tests");
		}
	});

	afterAll(async () => {
		// Clean up created maps
		for (const id of createdMapIds) {
			try {
				await fetch(`${API_URL}/api/maps/${id}`, { method: "DELETE" });
			} catch {
				// Ignore cleanup errors
			}
		}
	});

	describe("GET /api/maps", () => {
		test("should return list of maps", async () => {
			const response = await fetch(`${API_URL}/api/maps`);
			expect(response.ok).toBe(true);

			const data = await response.json();
			expect(data.maps).toBeArray();
		});
	});

	describe("POST /api/maps", () => {
		test("should create a new map", async () => {
			const response = await fetch(`${API_URL}/api/maps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Test Map - Create",
					graph: {
						nodes: [
							{ id: "1", position: { x: 0, y: 0 }, data: { label: "Start" } },
							{ id: "2", position: { x: 100, y: 100 }, data: { label: "End" } },
						],
						edges: [{ id: "e1-2", source: "1", target: "2" }],
					},
				}),
			});

			expect(response.ok).toBe(true);
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.map.id).toBeDefined();
			expect(data.map.name).toBe("Test Map - Create");
			expect(data.map.nodeCount).toBe(2);

			createdMapIds.push(data.map.id);
		});

		test("should update an existing map", async () => {
			// First create a map
			const createResponse = await fetch(`${API_URL}/api/maps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Test Map - Update",
					graph: {
						nodes: [{ id: "1", position: { x: 0, y: 0 }, data: { label: "Initial" } }],
						edges: [],
					},
				}),
			});
			const createData = await createResponse.json();
			createdMapIds.push(createData.map.id);

			// Now update it
			const updateResponse = await fetch(`${API_URL}/api/maps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: createData.map.id,
					name: "Test Map - Updated Name",
					graph: {
						nodes: [
							{ id: "1", position: { x: 0, y: 0 }, data: { label: "Updated" } },
							{ id: "2", position: { x: 100, y: 100 }, data: { label: "New Node" } },
						],
						edges: [],
					},
				}),
			});

			expect(updateResponse.ok).toBe(true);
			const updateData = await updateResponse.json();

			expect(updateData.map.id).toBe(createData.map.id);
			expect(updateData.map.name).toBe("Test Map - Updated Name");
			expect(updateData.map.nodeCount).toBe(2);
		});

		test("should return 400 if name is missing", async () => {
			const response = await fetch(`${API_URL}/api/maps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					graph: { nodes: [], edges: [] },
				}),
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toBe("Name and graph are required");
		});

		test("should return 400 if graph is missing", async () => {
			const response = await fetch(`${API_URL}/api/maps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Test Map",
				}),
			});

			expect(response.status).toBe(400);
			const data = await response.json();
			expect(data.error).toBe("Name and graph are required");
		});
	});

	describe("GET /api/maps/:id", () => {
		test("should return a specific map", async () => {
			// First create a map
			const createResponse = await fetch(`${API_URL}/api/maps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Test Map - Get",
					graph: {
						nodes: [{ id: "1", position: { x: 0, y: 0 }, data: { label: "Test" } }],
						edges: [],
					},
				}),
			});
			const createData = await createResponse.json();
			createdMapIds.push(createData.map.id);

			// Now fetch it
			const response = await fetch(`${API_URL}/api/maps/${createData.map.id}`);
			expect(response.ok).toBe(true);

			const data = await response.json();
			expect(data.map.id).toBe(createData.map.id);
			expect(data.map.name).toBe("Test Map - Get");
			expect(data.map.nodes).toBeArray();
			expect(data.map.nodes.length).toBe(1);
			expect(data.map.edges).toBeArray();
		});

		test("should return 404 for non-existent map", async () => {
			const response = await fetch(`${API_URL}/api/maps/non_existent_id`);
			expect(response.status).toBe(404);

			const data = await response.json();
			expect(data.error).toBe("Map not found");
		});
	});

	describe("GET /api/maps/recent", () => {
		test("should return most recently updated map", async () => {
			const response = await fetch(`${API_URL}/api/maps/recent`);
			expect(response.ok).toBe(true);

			const data = await response.json();
			// May be null if no maps exist, or have a map
			if (data.map) {
				expect(data.map.id).toBeDefined();
				expect(data.map.name).toBeDefined();
				expect(data.map.nodes).toBeArray();
				expect(data.map.edges).toBeArray();
			}
		});
	});

	describe("DELETE /api/maps/:id", () => {
		test("should delete a map", async () => {
			// First create a map
			const createResponse = await fetch(`${API_URL}/api/maps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: "Test Map - Delete",
					graph: {
						nodes: [{ id: "1", position: { x: 0, y: 0 }, data: { label: "ToDelete" } }],
						edges: [],
					},
				}),
			});
			const createData = await createResponse.json();

			// Delete it
			const deleteResponse = await fetch(`${API_URL}/api/maps/${createData.map.id}`, {
				method: "DELETE",
			});
			expect(deleteResponse.ok).toBe(true);

			const deleteData = await deleteResponse.json();
			expect(deleteData.success).toBe(true);

			// Verify it's deleted
			const getResponse = await fetch(`${API_URL}/api/maps/${createData.map.id}`);
			expect(getResponse.status).toBe(404);
		});

		test("should return 404 when deleting non-existent map", async () => {
			const response = await fetch(`${API_URL}/api/maps/non_existent_id`, {
				method: "DELETE",
			});
			expect(response.status).toBe(404);

			const data = await response.json();
			expect(data.error).toBe("Map not found");
		});
	});
});

describe("Maps Persistence - Edge Cases", () => {
	test("should handle empty graph", async () => {
		const response = await fetch(`${API_URL}/api/maps`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "Empty Map",
				graph: { nodes: [], edges: [] },
			}),
		});

		expect(response.ok).toBe(true);
		const data = await response.json();

		expect(data.map.nodeCount).toBe(0);

		// Clean up
		await fetch(`${API_URL}/api/maps/${data.map.id}`, { method: "DELETE" });
	});

	test("should handle complex node data", async () => {
		const response = await fetch(`${API_URL}/api/maps`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: "Complex Map",
				graph: {
					nodes: [
						{
							id: "1",
							type: "diamond",
							position: { x: 100, y: 200 },
							data: {
								label: "Decision Node",
								description: "A complex decision",
								status: "bottleneck",
								color: "#ff0000",
								outputCount: 3,
							},
						},
					],
					edges: [],
				},
			}),
		});

		expect(response.ok).toBe(true);
		const data = await response.json();

		// Fetch to verify data integrity
		const getResponse = await fetch(`${API_URL}/api/maps/${data.map.id}`);
		const getData = await getResponse.json();

		expect(getData.map.nodes[0].type).toBe("diamond");
		expect(getData.map.nodes[0].data.status).toBe("bottleneck");
		expect(getData.map.nodes[0].data.outputCount).toBe(3);

		// Clean up
		await fetch(`${API_URL}/api/maps/${data.map.id}`, { method: "DELETE" });
	});

	test("should handle special characters in map name", async () => {
		const specialName = "Test Map: With \"Special\" Characters! (& more)";
		const response = await fetch(`${API_URL}/api/maps`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name: specialName,
				graph: { nodes: [], edges: [] },
			}),
		});

		expect(response.ok).toBe(true);
		const data = await response.json();

		expect(data.map.name).toBe(specialName);

		// Clean up
		await fetch(`${API_URL}/api/maps/${data.map.id}`, { method: "DELETE" });
	});
});
