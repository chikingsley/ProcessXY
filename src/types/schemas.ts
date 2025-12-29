import { z } from "zod";

// Node status enum
export const nodeStatusSchema = z.enum([
	"normal",
	"bottleneck",
	"issue",
	"complete",
]);

// Node type enum
export const nodeTypeSchema = z.enum(["default", "oval", "diamond"]);

// Node data schema
export const nodeDataSchema = z.object({
	label: z.string().max(50),
	description: z.string().optional(),
	status: nodeStatusSchema.optional(),
	color: z.string().optional(),
	issueDetails: z.string().optional(),
	outputCount: z.number().optional(), // For decision diamonds
});

// Position schema
export const positionSchema = z.object({
	x: z.number(),
	y: z.number(),
});

// Node schema (matches ProcessNode)
export const nodeSchema = z.object({
	id: z.string(),
	type: nodeTypeSchema.optional().default("default"),
	position: positionSchema,
	data: nodeDataSchema,
});

// Edge marker schema
export const edgeMarkerSchema = z.object({
	type: z.string(), // "arrowclosed", etc.
	width: z.number().optional(),
	height: z.number().optional(),
	color: z.string().optional(),
});

// Label style schema
export const labelStyleSchema = z.object({
	fill: z.string().optional(),
	fontWeight: z.number().optional(),
});

// Edge schema (matches ProcessEdge)
export const edgeSchema = z.object({
	id: z.string(),
	source: z.string(),
	target: z.string(),
	type: z
		.enum(["default", "bezier", "straight", "step", "smoothstep", "selfConnecting"])
		.optional(),
	sourceHandle: z.string().optional(),
	targetHandle: z.string().optional(),
	markerEnd: edgeMarkerSchema.optional(),
	label: z.string().optional(),
	labelStyle: labelStyleSchema.optional(),
	labelShowBg: z.boolean().optional(),
	animated: z.boolean().optional(),
});

// Graph update response schema - what the AI returns
export const graphUpdateSchema = z.object({
	mode: z.enum(["create", "update"]),
	nodes: z.array(nodeSchema),
	edges: z.array(edgeSchema),
	removedNodeIds: z.array(z.string()).optional(),
});

// Export types inferred from schemas
export type NodeData = z.infer<typeof nodeDataSchema>;
export type GraphNode = z.infer<typeof nodeSchema>;
export type GraphEdge = z.infer<typeof edgeSchema>;
export type GraphUpdate = z.infer<typeof graphUpdateSchema>;
