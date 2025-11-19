import { useState, useCallback } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { ProcessMap } from "./components/ProcessMap";
import { useNodesState, useEdgesState, addEdge, type Connection, type Edge, type Node } from "@xyflow/react";
import "./index.css";

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 0 }, data: { label: 'Start Process' } },
];
const initialEdges: Edge[] = [];

export function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <div className="w-[30%] min-w-[300px] max-w-[400px] h-full border-r border-border">
        <ChatInterface
          currentNodes={nodes}
          currentEdges={edges}
          onGraphUpdate={(newNodes, newEdges) => {
            setNodes(newNodes);
            setEdges(newEdges);
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
        />
      </div>
    </div>
  );
}

export default App;
