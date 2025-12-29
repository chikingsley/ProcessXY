import type { Edge, Node } from "@xyflow/react";
import { Loader2, Send } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGraphStream, mergeNodes } from "../hooks/useGraphStream";
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
			content: "Hello! I'm your process mapping assistant. Describe a process, and I'll help you map it out.",
		},
	]);
	const [inputValue, setInputValue] = useState("");

	// Track accumulated state for progressive updates
	const [streamState, setStreamState] = useState<{
		nodes: Node[];
		removedIds: Set<string>;
		edges: Edge[];
		mode: "create" | "update";
	}>({
		nodes: [],
		removedIds: new Set(),
		edges: [],
		mode: "create",
	});

	const { isStreaming, streamGraph } = useGraphStream({
		onModeSet: (mode) => {
			console.log(`📝 AI mode: ${mode}`);
			setStreamState((s) => ({ ...s, mode, nodes: [], removedIds: new Set() }));
		},

		onNodeAdded: (node) => {
			setStreamState((prev) => {
				const newNodes = [...prev.nodes, node];

				// Update graph progressively
				if (prev.mode === "create") {
					onGraphUpdate(newNodes, prev.edges);
				} else {
					const merged = mergeNodes(currentNodes, newNodes, prev.removedIds);
					const edges = prev.edges.length > 0 ? prev.edges : currentEdges;
					onGraphUpdate(merged, edges as Edge[]);
				}

				// Trigger fit after each node
				setTimeout(() => onStreamComplete?.(), 10);

				return { ...prev, nodes: newNodes };
			});
		},

		onNodeRemoved: (nodeId) => {
			setStreamState((prev) => {
				const newRemovedIds = new Set([...prev.removedIds, nodeId]);
				const merged = mergeNodes(currentNodes, prev.nodes, newRemovedIds);
				const edges = prev.edges.length > 0 ? prev.edges : currentEdges;
				onGraphUpdate(merged, edges as Edge[]);
				return { ...prev, removedIds: newRemovedIds };
			});
		},

		onEdgesSet: (edges) => {
			setStreamState((prev) => {
				// In update mode, preserve existing edges if AI sends empty array
				if (prev.mode === "update" && edges.length === 0) {
					console.log("⚠️ UPDATE mode: preserving existing edges");
					return prev;
				}

				if (prev.mode === "create") {
					onGraphUpdate(prev.nodes, edges);
				} else {
					const merged = mergeNodes(currentNodes, prev.nodes, prev.removedIds);
					onGraphUpdate(merged, edges);
				}

				return { ...prev, edges };
			});
		},

		onComplete: () => {
			console.log("✅ Stream complete");
			setTimeout(() => onStreamComplete?.(), 50);
		},

		onError: (error) => {
			setMessages((prev) => [
				...prev,
				{
					id: Date.now().toString(),
					role: "assistant",
					content: `Error: ${error}`,
				},
			]);
		},
	});

	const handleAutoName = useCallback(
		async (nodes: Node[]) => {
			if (!onAutoName || currentMapName !== "Untitled" || nodes.length === 0) return;

			const labels = nodes
				.map((n) => String(n.data?.label || ""))
				.filter((l) => l.length > 0)
				.slice(0, 5);

			if (labels.length === 0) return;

			try {
				const response = await fetch("/api/generate-name", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ nodeLabels: labels }),
				});
				const data = await response.json();
				if (data.name && data.name !== "Untitled Process") {
					onAutoName(data.name);
				}
			} catch (e) {
				console.warn("Failed to auto-name map:", e);
			}
		},
		[onAutoName, currentMapName],
	);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!inputValue.trim() || isStreaming) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: inputValue,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInputValue("");

		// Reset stream state
		setStreamState({
			nodes: [],
			removedIds: new Set(),
			edges: [],
			mode: "create",
		});

		const currentGraph: ProcessGraph = {
			nodes: currentNodes as ProcessNode[],
			edges: currentEdges as ProcessEdge[],
		};

		await streamGraph(userMessage.content, currentGraph, selectedNodeIds);

		// Add assistant message
		setMessages((prev) => [
			...prev,
			{
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "I've updated the process map based on your description.",
			},
		]);

		// Auto-name if needed
		setStreamState((s) => {
			handleAutoName(s.nodes);
			return s;
		});
	};

	return (
		<div className="h-full flex flex-col">
			<div className="px-4 py-3 border-b">
				<h3 className="text-sm font-medium text-muted-foreground">Process Assistant</h3>
			</div>
			<div className="flex-1 flex flex-col overflow-hidden">
				{/* Messages */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.map((message) => (
						<div
							key={message.id}
							className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
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
					{isStreaming && (
						<div className="flex justify-start">
							<div className="bg-muted text-muted-foreground rounded-lg px-4 py-2 text-sm flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								Thinking...
							</div>
						</div>
					)}
				</div>

				{/* Input */}
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
							disabled={isStreaming}
							rows={2}
						/>
						<Button type="submit" size="icon" disabled={isStreaming} className="shrink-0">
							<Send className="h-4 w-4" />
							<span className="sr-only">Send</span>
						</Button>
					</form>
				</div>
			</div>
		</div>
	);
}
