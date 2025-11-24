import { Position, type Node } from '@xyflow/react';

// Calculate the intersection point between two nodes for floating edges
export function getEdgeParams(source: Node, target: Node) {
  // Use position from the node directly - positionAbsolute is computed by ReactFlow
  if (!source.position || !target.position) {
    return {
      sx: 0,
      sy: 0,
      tx: 0,
      ty: 0,
      sourcePos: Position.Bottom,
      targetPos: Position.Top,
    };
  }

  const sourcePosition = source.position;
  const targetPosition = target.position;

  const sourceWidth = source.measured?.width ?? 0;
  const sourceHeight = source.measured?.height ?? 0;
  const targetWidth = target.measured?.width ?? 0;
  const targetHeight = target.measured?.height ?? 0;

  const sourceX = sourcePosition.x + sourceWidth / 2;
  const sourceY = sourcePosition.y + sourceHeight / 2;
  const targetX = targetPosition.x + targetWidth / 2;
  const targetY = targetPosition.y + targetHeight / 2;

  // Calculate the angle between source and target
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;

  // Determine which side of the source node to connect from
  let sourcePos = Position.Bottom;
  let targetPos = Position.Top;
  let sx = sourceX;
  let sy = sourceY;
  let tx = targetX;
  let ty = targetY;

  // Determine source position based on angle
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection
    if (dx > 0) {
      sourcePos = Position.Right;
      sx = sourcePosition.x + sourceWidth;
      sy = sourceY;
    } else {
      sourcePos = Position.Left;
      sx = sourcePosition.x;
      sy = sourceY;
    }
  } else {
    // Vertical connection
    if (dy > 0) {
      sourcePos = Position.Bottom;
      sx = sourceX;
      sy = sourcePosition.y + sourceHeight;
    } else {
      sourcePos = Position.Top;
      sx = sourceX;
      sy = sourcePosition.y;
    }
  }

  // Determine target position based on angle
  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection
    if (dx > 0) {
      targetPos = Position.Left;
      tx = targetPosition.x;
      ty = targetY;
    } else {
      targetPos = Position.Right;
      tx = targetPosition.x + targetWidth;
      ty = targetY;
    }
  } else {
    // Vertical connection
    if (dy > 0) {
      targetPos = Position.Top;
      tx = targetX;
      ty = targetPosition.y;
    } else {
      targetPos = Position.Bottom;
      tx = targetX;
      ty = targetPosition.y + targetHeight;
    }
  }

  return { sx, sy, tx, ty, sourcePos, targetPos };
}
