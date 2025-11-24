import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type { ProcessNode } from "../types/process";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const CustomNode = memo(({ data, selected }: NodeProps<ProcessNode>) => {
	// Determine node styling based on status and selection
	const getNodeClasses = () => {
		const baseClasses =
			"px-4 py-3 rounded-lg border-2 shadow-md transition-all duration-200 min-w-[150px] bg-background";

		// Selection glow effect
		if (selected) {
			return `${baseClasses} ring-4 ring-green-400 shadow-lg shadow-green-400/50 border-green-500`;
		}

		// Status-based styling
		switch (data.status) {
			case "bottleneck":
				return `${baseClasses} border-red-500 bg-red-50 dark:bg-red-950/20`;
			case "issue":
				return `${baseClasses} border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20`;
			case "complete":
				return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-950/20`;
			default:
				return `${baseClasses} border-border`;
		}
	};

	const getStatusIndicator = () => {
		switch (data.status) {
			case "bottleneck":
				return (
					<div
						className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
						title="Bottleneck"
					/>
				);
			case "issue":
				return (
					<div
						className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"
						title="Issue"
					/>
				);
			case "complete":
				return (
					<div
						className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
						title="Complete"
					/>
				);
			default:
				return null;
		}
	};

	const getTooltipContent = () => {
		const parts: string[] = [];

		if (data.description) {
			parts.push(data.description);
		}

		if (data.status && data.status !== "normal") {
			const statusLabel =
				data.status.charAt(0).toUpperCase() + data.status.slice(1);
			parts.push(`Status: ${statusLabel}`);
		}

		if (data.issueDetails) {
			parts.push(`Details: ${data.issueDetails}`);
		}

		if (data.color) {
			parts.push(`Color: ${data.color}`);
		}

		return parts.length > 0 ? parts.join(" | ") : "No additional information";
	};

	const nodeContent = (
		<div className="relative">
			<Handle type="target" position={Position.Top} className="!bg-gray-400" />
			<div
				className={getNodeClasses()}
				style={data.color ? { borderColor: data.color } : {}}
			>
				<div className="font-medium text-sm text-foreground">{data.label}</div>
				{data.description && (
					<div className="text-xs text-muted-foreground mt-1">
						{data.description}
					</div>
				)}
			</div>
			{getStatusIndicator()}
			<Handle
				type="source"
				position={Position.Bottom}
				className="!bg-gray-400"
			/>
		</div>
	);

	return (
		<Tooltip>
			<TooltipTrigger asChild>{nodeContent}</TooltipTrigger>
			<TooltipContent side="right" className="max-w-xs">
				{getTooltipContent()}
			</TooltipContent>
		</Tooltip>
	);
});

CustomNode.displayName = "CustomNode";
