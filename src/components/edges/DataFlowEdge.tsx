import {
	BaseEdge,
	EdgeLabelRenderer,
	type EdgeProps,
	getBezierPath,
} from "@xyflow/react";
import { FileText, Database, ArrowRightLeft, Mail, User, Package } from "lucide-react";

// Data type icons mapping
const dataTypeIcons: Record<string, typeof FileText> = {
	document: FileText,
	form: FileText,
	data: Database,
	database: Database,
	message: Mail,
	email: Mail,
	user: User,
	customer: User,
	package: Package,
	default: ArrowRightLeft,
};

/**
 * Data flow edge that shows what data/documents pass between process steps
 * Displays icons based on data type and animated flow direction
 */
export function DataFlowEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	markerEnd,
	markerStart,
	style,
	label,
	labelStyle,
	labelShowBg,
	animated,
	data,
}: EdgeProps) {
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetPosition,
		targetX,
		targetY,
	});

	// Get data flow info from edge data
	const edgeData = data as { dataType?: string; dataLabel?: string } | undefined;
	const dataType = edgeData?.dataType?.toLowerCase() || "";
	const dataLabel = edgeData?.dataLabel || (typeof label === "string" ? label : undefined);
	const IconComponent = dataTypeIcons[dataType] || (dataLabel ? dataTypeIcons.default : null);

	return (
		<>
			<BaseEdge
				id={id}
				path={edgePath}
				markerEnd={markerEnd}
				markerStart={markerStart}
				style={{
					...style,
					strokeWidth: 2,
				}}
				className={animated ? "animated-edge" : ""}
			/>
			{/* Animated flow particles */}
			{animated && (
				<circle r="4" fill="currentColor" className="text-primary">
					<animateMotion
						dur="2s"
						repeatCount="indefinite"
						path={edgePath}
					/>
				</circle>
			)}
			{/* Data flow label with icon */}
			{dataLabel && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
							pointerEvents: "all",
						}}
						className="nodrag nopan"
					>
						<div
							className={`
								flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
								${labelShowBg !== false ? "bg-background border shadow-sm" : ""}
							`}
							style={labelStyle}
						>
							{IconComponent && <IconComponent className="h-3 w-3 opacity-70" />}
							<span>{dataLabel}</span>
						</div>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}
