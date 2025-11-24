import { type EdgeProps, getBezierPath, useInternalNode } from "@xyflow/react";
import { getEdgeParams } from "../../utils/edgeHelpers";

/**
 * Floating edge that dynamically calculates connection points
 * Used for diamond nodes and other shapes where handles aren't at fixed positions
 */
export function FloatingEdge({
	id,
	source,
	target,
	markerEnd,
	markerStart,
	style,
	label,
	labelStyle,
	labelShowBg,
	labelBgStyle,
}: EdgeProps) {
	const sourceNode = useInternalNode(source);
	const targetNode = useInternalNode(target);

	if (!sourceNode || !targetNode) {
		return null;
	}

	const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
		sourceNode,
		targetNode,
	);

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX: sx,
		sourceY: sy,
		sourcePosition: sourcePos,
		targetPosition: targetPos,
		targetX: tx,
		targetY: ty,
	});

	return (
		<>
			<path
				id={id}
				className="react-flow__edge-path"
				d={edgePath}
				markerEnd={markerEnd}
				markerStart={markerStart}
				style={style}
			/>
			{label && (
				<g>
					{labelShowBg && (
						<rect
							x={labelX - 20}
							y={labelY - 10}
							width={40}
							height={20}
							rx={4}
							fill={(labelBgStyle?.background as string) || "#ffffff"}
							className="react-flow__edge-label-bg"
						/>
					)}
					<text
						x={labelX}
						y={labelY}
						className="react-flow__edge-label"
						style={labelStyle}
						textAnchor="middle"
						dominantBaseline="middle"
					>
						{label}
					</text>
				</g>
			)}
		</>
	);
}
