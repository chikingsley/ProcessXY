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
  generationConfig: {
    responseMimeType: "application/json",
  },
});

const SYSTEM_PROMPT = `
You are an expert process mapping assistant. Your goal is to generate or modify a process map based on the user's description.
You must return a JSON object containing 'nodes' and 'edges' that represents the process flow.

Rules:
1. Nodes must have a unique 'id', a 'position' {x, y}, and 'data' { label: string }.
2. Edges must have a unique 'id', 'source' (node id), and 'target' (node id).
3. Layout the nodes logically. Start from the top (y=0) and flow downwards.
4. If the user asks to modify an existing map, you will receive the current graph context. Respect existing IDs if possible, or replace them if a full rewrite is needed.
5. Keep labels concise.
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
          const { prompt, currentGraph } = body;

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
                parts: [{ text: "I understand. I am ready to generate process maps in JSON format." }],
              },
            ],
          });

          let message = `User Request: ${prompt}`;
          if (currentGraph && currentGraph.nodes.length > 0) {
            message += `\n\nCurrent Graph Context: ${JSON.stringify(currentGraph)}`;
          }

          const result = await chatSession.sendMessage(message);
          const responseText = result.response.text();
          const graph = JSON.parse(responseText);

          return Response.json(graph);
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
