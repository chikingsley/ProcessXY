import {
	BaseEdge,
	BezierEdge,
	type EdgeProps,
	useInternalNode,
} from "@xyflow/react";

/**
 * Self-connecting edge that creates a loop when source and target are different nodes
 * but need to loop back (e.g., retry flow)
 * Uses bezier for normal connections and custom arc path for loop-backs
 */
export function SelfConnectingEdge(props: EdgeProps) {
	const {
		source,
		target,
		sourceX,
		sourceY,
		targetX,
		targetY,
		id,
		markerEnd,
		markerStart,
		style,
		label,
		labelStyle,
		labelShowBg,
		animated,
	} = props;

	// Hooks must be called unconditionally at the top level
	const sourceNode = useInternalNode(source);
	const targetNode = useInternalNode(target);

	// Use bezier edge for normal connections
	if (source !== target) {
		// For loop-back edges where source and target are different but create a loop
		// Calculate a custom path that goes around

		if (!sourceNode || !targetNode) {
			return <BezierEdge {...props} />;
		}

		// Check if this is a backward flow (going up in the diagram)
		const isBackward = targetY < sourceY;

		if (isBackward) {
			// Create a looping path that goes around the side
			const midY = (sourceY + targetY) / 2;
			const offsetX = -100; // How far to the side the loop extends

			const edgePath = `
        M ${sourceX} ${sourceY}
        C ${sourceX + offsetX} ${sourceY},
          ${targetX + offsetX} ${targetY},
          ${targetX} ${targetY}
      `;

			return (
				<>
					<path
						id={id}
						className={`react-flow__edge-path ${animated ? "animated" : ""}`}
						d={edgePath}
						markerEnd={markerEnd}
						markerStart={markerStart}
						style={style}
					/>
					{label && (
						<g>
							{labelShowBg && (
								<rect
									x={sourceX + offsetX / 2 - 20}
									y={midY - 10}
									width={40}
									height={20}
									rx={4}
									fill="#ffffff"
									className="react-flow__edge-label-bg"
								/>
							)}
							<text
								x={sourceX + offsetX / 2}
								y={midY}
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

		return <BezierEdge {...props} />;
	}

	// Self-loop (source === target)
	const radiusX = 50;
	const radiusY = 50;
	const edgePath = `M ${sourceX - 5} ${sourceY} A ${radiusX} ${radiusY} 0 1 0 ${targetX + 2} ${targetY}`;

	return (
		<BaseEdge
			path={edgePath}
			markerEnd={markerEnd}
			markerStart={markerStart}
			style={style}
		/>
	);
}
