import { ALIGNMENT_GUIDE_TOLERANCE } from "../domain/diagramDefaults";
import type { AlignmentGuides, CanvasPoint, CanvasRect, DiagramNode } from "../domain/types";
import { getNodeVisualBounds } from "./geometry";

export function getAvailableNodePosition(center: CanvasPoint, size: { width: number; height: number }, nodes: DiagramNode[]) {
  const offsets = [
    { x: 0, y: 0 },
    { x: 0, y: 160 },
    { x: 220, y: 0 },
    { x: -220, y: 0 },
    { x: -220, y: 160 },
    { x: 220, y: 160 },
    { x: -320, y: 220 },
    { x: 320, y: 220 },
    { x: 0, y: -160 },
    { x: 220, y: -160 },
    { x: -220, y: -160 },
    { x: 0, y: 320 },
    { x: 320, y: 0 },
    { x: -320, y: 0 }
  ];
  for (const offset of offsets) {
    const candidate = { x: center.x + offset.x - size.width / 2, y: center.y + offset.y - size.height / 2 };
    const candidateBounds = {
      left: candidate.x,
      top: candidate.y,
      right: candidate.x + size.width,
      bottom: candidate.y + size.height
    };
    const overlaps = nodes.some((node) => rectsOverlap(candidateBounds, getNodeVisualBounds(node), 18));
    if (!overlaps) return candidate;
  }
  return { x: center.x - size.width / 2 + 260, y: center.y - size.height / 2 + 220 };
}

export function rectsOverlap(a: CanvasRect, b: CanvasRect, padding = 0) {
  return a.left < b.right + padding && a.right > b.left - padding && a.top < b.bottom + padding && a.bottom > b.top - padding;
}

export function inflateRect(rect: CanvasRect, padding: number): CanvasRect {
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding
  };
}

export function segmentIntersectsRect(start: CanvasPoint, end: CanvasPoint, rect: CanvasRect) {
  if (pointInRect(start, rect) || pointInRect(end, rect)) return true;
  const topLeft = { x: rect.left, y: rect.top };
  const topRight = { x: rect.right, y: rect.top };
  const bottomRight = { x: rect.right, y: rect.bottom };
  const bottomLeft = { x: rect.left, y: rect.bottom };
  return (
    segmentsIntersect(start, end, topLeft, topRight) ||
    segmentsIntersect(start, end, topRight, bottomRight) ||
    segmentsIntersect(start, end, bottomRight, bottomLeft) ||
    segmentsIntersect(start, end, bottomLeft, topLeft)
  );
}

export function getNodeAlignmentGuides(activeNode: DiagramNode, nodes: DiagramNode[], zoom: number): AlignmentGuides {
  const tolerance = ALIGNMENT_GUIDE_TOLERANCE / Math.max(zoom, 0.2);
  const activeX = [activeNode.position.x, activeNode.position.x + activeNode.data.width / 2, activeNode.position.x + activeNode.data.width];
  const activeY = [activeNode.position.y, activeNode.position.y + activeNode.data.height / 2, activeNode.position.y + activeNode.data.height];
  const xGuides = new Set<number>();
  const yGuides = new Set<number>();

  nodes.forEach((node) => {
    if (node.id === activeNode.id || node.hidden) return;
    const targetX = [node.position.x, node.position.x + node.data.width / 2, node.position.x + node.data.width];
    const targetY = [node.position.y, node.position.y + node.data.height / 2, node.position.y + node.data.height];

    activeX.forEach((activeValue) => {
      targetX.forEach((targetValue) => {
        if (Math.abs(activeValue - targetValue) <= tolerance) {
          xGuides.add(targetValue);
        }
      });
    });

    activeY.forEach((activeValue) => {
      targetY.forEach((targetValue) => {
        if (Math.abs(activeValue - targetValue) <= tolerance) {
          yGuides.add(targetValue);
        }
      });
    });
  });

  return { x: Array.from(xGuides).slice(0, 4), y: Array.from(yGuides).slice(0, 4) };
}

export function guidesEqual(left: AlignmentGuides, right: AlignmentGuides) {
  return left.x.join(",") === right.x.join(",") && left.y.join(",") === right.y.join(",");
}

function pointInRect(point: CanvasPoint, rect: CanvasRect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function segmentsIntersect(a: CanvasPoint, b: CanvasPoint, c: CanvasPoint, d: CanvasPoint) {
  const direction = (p1: CanvasPoint, p2: CanvasPoint, p3: CanvasPoint) => (p3.x - p1.x) * (p2.y - p1.y) - (p2.x - p1.x) * (p3.y - p1.y);
  const onSegment = (p1: CanvasPoint, p2: CanvasPoint, p3: CanvasPoint) =>
    Math.min(p1.x, p2.x) <= p3.x && p3.x <= Math.max(p1.x, p2.x) && Math.min(p1.y, p2.y) <= p3.y && p3.y <= Math.max(p1.y, p2.y);
  const d1 = direction(c, d, a);
  const d2 = direction(c, d, b);
  const d3 = direction(a, b, c);
  const d4 = direction(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  if (d1 === 0 && onSegment(c, d, a)) return true;
  if (d2 === 0 && onSegment(c, d, b)) return true;
  if (d3 === 0 && onSegment(a, b, c)) return true;
  return d4 === 0 && onSegment(a, b, d);
}
