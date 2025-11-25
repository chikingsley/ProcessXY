import { GoogleGenerativeAI } from "@google/generative-ai";
import { serve } from "bun";
import index from "./index.html";
import {
	listMaps,
	getMap,
	saveMap,
	deleteMap,
	getMostRecentMap,
} from "./db/maps";

// Initialize Gemini AI on the server side only
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
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
	model: "gemini-flash-latest",
	// No JSON constraint - we'll use NDJSON for streaming
});

const SYSTEM_PROMPT = `
You are an expert process mapping assistant. Your goal is to generate or modify a process map based on the user's description.

OUTPUT FORMAT (NDJSON - Newline Delimited JSON):
FIRST, output a mode indicator, then nodes, then edges.

FORMAT:
{"type":"mode","data":"update"} OR {"type":"mode","data":"create"}
{"type":"node","data":{...node object...}}
{"type":"edges","data":[...all edges...]}

MODE RULES (CRITICAL - output this FIRST before any nodes):
- "create" mode: Use when building a NEW process from scratch or when user asks to "create", "make", "build" a new process
- "update" mode: Use when MODIFYING an existing process (changing colors, status, labels, adding/removing nodes)

In UPDATE mode:
- Only output nodes that are CHANGING (not the whole graph)
- Preserve the same node IDs for nodes being modified
- Include {"type":"remove_node","data":"node-id"} to delete a node
- Edges array should include ALL edges for the final state (we replace edges entirely)

In CREATE mode:
- Output ALL nodes for the new process
- Output ALL edges for the new process
- This replaces the entire existing graph

CRITICAL: Each line must be valid JSON. No additional text or explanation.

NODE TYPES:
1. RECTANGLE (default) - Standard process steps
2. OVAL - Start/end points
3. DIAMOND - Decision points with multiple outputs

NODE STRUCTURE:
{
  "id": "unique-string-id",
  "type": "default" | "oval" | "diamond" (default: "default"),
  "position": { "x": number, "y": number },
  "data": {
    "label": "string (concise)",
    "description": "string (optional)",
    "status": "normal" | "bottleneck" | "issue" | "complete" (optional),
    "color": "hex-color-code (optional)",
    "issueDetails": "string (optional)",
    "outputCount": number (REQUIRED for diamond nodes - number of decision branches)
  }
}

NODE TYPE RULES:
- Use type: "oval" for START and END nodes
- Use type: "diamond" for DECISION points (Yes/No, routing, conditional logic)
- For diamond nodes, MUST include "outputCount" in data:
  - 2 outputs for Yes/No decisions
  - 3+ outputs for multi-way decisions (Low/Medium/High, etc.)
- Use type: "default" (or omit) for regular process steps

EDGE STRUCTURE:
{
  "id": "unique-string-id",
  "source": "source-node-id",
  "target": "target-node-id",
  "type": "bezier",
  "markerEnd": {
    "type": "arrowclosed"
  },
  "label": "optional-label (e.g., 'Yes', 'No' for decisions)",
  "labelStyle": { "fill": "#color", "fontWeight": 600 } (optional),
  "labelShowBg": true (optional),
  "animated": false (optional)
}

EDGE RULES:
1. Default edges: Use "type": "bezier" for smooth curved routing (forward flow)
2. Always include "markerEnd": {"type": "arrowclosed"} for directional arrows
3. CRITICAL - For DIAMOND decision nodes with 2 outputs (Yes/No):
   - "No" branch: MUST use "sourceHandle": "left" to exit from the LEFT side of the diamond
   - "Yes" branch: MUST use "sourceHandle": "right" to exit from the RIGHT side of the diamond
   - "Yes" branches: "label": "Yes", "labelStyle": {"fill": "#22c55e", "fontWeight": 600}
   - "No" branches: "label": "No", "labelStyle": {"fill": "#ef4444", "fontWeight": 600}
4. Set "labelShowBg": true to make labels more readable
5. BACKWARD/LOOP EDGES: When an edge goes BACK to an earlier node (retry, loop, return):
   - Use "type": "selfConnecting" instead of "bezier"
   - Add "sourceHandle": "left" or "right" to specify which side the edge exits
   - Add "targetHandle": "left" or "right" to specify which side the edge enters
   - The edge will automatically route AROUND other nodes instead of cutting through
   - Example: If the "No" branch of a decision loops back, use sourceHandle: "left", targetHandle: "left"
   - Set "animated": true on loop edges to show they're special flows

LAYOUT RULES:
1. Start from top (y=0) and flow downwards
2. Horizontal spacing: 250-300px between nodes (give edges room to breathe)
3. Vertical spacing: 200-280px between levels (NOT 100-150px, that's too tight!)
4. Center align when possible
5. For diamond nodes with multiple outputs, spread child nodes wider apart (300-350px horizontal)

NATURAL LANGUAGE UNDERSTANDING:
⭐ When you see "SELECTED NODES" in the user request, those are the nodes the user is referring to with words like:
  - "this" / "this node" → Apply to SELECTED NODES only
  - "these" / "these nodes" → Apply to SELECTED NODES only
  - "the selected" → Apply to SELECTED NODES only
  - "make it red" → Apply to SELECTED NODES only

When user mentions a node by label or description:
  - "the approval step" → Find node with label containing "approval"
  - "the bottleneck" → Find node with status: "bottleneck"
  - "the problem node" → Find node with status: "issue"

When user says:
  - "all nodes" / "everything" / "the whole process" → Modify all nodes
  - "add after this" → Add new node after SELECTED NODES

MODIFICATION RULES:
1. If SELECTED NODES exist, ONLY modify those nodes unless user explicitly says "all"
2. Preserve existing node IDs when modifying
3. Preserve unaffected nodes exactly as they are
4. When changing colors, use hex codes (#ff0000 for red, #00ff00 for green, etc.)
5. When marking bottlenecks, set status: "bottleneck"
6. When marking issues, set status: "issue"
7. When marking complete, set status: "complete"

STATUS USAGE:
- status: "bottleneck" → Node is a process bottleneck (shows red indicator)
- status: "issue" → Node has a problem (shows yellow indicator)
- status: "complete" → Node is completed (shows green indicator)
- status: "normal" → Default state

EXAMPLES:
User: "Create a customer onboarding process"
→ Start node (oval), process steps (default), decision node (diamond with outputCount: 2), end node (oval)

User: "Make this red" + SELECTED NODES: ["1"]
→ Set node "1" color to "#ef4444"

User: "Mark the approval step as a bottleneck"
→ Find node with label containing "approval", set status: "bottleneck"

User: "Add a decision point for credit check"
→ Create diamond node with type: "diamond", outputCount: 2, label: "Credit OK?"

User: "Add a review step after this" + SELECTED NODES: ["2"]
→ Create new node after node "2"

User: "Change everything to green"
→ Set color: "#22c55e" for ALL nodes

EXAMPLE OUTPUT FOR A DECISION FLOW (note the spacing - 200-280px vertical, 300px+ horizontal):
{"type":"node","data":{"id":"1","type":"oval","position":{"x":250,"y":0},"data":{"label":"Start"}}}
{"type":"node","data":{"id":"2","type":"default","position":{"x":250,"y":200},"data":{"label":"Review Application"}}}
{"type":"node","data":{"id":"3","type":"diamond","position":{"x":200,"y":480},"data":{"label":"Approved?","outputCount":2}}}
{"type":"node","data":{"id":"4","type":"default","position":{"x":50,"y":760},"data":{"label":"Request More Info"}}}
{"type":"node","data":{"id":"5","type":"default","position":{"x":400,"y":760},"data":{"label":"Process Approval"}}}
{"type":"edges","data":[{"id":"e1-2","source":"1","target":"2","type":"bezier","markerEnd":{"type":"arrowclosed"}},{"id":"e2-3","source":"2","target":"3","type":"bezier","markerEnd":{"type":"arrowclosed"}},{"id":"e3-4","source":"3","sourceHandle":"left","target":"4","type":"bezier","label":"No","labelStyle":{"fill":"#ef4444","fontWeight":600},"labelShowBg":true,"markerEnd":{"type":"arrowclosed"}},{"id":"e3-5","source":"3","sourceHandle":"right","target":"5","type":"bezier","label":"Yes","labelStyle":{"fill":"#22c55e","fontWeight":600},"labelShowBg":true,"markerEnd":{"type":"arrowclosed"}}]}

CRITICAL:
- Always preserve the complete node structure
- Return valid JSON only
- If SELECTED NODES are provided, prioritize them for ambiguous references
- Keep labels under 30 characters
`;

const server = serve({
	port: 4321,
	routes: {
		// Serve index.html for all unmatched routes.
		"/*": index,

		"/api/generate-map": {
			async POST(req) {
				try {
					if (!apiKey) {
						return Response.json(
							{
								error:
									"Google API Key is missing. Please set GOOGLE_API_KEY in your .env file.",
							},
							{ status: 500 },
						);
					}

					const body = await req.json();
					const { prompt, currentGraph, selectedNodeIds } = body;

					if (!prompt) {
						return Response.json(
							{ error: "Prompt is required" },
							{ status: 400 },
						);
					}

					const chatSession = model.startChat({
						history: [
							{
								role: "user",
								parts: [{ text: SYSTEM_PROMPT }],
							},
							{
								role: "model",
								parts: [
									{
										text: "I understand. I will output nodes and edges in NDJSON format for streaming.",
									},
								],
							},
						],
					});

					let message = `User Request: ${prompt}`;

					// Add selected nodes context if any nodes are selected
					if (selectedNodeIds && selectedNodeIds.length > 0) {
						const selectedNodes = currentGraph.nodes.filter(
							(n: { id: string }) => selectedNodeIds.includes(n.id),
						);
						const selectedLabels = selectedNodes.map(
							(n: { data: { label: string } }) => n.data.label,
						);
						message += `\n\n⭐ SELECTED NODES (user is referring to these): ${selectedLabels.join(", ")} (IDs: ${selectedNodeIds.join(", ")})`;
					}

					if (currentGraph && currentGraph.nodes.length > 0) {
						message += `\n\nCurrent Graph Context: ${JSON.stringify(currentGraph)}`;
					}

					// Use streaming API
					const result = await chatSession.sendMessageStream(message);

					// Create a readable stream for SSE (Server-Sent Events)
					const stream = new ReadableStream({
						async start(controller) {
							const encoder = new TextEncoder();

							try {
								let currentObject = "";
								let braceDepth = 0;
								let bracketDepth = 0;
								let inString = false;
								let escapeNext = false;

								for await (const chunk of result.stream) {
									const chunkText = chunk.text();

									// Process only new characters from this chunk
									for (let i = 0; i < chunkText.length; i++) {
										const char = chunkText[i];
										currentObject += char;

										// Track string boundaries (ignore braces inside strings)
										if (char === '"' && !escapeNext) {
											inString = !inString;
										}
										escapeNext = char === "\\" && !escapeNext;

										if (!inString) {
											if (char === "{") braceDepth++;
											if (char === "}") braceDepth--;
											if (char === "[") bracketDepth++;
											if (char === "]") bracketDepth--;

											// Complete JSON object detected
											if (
												braceDepth === 0 &&
												bracketDepth === 0 &&
												currentObject.trim()
											) {
												try {
													const trimmed = currentObject.trim();
													if (trimmed.startsWith("{")) {
														// Validate and send
														const parsed = JSON.parse(trimmed);
														controller.enqueue(
															encoder.encode(`data: ${trimmed}\n\n`),
														);

														// Better logging for edges
														if (
															parsed.type === "edges" &&
															parsed.data?.length > 0
														) {
															console.log(
																"✅ Edges object:",
																JSON.stringify(parsed.data[0], null, 2),
															);
														} else {
															console.log(
																"✅ Parsed JSON object:",
																`${trimmed.substring(0, 50)}...`,
															);
														}
														// Reset for next object
														currentObject = "";
														braceDepth = 0;
														bracketDepth = 0;
														inString = false;
														escapeNext = false;
													}
												} catch (_e) {
													console.warn(
														"⚠️  Invalid JSON object:",
														currentObject.substring(0, 100),
													);
													// Reset on error
													currentObject = "";
													braceDepth = 0;
													bracketDepth = 0;
													inString = false;
													escapeNext = false;
												}
											}
										}
									}
								}

								// Process any remaining buffer
								if (currentObject.trim()) {
									try {
										const trimmed = currentObject.trim();
										if (trimmed.startsWith("{")) {
											JSON.parse(trimmed);
											controller.enqueue(
												encoder.encode(`data: ${trimmed}\n\n`),
											);
											console.log(
												"✅ Final JSON object:",
												`${trimmed.substring(0, 50)}...`,
											);
										}
									} catch (_e) {
										console.warn(
											"⚠️  Invalid JSON in final buffer:",
											currentObject.substring(0, 100),
										);
									}
								}

								// Send completion event
								controller.enqueue(
									encoder.encode('data: {"type":"complete"}\n\n'),
								);
								controller.close();
							} catch (error) {
								console.error("Streaming error:", error);
								controller.enqueue(
									encoder.encode(
										`data: {"type":"error","message":"${error}"}\n\n`,
									),
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
					return Response.json(
						{ error: "Failed to generate process map" },
						{ status: 500 },
					);
				}
			},
		},

		"/api/hello": {
			async GET(_req) {
				return Response.json({
					message: "Hello, world!",
					method: "GET",
				});
			},
			async PUT(_req) {
				return Response.json({
					message: "Hello, world!",
					method: "PUT",
				});
			},
		},

		"/api/hello/:name": async (req) => {
			const name = req.params.name;
			return Response.json({
				message: `Hello, ${name}!`,
			});
		},

		// Maps CRUD API
		"/api/maps": {
			// List all saved maps
			async GET(_req) {
				try {
					const maps = listMaps();
					return Response.json({ maps });
				} catch (error) {
					console.error("Error listing maps:", error);
					return Response.json(
						{ error: "Failed to list maps" },
						{ status: 500 },
					);
				}
			},

			// Save a new map or update existing
			async POST(req) {
				try {
					const body = await req.json();
					const { id, name, graph } = body;

					if (!name || !graph) {
						return Response.json(
							{ error: "Name and graph are required" },
							{ status: 400 },
						);
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
					return Response.json(
						{ error: "Failed to save map" },
						{ status: 500 },
					);
				}
			},
		},

		"/api/maps/recent": {
			// Get the most recently updated map (for auto-load)
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
					return Response.json(
						{ error: "Failed to get recent map" },
						{ status: 500 },
					);
				}
			},
		},

		"/api/maps/:id": {
			// Get a specific map
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
					return Response.json(
						{ error: "Failed to get map" },
						{ status: 500 },
					);
				}
			},

			// Delete a map
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
					return Response.json(
						{ error: "Failed to delete map" },
						{ status: 500 },
					);
				}
			},
		},
	},

	development: process.env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
