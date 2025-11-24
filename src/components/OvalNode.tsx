import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type { ProcessNode } from "../types/process";

/**
 * Oval-shaped node for start/end points in process maps
 */
export const OvalNode = memo(({ data, selected }: NodeProps<ProcessNode>) => {
	const getNodeClasses = () => {
		const baseClasses =
			"px-8 py-4 border-2 shadow-md transition-all duration-200 min-w-[160px] bg-background";
		const shapeClasses = "rounded-full"; // Full rounding for oval

		if (selected) {
			return `${baseClasses} ${shapeClasses} ring-4 ring-green-400 shadow-lg shadow-green-400/50 border-green-500`;
		}

		switch (data.status) {
			case "bottleneck":
				return `${baseClasses} ${shapeClasses} border-red-500 bg-red-50 dark:bg-red-950/20`;
			case "issue":
				return `${baseClasses} ${shapeClasses} border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20`;
			case "complete":
				return `${baseClasses} ${shapeClasses} border-green-500 bg-green-50 dark:bg-green-950/20`;
			default:
				return `${baseClasses} ${shapeClasses} border-border`;
		}
	};

	const getStatusIndicator = () => {
		switch (data.status) {
			case "bottleneck":
				return (
					<div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-background" />
				);
			case "issue":
				return (
					<div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-500 border-2 border-background" />
				);
			case "complete":
				return (
					<div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
				);
			default:
				return null;
		}
	};

	return (
		<div className="relative">
			<Handle
				type="target"
				position={Position.Top}
				className="!bg-muted-foreground"
			/>
			<div
				className={getNodeClasses()}
				style={{
					backgroundColor: data.color || undefined,
				}}
			>
				<div className="font-medium text-sm text-center whitespace-nowrap">
					{data.label}
				</div>
				{data.description && (
					<div className="text-xs text-muted-foreground mt-1 text-center">
						{data.description}
					</div>
				)}
			</div>
			{getStatusIndicator()}
			<Handle
				type="source"
				position={Position.Bottom}
				className="!bg-muted-foreground"
			/>
		</div>
	);
});

OvalNode.displayName = "OvalNode";
