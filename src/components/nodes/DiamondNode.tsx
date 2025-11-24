import { Handle, type NodeProps, Position } from "@xyflow/react";
import { memo } from "react";
import type { ProcessNode } from "../../types/process";

/**
 * Calculate bottom handle positions based on output count
 * Positions are distributed along the 25%-75% range of the width
 */
function getBottomHandlePoints(count: number): { left: number; top: number }[] {
	// Distribute x positions across the bottom half of the diamond (from left vertex to right vertex)
	const xPercents =
		count === 1
			? [50]
			: count === 2
				? [33, 67]
				: count === 3
					? [25, 50, 75]
					: count === 4
						? [25, 41.7, 58.3, 75]
						: [...Array(count)].map((_, i) => 25 + (50 / (count - 1)) * i);

	// Convert x percents into points on the lower edges of the diamond
	// Diamond vertices: (20,80) -> (80,140) -> (140,80)
	return xPercents.map((percent) => {
		const x = 20 + ((140 - 20) * percent) / 100;
		const isRightHalf = x >= 80;
		const y = isRightHalf ? 220 - x : x + 60; // y=x+60 on left segment, y=220-x on right

		return { left: x, top: y };
	});
}

/**
 * Diamond-shaped node for decision points in process maps
 * Uses CSS transform to create diamond shape
 */
export const DiamondNode = memo(
	({ data, selected }: NodeProps<ProcessNode>) => {
		// Default to 2 outputs for typical Yes/No decisions
		const outputCount = data.outputCount ?? 2;
		const bottomHandlePositions = getBottomHandlePoints(outputCount);
		const getBorderColor = () => {
			if (selected) return "#22c55e"; // green-500

			switch (data.status) {
				case "bottleneck":
					return "#ef4444"; // red-500
				case "issue":
					return "#eab308"; // yellow-500
				case "complete":
					return "#22c55e"; // green-500
				default:
					return "#d1d5db"; // gray-300 - explicit hex instead of CSS variable
			}
		};

		const getBackgroundColor = () => {
			if (data.color) return data.color;

			switch (data.status) {
				case "bottleneck":
					return "#fef2f2"; // red-50
				case "issue":
					return "#fefce8"; // yellow-50
				case "complete":
					return "#f0fdf4"; // green-50
				default:
					return "#ffffff"; // white - explicit hex instead of CSS variable
			}
		};

		return (
			<div className="relative" style={{ width: "160px", height: "160px" }}>
				{/* Input handle at top vertex of diamond (80, 20) */}
				<Handle
					type="target"
					position={Position.Top}
					className="!bg-muted-foreground"
					style={{
						top: "20px",
						left: "80px",
					}}
				/>

				{/* SVG Diamond - properly visible with clean outline */}
				<svg
					width="160"
					height="160"
					className="absolute inset-0"
					style={{ overflow: "visible" }}
					role="img"
					aria-label="Diamond decision node"
				>
					<title>Diamond decision node</title>
					{/* Selection ring */}
					{selected && (
						<polygon
							points="80,15 145,80 80,145 15,80"
							fill="none"
							stroke="#22c55e"
							strokeWidth="8"
							opacity="0.3"
						/>
					)}
					{/* Diamond shape */}
					<polygon
						points="80,20 140,80 80,140 20,80"
						fill={getBackgroundColor()}
						stroke={getBorderColor()}
						strokeWidth="2"
						className="transition-all duration-200"
						style={{
							filter: selected
								? "drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
								: "drop-shadow(0 2px 4px rgba(0,0,0,0.05))",
						}}
					/>
				</svg>

				{/* Label container - centered on diamond */}
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<div className="text-center px-2" style={{ maxWidth: "100px" }}>
						<div className="font-medium text-sm">{data.label}</div>
						{data.description && (
							<div className="text-xs text-muted-foreground mt-1 line-clamp-2">
								{data.description}
							</div>
						)}
					</div>
				</div>

				{/* Status indicator */}
				{data.status && data.status !== "normal" && (
					<div
						className="absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-background z-10"
						style={{
							backgroundColor:
								data.status === "bottleneck"
									? "#ef4444"
									: data.status === "issue"
										? "#eab308"
										: "#22c55e",
						}}
					/>
				)}

				{/* Output handles dynamically positioned along bottom edge */}
				{bottomHandlePositions.map(({ left, top }, index) => {
					const handleId =
						outputCount === 2
							? index === 0
								? "left"
								: "right" // Preserve 'left'/'right' IDs for 2 outputs
							: `output-${index}`;

					return (
						<Handle
							key={handleId}
							type="source"
							id={handleId}
							position={Position.Bottom}
							className="!bg-muted-foreground"
							style={{
								position: "absolute",
								left: `${left}px`,
								top: `${top}px`,
								transform: "translate(-50%, -50%)",
							}}
						/>
					);
				})}
			</div>
		);
	},
);

DiamondNode.displayName = "DiamondNode";
