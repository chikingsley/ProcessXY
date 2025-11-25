import { Database } from "bun:sqlite";
import type { ProcessGraph } from "../types/process";

// Initialize database (creates file if it doesn't exist)
const db = new Database("processxy.db", { create: true });

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nodes TEXT NOT NULL,
    edges TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Create index for faster lookups
db.run(
	`CREATE INDEX IF NOT EXISTS idx_maps_updated_at ON maps(updated_at DESC)`,
);

export interface SavedMap {
	id: string;
	name: string;
	nodes: string; // JSON string
	edges: string; // JSON string
	created_at: string;
	updated_at: string;
}

export interface MapSummary {
	id: string;
	name: string;
	nodeCount: number;
	created_at: string;
	updated_at: string;
}

/**
 * Generate a unique ID for new maps
 */
function generateId(): string {
	return `map_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * List all saved maps (summary only, not full graph data)
 */
export function listMaps(): MapSummary[] {
	const stmt = db.prepare(`
    SELECT id, name, nodes, created_at, updated_at
    FROM maps
    ORDER BY updated_at DESC
  `);

	const rows = stmt.all() as SavedMap[];

	return rows.map((row) => {
		const nodes = JSON.parse(row.nodes);
		return {
			id: row.id,
			name: row.name,
			nodeCount: nodes.length,
			created_at: row.created_at,
			updated_at: row.updated_at,
		};
	});
}

/**
 * Get a single map by ID
 */
export function getMap(id: string): SavedMap | null {
	const stmt = db.prepare("SELECT * FROM maps WHERE id = ?");
	const row = stmt.get(id) as SavedMap | null;
	return row;
}

/**
 * Save a new map or update existing one
 */
export function saveMap(
	graph: ProcessGraph,
	name: string,
	id?: string,
): SavedMap {
	const mapId = id || generateId();
	const nodesJson = JSON.stringify(graph.nodes);
	const edgesJson = JSON.stringify(graph.edges);
	const now = new Date().toISOString();

	// Check if map exists
	const existing = id ? getMap(id) : null;

	if (existing) {
		// Update existing map
		const stmt = db.prepare(`
      UPDATE maps
      SET name = ?, nodes = ?, edges = ?, updated_at = ?
      WHERE id = ?
    `);
		stmt.run(name, nodesJson, edgesJson, now, mapId);
	} else {
		// Insert new map
		const stmt = db.prepare(`
      INSERT INTO maps (id, name, nodes, edges, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
		stmt.run(mapId, name, nodesJson, edgesJson, now, now);
	}

	const savedMap = getMap(mapId);
	if (!savedMap) {
		throw new Error(`Failed to save map: ${mapId}`);
	}
	return savedMap;
}

/**
 * Delete a map by ID
 */
export function deleteMap(id: string): boolean {
	const stmt = db.prepare("DELETE FROM maps WHERE id = ?");
	const result = stmt.run(id);
	return result.changes > 0;
}

/**
 * Get the most recently updated map (for auto-load on startup)
 */
export function getMostRecentMap(): SavedMap | null {
	const stmt = db.prepare(`
    SELECT * FROM maps
    ORDER BY updated_at DESC
    LIMIT 1
  `);
	return stmt.get() as SavedMap | null;
}
