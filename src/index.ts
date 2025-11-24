import { serve } from "bun";
import index from "./index.html";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI on the server side only
const apiKey = process.env.GOOGLE_API_KEY || "";
console.log("🔑 API Key status:", apiKey ? `Found (${apiKey.substring(0, 10)}...)` : "NOT FOUND");
console.log("📋 All env vars:", Object.keys(process.env).filter(k => k.includes("GOOGLE") || k.includes("API")));
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
Output each node as a separate JSON object on its own line, followed by edges.
Format:
{"type":"node","data":{...node object...}}
{"type":"node","data":{...node object...}}
{"type":"edges","data":[...all edges...]}

CRITICAL: Each line must be valid JSON. No additional text or explanation.

NODE STRUCTURE:
{
  "id": "unique-string-id",
  "position": { "x": number, "y": number },
  "data": {
    "label": "string (concise)",
    "description": "string (optional)",
    "status": "normal" | "bottleneck" | "issue" | "complete" (optional),
    "color": "hex-color-code (optional)",
    "issueDetails": "string (optional)"
  }
}

EDGE STRUCTURE:
{
  "id": "unique-string-id",
  "source": "source-node-id",
  "target": "target-node-id",
  "type": "smoothstep",
  "markerEnd": {
    "type": "ArrowClosed"
  },
  "label": "optional-label (e.g., 'Yes', 'No' for decisions)",
  "labelStyle": { "fill": "#color", "fontWeight": 600 } (optional),
  "labelShowBg": true (optional),
  "animated": false (optional)
}

EDGE RULES:
1. Always include "type": "smoothstep" for professional routing
2. Always include "markerEnd": {"type": "ArrowClosed"} for directional arrows
3. For decision nodes, add labels like "Yes" or "No":
   - "Yes" branches: "label": "Yes", "labelStyle": {"fill": "#22c55e", "fontWeight": 600}
   - "No" branches: "label": "No", "labelStyle": {"fill": "#ef4444", "fontWeight": 600}
4. Set "labelShowBg": true to make labels more readable

LAYOUT RULES:
1. Start from top (y=0) and flow downwards
2. Horizontal spacing: 250px between nodes
3. Vertical spacing: 100-150px between levels
4. Center align when possible

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
User: "Make this red" + SELECTED NODES: ["1"]
→ Set node "1" color to "#ef4444"

User: "Mark the approval step as a bottleneck"
→ Find node with label containing "approval", set status: "bottleneck"

User: "Add a review step after this" + SELECTED NODES: ["2"]
→ Create new node after node "2"

User: "Change everything to green"
→ Set color: "#22c55e" for ALL nodes

CRITICAL:
- Always preserve the complete node structure
- Return valid JSON only
- If SELECTED NODES are provided, prioritize them for ambiguous references
- Keep labels under 30 characters
`;

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/generate-map": {
      async POST(req) {
        try {
          if (!apiKey) {
            return Response.json(
              { error: "Google API Key is missing. Please set GOOGLE_API_KEY in your .env file." },
              { status: 500 }
            );
          }

          const body = await req.json();
          const { prompt, currentGraph, selectedNodeIds } = body;

          if (!prompt) {
            return Response.json(
              { error: "Prompt is required" },
              { status: 400 }
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
                parts: [{ text: "I understand. I will output nodes and edges in NDJSON format for streaming." }],
              },
            ],
          });

          let message = `User Request: ${prompt}`;

          // Add selected nodes context if any nodes are selected
          if (selectedNodeIds && selectedNodeIds.length > 0) {
            const selectedNodes = currentGraph.nodes.filter((n: any) => selectedNodeIds.includes(n.id));
            const selectedLabels = selectedNodes.map((n: any) => n.data.label);
            message += `\n\n⭐ SELECTED NODES (user is referring to these): ${selectedLabels.join(', ')} (IDs: ${selectedNodeIds.join(', ')})`;
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
                let currentObject = '';
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
                    escapeNext = char === '\\' && !escapeNext;

                    if (!inString) {
                      if (char === '{') braceDepth++;
                      if (char === '}') braceDepth--;
                      if (char === '[') bracketDepth++;
                      if (char === ']') bracketDepth--;

                      // Complete JSON object detected
                      if (braceDepth === 0 && bracketDepth === 0 && currentObject.trim()) {
                        try {
                          const trimmed = currentObject.trim();
                          if (trimmed.startsWith('{')) {
                            // Validate and send
                            const parsed = JSON.parse(trimmed);
                            controller.enqueue(encoder.encode(`data: ${trimmed}\n\n`));

                            // Better logging for edges
                            if (parsed.type === 'edges' && parsed.data?.length > 0) {
                              console.log('✅ Edges object:', JSON.stringify(parsed.data[0], null, 2));
                            } else {
                              console.log('✅ Parsed JSON object:', trimmed.substring(0, 50) + '...');
                            }
                            // Reset for next object
                            currentObject = '';
                            braceDepth = 0;
                            bracketDepth = 0;
                            inString = false;
                            escapeNext = false;
                          }
                        } catch (e) {
                          console.warn('⚠️  Invalid JSON object:', currentObject.substring(0, 100));
                          // Reset on error
                          currentObject = '';
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
                    if (trimmed.startsWith('{')) {
                      JSON.parse(trimmed);
                      controller.enqueue(encoder.encode(`data: ${trimmed}\n\n`));
                      console.log('✅ Final JSON object:', trimmed.substring(0, 50) + '...');
                    }
                  } catch (e) {
                    console.warn('⚠️  Invalid JSON in final buffer:', currentObject.substring(0, 100));
                  }
                }

                // Send completion event
                controller.enqueue(encoder.encode('data: {"type":"complete"}\n\n'));
                controller.close();
              } catch (error) {
                console.error('Streaming error:', error);
                controller.enqueue(encoder.encode(`data: {"type":"error","message":"${error}"}\n\n`));
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          });
        } catch (error) {
          console.error("Error generating process map:", error);
          return Response.json(
            { error: "Failed to generate process map" },
            { status: 500 }
          );
        }
      },
    },

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
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
