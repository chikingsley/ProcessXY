import { Check, ChevronDown, FileText, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { MapInfo } from "../hooks/usePersistence";

interface MapsPanelProps {
	currentMapName: string;
	maps: MapInfo[];
	isSaving: boolean;
	lastSaved: Date | null;
	onLoadMap: (id: string) => void;
	onNewMap: () => void;
	onDeleteMap: (id: string) => void;
	onRename: (name: string) => void;
	onSaveNow: () => void;
}

export function MapsPanel({
	currentMapName,
	maps,
	isSaving,
	lastSaved,
	onLoadMap,
	onNewMap,
	onDeleteMap,
	onRename,
	onSaveNow,
}: MapsPanelProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editName, setEditName] = useState(currentMapName);

	const formatDate = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (seconds < 60) return "just now";
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return date.toLocaleDateString();
	};

	const handleRename = () => {
		if (editName.trim() && editName !== currentMapName) {
			onRename(editName.trim());
		}
		setIsEditing(false);
	};

	return (
		<div className="flex items-center gap-2">
			{/* Map name / selector */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="flex items-center gap-2 h-8 px-3">
						<FileText className="h-4 w-4" />
						{isEditing ? (
							<input
								type="text"
								value={editName}
								onChange={(e) => setEditName(e.target.value)}
								onBlur={handleRename}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleRename();
									if (e.key === "Escape") {
										setEditName(currentMapName);
										setIsEditing(false);
									}
								}}
								className="bg-transparent border-b border-primary outline-none w-32"
								ref={(input) => input?.focus()}
								onClick={(e) => e.stopPropagation()}
							/>
						) : (
							<span className="max-w-[150px] truncate">{currentMapName}</span>
						)}
						<ChevronDown className="h-3 w-3 opacity-50" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-64">
					<DropdownMenuItem onClick={onNewMap}>
						<Plus className="h-4 w-4 mr-2" />
						New Map
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{maps.length === 0 ? (
						<div className="px-2 py-3 text-sm text-muted-foreground text-center">
							No saved maps yet
						</div>
					) : (
						maps.map((map) => (
							<DropdownMenuItem
								key={map.id}
								className="flex items-center justify-between group"
								onClick={() => onLoadMap(map.id)}
							>
								<div className="flex flex-col">
									<span className="truncate max-w-[180px]">{map.name}</span>
									<span className="text-xs text-muted-foreground">
										{map.nodeCount} nodes
									</span>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
									onClick={(e) => {
										e.stopPropagation();
										onDeleteMap(map.id);
									}}
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</DropdownMenuItem>
						))
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Save status */}
			<div className="flex items-center gap-1 text-xs text-muted-foreground">
				{isSaving ? (
					<>
						<Save className="h-3 w-3 animate-pulse" />
						<span>Saving...</span>
					</>
				) : lastSaved ? (
					<>
						<Check className="h-3 w-3 text-green-500" />
						<span>Saved {formatDate(lastSaved)}</span>
					</>
				) : (
					<Button
						variant="ghost"
						size="sm"
						className="h-6 px-2 text-xs"
						onClick={onSaveNow}
					>
						<Save className="h-3 w-3 mr-1" />
						Save
					</Button>
				)}
			</div>
		</div>
	);
}
