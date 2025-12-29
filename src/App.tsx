import {
	addEdge,
	type Connection,
	type Edge,
	type Node,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { DevControlPanel } from "./components/DevControlPanel";
import { MapsPanel } from "./components/MapsPanel";
import { ProcessMap } from "./components/ProcessMap";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	SidebarRail,
} from "./components/ui/sidebar";
import { useHistory } from "./hooks/useHistory";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePersistence } from "./hooks/usePersistence";
import { getLayoutedElements, LAYOUT_PRESETS } from "./utils/autoLayout";
import { TEST_EDGES, TEST_NODES } from "./utils/testData";
import "./index.css";

// Use main flow (nodes 1-7) as initial state for development
const initialNodes: Node[] = TEST_NODES.filter((n) => Number(n.id) <= 7);
const initialEdges: Edge[] = TEST_EDGES.filter((e) => {
	const sourceId = Number(e.source);
	const targetId = Number(e.target);
	return sourceId <= 7 && targetId <= 7;
});

export function App() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
	const [fitViewFn, setFitViewFn] = useState<(() => void) | null>(null);
	const [layoutPresetName, setLayoutPresetName] = useState<string | null>(null);
	const layoutPresetIndex = useRef(0);
	// Key to reset ChatInterface when creating a new map
	const [chatKey, setChatKey] = useState(0);

	// Persistence hook for auto-save and map management
	const persistence = usePersistence({
		autoSaveDelay: 2000,
		onLoad: (map) => {
			setNodes(map.nodes);
			setEdges(map.edges);
			setChatKey((k) => k + 1); // Reset chat when loading a different map
			setTimeout(() => fitViewFn?.(), 100);
		},
	});


	// Auto-save when nodes or edges change
	useEffect(() => {
		// Skip if no nodes (empty graph) or still loading
		if (nodes.length === 0 || persistence.isLoading) return;
		// Skip the initial default node
		const firstNode = nodes[0];
		if (
			nodes.length === 1 &&
			firstNode?.id === "1" &&
			firstNode?.data.label === "Start Process"
		)
			return;

		persistence.autoSave(nodes, edges);
	}, [nodes, edges, persistence.autoSave, persistence.isLoading]);

	// History management for undo/redo
	const history = useHistory(initialNodes, initialEdges);

	const onConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	const handleSelectionChange = useCallback(
		(params: { nodes: Node[]; edges: Edge[] }) => {
			setSelectedNodeIds(params.nodes.map((node) => node.id));
		},
		[],
	);

	// Track changes for history
	useEffect(() => {
		history.set(nodes, edges);
	}, [nodes, edges, history.set]);

	// Undo/Redo handlers
	const handleUndo = useCallback(() => {
		const previousState = history.undo();
		if (previousState) {
			setNodes(previousState.nodes);
			setEdges(previousState.edges);
		}
	}, [history, setNodes, setEdges]);

	const handleRedo = useCallback(() => {
		const nextState = history.redo();
		if (nextState) {
			setNodes(nextState.nodes);
			setEdges(nextState.edges);
		}
	}, [history, setNodes, setEdges]);

	// Delete selected nodes/edges
	const handleDelete = useCallback(() => {
		if (selectedNodeIds.length > 0) {
			setNodes((nds) =>
				nds.filter((node) => !selectedNodeIds.includes(node.id)),
			);
			setEdges((eds) =>
				eds.filter(
					(edge) =>
						!selectedNodeIds.includes(edge.source) &&
						!selectedNodeIds.includes(edge.target),
				),
			);
			setSelectedNodeIds([]);
		}
	}, [selectedNodeIds, setNodes, setEdges]);

	// Delete a specific node
	const handleDeleteNode = useCallback(
		(nodeId: string) => {
			setNodes((nds) => nds.filter((node) => node.id !== nodeId));
			setEdges((eds) =>
				eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
			);
		},
		[setNodes, setEdges],
	);

	// Duplicate a node
	const handleDuplicateNode = useCallback(
		(nodeId: string) => {
			const node = nodes.find((n) => n.id === nodeId);
			if (!node) return;

			const newNode = {
				...node,
				id: `${Date.now()}`,
				position: {
					x: node.position.x + 50,
					y: node.position.y + 50,
				},
				data: {
					...node.data,
					label: `${node.data.label} (copy)`,
				},
			};

			setNodes((nds) => [...nds, newNode]);
		},
		[nodes, setNodes],
	);

	// Update node data
	const handleUpdateNode = useCallback(
		(nodeId: string, updates: Partial<Node["data"]>) => {
			setNodes((nds) =>
				nds.map((node) =>
					node.id === nodeId
						? { ...node, data: { ...node.data, ...updates } }
						: node,
				),
			);
		},
		[setNodes],
	);

	// Auto-layout function - cycles through presets on each press
	const handleAutoLayout = useCallback(async () => {
		const preset = LAYOUT_PRESETS[layoutPresetIndex.current] ?? LAYOUT_PRESETS[0];
		const { nodes: layoutedNodes, edges: layoutedEdges, presetName } =
			await getLayoutedElements(nodes, edges, "TB", preset);
		setNodes(layoutedNodes);
		setEdges(layoutedEdges);
		setLayoutPresetName(presetName);

		// Log to console for debugging
		console.log(`Layout applied: "${presetName}" (${layoutPresetIndex.current + 1}/${LAYOUT_PRESETS.length})`);
		console.log(`  centerX: ${preset?.centerX}, verticalGap: ${preset?.verticalGap}, branchOffset: ${preset?.branchOffset}`);

		// Cycle to next preset for next press
		layoutPresetIndex.current = (layoutPresetIndex.current + 1) % LAYOUT_PRESETS.length;

		// Clear the preset name display after 2 seconds
		setTimeout(() => setLayoutPresetName(null), 2000);
		setTimeout(() => fitViewFn?.(), 50);
	}, [nodes, edges, setNodes, setEdges, fitViewFn]);

	// Load test map
	const handleLoadTestMap = useCallback(() => {
		setNodes(TEST_NODES);
		setEdges(TEST_EDGES);
		// Fit view after loading
		setTimeout(() => {
			if (fitViewFn) {
				fitViewFn();
			}
		}, 100);
	}, [setNodes, setEdges, fitViewFn]);

	// Load a test scenario (for DevControlPanel)
	const handleLoadScenario = useCallback(
		(scenarioNodes: Node[], scenarioEdges: Edge[]) => {
			setNodes(scenarioNodes);
			setEdges(scenarioEdges);
			setTimeout(() => fitViewFn?.(), 100);
		},
		[setNodes, setEdges, fitViewFn],
	);

	// Clear map (for DevControlPanel)
	const handleClearMap = useCallback(() => {
		setNodes([]);
		setEdges([]);
	}, [setNodes, setEdges]);

	// Export JSON (for DevControlPanel)
	const handleExportJson = useCallback(() => {
		const data = { nodes, edges };
		const json = JSON.stringify(data, null, 2);
		navigator.clipboard.writeText(json);
		console.log("Exported to clipboard:", data);
		alert("JSON copied to clipboard!");
	}, [nodes, edges]);

	// Show positions in console (for DevControlPanel)
	const handleShowPositions = useCallback(() => {
		console.log("\n=== CURRENT NODE POSITIONS ===");
		for (const node of nodes) {
			const visualCenterX = node.position.x + (node.type === "diamond" || node.type === "oval" ? 80 : 75);
			console.log(
				`${node.id}: "${node.data.label}" - ` +
				`x=${Math.round(node.position.x)}, y=${Math.round(node.position.y)}, ` +
				`visualCenter=${Math.round(visualCenterX)}`
			);
		}
		console.log("=== END POSITIONS ===\n");
	}, [nodes]);

	// Keyboard shortcuts
	const shortcuts = useMemo(
		() => [
			{
				key: "z",
				ctrlKey: true,
				handler: handleUndo,
				description: "Undo",
			},
			{
				key: "z",
				metaKey: true,
				handler: handleUndo,
				description: "Undo (Mac)",
			},
			{
				key: "y",
				ctrlKey: true,
				handler: handleRedo,
				description: "Redo",
			},
			{
				key: "z",
				ctrlKey: true,
				shiftKey: true,
				handler: handleRedo,
				description: "Redo (Alt)",
			},
			{
				key: "z",
				metaKey: true,
				shiftKey: true,
				handler: handleRedo,
				description: "Redo (Mac)",
			},
			{
				key: "Delete",
				handler: handleDelete,
				description: "Delete selected nodes",
			},
			{
				key: "Backspace",
				handler: handleDelete,
				description: "Delete selected nodes (Mac)",
			},
			{
				key: "l",
				ctrlKey: true,
				handler: handleAutoLayout,
				description: "Auto-layout nodes",
			},
			{
				key: "l",
				metaKey: true,
				handler: handleAutoLayout,
				description: "Auto-layout nodes (Mac)",
			},
		],
		[handleUndo, handleRedo, handleDelete, handleAutoLayout],
	);

	useKeyboardShortcuts(shortcuts);

	// Handler to create a new empty map
	const handleNewMap = useCallback(() => {
		persistence.createNewMap();
		setNodes([]); // Start with blank canvas
		setEdges([]);
		setChatKey((k) => k + 1); // Reset chat interface
	}, [persistence.createNewMap, setNodes, setEdges]);

	// Handler to manually save
	const handleSaveNow = useCallback(() => {
		persistence.saveMap(nodes, edges);
	}, [persistence.saveMap, nodes, edges]);

	return (
		<SidebarProvider defaultOpen={true}>
			{/* Layout preset indicator */}
			{layoutPresetName && (
				<div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
					Layout: {layoutPresetName} ({layoutPresetIndex.current}/{LAYOUT_PRESETS.length})
				</div>
			)}

			{/* Dev Control Panel */}
			<DevControlPanel
				onLoadScenario={handleLoadScenario}
				onClearMap={handleClearMap}
				onAutoLayout={handleAutoLayout}
				onExportJson={handleExportJson}
				onShowPositions={handleShowPositions}
				currentNodeCount={nodes.length}
				currentEdgeCount={edges.length}
				currentNodes={nodes}
			/>

			<Sidebar className="border-r">
				<SidebarHeader className="border-b px-3 py-2">
					<MapsPanel
						currentMapName={persistence.currentMapName}
						maps={persistence.maps}
						isSaving={persistence.isSaving}
						lastSaved={persistence.lastSaved}
						onLoadMap={persistence.loadMap}
						onNewMap={handleNewMap}
						onDeleteMap={persistence.deleteMapById}
						onRename={persistence.renameMap}
						onSaveNow={handleSaveNow}
					/>
				</SidebarHeader>
				<SidebarContent className="p-0">
					<ChatInterface
						key={chatKey}
						currentNodes={nodes}
						currentEdges={edges}
						selectedNodeIds={selectedNodeIds}
						onGraphUpdate={(newNodes, newEdges) => {
							setNodes(newNodes);
							setEdges(newEdges);
						}}
						onStreamComplete={() => {
							if (fitViewFn) {
								fitViewFn();
							}
						}}
						onAutoName={persistence.renameMap}
						currentMapName={persistence.currentMapName}
					/>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>

			<SidebarInset className="h-screen">
				<ProcessMap
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onSelectionChange={handleSelectionChange}
					onDeleteNode={handleDeleteNode}
					onDuplicateNode={handleDuplicateNode}
					onUpdateNode={handleUpdateNode}
					onAutoLayout={handleAutoLayout}
					onFitViewReady={(fn) => setFitViewFn(() => fn)}
					onLoadTestMap={handleLoadTestMap}
				/>
			</SidebarInset>
		</SidebarProvider>
	);
}

export default App;
