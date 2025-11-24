import { type Node, type Edge, type EdgeMarker } from '@xyflow/react';

export type NodeStatus = 'normal' | 'bottleneck' | 'issue' | 'complete';

export interface ProcessNode extends Node {
    data: {
        label: string;
        description?: string;
        status?: NodeStatus;
        color?: string;
        issueDetails?: string;
        outputCount?: number; // For decision diamonds - number of output handles
    };
}

export interface ProcessEdge extends Edge {
    type?: 'default' | 'straight' | 'step' | 'smoothstep';
    markerEnd?: EdgeMarker | string;
    label?: string;
    labelStyle?: React.CSSProperties;
    labelShowBg?: boolean;
    labelBgStyle?: React.CSSProperties;
    animated?: boolean;
}

export interface ProcessGraph {
    nodes: ProcessNode[];
    edges: ProcessEdge[];
}
