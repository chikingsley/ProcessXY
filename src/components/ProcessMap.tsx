import {
	Background,
	BackgroundVariant,
	BezierEdge,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	type NodeMouseHandler,
	type OnConnect,
	type OnEdgesChange,
	type OnNodesChange,
	type OnSelectionChangeParams,
	ReactFlow,
	type ReactFlowInstance,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import type { NodeStatus, ProcessNode } from "../types/process";
import { ContextMenu } from "./ContextMenu";
import { FloatingEdge } from "./edges/FloatingEdge";
import { SelfConnectingEdge } from "./edges/SelfConnectingEdge";
import { DiamondNode } from "./nodes/DiamondNode";
import { OvalNode } from "./nodes/OvalNode";
import { RectangleNode } from "./nodes/RectangleNode";
import { TooltipProvider } from "./ui/tooltip";

const nodeTypes = {
	default: RectangleNode,
	oval: OvalNode,
	diamond: DiamondNode,
};

const edgeTypes = {
	bezier: BezierEdge, // Alias for compatibility - React Flow v12 doesn't have "bezier" by default
	floating: FloatingEdge,
	selfConnecting: SelfConnectingEdge,
};

interface ProcessMapProps {
	nodes: Node[];
	edges: Edge[];
	onNodesChange: OnNodesChange;
	onEdgesChange: OnEdgesChange;
	onConnect: OnConnect;
	onSelectionChange: (params: OnSelectionChangeParams) => void;
	onDeleteNode?: (nodeId: string) => void;
	onDuplicateNode?: (nodeId: string) => void;
	onUpdateNode?: (
		nodeId: string,
		updates: Partial<ProcessNode["data"]>,
	) => void;
	onAutoLayout?: () => void;
	onFitViewReady?: (fitViewFn: () => void) => void;
	onLoadTestMap?: () => void;
}

export function ProcessMap({
	nodes,
	edges,
	onNodesChange,
	onEdgesChange,
	onConnect,
	onSelectionChange,
	onDeleteNode,
	onDuplicateNode,
	onUpdateNode,
	onAutoLayout,
	onFitViewReady,
	onLoadTestMap,
}: ProcessMapProps) {
	// Memoize nodeTypes and edgeTypes to prevent recreation on every render
	const memoizedNodeTypes = useMemo(() => nodeTypes, []);
	const memoizedEdgeTypes = useMemo(() => edgeTypes, []);

	// Context menu state
	const [contextMenu, setContextMenu] = useState<{
		nodeId: string;
		x: number;
		y: number;
	} | null>(null);

	// Handle right-click on node
	const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
		event.preventDefault();
		setContextMenu({
			nodeId: node.id,
			x: event.clientX,
			y: event.clientY,
		});
	}, []);

	// Close context menu
	const closeContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	// Context menu handlers
	const handleDelete = useCallback(() => {
		if (contextMenu && onDeleteNode) {
			onDeleteNode(contextMenu.nodeId);
		}
	}, [contextMenu, onDeleteNode]);

	const handleDuplicate = useCallback(() => {
		if (contextMenu && onDuplicateNode) {
			onDuplicateNode(contextMenu.nodeId);
		}
	}, [contextMenu, onDuplicateNode]);

	const handleChangeStatus = useCallback(
		(status: NodeStatus) => {
			if (contextMenu && onUpdateNode) {
				onUpdateNode(contextMenu.nodeId, { status });
			}
		},
		[contextMenu, onUpdateNode],
	);

	const handleChangeColor = useCallback(
		(color: string) => {
			if (contextMenu && onUpdateNode) {
				onUpdateNode(contextMenu.nodeId, { color });
			}
		},
		[contextMenu, onUpdateNode],
	);

	// Handle React Flow initialization
	const handleInit = useCallback(
		(instance: ReactFlowInstance) => {
			if (onFitViewReady) {
				onFitViewReady(() => {
					instance.fitView({ duration: 800, padding: 0.15 });
				});
			}
		},
		[onFitViewReady],
	);

	return (
		<TooltipProvider delayDuration={300}>
			<div className="h-full w-full bg-background">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onSelectionChange={onSelectionChange}
					onNodeContextMenu={onNodeContextMenu}
					nodeTypes={memoizedNodeTypes}
					edgeTypes={memoizedEdgeTypes}
					onInit={handleInit}
					defaultEdgeOptions={{
						type: "bezier",
						style: {
							strokeWidth: 2,
							stroke: "#64748b",
						},
						markerEnd: {
							type: "arrowclosed",
							width: 25,
							height: 25,
							color: "#64748b",
						},
					}}
					fitView
				>
					<Controls>
						{onAutoLayout && (
							<button
								type="button"
								onClick={onAutoLayout}
								className="react-flow__controls-button"
								title="Auto-layout (Ctrl+L)"
								aria-label="Auto-layout nodes"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									role="img"
									aria-label="Auto-layout icon"
								>
									<title>Auto-layout</title>
									<rect x="3" y="3" width="18" height="18" rx="2" />
									<path d="M9 3v18" />
									<path d="M15 3v18" />
									<path d="M3 9h18" />
									<path d="M3 15h18" />
								</svg>
							</button>
						)}
						{onLoadTestMap && (
							<button
								type="button"
								onClick={onLoadTestMap}
								className="react-flow__controls-button"
								title="Load Test Map"
								aria-label="Load test process map"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									role="img"
									aria-label="Load test map icon"
								>
									<title>Load Test Map</title>
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
									<polyline points="14 2 14 8 20 8" />
									<line x1="12" y1="18" x2="12" y2="12" />
									<line x1="9" y1="15" x2="15" y2="15" />
								</svg>
							</button>
						)}
					</Controls>
					<MiniMap />
					<Background variant={BackgroundVariant.Dots} gap={12} size={1} />
				</ReactFlow>

				{contextMenu && (
					<ContextMenu
						x={contextMenu.x}
						y={contextMenu.y}
						onClose={closeContextMenu}
						onDelete={onDeleteNode ? handleDelete : undefined}
						onDuplicate={onDuplicateNode ? handleDuplicate : undefined}
						onChangeStatus={onUpdateNode ? handleChangeStatus : undefined}
						onChangeColor={onUpdateNode ? handleChangeColor : undefined}
					/>
				)}
			</div>
		</TooltipProvider>
	);
}
