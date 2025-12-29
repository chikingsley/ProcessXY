import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, generateText, Output } from "ai";
import { serve } from "bun";
import index from "./index.html";
import {
	listMaps,
	getMap,
	saveMap,
	deleteMap,
	getMostRecentMap,
} from "./db/maps";
import { graphUpdateSchema } from "./types/schemas";

// Initialize AI SDK Google provider
const apiKey = process.env.GOOGLE_API_KEY || "";
console.log(
	"🔑 API Key status:",
	apiKey ? `Found (${apiKey.substring(0, 10)}...)` : "NOT FOUND",
);
console.log(
	"📋 All env vars:",
	Object.keys(process.env).filter(
		(k) => k.includes("GOOGLE") || k.includes("API"),
	),
);
if (!apiKey) {
	console.warn("⚠️  GOOGLE_API_KEY not found in environment variables");
}

const google = createGoogleGenerativeAI({
	apiKey,
});

// Simplified system prompt for structured output
const SYSTEM_PROMPT = `You are an expert process mapping assistant. Generate or modify process maps based on user descriptions.

OUTPUT: Return a JSON object with this structure:
{
  "mode": "create" | "update",
  "nodes": [...],
  "edges": [...],
  "removedNodeIds": [...] (optional, for update mode)
}

MODE RULES:
- "create": Build NEW process from scratch. Replace entire graph.
- "update": MODIFY existing process. Only include nodes that are CHANGING.

NODE STRUCTURE:
{
  "id": "unique-string",
  "type": "default" | "oval" | "diamond",
  "position": { "x": number, "y": number },
  "data": {
    "label": "string (max 30 chars)",
    "description": "optional string",
    "status": "normal" | "bottleneck" | "issue" | "complete",
    "color": "#hex-color",
    "outputCount": number (REQUIRED for diamond nodes)
  }
}

NODE TYPES:
- "oval": Start/End nodes
- "diamond": Decision points (MUST have outputCount: 2+ for branches)
- "default": Regular process steps

EDGE STRUCTURE:
{
  "id": "unique-string",
  "source": "source-node-id",
  "target": "target-node-id",
  "type": "straight" | "bezier" | "selfConnecting",
  "sourceHandle": "left" | "right" (for diamond outputs),
  "targetHandle": "left" | "right" (for loop-backs),
  "markerEnd": { "type": "arrowclosed" },
  "label": "Yes" | "No" | custom,
  "labelStyle": { "fill": "#color", "fontWeight": 600 },
  "labelShowBg": true,
  "animated": true (for loops)
}

EDGE RULES:
- Diamond "No" branch: sourceHandle: "left", label: "No", labelStyle.fill: "#ef4444"
- Diamond "Yes" branch: sourceHandle: "right", label: "Yes", labelStyle.fill: "#22c55e"
- Loop-back edges: type: "selfConnecting", animated: true

LAYOUT (centered spine):
- CENTER_X = 300 (main vertical axis)
- BRANCH_OFFSET = 200 (distance to branches)
- VERTICAL_GAP = 60 (between nodes)
- Node heights: oval=45px, default=50px, diamond=160px

Horizontal positions:
- Centered nodes: x = 300 - (width/2)
- Left branch: x = 100 - (width/2)
- Right branch: x = 500 - (width/2)

Vertical positions (cumulative):
- Level 0: y = 0
- Each level: y = previous_y + previous_height + 60

SELECTED NODES:
When "SELECTED NODES" appears, apply changes ONLY to those nodes unless user says "all".
- "this" / "these" → SELECTED NODES
- "make it red" → SELECTED NODES
- "all nodes" / "everything" → All nodes

STATUS COLORS:
- bottleneck: red indicator
- issue: yellow indicator
- complete: green indicator`;

const server = serve({
	port: 4321,
	routes: {
		"/*": index,

		"/api/generate-map": {
			async POST(req) {
				try {
					if (!apiKey) {
						return Response.json(
							{ error: "Google API Key is missing. Please set GOOGLE_API_KEY in your .env file." },
							{ status: 500 },
						);
					}

					const body = await req.json();
					const { prompt, currentGraph, selectedNodeIds } = body;

					if (!prompt) {
						return Response.json({ error: "Prompt is required" }, { status: 400 });
					}

					// Build context message
					let message = `User Request: ${prompt}`;

					if (selectedNodeIds && selectedNodeIds.length > 0) {
						const selectedNodes = currentGraph.nodes.filter(
							(n: { id: string }) => selectedNodeIds.includes(n.id),
						);
						const selectedLabels = selectedNodes.map(
							(n: { data: { label: string } }) => n.data.label,
						);
						message += `\n\n⭐ SELECTED NODES: ${selectedLabels.join(", ")} (IDs: ${selectedNodeIds.join(", ")})`;
					}

					if (currentGraph && currentGraph.nodes.length > 0) {
						message += `\n\nCurrent Graph: ${JSON.stringify(currentGraph)}`;
					}

					// Use streamText with structured output
					const result = streamText({
						model: google("gemini-3-flash-preview"),
						system: SYSTEM_PROMPT,
						prompt: message,
						output: Output.object({ schema: graphUpdateSchema }),
					});

					// Stream partial objects as SSE
					const stream = new ReadableStream({
						async start(controller) {
							const encoder = new TextEncoder();
							let lastNodeCount = 0;
							let sentMode = false;

							try {
								for await (const partialObject of result.partialOutputStream) {
									// Send mode as soon as we have it (only once)
									if (partialObject.mode && !sentMode) {
										const modeEvent = { type: "mode", data: partialObject.mode };
										controller.enqueue(encoder.encode(`data: ${JSON.stringify(modeEvent)}\n\n`));
										sentMode = true;
									}

									// Stream new nodes as they appear
									if (partialObject.nodes && partialObject.nodes.length > lastNodeCount) {
										for (let i = lastNodeCount; i < partialObject.nodes.length; i++) {
											const node = partialObject.nodes[i];
											if (node?.id && node?.position && node?.data) {
												const nodeEvent = { type: "node", data: node };
												controller.enqueue(encoder.encode(`data: ${JSON.stringify(nodeEvent)}\n\n`));
												console.log(`✅ Node: ${node.data?.label || node.id}`);
											}
										}
										lastNodeCount = partialObject.nodes.length;
									}

									// Handle removedNodeIds
									if (partialObject.removedNodeIds) {
										for (const nodeId of partialObject.removedNodeIds) {
											if (nodeId) {
												controller.enqueue(
													encoder.encode(`data: ${JSON.stringify({ type: "remove_node", data: nodeId })}\n\n`)
												);
											}
										}
									}
								}

								// Get final validated object
								const finalObject = await result.output;

								// Send final edges
								if (finalObject?.edges && finalObject.edges.length > 0) {
									controller.enqueue(
										encoder.encode(`data: ${JSON.stringify({ type: "edges", data: finalObject.edges })}\n\n`)
									);
									console.log(`✅ Edges: ${finalObject.edges.length} total`);
								}

								// Send completion
								controller.enqueue(encoder.encode('data: {"type":"complete"}\n\n'));
								controller.close();
							} catch (error) {
								console.error("Streaming error:", error);
								controller.enqueue(
									encoder.encode(`data: {"type":"error","message":"${error}"}\n\n`)
								);
								controller.close();
							}
						},
					});

					return new Response(stream, {
						headers: {
							"Content-Type": "text/event-stream",
							"Cache-Control": "no-cache",
							Connection: "keep-alive",
						},
					});
				} catch (error) {
					console.error("Error generating process map:", error);
					return Response.json({ error: "Failed to generate process map" }, { status: 500 });
				}
			},
		},

		"/api/generate-name": {
			async POST(req) {
				try {
					if (!apiKey) {
						return Response.json({ error: "Google API Key is missing" }, { status: 500 });
					}

					const body = await req.json();
					const { nodeLabels } = body;

					if (!nodeLabels || nodeLabels.length === 0) {
						return Response.json({ name: "Untitled Process" });
					}

					const { text } = await generateText({
						model: google("gemini-3-flash-preview"),
						prompt: `Generate a very short (2-4 words max) name for a process map with these steps: ${nodeLabels.join(", ")}.
Return ONLY the name, no quotes. Examples: "Employee Onboarding", "Bug Triage", "Loan Application"`,
					});

					const name = text.trim().replace(/['"]/g, "");
					const finalName = name.length > 40 ? name.substring(0, 40) : name;

					console.log(`📝 Generated map name: ${finalName}`);
					return Response.json({ name: finalName });
				} catch (error) {
					console.error("Error generating name:", error);
					return Response.json({ name: "Untitled Process" });
				}
			},
		},

		"/api/hello": {
			async GET(_req) {
				return Response.json({ message: "Hello, world!", method: "GET" });
			},
			async PUT(_req) {
				return Response.json({ message: "Hello, world!", method: "PUT" });
			},
		},

		"/api/hello/:name": async (req) => {
			return Response.json({ message: `Hello, ${req.params.name}!` });
		},

		"/api/maps": {
			async GET(_req) {
				try {
					const maps = listMaps();
					return Response.json({ maps });
				} catch (error) {
					console.error("Error listing maps:", error);
					return Response.json({ error: "Failed to list maps" }, { status: 500 });
				}
			},

			async POST(req) {
				try {
					const body = await req.json();
					const { id, name, graph } = body;

					if (!name || !graph) {
						return Response.json({ error: "Name and graph are required" }, { status: 400 });
					}

					const savedMap = saveMap(graph, name, id);
					console.log(`💾 Saved map: ${savedMap.name} (${savedMap.id})`);

					return Response.json({
						success: true,
						map: {
							id: savedMap.id,
							name: savedMap.name,
							nodeCount: JSON.parse(savedMap.nodes).length,
							created_at: savedMap.created_at,
							updated_at: savedMap.updated_at,
						},
					});
				} catch (error) {
					console.error("Error saving map:", error);
					return Response.json({ error: "Failed to save map" }, { status: 500 });
				}
			},
		},

		"/api/maps/recent": {
			async GET(_req) {
				try {
					const map = getMostRecentMap();
					if (!map) {
						return Response.json({ map: null });
					}

					return Response.json({
						map: {
							id: map.id,
							name: map.name,
							nodes: JSON.parse(map.nodes),
							edges: JSON.parse(map.edges),
							created_at: map.created_at,
							updated_at: map.updated_at,
						},
					});
				} catch (error) {
					console.error("Error getting recent map:", error);
					return Response.json({ error: "Failed to get recent map" }, { status: 500 });
				}
			},
		},

		"/api/maps/:id": {
			async GET(req) {
				try {
					const id = req.params.id;
					const map = getMap(id);

					if (!map) {
						return Response.json({ error: "Map not found" }, { status: 404 });
					}

					return Response.json({
						map: {
							id: map.id,
							name: map.name,
							nodes: JSON.parse(map.nodes),
							edges: JSON.parse(map.edges),
							created_at: map.created_at,
							updated_at: map.updated_at,
						},
					});
				} catch (error) {
					console.error("Error getting map:", error);
					return Response.json({ error: "Failed to get map" }, { status: 500 });
				}
			},

			async DELETE(req) {
				try {
					const id = req.params.id;
					const deleted = deleteMap(id);

					if (!deleted) {
						return Response.json({ error: "Map not found" }, { status: 404 });
					}

					console.log(`🗑️ Deleted map: ${id}`);
					return Response.json({ success: true });
				} catch (error) {
					console.error("Error deleting map:", error);
					return Response.json({ error: "Failed to delete map" }, { status: 500 });
				}
			},
		},
	},

	development: process.env.NODE_ENV !== "production" && {
		hmr: true,
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
