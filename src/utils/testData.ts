import type { Edge, Node } from "@xyflow/react";

/**
 * Test data with centered spine layout
 * Position.x is TOP-LEFT corner, so we need: CENTER_X - (nodeWidth / 2)
 */

// Layout constants
const CENTER_X = 300;
const LEVEL_HEIGHT = 130;
const BRANCH_OFFSET = 200;

// Node widths (MUST match actual CSS sizes!)
// DiamondNode.tsx: width: "160px"
// OvalNode.tsx: min-w-[160px]
// RectangleNode.tsx: min-w-[150px]
const OVAL_WIDTH = 160;
const RECT_WIDTH = 150;
const DIAMOND_WIDTH = 160;

export const TEST_NODES: Node[] = [
	// === MAIN FLOW (centered spine) ===
	{
		id: "1",
		type: "oval",
		position: { x: CENTER_X - OVAL_WIDTH / 2, y: 0 },
		data: { label: "Start", status: "normal" },
	},
	{
		id: "2",
		type: "default",
		position: { x: CENTER_X - RECT_WIDTH / 2, y: LEVEL_HEIGHT },
		data: { label: "Review Application", status: "normal" },
	},
	{
		id: "3",
		type: "diamond",
		position: { x: CENTER_X - DIAMOND_WIDTH / 2, y: LEVEL_HEIGHT * 2 },
		data: { label: "Credit OK?", status: "normal", outputCount: 2 },
	},
	// === DECISION BRANCHES (symmetric around center) ===
	{
		id: "4",
		type: "default",
		position: { x: CENTER_X - BRANCH_OFFSET - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 3 },
		data: { label: "Request Documents", status: "issue" },
	},
	{
		id: "5",
		type: "default",
		position: { x: CENTER_X + BRANCH_OFFSET - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 3 },
		data: { label: "Approve Application", status: "normal" },
	},
	// === HAPPY PATH CONTINUATION (back to center) ===
	{
		id: "6",
		type: "default",
		position: { x: CENTER_X - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 4 },
		data: { label: "Send Notification", status: "bottleneck" },
	},
	{
		id: "7",
		type: "oval",
		position: { x: CENTER_X - OVAL_WIDTH / 2, y: LEVEL_HEIGHT * 5 },
		data: { label: "End", status: "normal" },
	},

	// === SEPARATE: 3-way decision example ===
	{
		id: "8",
		type: "diamond",
		position: { x: 750 - DIAMOND_WIDTH / 2, y: LEVEL_HEIGHT },
		data: { label: "Priority?", status: "normal", outputCount: 3 },
	},
	{
		id: "9",
		type: "default",
		position: { x: 550 - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 2.5 },
		data: { label: "Low Priority", status: "normal" },
	},
	{
		id: "10",
		type: "default",
		position: { x: 750 - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 2.5 },
		data: { label: "Medium Priority", status: "normal" },
	},
	{
		id: "11",
		type: "default",
		position: { x: 950 - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 2.5 },
		data: { label: "High Priority", status: "issue" },
	},

	// === SEPARATE: 4-way decision example ===
	{
		id: "12",
		type: "diamond",
		position: { x: 1250 - DIAMOND_WIDTH / 2, y: LEVEL_HEIGHT },
		data: { label: "Risk Level?", status: "normal", outputCount: 4 },
	},
	{
		id: "13",
		type: "default",
		position: { x: 1000 - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 2.5 },
		data: { label: "Minimal Risk", status: "normal" },
	},
	{
		id: "14",
		type: "default",
		position: { x: 1167 - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 2.5 },
		data: { label: "Low Risk", status: "normal" },
	},
	{
		id: "15",
		type: "default",
		position: { x: 1333 - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 2.5 },
		data: { label: "Medium Risk", status: "issue" },
	},
	{
		id: "16",
		type: "default",
		position: { x: 1500 - RECT_WIDTH / 2, y: LEVEL_HEIGHT * 2.5 },
		data: { label: "High Risk", status: "bottleneck" },
	},
];

export const TEST_EDGES: Edge[] = [
	// === MAIN SPINE (straight lines) ===
	{
		id: "e1-2",
		source: "1",
		target: "2",
		type: "straight",
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},
	{
		id: "e2-3",
		source: "2",
		target: "3",
		type: "straight",
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},

	// === DECISION BRANCHES (bezier curves) ===
	{
		id: "e3-4",
		source: "3",
		sourceHandle: "left",
		target: "4",
		type: "bezier",
		label: "No",
		labelStyle: { fill: "#ef4444", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#ef4444" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#ef4444" },
	},
	{
		id: "e3-5",
		source: "3",
		sourceHandle: "right",
		target: "5",
		type: "bezier",
		label: "Yes",
		labelStyle: { fill: "#22c55e", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#22c55e" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#22c55e" },
	},

	// === LOOP BACK (dashed secondary path) ===
	{
		id: "e4-2",
		source: "4",
		sourceHandle: "left",
		target: "2",
		targetHandle: "left",
		type: "selfConnecting",
		label: "Resubmit",
		labelStyle: { fill: "#94a3b8", fontWeight: 500 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#94a3b8", strokeDasharray: "5,5" },
		markerEnd: { type: "arrowclosed", width: 20, height: 20, color: "#94a3b8" },
	},

	// === HAPPY PATH CONTINUATION ===
	{
		id: "e5-6",
		source: "5",
		target: "6",
		type: "bezier",
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},
	{
		id: "e6-7",
		source: "6",
		target: "7",
		type: "straight",
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},

	// === 3-WAY DECISION EDGES ===
	{
		id: "e8-9",
		source: "8",
		sourceHandle: "output-0",
		target: "9",
		type: "bezier",
		label: "Low",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},
	{
		id: "e8-10",
		source: "8",
		sourceHandle: "output-1",
		target: "10",
		type: "bezier",
		label: "Medium",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},
	{
		id: "e8-11",
		source: "8",
		sourceHandle: "output-2",
		target: "11",
		type: "bezier",
		label: "High",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},

	// === 4-WAY DECISION EDGES ===
	{
		id: "e12-13",
		source: "12",
		sourceHandle: "output-0",
		target: "13",
		type: "bezier",
		label: "Minimal",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},
	{
		id: "e12-14",
		source: "12",
		sourceHandle: "output-1",
		target: "14",
		type: "bezier",
		label: "Low",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},
	{
		id: "e12-15",
		source: "12",
		sourceHandle: "output-2",
		target: "15",
		type: "bezier",
		label: "Medium",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},
	{
		id: "e12-16",
		source: "12",
		sourceHandle: "output-3",
		target: "16",
		type: "bezier",
		label: "High",
		labelStyle: { fill: "#64748b", fontWeight: 600 },
		labelShowBg: true,
		style: { strokeWidth: 2, stroke: "#64748b" },
		markerEnd: { type: "arrowclosed", width: 25, height: 25, color: "#64748b" },
	},
];
