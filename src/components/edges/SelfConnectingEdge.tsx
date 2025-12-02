import {
	BaseEdge,
	BezierEdge,
	EdgeLabelRenderer,
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
			// Smart routing: Detect which side to use based on sourceHandleId
			// If edge came from left branch of decision, route through left side
			// If edge came from right branch of decision, route through right side
			const useLeftSide = props.sourceHandleId === "left";
			const useRightSide = props.sourceHandleId === "right";

			if (useLeftSide || useRightSide) {
				// Calculate handle positions based on routing side
				const sourceNodeWidth = sourceNode.measured?.width ?? 160;
				const targetNodeWidth = targetNode.measured?.width ?? 160;

				const sourceLeft = sourceNode.internals.positionAbsolute.x;
				const sourceRight =
					sourceNode.internals.positionAbsolute.x + sourceNodeWidth;
				const sourceMidY =
					sourceNode.internals.positionAbsolute.y +
					(sourceNode.measured?.height ?? 0) / 2;

				const targetLeft = targetNode.internals.positionAbsolute.x;
				const targetRight =
					targetNode.internals.positionAbsolute.x + targetNodeWidth;
				const targetMidY =
					targetNode.internals.positionAbsolute.y +
					(targetNode.measured?.height ?? 0) / 2;

				// For left routing: negative offset, for right routing: positive offset
				const offsetX = useLeftSide ? -80 : 80;
				const controlOffset = 60; // Control point offset for bezier curve

				// Determine start and end points based on routing side
				const startX = useLeftSide ? sourceLeft : sourceRight;
				const endX = useLeftSide ? targetLeft : targetRight;

				// Create a smooth bezier curve that routes around the specified side
				const edgePath = `
          M ${startX} ${sourceMidY}
          C ${startX + offsetX} ${sourceMidY},
            ${startX + offsetX} ${sourceMidY - controlOffset},
            ${startX + offsetX} ${(sourceMidY + targetMidY) / 2}
          C ${startX + offsetX} ${targetMidY + controlOffset},
            ${endX + offsetX} ${targetMidY},
            ${endX} ${targetMidY}
        `;

				const labelX = startX + offsetX;
				const labelY = (sourceMidY + targetMidY) / 2;

				return (
					<>
						<BaseEdge
							id={id}
							path={edgePath}
							markerEnd={markerEnd}
							markerStart={markerStart}
							style={style}
						/>
						{label && (
							<EdgeLabelRenderer>
								<div
									style={{
										position: "absolute",
										transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
										pointerEvents: "all",
									}}
									className="nodrag nopan"
								>
									{labelShowBg && (
										<span
											style={{
												position: "absolute",
												inset: "-4px -8px",
												background: "#ffffff",
												borderRadius: "4px",
												zIndex: -1,
											}}
										/>
									)}
									<span style={labelStyle}>{label}</span>
								</div>
							</EdgeLabelRenderer>
						)}
					</>
				);
			}
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
