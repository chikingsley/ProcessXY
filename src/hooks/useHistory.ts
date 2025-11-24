import { useCallback, useRef, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';

interface HistoryState {
    nodes: Node[];
    edges: Edge[];
}

interface UseHistoryReturn {
    past: HistoryState[];
    future: HistoryState[];
    set: (nodes: Node[], edges: Edge[]) => void;
    undo: () => HistoryState | null;
    redo: () => HistoryState | null;
    canUndo: boolean;
    canRedo: boolean;
    clear: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useHistory(initialNodes: Node[], initialEdges: Edge[]): UseHistoryReturn {
    const [past, setPast] = useState<HistoryState[]>([]);
    const [future, setFuture] = useState<HistoryState[]>([]);

    // Track the current state to avoid infinite loops
    const currentStateRef = useRef<HistoryState>({
        nodes: initialNodes,
        edges: initialEdges,
    });

    const set = useCallback((nodes: Node[], edges: Edge[]) => {
        const newState: HistoryState = {
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
        };

        // Don't add to history if state hasn't actually changed
        const currentState = currentStateRef.current;
        if (
            JSON.stringify(currentState.nodes) === JSON.stringify(newState.nodes) &&
            JSON.stringify(currentState.edges) === JSON.stringify(newState.edges)
        ) {
            return;
        }

        setPast((prev) => {
            const newPast = [...prev, currentState];
            // Limit history size
            if (newPast.length > MAX_HISTORY_SIZE) {
                return newPast.slice(1);
            }
            return newPast;
        });

        setFuture([]);
        currentStateRef.current = newState;
    }, []);

    const undo = useCallback((): HistoryState | null => {
        if (past.length === 0) return null;

        const previous = past[past.length - 1];
        if (!previous) return null;

        const newPast = past.slice(0, -1);

        setPast(newPast);
        setFuture((prev) => [currentStateRef.current, ...prev]);
        currentStateRef.current = previous;

        return previous;
    }, [past]);

    const redo = useCallback((): HistoryState | null => {
        if (future.length === 0) return null;

        const next = future[0];
        if (!next) return null;

        const newFuture = future.slice(1);

        setFuture(newFuture);
        setPast((prev) => [...prev, currentStateRef.current]);
        currentStateRef.current = next;

        return next;
    }, [future]);

    const clear = useCallback(() => {
        setPast([]);
        setFuture([]);
    }, []);

    return {
        past,
        future,
        set,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        clear,
    };
}
