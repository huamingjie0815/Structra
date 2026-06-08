import { AUTO_ROUTE_PADDING } from "../domain/diagramDefaults";
import type { CanvasPoint, CanvasRect, DiagramEdge, DiagramNode, EdgeWaypoint } from "../domain/types";
import { getEdgeEndpoints } from "./edgeGeometry";
import { getNodeVisualBounds } from "./geometry";
import { inflateRect, segmentIntersectsRect } from "./canvasGeometry";

export function getAutoRouteWaypoints(edge: DiagramEdge, nodes: DiagramNode[]) {
  const endpoints = getEdgeEndpoints(edge, nodes);
  if (!endpoints) return null;

  const source = { x: endpoints.sx, y: endpoints.sy };
  const target = { x: endpoints.tx, y: endpoints.ty };
  const obstacles = nodes
    .filter((node) => node.id !== edge.source && node.id !== edge.target && !node.hidden)
    .map((node) => inflateRect(getNodeVisualBounds(node), AUTO_ROUTE_PADDING));
  if (obstacles.length === 0) return [];

  const xValues = [source.x, target.x, ...obstacles.flatMap((rect) => [rect.left, rect.right])];
  const yValues = [source.y, target.y, ...obstacles.flatMap((rect) => [rect.top, rect.bottom])];
  const midX = Math.round((source.x + target.x) / 2);
  const midY = Math.round((source.y + target.y) / 2);
  const leftX = Math.round(Math.min(...xValues) - AUTO_ROUTE_PADDING);
  const rightX = Math.round(Math.max(...xValues) + AUTO_ROUTE_PADDING);
  const topY = Math.round(Math.min(...yValues) - AUTO_ROUTE_PADDING);
  const bottomY = Math.round(Math.max(...yValues) + AUTO_ROUTE_PADDING);
  const candidates: EdgeWaypoint[][] = [
    [],
    [
      { x: midX, y: source.y },
      { x: midX, y: target.y }
    ],
    [
      { x: source.x, y: midY },
      { x: target.x, y: midY }
    ],
    [
      { x: source.x, y: topY },
      { x: target.x, y: topY }
    ],
    [
      { x: source.x, y: bottomY },
      { x: target.x, y: bottomY }
    ],
    [
      { x: leftX, y: source.y },
      { x: leftX, y: target.y }
    ],
    [
      { x: rightX, y: source.y },
      { x: rightX, y: target.y }
    ],
    [
      { x: leftX, y: source.y },
      { x: leftX, y: midY },
      { x: target.x, y: midY }
    ],
    [
      { x: rightX, y: source.y },
      { x: rightX, y: midY },
      { x: target.x, y: midY }
    ]
  ];

  const ranked = candidates
    .map((waypoints) => {
      const simplified = simplifyRouteWaypoints(source, target, waypoints);
      const points = [source, ...simplified, target];
      const intersections = countRouteIntersections(points, obstacles);
      const length = getRouteLength(points);
      return { waypoints: simplified, score: intersections * 100000 + length };
    })
    .sort((a, b) => a.score - b.score);
  return ranked[0]?.waypoints ?? [];
}

export function simplifyRouteWaypoints(source: CanvasPoint, target: CanvasPoint, waypoints: EdgeWaypoint[]) {
  const points = [source, ...waypoints, target]
    .map((point) => ({ x: Math.round(point.x), y: Math.round(point.y) }))
    .filter((point, index, items) => index === 0 || point.x !== items[index - 1].x || point.y !== items[index - 1].y);
  const simplified: CanvasPoint[] = [];
  for (const point of points) {
    simplified.push(point);
    while (simplified.length >= 3) {
      const [a, b, c] = simplified.slice(-3);
      const sameX = a.x === b.x && b.x === c.x;
      const sameY = a.y === b.y && b.y === c.y;
      if (!sameX && !sameY) break;
      simplified.splice(simplified.length - 2, 1);
    }
  }
  return simplified.slice(1, -1).slice(0, 8);
}

export function countRouteIntersections(points: CanvasPoint[], obstacles: CanvasRect[]) {
  let count = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    count += obstacles.filter((rect) => segmentIntersectsRect(start, end, rect)).length;
  }
  return count;
}

export function getRouteLength(points: CanvasPoint[]) {
  return points.slice(0, -1).reduce((sum, point, index) => {
    const next = points[index + 1];
    return sum + Math.hypot(next.x - point.x, next.y - point.y);
  }, 0);
}
