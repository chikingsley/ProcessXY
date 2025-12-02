import type { Edge, Node } from "@xyflow/react";
import { useState } from "react";
import { TEST_EDGES, TEST_NODES } from "../utils/testData";

// Test scenarios for quick loading
interface TestScenario {
	name: string;
	description: string;
	nodes: Node[];
	edges: Edge[];
}

// Layout constants
const VERTICAL_GAP = 60;
const OVAL_H = 45;
const RECT_H = 50;
const DIAMOND_H = 160;

// Simple 2-node flow
const simpleFlow: TestScenario = {
	name: "Simple Flow",
	description: "Start -> End (2 nodes)",
	nodes: [
		{ id: "1", type: "oval", position: { x: 220, y: 0 }, data: { label: "Start", status: "normal" } },
		{ id: "2", type: "oval", position: { x: 220, y: OVAL_H + VERTICAL_GAP }, data: { label: "End", status: "normal" } },
	],
	edges: [
		{ id: "e1-2", source: "1", target: "2", type: "straight", style: { strokeWidth: 2, stroke: "#64748b" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" } },
	],
};

// Linear 4-step process (no decisions)
const linearFlow: TestScenario = {
	name: "Linear Process",
	description: "4 sequential steps",
	nodes: [
		{ id: "1", type: "oval", position: { x: 220, y: 0 }, data: { label: "Start", status: "normal" } },
		{ id: "2", type: "default", position: { x: 225, y: OVAL_H + VERTICAL_GAP }, data: { label: "Step 1", status: "normal" } },
		{ id: "3", type: "default", position: { x: 225, y: OVAL_H + VERTICAL_GAP + RECT_H + VERTICAL_GAP }, data: { label: "Step 2", status: "normal" } },
		{ id: "4", type: "oval", position: { x: 220, y: OVAL_H + VERTICAL_GAP + RECT_H + VERTICAL_GAP + RECT_H + VERTICAL_GAP }, data: { label: "End", status: "normal" } },
	],
	edges: [
		{ id: "e1-2", source: "1", target: "2", type: "straight", style: { strokeWidth: 2, stroke: "#64748b" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" } },
		{ id: "e2-3", source: "2", target: "3", type: "straight", style: { strokeWidth: 2, stroke: "#64748b" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" } },
		{ id: "e3-4", source: "3", target: "4", type: "straight", style: { strokeWidth: 2, stroke: "#64748b" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" } },
	],
};

// Single decision with 2 branches - Y positions: 0, 105, 325, 435
const singleDecision: TestScenario = {
	name: "Single Decision",
	description: "One Yes/No decision point",
	nodes: [
		{ id: "1", type: "oval", position: { x: 220, y: 0 }, data: { label: "Start", status: "normal" } },
		{ id: "2", type: "diamond", position: { x: 220, y: OVAL_H + VERTICAL_GAP }, data: { label: "Approved?", status: "normal", outputCount: 2 } },
		{ id: "3", type: "default", position: { x: 25, y: OVAL_H + VERTICAL_GAP + DIAMOND_H + VERTICAL_GAP }, data: { label: "Reject", status: "issue" } },
		{ id: "4", type: "default", position: { x: 425, y: OVAL_H + VERTICAL_GAP + DIAMOND_H + VERTICAL_GAP }, data: { label: "Approve", status: "complete" } },
		{ id: "5", type: "oval", position: { x: 220, y: OVAL_H + VERTICAL_GAP + DIAMOND_H + VERTICAL_GAP + RECT_H + VERTICAL_GAP }, data: { label: "End", status: "normal" } },
	],
	edges: [
		{ id: "e1-2", source: "1", target: "2", type: "straight", style: { strokeWidth: 2, stroke: "#64748b" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" } },
		{ id: "e2-3", source: "2", sourceHandle: "left", target: "3", type: "bezier", label: "No", labelStyle: { fill: "#ef4444", fontWeight: 600 }, style: { strokeWidth: 2, stroke: "#ef4444" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#ef4444" } },
		{ id: "e2-4", source: "2", sourceHandle: "right", target: "4", type: "bezier", label: "Yes", labelStyle: { fill: "#22c55e", fontWeight: 600 }, style: { strokeWidth: 2, stroke: "#22c55e" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#22c55e" } },
		{ id: "e3-5", source: "3", target: "5", type: "bezier", style: { strokeWidth: 2, stroke: "#64748b" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" } },
		{ id: "e4-5", source: "4", target: "5", type: "bezier", style: { strokeWidth: 2, stroke: "#64748b" }, markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" } },
	],
};

// Main flow only (nodes 1-7 from testData.ts)
const mainFlowScenario: TestScenario = {
	name: "Main Flow",
	description: "7-node flow with decision & loop",
	nodes: TEST_NODES.filter((n) => Number(n.id) <= 7),
	edges: TEST_EDGES.filter((e) => {
		const sourceId = Number(e.source);
		const targetId = Number(e.target);
		return sourceId <= 7 && targetId <= 7;
	}),
};

// Main flow without the loop edge (to test if selfConnecting edge causes selection issue)
const mainFlowNoLoop: TestScenario = {
	name: "Main Flow (No Loop)",
	description: "7-node flow without loop edge",
	nodes: TEST_NODES.filter((n) => Number(n.id) <= 7),
	edges: TEST_EDGES.filter((e) => {
		const sourceId = Number(e.source);
		const targetId = Number(e.target);
		return sourceId <= 7 && targetId <= 7 && e.id !== "e4-2";
	}),
};

// Full test scenario (from testData.ts) - includes 3 separate subgraphs
const fullTestScenario: TestScenario = {
	name: "Full Test",
	description: "3 subgraphs (may have selection issues)",
	nodes: TEST_NODES,
	edges: TEST_EDGES,
};

const TEST_SCENARIOS: TestScenario[] = [
	simpleFlow,
	linearFlow,
	singleDecision,
	mainFlowNoLoop,
	mainFlowScenario,
	fullTestScenario,
];

interface DevControlPanelProps {
	onLoadScenario: (nodes: Node[], edges: Edge[]) => void;
	onClearMap: () => void;
	onAutoLayout: () => void;
	onExportJson: () => void;
	onShowPositions: () => void;
	currentNodeCount: number;
	currentEdgeCount: number;
	currentNodes: Node[];
}

export function DevControlPanel({
	onLoadScenario,
	onClearMap,
	onAutoLayout,
	onExportJson,
	onShowPositions,
	currentNodeCount,
	currentEdgeCount,
	currentNodes,
}: DevControlPanelProps) {
	const [isExpanded, setIsExpanded] = useState(true); // Start expanded for dev
	const [selectedScenario, setSelectedScenario] = useState<string | null>("Main Flow");
	const [showPositions, setShowPositions] = useState(false);

	const handleLoadScenario = (scenario: TestScenario) => {
		setSelectedScenario(scenario.name);
		onLoadScenario(scenario.nodes, scenario.edges);
	};

	return (
		<div className="absolute bottom-4 right-4 z-50">
			{/* Collapsed state - just a button */}
			{!isExpanded && (
				<button
					type="button"
					onClick={() => setIsExpanded(true)}
					className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-colors"
				>
					<span className="text-lg">🛠️</span>
					<span>Dev Tools</span>
				</button>
			)}

			{/* Expanded panel */}
			{isExpanded && (
				<div className="bg-slate-800 text-white rounded-lg shadow-xl w-72 overflow-hidden">
					{/* Header */}
					<div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-700">
						<span className="font-medium text-sm flex items-center gap-2">
							<span>🛠️</span> Dev Control Panel
						</span>
						<button
							type="button"
							onClick={() => setIsExpanded(false)}
							className="text-slate-400 hover:text-white transition-colors"
						>
							✕
						</button>
					</div>

					{/* Stats */}
					<div className="px-3 py-2 bg-slate-900/50 border-b border-slate-700 text-xs">
						<div className="flex justify-between">
							<span className="text-slate-400">Nodes:</span>
							<span className="font-mono">{currentNodeCount}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-slate-400">Edges:</span>
							<span className="font-mono">{currentEdgeCount}</span>
						</div>
					</div>

					{/* Test Scenarios */}
					<div className="p-3 border-b border-slate-700">
						<div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">
							Test Scenarios
						</div>
						<div className="space-y-1">
							{TEST_SCENARIOS.map((scenario) => (
								<button
									key={scenario.name}
									type="button"
									onClick={() => handleLoadScenario(scenario)}
									className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
										selectedScenario === scenario.name
											? "bg-blue-600 text-white"
											: "bg-slate-700 hover:bg-slate-600 text-slate-200"
									}`}
								>
									<div className="font-medium">{scenario.name}</div>
									<div className="text-xs text-slate-400">
										{scenario.description}
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Actions */}
					<div className="p-3 space-y-2">
						<div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">
							Actions
						</div>
						<div className="grid grid-cols-2 gap-2">
							<button
								type="button"
								onClick={onAutoLayout}
								className="bg-slate-700 hover:bg-slate-600 px-2 py-1.5 rounded text-sm transition-colors"
							>
								📐 Layout
							</button>
							<button
								type="button"
								onClick={onClearMap}
								className="bg-slate-700 hover:bg-slate-600 px-2 py-1.5 rounded text-sm transition-colors"
							>
								🗑️ Clear
							</button>
							<button
								type="button"
								onClick={() => setShowPositions(!showPositions)}
								className={`px-2 py-1.5 rounded text-sm transition-colors ${
									showPositions ? "bg-blue-600" : "bg-slate-700 hover:bg-slate-600"
								}`}
							>
								📍 Positions
							</button>
							<button
								type="button"
								onClick={onExportJson}
								className="bg-slate-700 hover:bg-slate-600 px-2 py-1.5 rounded text-sm transition-colors"
							>
								📋 Export
							</button>
						</div>
					</div>

					{/* Live Positions Display */}
					{showPositions && (
						<div className="p-3 border-t border-slate-700 max-h-48 overflow-y-auto">
							<div className="text-xs text-slate-400 mb-2 uppercase tracking-wider">
								Node Positions (live)
							</div>
							<div className="space-y-1 font-mono text-xs">
								{currentNodes.map((node) => (
									<div key={node.id} className="flex justify-between text-slate-300">
										<span className="truncate max-w-[120px]" title={String(node.data.label)}>
											{node.id}: {String(node.data.label).slice(0, 12)}
										</span>
										<span className="text-slate-500">
											({Math.round(node.position.x)}, {Math.round(node.position.y)})
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Keyboard shortcuts */}
					<div className="px-3 py-2 bg-slate-900/50 text-xs text-slate-500">
						<div className="flex justify-between">
							<span>Auto-layout:</span>
							<kbd className="bg-slate-700 px-1 rounded">⌘L</kbd>
						</div>
						<div className="flex justify-between">
							<span>Undo:</span>
							<kbd className="bg-slate-700 px-1 rounded">⌘Z</kbd>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
