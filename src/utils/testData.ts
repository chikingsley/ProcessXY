import type { Edge, Node } from "@xyflow/react";

/**
 * Test data for visual development and testing
 * Includes all feature showcases: arrows, labels, smoothstep, statuses
 */
export const TEST_NODES: Node[] = [
	{
		id: "1",
		type: "oval",
		position: { x: 250, y: 0 },
		data: {
			label: "Start",
			status: "normal",
		},
	},
	{
		id: "2",
		type: "default",
		position: { x: 250, y: 200 },
		data: {
			label: "Review Application",
			status: "normal",
		},
	},
	{
		id: "3",
		type: "diamond",
		position: { x: 200, y: 480 },
		data: {
			label: "Credit OK?",
			status: "normal",
			outputCount: 2,
		},
	},
	{
		id: "4",
		type: "default",
		position: { x: 50, y: 760 },
		data: {
			label: "Request Documents",
			status: "issue",
		},
	},
	{
		id: "5",
		type: "default",
		position: { x: 400, y: 760 },
		data: {
			label: "Approve Application",
			status: "normal",
		},
	},
	{
		id: "6",
		type: "default",
		position: { x: 250, y: 1040 },
		data: {
			label: "Send Notification",
			status: "bottleneck",
		},
	},
	{
		id: "7",
		type: "oval",
		position: { x: 250, y: 1320 },
		data: {
			label: "End",
			status: "normal",
		},
	},
	// Additional examples showcasing diamond nodes with different output counts
	{
		id: "8",
		type: "diamond", // Diamond with 3 outputs
		position: { x: 700, y: 200 },
		data: {
			label: "Priority?",
			status: "normal",
			outputCount: 3,
		},
	},
	{
		id: "9",
		type: "default",
		position: { x: 550, y: 480 },
		data: {
			label: "Low Priority",
			status: "normal",
		},
	},
	{
		id: "10",
		type: "default",
		position: { x: 700, y: 480 },
		data: {
			label: "Medium Priority",
			status: "normal",
		},
	},
	{
		id: "11",
		type: "default",
		position: { x: 850, y: 480 },
		data: {
			label: "High Priority",
			status: "issue",
		},
	},
	{
		id: "12",
		type: "diamond", // Diamond with 4 outputs
		position: { x: 700, y: 760 },
		data: {
			label: "Risk Level?",
			status: "normal",
			outputCount: 4,
		},
	},
	{
		id: "13",
		type: "default",
		position: { x: 500, y: 1040 },
		data: {
			label: "Minimal Risk",
			status: "normal",
		},
	},
	{
		id: "14",
		type: "default",
		position: { x: 650, y: 1040 },
		data: {
			label: "Low Risk",
			status: "normal",
		},
	},
	{
		id: "15",
		type: "default",
		position: { x: 800, y: 1040 },
		data: {
			label: "Medium Risk",
			status: "issue",
		},
	},
	{
		id: "16",
		type: "default",
		position: { x: 950, y: 1040 },
		data: {
			label: "High Risk",
			status: "bottleneck",
		},
	},
];

export const TEST_EDGES: Edge[] = [
	{
		id: "e1-2",
		source: "1",
		target: "2",
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
	},
	{
		id: "e2-3",
		source: "2",
		target: "3",
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
	},
	{
		id: "e3-4",
		source: "3",
		sourceHandle: "left", // Connect from left handle of diamond
		target: "4",
		type: "bezier",
		label: "No",
		labelStyle: { fill: "#ef4444", fontWeight: 600 },
		labelShowBg: true,
		style: {
			strokeWidth: 2,
			stroke: "#ef4444",
		},
		markerEnd: {
			type: "arrowclosed",
			width: 25,
			height: 25,
			color: "#ef4444",
		},
	},
	{
		id: "e3-5",
		source: "3",
		sourceHandle: "right", // Connect from right handle of diamond
		target: "5",
		type: "bezier",
		label: "Yes",
		labelStyle: { fill: "#22c55e", fontWeight: 600 },
		labelShowBg: true,
		style: {
			strokeWidth: 2,
			stroke: "#22c55e",
		},
		markerEnd: {
			type: "arrowclosed",
			width: 25,
			height: 25,
			color: "#22c55e",
		},
	},
	{
		id: "e4-2",
		source: "4",
		sourceHandle: "left", // Exit from left side (came from left "No" branch)
		target: "2",
		targetHandle: "left", // Enter to left side
		type: "selfConnecting", // Self-connecting edge for loop-back
		label: "Retry",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
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
		animated: true, // Show animation on loop-back edge
	},
	{
		id: "e5-6",
		source: "5",
		target: "6",
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
	},
	{
		id: "e6-7",
		source: "6",
		target: "7",
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
	},
	// Edges for 3-output diamond (Priority)
	{
		id: "e8-9",
		source: "8",
		sourceHandle: "output-0", // First output (25%)
		target: "9",
		type: "bezier",
		label: "Low",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
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
	},
	{
		id: "e8-10",
		source: "8",
		sourceHandle: "output-1", // Second output (50%)
		target: "10",
		type: "bezier",
		label: "Medium",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
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
	},
	{
		id: "e8-11",
		source: "8",
		sourceHandle: "output-2", // Third output (75%)
		target: "11",
		type: "bezier",
		label: "High",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
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
	},
	// Edges for 4-output diamond (Risk Level)
	{
		id: "e12-13",
		source: "12",
		sourceHandle: "output-0", // First output (25%)
		target: "13",
		type: "bezier",
		label: "Minimal",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
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
	},
	{
		id: "e12-14",
		source: "12",
		sourceHandle: "output-1", // Second output (41.7%)
		target: "14",
		type: "bezier",
		label: "Low",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
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
	},
	{
		id: "e12-15",
		source: "12",
		sourceHandle: "output-2", // Third output (58.3%)
		target: "15",
		type: "bezier",
		label: "Medium",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
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
	},
	{
		id: "e12-16",
		source: "12",
		sourceHandle: "output-3", // Fourth output (75%)
		target: "16",
		type: "bezier",
		label: "High",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
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
	},
];
