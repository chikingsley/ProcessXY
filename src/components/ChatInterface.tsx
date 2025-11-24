import type { Edge, Node } from "@xyflow/react";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ProcessEdge, ProcessGraph, ProcessNode } from "../types/process";

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
}

export function ChatInterface({
	currentNodes,
	currentEdges,
	selectedNodeIds,
	onGraphUpdate,
	onStreamComplete,
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

			const streamedNodes: Node[] = [];
			let streamedEdges: Edge[] = [];

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				const lines = chunk.split("\n");

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						const jsonStr = line.slice(6); // Remove 'data: ' prefix
						try {
							const data = JSON.parse(jsonStr);

							if (data.type === "node") {
								// Add node progressively
								streamedNodes.push(data.data);
								onGraphUpdate([...streamedNodes], streamedEdges);
								// Option A: Fit after every node
								if (onStreamComplete) {
									setTimeout(() => onStreamComplete(), 10);
								}
							} else if (data.type === "edges") {
								// Normalize edge marker types (ArrowClosed → arrowclosed)
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
								streamedEdges = normalizedEdges;
								onGraphUpdate([...streamedNodes], streamedEdges);
							} else if (data.type === "complete") {
								// Stream complete - trigger fitView
								console.log("Stream complete");
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
			}

			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "I've updated the process map based on your description.",
			};
			setMessages((prev) => [...prev, assistantMessage]);
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
		<Card className="h-full flex flex-col rounded-none border-none shadow-none">
			<CardHeader className="p-4 border-b">
				<CardTitle className="text-lg">Process Assistant</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
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
					<form onSubmit={handleSendMessage} className="flex gap-2">
						<Input
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							placeholder="Type a message..."
							className="flex-1"
							disabled={isLoading}
						/>
						<Button type="submit" size="icon" disabled={isLoading}>
							<Send className="h-4 w-4" />
							<span className="sr-only">Send</span>
						</Button>
					</form>
				</div>
			</CardContent>
		</Card>
	);
}
