import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import type { NodeStatus } from "../types/process";

export interface ContextMenuProps {
	x: number;
	y: number;
	onClose: () => void;
	onDelete?: () => void;
	onDuplicate?: () => void;
	onChangeStatus?: (status: NodeStatus) => void;
	onChangeColor?: (color: string) => void;
}

const statusColors = [
	{ status: "normal" as NodeStatus, label: "Normal", color: "#6b7280" },
	{ status: "bottleneck" as NodeStatus, label: "Bottleneck", color: "#ef4444" },
	{ status: "issue" as NodeStatus, label: "Issue", color: "#eab308" },
	{ status: "complete" as NodeStatus, label: "Complete", color: "#22c55e" },
];

const customColors = [
	{ label: "Blue", color: "#3b82f6" },
	{ label: "Purple", color: "#a855f7" },
	{ label: "Pink", color: "#ec4899" },
	{ label: "Orange", color: "#f97316" },
];

export function ContextMenu({
	x,
	y,
	onClose,
	onDelete,
	onDuplicate,
	onChangeStatus,
	onChangeColor,
}: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [onClose]);

	return (
		<Card
			ref={menuRef}
			className="absolute z-50 min-w-[200px] p-2 shadow-lg"
			style={{ left: x, top: y }}
		>
			<div className="flex flex-col gap-1">
				{onDuplicate && (
					<button
						type="button"
						className="px-3 py-2 text-sm text-left hover:bg-accent rounded transition-colors"
						onClick={() => {
							onDuplicate();
							onClose();
						}}
					>
						Duplicate
					</button>
				)}

				{onChangeStatus && <div className="border-t border-border my-1" />}

				{onChangeStatus && (
					<div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
						Change Status
					</div>
				)}

				{onChangeStatus &&
					statusColors.map(({ status, label, color }) => (
						<button
							key={status}
							type="button"
							className="px-3 py-2 text-sm text-left hover:bg-accent rounded transition-colors flex items-center gap-2"
							onClick={() => {
								onChangeStatus(status);
								onClose();
							}}
						>
							<div
								className="w-3 h-3 rounded-full"
								style={{ backgroundColor: color }}
							/>
							{label}
						</button>
					))}

				{onChangeColor && <div className="border-t border-border my-1" />}

				{onChangeColor && (
					<div className="px-3 py-1 text-xs font-semibold text-muted-foreground">
						Custom Color
					</div>
				)}

				{onChangeColor &&
					customColors.map(({ label, color }) => (
						<button
							key={color}
							type="button"
							className="px-3 py-2 text-sm text-left hover:bg-accent rounded transition-colors flex items-center gap-2"
							onClick={() => {
								onChangeColor(color);
								onClose();
							}}
						>
							<div
								className="w-3 h-3 rounded-full border border-border"
								style={{ backgroundColor: color }}
							/>
							{label}
						</button>
					))}

				{onDelete && (
					<>
						<div className="border-t border-border my-1" />
						<button
							type="button"
							className="px-3 py-2 text-sm text-left hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
							onClick={() => {
								onDelete();
								onClose();
							}}
						>
							Delete
						</button>
					</>
				)}
			</div>
		</Card>
	);
}
