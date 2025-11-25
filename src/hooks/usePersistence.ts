import type { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface MapInfo {
	id: string;
	name: string;
	nodeCount: number;
	created_at: string;
	updated_at: string;
}

export interface SavedMapData {
	id: string;
	name: string;
	nodes: Node[];
	edges: Edge[];
	created_at: string;
	updated_at: string;
}

interface UsePersistenceOptions {
	autoSaveDelay?: number; // Debounce delay in ms (default: 2000)
	onSaveStart?: () => void;
	onSaveComplete?: (map: MapInfo) => void;
	onSaveError?: (error: string) => void;
	onLoad?: (map: SavedMapData) => void;
}

export function usePersistence(options: UsePersistenceOptions = {}) {
	const {
		autoSaveDelay = 2000,
		onSaveStart,
		onSaveComplete,
		onSaveError,
		onLoad,
	} = options;

	const [currentMapId, setCurrentMapId] = useState<string | null>(null);
	const [currentMapName, setCurrentMapName] = useState<string>("Untitled Map");
	const [isSaving, setIsSaving] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [maps, setMaps] = useState<MapInfo[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Refs for debouncing
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingGraphRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

	// Fetch list of saved maps
	const fetchMaps = useCallback(async () => {
		try {
			const response = await fetch("/api/maps");
			const data = await response.json();
			setMaps(data.maps || []);
		} catch (error) {
			console.error("Failed to fetch maps:", error);
		}
	}, []);

	// Load most recent map on startup
	const loadMostRecent = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/maps/recent");
			const data = await response.json();

			if (data.map) {
				setCurrentMapId(data.map.id);
				setCurrentMapName(data.map.name);
				setLastSaved(new Date(data.map.updated_at));
				onLoad?.(data.map);
				return data.map;
			}
			return null;
		} catch (error) {
			console.error("Failed to load recent map:", error);
			return null;
		} finally {
			setIsLoading(false);
		}
	}, [onLoad]);

	// Load a specific map by ID
	const loadMap = useCallback(
		async (id: string) => {
			try {
				setIsLoading(true);
				const response = await fetch(`/api/maps/${id}`);
				if (!response.ok) {
					throw new Error("Map not found");
				}
				const data = await response.json();

				setCurrentMapId(data.map.id);
				setCurrentMapName(data.map.name);
				setLastSaved(new Date(data.map.updated_at));
				onLoad?.(data.map);
				return data.map;
			} catch (error) {
				console.error("Failed to load map:", error);
				onSaveError?.("Failed to load map");
				return null;
			} finally {
				setIsLoading(false);
			}
		},
		[onLoad, onSaveError],
	);

	// Save map (debounced for auto-save)
	const saveMap = useCallback(
		async (nodes: Node[], edges: Edge[], name?: string) => {
			const mapName = name || currentMapName;

			// Skip save if no nodes
			if (nodes.length === 0) {
				return;
			}

			setIsSaving(true);
			onSaveStart?.();

			try {
				const response = await fetch("/api/maps", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: currentMapId, // Will create new if null
						name: mapName,
						graph: { nodes, edges },
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to save");
				}

				const data = await response.json();
				setCurrentMapId(data.map.id);
				setCurrentMapName(data.map.name);
				setLastSaved(new Date(data.map.updated_at));
				onSaveComplete?.(data.map);

				// Refresh maps list
				fetchMaps();
			} catch (error) {
				console.error("Failed to save map:", error);
				onSaveError?.("Failed to save map");
			} finally {
				setIsSaving(false);
			}
		},
		[
			currentMapId,
			currentMapName,
			onSaveStart,
			onSaveComplete,
			onSaveError,
			fetchMaps,
		],
	);

	// Debounced auto-save
	const autoSave = useCallback(
		(nodes: Node[], edges: Edge[]) => {
			// Store pending graph data
			pendingGraphRef.current = { nodes, edges };

			// Clear existing timeout
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			// Set new timeout
			saveTimeoutRef.current = setTimeout(() => {
				if (pendingGraphRef.current) {
					saveMap(pendingGraphRef.current.nodes, pendingGraphRef.current.edges);
					pendingGraphRef.current = null;
				}
			}, autoSaveDelay);
		},
		[saveMap, autoSaveDelay],
	);

	// Create a new map
	const createNewMap = useCallback((name = "Untitled Map") => {
		setCurrentMapId(null);
		setCurrentMapName(name);
		setLastSaved(null);
	}, []);

	// Delete a map
	const deleteMapById = useCallback(
		async (id: string) => {
			try {
				const response = await fetch(`/api/maps/${id}`, { method: "DELETE" });
				if (!response.ok) {
					throw new Error("Failed to delete");
				}

				// If we deleted the current map, clear it
				if (id === currentMapId) {
					setCurrentMapId(null);
					setCurrentMapName("Untitled Map");
					setLastSaved(null);
				}

				// Refresh maps list
				fetchMaps();
				return true;
			} catch (error) {
				console.error("Failed to delete map:", error);
				onSaveError?.("Failed to delete map");
				return false;
			}
		},
		[currentMapId, fetchMaps, onSaveError],
	);

	// Rename current map
	const renameMap = useCallback((newName: string) => {
		setCurrentMapName(newName);
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	// Fetch maps list on mount
	useEffect(() => {
		fetchMaps();
	}, [fetchMaps]);

	return {
		// State
		currentMapId,
		currentMapName,
		isSaving,
		isLoading,
		lastSaved,
		maps,

		// Actions
		saveMap,
		autoSave,
		loadMap,
		loadMostRecent,
		createNewMap,
		deleteMapById,
		renameMap,
		fetchMaps,
	};
}
