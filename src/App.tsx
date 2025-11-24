import { useState, useCallback, useEffect, useMemo } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { ProcessMap } from "./components/ProcessMap";
import { useNodesState, useEdgesState, addEdge, type Connection, type Edge, type Node } from "@xyflow/react";
import { useHistory } from "./hooks/useHistory";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { getLayoutedElements } from "./utils/autoLayout";
import { TEST_NODES, TEST_EDGES } from "./utils/testData";
import "./index.css";

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 0 }, data: { label: 'Start Process' } },
];
const initialEdges: Edge[] = [];

export function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [fitViewFn, setFitViewFn] = useState<(() => void) | null>(null);

  // Check URL parameters on mount for test mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'true') {
      handleLoadTestMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // History management for undo/redo
  const history = useHistory(initialNodes, initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodeIds(params.nodes.map(node => node.id));
  }, []);

  // Track changes for history
  useEffect(() => {
    history.set(nodes, edges);
  }, [nodes, edges]);

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
      setNodes((nds) => nds.filter((node) => !selectedNodeIds.includes(node.id)));
      setEdges((eds) => eds.filter(
        (edge) => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      ));
      setSelectedNodeIds([]);
    }
  }, [selectedNodeIds, setNodes, setEdges]);

  // Delete a specific node
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    ));
  }, [setNodes, setEdges]);

  // Duplicate a node
  const handleDuplicateNode = useCallback((nodeId: string) => {
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
  }, [nodes, setNodes]);

  // Update node data
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<Node['data']>) => {
    setNodes((nds) => nds.map((node) =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));
  }, [setNodes]);

  // Auto-layout function
  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

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

  // Keyboard shortcuts
  const shortcuts = useMemo(() => [
    {
      key: 'z',
      ctrlKey: true,
      handler: handleUndo,
      description: 'Undo',
    },
    {
      key: 'z',
      metaKey: true,
      handler: handleUndo,
      description: 'Undo (Mac)',
    },
    {
      key: 'y',
      ctrlKey: true,
      handler: handleRedo,
      description: 'Redo',
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      handler: handleRedo,
      description: 'Redo (Alt)',
    },
    {
      key: 'z',
      metaKey: true,
      shiftKey: true,
      handler: handleRedo,
      description: 'Redo (Mac)',
    },
    {
      key: 'Delete',
      handler: handleDelete,
      description: 'Delete selected nodes',
    },
    {
      key: 'Backspace',
      handler: handleDelete,
      description: 'Delete selected nodes (Mac)',
    },
    {
      key: 'l',
      ctrlKey: true,
      handler: handleAutoLayout,
      description: 'Auto-layout nodes',
    },
    {
      key: 'l',
      metaKey: true,
      handler: handleAutoLayout,
      description: 'Auto-layout nodes (Mac)',
    },
  ], [handleUndo, handleRedo, handleDelete, handleAutoLayout]);

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="w-[30%] min-w-[300px] max-w-[400px] h-full border-r border-border">
        <ChatInterface
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
        />
      </div>
      <div className="flex-1 h-full">
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
      </div>
    </div>
  );
}

export default App;
