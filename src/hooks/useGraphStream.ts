import { useCallback, useRef, useState } from "react";
import type { Edge, Node, MarkerType } from "@xyflow/react";

interface GraphStreamEvent {
	type: "mode" | "node" | "edges" | "remove_node" | "complete" | "error";
	data: unknown;
}

interface UseGraphStreamOptions {
	onNodeAdded?: (node: Node) => void;
	onEdgesSet?: (edges: Edge[]) => void;
	onNodeRemoved?: (nodeId: string) => void;
	onModeSet?: (mode: "create" | "update") => void;
	onComplete?: () => void;
	onError?: (error: string) => void;
}

interface GraphStreamState {
	isStreaming: boolean;
	mode: "create" | "update" | null;
	streamedNodes: Node[];
	streamedEdges: Edge[];
	removedNodeIds: Set<string>;
}

export function useGraphStream(options: UseGraphStreamOptions = {}) {
	const [state, setState] = useState<GraphStreamState>({
		isStreaming: false,
		mode: null,
		streamedNodes: [],
		streamedEdges: [],
		removedNodeIds: new Set(),
	});

	const abortControllerRef = useRef<AbortController | null>(null);

	const streamGraph = useCallback(
		async (prompt: string, currentGraph: { nodes: Node[]; edges: Edge[] }, selectedNodeIds: string[]) => {
			// Abort any existing stream
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			abortControllerRef.current = new AbortController();

			setState({
				isStreaming: true,
				mode: null,
				streamedNodes: [],
				streamedEdges: [],
				removedNodeIds: new Set(),
			});

			try {
				const response = await fetch("/api/generate-map", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ prompt, currentGraph, selectedNodeIds }),
					signal: abortControllerRef.current.signal,
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to generate map");
				}

				const reader = response.body?.getReader();
				if (!reader) throw new Error("No response body");

				const decoder = new TextDecoder();
				let buffer = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					buffer += decoder.decode(value, { stream: true });
					const lines = buffer.split("\n");
					buffer = lines.pop() || ""; // Keep incomplete line in buffer

					for (const line of lines) {
						if (!line.startsWith("data: ")) continue;
						const jsonStr = line.slice(6).trim();
						if (!jsonStr) continue;

						try {
							const event = JSON.parse(jsonStr) as GraphStreamEvent;

							switch (event.type) {
								case "mode":
									const mode = event.data as "create" | "update";
									setState((s) => ({ ...s, mode }));
									options.onModeSet?.(mode);
									break;

								case "node":
									const node = event.data as Node;
									setState((s) => ({
										...s,
										streamedNodes: [...s.streamedNodes, node],
									}));
									options.onNodeAdded?.(node);
									break;

								case "edges":
									const edges = (event.data as Edge[]).map((edge) => ({
										...edge,
										markerEnd:
											edge.markerEnd && typeof edge.markerEnd === "object" && "type" in edge.markerEnd
												? { ...edge.markerEnd, type: (edge.markerEnd.type as string).toLowerCase() as MarkerType }
												: edge.markerEnd,
									})) as Edge[];
									setState((s) => ({ ...s, streamedEdges: edges }));
									options.onEdgesSet?.(edges);
									break;

								case "remove_node":
									const nodeId = event.data as string;
									setState((s) => ({
										...s,
										removedNodeIds: new Set([...s.removedNodeIds, nodeId]),
									}));
									options.onNodeRemoved?.(nodeId);
									break;

								case "complete":
									options.onComplete?.();
									break;

								case "error":
									throw new Error(event.data as string);
							}
						} catch (parseError) {
							console.warn("Failed to parse SSE:", jsonStr);
						}
					}
				}
			} catch (error) {
				if ((error as Error).name !== "AbortError") {
					const message = error instanceof Error ? error.message : "Unknown error";
					options.onError?.(message);
				}
			} finally {
				setState((s) => ({ ...s, isStreaming: false }));
				abortControllerRef.current = null;
			}
		},
		[options],
	);

	const abort = useCallback(() => {
		abortControllerRef.current?.abort();
	}, []);

	return {
		...state,
		streamGraph,
		abort,
	};
}

/**
 * Merge updated nodes with existing nodes
 */
export function mergeNodes(
	existingNodes: Node[],
	updatedNodes: Node[],
	nodeIdsToRemove: Set<string>,
): Node[] {
	const updatedNodeMap = new Map(updatedNodes.map((n) => [n.id, n]));
	const mergedNodes: Node[] = [];

	for (const node of existingNodes) {
		if (nodeIdsToRemove.has(node.id)) continue;

		const updatedNode = updatedNodeMap.get(node.id);
		if (updatedNode) {
			mergedNodes.push(updatedNode);
			updatedNodeMap.delete(node.id);
		} else {
			mergedNodes.push(node);
		}
	}

	for (const node of updatedNodeMap.values()) {
		mergedNodes.push(node);
	}

	return mergedNodes;
}
