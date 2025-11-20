import { type Node, type Edge } from '@xyflow/react';

export type NodeStatus = 'normal' | 'bottleneck' | 'issue' | 'complete';

export interface ProcessNode extends Node {
    data: {
        label: string;
        description?: string;
        status?: NodeStatus;
        color?: string;
        issueDetails?: string;
    };
}

export interface ProcessEdge extends Edge { }

export interface ProcessGraph {
    nodes: ProcessNode[];
    edges: ProcessEdge[];
}
