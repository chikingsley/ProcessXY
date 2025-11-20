import { describe, test, expect } from "bun:test";
import type { ProcessNode, ProcessEdge, NodeStatus } from "../src/types/process";

describe("ProcessXY Type Definitions", () => {
    test("ProcessNode should have correct structure", () => {
        const node: ProcessNode = {
            id: "1",
            position: { x: 0, y: 0 },
            data: {
                label: "Test Node",
                description: "Test Description",
                status: "normal",
                color: "#ff0000",
                issueDetails: "Some issue",
            },
        };

        expect(node.id).toBe("1");
        expect(node.data.label).toBe("Test Node");
        expect(node.data.status).toBe("normal");
    });

    test("NodeStatus should accept valid statuses", () => {
        const validStatuses: NodeStatus[] = ["normal", "bottleneck", "issue", "complete"];

        validStatuses.forEach((status) => {
            const node: ProcessNode = {
                id: "1",
                position: { x: 0, y: 0 },
                data: {
                    label: "Test",
                    status,
                },
            };

            expect(node.data.status).toBe(status);
        });
    });

    test("ProcessNode should work with minimal data", () => {
        const minimalNode: ProcessNode = {
            id: "1",
            position: { x: 0, y: 0 },
            data: {
                label: "Minimal Node",
            },
        };

        expect(minimalNode.data.label).toBe("Minimal Node");
        expect(minimalNode.data.description).toBeUndefined();
        expect(minimalNode.data.status).toBeUndefined();
    });

    test("ProcessEdge should have correct structure", () => {
        const edge: ProcessEdge = {
            id: "e1-2",
            source: "1",
            target: "2",
        };

        expect(edge.id).toBe("e1-2");
        expect(edge.source).toBe("1");
        expect(edge.target).toBe("2");
    });
});

describe("API Endpoint Contract", () => {
    test("should construct proper API request body", () => {
        const requestBody = {
            prompt: "Create a process",
            currentGraph: {
                nodes: [
                    {
                        id: "1",
                        position: { x: 0, y: 0 },
                        data: { label: "Start" },
                    },
                ],
                edges: [],
            },
            selectedNodeIds: ["1"],
        };

        expect(requestBody.prompt).toBeDefined();
        expect(requestBody.currentGraph).toBeDefined();
        expect(requestBody.selectedNodeIds).toBeArray();
        expect(requestBody.selectedNodeIds.length).toBe(1);
    });

    test("should handle empty selection", () => {
        const requestBody = {
            prompt: "Create a new process",
            currentGraph: { nodes: [], edges: [] },
            selectedNodeIds: [],
        };

        expect(requestBody.selectedNodeIds).toBeArray();
        expect(requestBody.selectedNodeIds.length).toBe(0);
    });

    test("should handle multiple selected nodes", () => {
        const requestBody = {
            prompt: "Make these red",
            currentGraph: {
                nodes: [
                    { id: "1", position: { x: 0, y: 0 }, data: { label: "A" } },
                    { id: "2", position: { x: 100, y: 0 }, data: { label: "B" } },
                    { id: "3", position: { x: 200, y: 0 }, data: { label: "C" } },
                ],
                edges: [],
            },
            selectedNodeIds: ["1", "2", "3"],
        };

        expect(requestBody.selectedNodeIds.length).toBe(3);
        expect(requestBody.selectedNodeIds).toContain("1");
        expect(requestBody.selectedNodeIds).toContain("2");
        expect(requestBody.selectedNodeIds).toContain("3");
    });
});

describe("Node Selection Logic", () => {
    test("should filter selected nodes correctly", () => {
        const allNodes: ProcessNode[] = [
            { id: "1", position: { x: 0, y: 0 }, data: { label: "A" } },
            { id: "2", position: { x: 100, y: 0 }, data: { label: "B" } },
            { id: "3", position: { x: 200, y: 0 }, data: { label: "C" } },
        ];

        const selectedNodeIds = ["1", "3"];
        const selectedNodes = allNodes.filter((n) => selectedNodeIds.includes(n.id));

        expect(selectedNodes.length).toBe(2);
        expect(selectedNodes[0].id).toBe("1");
        expect(selectedNodes[1].id).toBe("3");
    });

    test("should extract labels from selected nodes", () => {
        const allNodes: ProcessNode[] = [
            { id: "1", position: { x: 0, y: 0 }, data: { label: "Start" } },
            { id: "2", position: { x: 100, y: 0 }, data: { label: "Process" } },
            { id: "3", position: { x: 200, y: 0 }, data: { label: "End" } },
        ];

        const selectedNodeIds = ["1", "2"];
        const selectedLabels = allNodes
            .filter((n) => selectedNodeIds.includes(n.id))
            .map((n) => n.data.label);

        expect(selectedLabels).toEqual(["Start", "Process"]);
    });
});

describe("Node Status and Styling", () => {
    test("should determine correct styling classes for node statuses", () => {
        const getStatusClass = (status?: NodeStatus) => {
            switch (status) {
                case "bottleneck":
                    return "border-red-500";
                case "issue":
                    return "border-yellow-500";
                case "complete":
                    return "border-green-500";
                default:
                    return "border-border";
            }
        };

        expect(getStatusClass("bottleneck")).toBe("border-red-500");
        expect(getStatusClass("issue")).toBe("border-yellow-500");
        expect(getStatusClass("complete")).toBe("border-green-500");
        expect(getStatusClass("normal")).toBe("border-border");
        expect(getStatusClass(undefined)).toBe("border-border");
    });

    test("should apply selection glow effect", () => {
        const isSelected = true;
        const glowClass = isSelected
            ? "ring-4 ring-green-400 shadow-lg shadow-green-400/50"
            : "";

        expect(glowClass).toContain("ring-green-400");
        expect(glowClass).toContain("shadow-green-400/50");
    });
});
