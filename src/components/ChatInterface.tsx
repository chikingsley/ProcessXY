import type { Edge, Node } from "@xyflow/react";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProcessEdge, ProcessGraph, ProcessNode } from "../types/process";

/**
 * Merge updated nodes with existing nodes
 * - Nodes in updatedNodes replace existing nodes with the same ID
 * - Nodes in nodeIdsToRemove are filtered out
 * - Existing nodes not in either list are preserved
 */
function mergeNodes(
	existingNodes: Node[],
	updatedNodes: Node[],
	nodeIdsToRemove: Set<string>,
): Node[] {
	// Create a map of updated nodes by ID for fast lookup
	const updatedNodeMap = new Map(updatedNodes.map((n) => [n.id, n]));

	// Start with existing nodes, replacing/filtering as needed
	const mergedNodes: Node[] = [];

	for (const node of existingNodes) {
		// Skip if marked for removal
		if (nodeIdsToRemove.has(node.id)) continue;

		// Use updated version if available, otherwise keep existing
		const updatedNode = updatedNodeMap.get(node.id);
		if (updatedNode) {
			mergedNodes.push(updatedNode);
			updatedNodeMap.delete(node.id); // Mark as processed
		} else {
			mergedNodes.push(node);
		}
	}

	// Add any new nodes that weren't replacements
	for (const node of updatedNodeMap.values()) {
		mergedNodes.push(node);
	}

	return mergedNodes;
}

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
}

interface ChatInterfaceProps {
	currentNodes: Node[];
	currentEdges: Edge[];
	selectedNodeIds: string[];
	onGraphUpdate: (nodes: Node[], edges: Edge[]) => void;
	onStreamComplete?: () => void;
	onAutoName?: (name: string) => void;
	currentMapName?: string;
}

export function ChatInterface({
	currentNodes,
	currentEdges,
	selectedNodeIds,
	onGraphUpdate,
	onStreamComplete,
	onAutoName,
	currentMapName,
}: ChatInterfaceProps) {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			role: "assistant",
			content:
				"Hello! I'm your process mapping assistant. Describe a process, and I'll help you map it out.",
		},
	]);
	const [inputValue, setInputValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: inputValue,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");
		setIsLoading(true);

		try {
			// Convert current React Flow nodes/edges to ProcessGraph type
			const currentGraph: ProcessGraph = {
				nodes: currentNodes as ProcessNode[],
				edges: currentEdges as ProcessEdge[],
			};

			// Call the server-side API endpoint with streaming
			const response = await fetch("/api/generate-map", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt: userMessage.content,
					currentGraph,
					selectedNodeIds,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to generate map");
			}

			// Handle streaming response
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error("No response body");
			}

			// Track update mode: "create" replaces everything, "update" merges changes
			let mode: "create" | "update" = "create";

			// For create mode: collect all new nodes
			const streamedNodes: Node[] = [];
			// For update mode: track nodes to modify/add and IDs to remove
			const nodesToMerge: Node[] = [];
			const nodeIdsToRemove: Set<string> = new Set();

			let streamedEdges: Edge[] = [];

			// Buffer for accumulating partial JSON across chunks
			let jsonBuffer = "";
			let braceCount = 0;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split("\n");

				for (const line of lines) {
					let content = line;

					// Handle new data line
					if (line.startsWith("data: ")) {
						content = line.slice(6); // Remove 'data: ' prefix
					}

					// Skip empty lines
					if (!content.trim()) continue;

					// If we're not in the middle of accumulating, and this doesn't look like JSON, skip
					if (jsonBuffer === "" && !content.startsWith("{")) continue;

					// Accumulate content
					jsonBuffer += content;

					// Count braces to detect complete JSON
					for (const char of content) {
						if (char === "{" || char === "[") braceCount++;
						else if (char === "}" || char === "]") braceCount--;
					}

					// Only parse when we have a complete JSON object
					if (braceCount !== 0) continue;

					const jsonStr = jsonBuffer;
					jsonBuffer = "";
					braceCount = 0;

					try {
						const data = JSON.parse(jsonStr);

						if (data.type === "mode") {
							// Set the mode for this response
							mode = data.data === "update" ? "update" : "create";
							console.log(`📝 AI mode: ${mode}`);
						} else if (data.type === "node") {
							if (mode === "create") {
								// Create mode: collect all nodes fresh
								streamedNodes.push(data.data);
								onGraphUpdate([...streamedNodes], streamedEdges);
							} else {
								// Update mode: track nodes to merge
								nodesToMerge.push(data.data);
								// Merge with existing nodes progressively
								const mergedNodes = mergeNodes(
									currentNodes,
									nodesToMerge,
									nodeIdsToRemove,
								);
								// Preserve existing edges during progressive updates
								const progressiveEdges =
									streamedEdges.length > 0
										? streamedEdges
										: (currentEdges as Edge[]);
								onGraphUpdate(mergedNodes, progressiveEdges);
							}
							// Fit after every node
							if (onStreamComplete) {
								setTimeout(() => onStreamComplete(), 10);
							}
						} else if (data.type === "remove_node") {
							// Mark node for removal (update mode only)
							nodeIdsToRemove.add(data.data);
							const mergedNodes = mergeNodes(
								currentNodes,
								nodesToMerge,
								nodeIdsToRemove,
							);
							// Preserve existing edges when removing nodes
							const progressiveEdges =
								streamedEdges.length > 0
									? streamedEdges
									: (currentEdges as Edge[]);
							onGraphUpdate(mergedNodes, progressiveEdges);
						} else if (data.type === "edges") {
							// Normalize edge marker types to lowercase (safety net)
							const normalizedEdges = data.data.map((edge: Edge) => {
								// Check if markerEnd is an object with a type property
								const markerEnd = edge.markerEnd;
								const normalizedMarkerEnd =
									markerEnd &&
									typeof markerEnd === "object" &&
									"type" in markerEnd
										? {
												...markerEnd,
												type: markerEnd.type.toLowerCase(),
											}
										: markerEnd;

								return {
									...edge,
									markerEnd: normalizedMarkerEnd,
								};
							});

							// In UPDATE mode, preserve existing edges if AI sends empty array
							// This prevents accidental edge deletion when only updating node properties
							if (mode === "update" && normalizedEdges.length === 0) {
								console.log(
									"⚠️ UPDATE mode: AI sent empty edges, preserving existing edges",
								);
								// Don't update streamedEdges, keep using currentEdges
							} else {
								streamedEdges = normalizedEdges;
							}

							if (mode === "create") {
								onGraphUpdate([...streamedNodes], streamedEdges);
							} else {
								const mergedNodes = mergeNodes(
									currentNodes,
									nodesToMerge,
									nodeIdsToRemove,
								);
								// In update mode, use currentEdges if streamedEdges is still empty
								const finalEdges =
									streamedEdges.length > 0 ? streamedEdges : currentEdges;
								onGraphUpdate(mergedNodes, finalEdges as Edge[]);
							}
						} else if (data.type === "complete") {
							// Stream complete - trigger fitView
							console.log(
								`✅ Stream complete (mode: ${mode}, nodes: ${mode === "create" ? streamedNodes.length : nodesToMerge.length} modified)`,
							);
							if (onStreamComplete) {
								// Small delay to ensure DOM is updated
								setTimeout(() => onStreamComplete(), 50);
							}
						} else if (data.type === "error") {
							throw new Error(data.message);
						}
					} catch (_e) {
						// Skip invalid JSON
						console.warn("Failed to parse SSE data:", jsonStr);
					}
				}
			}

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "I've updated the process map based on your description.",
			};
			setMessages((prev) => [...prev, assistantMessage]);

			// Auto-name the map if it's still "Untitled" and we have nodes
			if (
				onAutoName &&
				currentMapName === "Untitled" &&
				(streamedNodes.length > 0 || nodesToMerge.length > 0)
			) {
				const allNodes = streamedNodes.length > 0 ? streamedNodes : nodesToMerge;
				const labels = allNodes
					.map((n) => String(n.data?.label || ""))
					.filter((l) => l.length > 0)
					.slice(0, 5); // Limit to first 5 labels

				if (labels.length > 0) {
					try {
						const nameResponse = await fetch("/api/generate-name", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ nodeLabels: labels }),
						});
						const nameData = await nameResponse.json();
						if (nameData.name && nameData.name !== "Untitled Process") {
							onAutoName(nameData.name);
						}
					} catch (e) {
						console.warn("Failed to auto-name map:", e);
					}
				}
			}
		} catch (error) {
			console.error(error);
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content:
					error instanceof Error
						? `Error: ${error.message}`
						: "Sorry, I encountered an error while generating the map. Please check your API key and try again.",
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="h-full flex flex-col">
			<div className="px-4 py-3 border-b">
				<h3 className="text-sm font-medium text-muted-foreground">Process Assistant</h3>
			</div>
			<div className="flex-1 flex flex-col overflow-hidden">
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.map((message) => (
						<div
							key={message.id}
							className={`flex ${
								message.role === "user" ? "justify-end" : "justify-start"
							}`}
						>
							<div
								className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
									message.role === "user"
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground"
								}`}
							>
								{message.content}
							</div>
						</div>
					))}
					{isLoading && (
						<div className="flex justify-start">
							<div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 text-sm flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								Thinking...
							</div>
						</div>
					)}
				</div>
				<div className="p-4 border-t bg-background">
					{/* Selected Nodes Chips */}
					{selectedNodeIds.length > 0 && (
						<div className="mb-3 flex flex-wrap gap-2">
							{selectedNodeIds.map((nodeId) => {
								const node = currentNodes.find((n) => n.id === nodeId);
								return node ? (
									<div
										key={nodeId}
										className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium border border-green-300 dark:border-green-700"
									>
										<span>{String(node.data.label)}</span>
									</div>
								) : null;
							})}
							<span className="text-xs text-muted-foreground self-center">
								{selectedNodeIds.length} selected
							</span>
						</div>
					)}
					<form onSubmit={handleSendMessage} className="flex gap-2 items-end">
						<Textarea
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									handleSendMessage(e);
								}
							}}
							placeholder="Describe a process..."
							className="flex-1 min-h-[60px] max-h-[120px] resize-none"
							disabled={isLoading}
							rows={2}
						/>
						<Button type="submit" size="icon" disabled={isLoading} className="shrink-0">
							<Send className="h-4 w-4" />
							<span className="sr-only">Send</span>
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
