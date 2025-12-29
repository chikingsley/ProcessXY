import type { Edge, Node } from "@xyflow/react";

// Node dimensions by type (MUST match actual rendered CSS sizes!)
// DiamondNode.tsx: width: "160px", height: "160px"
// OvalNode.tsx: min-w-[160px] with px-8 py-4
// RectangleNode.tsx: min-w-[150px] with px-4 py-3
const NODE_WIDTHS: Record<string, number> = {
	default: 150,  // RectangleNode min-w-[150px]
	diamond: 160,  // DiamondNode width: 160px
	oval: 160,     // OvalNode min-w-[160px]
};

const NODE_HEIGHTS: Record<string, number> = {
	default: 50,
	diamond: 160,  // DiamondNode height: 160px
	oval: 45,
};

function getNodeWidth(type?: string): number {
	return NODE_WIDTHS[type || "default"] ?? 180;
}

function getNodeHeight(type?: string): number {
	return NODE_HEIGHTS[type || "default"] ?? 50;
}

// Layout parameter presets for iteration/debugging
export interface LayoutParams {
	name: string;
	centerX: number;
	verticalGap: number; // Gap between bottom of one node and top of next
	branchOffset: number;
	subgraphGap: number;
}

// Single preset for debugging
export const LAYOUT_PRESETS: LayoutParams[] = [
	{ name: "Default", centerX: 300, verticalGap: 60, branchOffset: 200, subgraphGap: 300 },
];

// Default layout constants (used when no params provided)
const CENTER_X = 300; // Center of first subgraph
const BRANCH_OFFSET = 200;
const SUBGRAPH_GAP = 150; // Gap between disconnected subgraphs
const VERTICAL_GAP = 60; // Minimum gap between bottom of one node and top of next

/**
 * Centered-spine layout for process maps
 * - Handles disconnected subgraphs (layouts each separately)
 * - Main path forms vertical center axis
 * - Decision branches spread symmetrically
 * - Loop-back edges don't affect positioning
 */
export async function getLayoutedElements(
	nodes: Node[],
	edges: Edge[],
	_direction: "TB" | "LR" = "TB",
	params?: LayoutParams,
): Promise<{ nodes: Node[]; edges: Edge[]; presetName: string }> {
	// Use provided params or defaults
	const centerX = params?.centerX ?? CENTER_X;
	const verticalGap = params?.verticalGap ?? VERTICAL_GAP;
	const branchOffset = params?.branchOffset ?? BRANCH_OFFSET;
	const subgraphGap = params?.subgraphGap ?? SUBGRAPH_GAP;
	const presetName = params?.name ?? "Default";

	if (nodes.length === 0) {
		return { nodes: [], edges: [], presetName };
	}

	// Build adjacency map (excluding loop-back edges)
	const forwardEdges = edges.filter(
		(e) => e.type !== "selfConnecting" && !isLoopBack(e, nodes),
	);

	// Build parent/children relationships
	const childrenOf = new Map<string, string[]>();
	const parentOf = new Map<string, string[]>();

	for (const edge of forwardEdges) {
		const children = childrenOf.get(edge.source) || [];
		children.push(edge.target);
		childrenOf.set(edge.source, children);

		const parents = parentOf.get(edge.target) || [];
		parents.push(edge.source);
		parentOf.set(edge.target, parents);
	}

	// Find all disconnected subgraphs
	const subgraphs = findSubgraphs(nodes, forwardEdges);

	// Layout each subgraph independently
	// First subgraph starts at centerX, subsequent ones are placed to the right
	let nextSubgraphStart = centerX + 300; // Start position for second subgraph
	const allLayoutedNodes: Node[] = [];
	let isFirst = true;

	for (const subgraphNodeIds of subgraphs) {
		const subgraphNodes = nodes.filter((n) => subgraphNodeIds.has(n.id));
		const subgraphEdges = forwardEdges.filter(
			(e) => subgraphNodeIds.has(e.source) && subgraphNodeIds.has(e.target),
		);

		// First subgraph is centered at centerX, others are placed after
		const subgraphCenterX = isFirst ? centerX : nextSubgraphStart + 200;

		const { layoutedNodes, width } = layoutSubgraph(
			subgraphNodes,
			subgraphEdges,
			childrenOf,
			parentOf,
			subgraphCenterX,
			verticalGap,
			branchOffset,
		);

		allLayoutedNodes.push(...layoutedNodes);

		if (isFirst) {
			isFirst = false;
		} else {
			nextSubgraphStart += width + subgraphGap;
		}
	}

	return { nodes: allLayoutedNodes, edges, presetName };
}

/**
 * Find disconnected subgraphs using Union-Find
 */
function findSubgraphs(nodes: Node[], edges: Edge[]): Set<string>[] {
	const parent = new Map<string, string>();

	// Initialize each node as its own parent
	for (const node of nodes) {
		parent.set(node.id, node.id);
	}

	// Find root of a node
	function find(id: string): string {
		if (parent.get(id) !== id) {
			parent.set(id, find(parent.get(id)!));
		}
		return parent.get(id)!;
	}

	// Union two nodes
	function union(a: string, b: string) {
		const rootA = find(a);
		const rootB = find(b);
		if (rootA !== rootB) {
			parent.set(rootA, rootB);
		}
	}

	// Union nodes connected by edges
	for (const edge of edges) {
		union(edge.source, edge.target);
	}

	// Group nodes by their root
	const groups = new Map<string, Set<string>>();
	for (const node of nodes) {
		const root = find(node.id);
		if (!groups.has(root)) {
			groups.set(root, new Set());
		}
		groups.get(root)!.add(node.id);
	}

	return Array.from(groups.values());
}

/**
 * Layout a single connected subgraph
 */
function layoutSubgraph(
	nodes: Node[],
	edges: Edge[],
	childrenOf: Map<string, string[]>,
	parentOf: Map<string, string[]>,
	startX: number,
	verticalGap: number = VERTICAL_GAP,
	branchOffset: number = BRANCH_OFFSET,
): { layoutedNodes: Node[]; width: number } {
	if (nodes.length === 0) {
		return { layoutedNodes: [], width: 0 };
	}

	// Find start node (no incoming edges within this subgraph)
	const subgraphIds = new Set(nodes.map((n) => n.id));
	const allTargets = new Set(edges.map((e) => e.target));
	const startNode = nodes.find((n) => !allTargets.has(n.id));

	if (!startNode) {
		// Fallback: just return original positions shifted
		return {
			layoutedNodes: nodes.map((n) => ({
				...n,
				position: { x: n.position.x + startX, y: n.position.y },
			})),
			width: 400,
		};
	}

	// Assign levels using BFS
	const nodeLevel = new Map<string, number>();
	const queue: { id: string; level: number }[] = [{ id: startNode.id, level: 0 }];
	const visited = new Set<string>();

	while (queue.length > 0) {
		const { id, level } = queue.shift()!;
		if (visited.has(id)) continue;
		visited.add(id);

		nodeLevel.set(id, Math.max(nodeLevel.get(id) ?? 0, level));

		const children = (childrenOf.get(id) || []).filter((c) => subgraphIds.has(c));
		for (const childId of children) {
			if (!visited.has(childId)) {
				queue.push({ id: childId, level: level + 1 });
			}
		}
	}

	// Group nodes by level
	const levelNodes = new Map<number, Node[]>();
	for (const node of nodes) {
		const level = nodeLevel.get(node.id) ?? 0;
		const nodesAtLevel = levelNodes.get(level) || [];
		nodesAtLevel.push(node);
		levelNodes.set(level, nodesAtLevel);
	}

	// Calculate subgraph width based on max nodes at any level
	let maxNodesAtLevel = 1;
	for (const nodesAtLevel of levelNodes.values()) {
		maxNodesAtLevel = Math.max(maxNodesAtLevel, nodesAtLevel.length);
	}
	const subgraphWidth = Math.max(400, (maxNodesAtLevel - 1) * branchOffset + 200);
	// Use startX directly as the center point (it's passed as the desired center)
	const centerX = startX;

	// Calculate Y positions based on cumulative heights (accounts for tall diamond nodes)
	// This ensures proper spacing after decision nodes (diamonds are 160px tall)
	const maxLevel = Math.max(...Array.from(nodeLevel.values()));
	const levelY = new Map<number, number>();
	let currentY = 0;

	for (let level = 0; level <= maxLevel; level++) {
		levelY.set(level, currentY);

		// Find the tallest node at this level to determine spacing to next level
		const nodesAtThisLevel = levelNodes.get(level) || [];
		let maxHeightAtLevel = 0;
		for (const node of nodesAtThisLevel) {
			const height = getNodeHeight(node.type);
			maxHeightAtLevel = Math.max(maxHeightAtLevel, height);
		}

		// Next level starts after: current node height + vertical gap
		currentY += maxHeightAtLevel + verticalGap;
	}

	// Position nodes
	console.log("\n=== LAYOUT DEBUG ===");
	console.log(`centerX = ${centerX}`);
	console.log(`branchOffset = ${branchOffset}`);
	console.log(`VERTICAL_GAP = ${VERTICAL_GAP}`);
	console.log("Level Y positions:", Object.fromEntries(levelY));
	console.log("");

	// First pass: calculate positions, tracking node X positions for parent lookup
	const nodePositions = new Map<string, number>(); // nodeId -> visualCenterX

	const layoutedNodes = nodes.map((node) => {
		const level = nodeLevel.get(node.id) ?? 0;
		const nodesAtLevel = levelNodes.get(level) || [node];
		const nodeIndex = nodesAtLevel.indexOf(node);
		const nodeCount = nodesAtLevel.length;
		const nodeWidth = getNodeWidth(node.type);

		let x: number;
		let visualCenterX: number;

		if (nodeCount === 1) {
			// Single node at level - check if it should align with parent branch
			const parents = parentOf.get(node.id) || [];
			const parentInSubgraph = parents.filter((p) => subgraphIds.has(p));

			if (parentInSubgraph.length === 1) {
				// Single parent - align with parent's X position
				const parentId = parentInSubgraph[0]!;
				const parentX = nodePositions.get(parentId);
				if (parentX !== undefined && Math.abs(parentX - centerX) > 50) {
					// Parent is off-center (part of a branch) - align under parent
					visualCenterX = parentX;
					x = visualCenterX - nodeWidth / 2;
				} else {
					// Parent is centered - stay centered
					x = centerX - nodeWidth / 2;
					visualCenterX = centerX;
				}
			} else if (parentInSubgraph.length > 1) {
				// Multiple parents (merge point) - center between them
				const parentXs = parentInSubgraph
					.map((p) => nodePositions.get(p))
					.filter((px): px is number => px !== undefined);
				if (parentXs.length > 0) {
					visualCenterX = parentXs.reduce((a, b) => a + b, 0) / parentXs.length;
					x = visualCenterX - nodeWidth / 2;
				} else {
					x = centerX - nodeWidth / 2;
					visualCenterX = centerX;
				}
			} else {
				// No parents (root node) - center
				x = centerX - nodeWidth / 2;
				visualCenterX = centerX;
			}
		} else if (nodeCount === 2) {
			// Two branch nodes - place symmetrically at centerX ± branchOffset
			if (nodeIndex === 0) {
				x = centerX - branchOffset - nodeWidth / 2;
			} else {
				x = centerX + branchOffset - nodeWidth / 2;
			}
			visualCenterX = x + nodeWidth / 2;
		} else {
			// 3+ branch nodes - spread evenly around center
			const totalSpan = (nodeCount - 1) * branchOffset;
			const levelStartX = centerX - totalSpan / 2;
			x = levelStartX + nodeIndex * branchOffset - nodeWidth / 2;
			visualCenterX = x + nodeWidth / 2;
		}

		// Store position for child nodes to reference
		nodePositions.set(node.id, visualCenterX);

		const y = levelY.get(level) ?? 0;

		console.log(
			`Node ${node.id} "${node.data.label}": ` +
			`type=${node.type}, height=${getNodeHeight(node.type)}, ` +
			`position.x=${x}, visualCenter=${visualCenterX}, y=${y}`
		);

		return {
			...node,
			position: { x, y },
		};
	});

	console.log("=== END DEBUG ===\n");

	return { layoutedNodes, width: subgraphWidth };
}

/**
 * Check if an edge is a loop-back (target comes before source in typical flow)
 */
function isLoopBack(edge: Edge, nodes: Node[]): boolean {
	const sourceNode = nodes.find((n) => n.id === edge.source);
	const targetNode = nodes.find((n) => n.id === edge.target);
	if (!sourceNode || !targetNode) return false;

	// If target is positioned above source, it's a loop-back
	return targetNode.position.y < sourceNode.position.y;
}
