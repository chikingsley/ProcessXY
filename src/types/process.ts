import { type Node, type Edge } from '@xyflow/react';

export interface ProcessNode extends Node {
    data: {
        label: string;
        description?: string;
    };
}

export interface ProcessEdge extends Edge { }

export interface ProcessGraph {
    nodes: ProcessNode[];
    edges: ProcessEdge[];
}
