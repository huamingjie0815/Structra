import { getBezierPath, getSmoothStepPath, getStraightPath, Position } from "@xyflow/react";

import { DEFAULT_EDGE_BEND_OFFSET, DEFAULT_EDGE_STROKE, DEFAULT_EDGE_WIDTH, EDGE_DASH_PATTERNS } from "../domain/diagramDefaults";
import type { DiagramEdge, DiagramNode, EdgeArrowMode, EdgeDashMode, EdgeEndpoints, EdgeWaypoint } from "../domain/types";
import { getNodeRotation, rotatePoint } from "./geometry";

export function getEdgeStroke(edge: DiagramEdge) {
  return String(edge.style?.stroke ?? DEFAULT_EDGE_STROKE);
}

export function getEdgeBendOffset(edge: Pick<DiagramEdge, "data">) {
  return normalizeEdgeBendOffset(edge.data?.bendOffset ?? DEFAULT_EDGE_BEND_OFFSET);
}

export function getEdgeWaypoints(edge: Pick<DiagramEdge, "data">) {
  return (edge.data?.waypoints ?? []).filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

export function normalizeEdgeBendOffset(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_EDGE_BEND_OFFSET;
  return Math.min(160, Math.max(0, Math.round(parsed)));
}

export function getEdgeStrokeWidth(edge: DiagramEdge) {
  return Number(edge.style?.strokeWidth ?? DEFAULT_EDGE_WIDTH);
}

export function getEdgeLabelColor(edge: DiagramEdge) {
  return String(edge.labelStyle?.fill ?? "#1f2937");
}

export function getEdgeLabelFontSize(edge: DiagramEdge) {
  return Number(edge.labelStyle?.fontSize ?? 12);
}

export function getEdgeLabelBackgroundFill(edge: DiagramEdge) {
  return String(edge.labelBgStyle?.fill ?? "#ffffff");
}

export function getEdgeLabelBackgroundOpacity(edge: DiagramEdge) {
  return Math.min(1, Math.max(0, Number(edge.labelBgStyle?.fillOpacity ?? 0.9)));
}

export function getEdgeDashMode(edge: DiagramEdge): EdgeDashMode {
  const dash = String(edge.style?.strokeDasharray ?? "");
  if (dash === EDGE_DASH_PATTERNS.dashed) return "dashed";
  if (dash === EDGE_DASH_PATTERNS.dotted) return "dotted";
  return "solid";
}

export function getEdgeArrowMode(edge: DiagramEdge): EdgeArrowMode {
  if (edge.markerStart && edge.markerEnd) return "both";
  if (edge.markerStart) return "start";
  if (edge.markerEnd) return "end";
  return "none";
}

export function getDiagramEdgePath({
  type,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  bendOffset,
  waypoints = []
}: {
  type: string;
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  bendOffset: number;
  waypoints?: EdgeWaypoint[];
}) {
  if (waypoints.length > 0) {
    return getManualEdgePath(sourceX, sourceY, targetX, targetY, waypoints);
  }

  if (type === "straight") {
    return getStraightPath({ sourceX, sourceY, targetX, targetY });
  }

  if (type === "bezier") {
    return getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: Math.min(1, Math.max(0, bendOffset / 80))
    });
  }

  return getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    offset: bendOffset,
    borderRadius: type === "step" ? 0 : 5
  });
}

export function getManualEdgePath(sourceX: number, sourceY: number, targetX: number, targetY: number, waypoints: EdgeWaypoint[]) {
  const points = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }];
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${formatSvgNumber(point.x)} ${formatSvgNumber(point.y)}`).join(" ");
  const labelPoint = getPolylineMidpoint(points);
  return [path, labelPoint.x, labelPoint.y] as [string, number, number];
}

export function formatSvgNumber(value: number) {
  return String(Math.round(value * 100) / 100);
}

export function getPolylineMidpoint(points: EdgeWaypoint[]) {
  const segments = points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    return { start, end, length };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (totalLength <= 0) return points[0] ?? { x: 0, y: 0 };
  let distance = totalLength / 2;
  for (const segment of segments) {
    if (distance <= segment.length) {
      const ratio = segment.length === 0 ? 0 : distance / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio
      };
    }
    distance -= segment.length;
  }
  return points[points.length - 1] ?? { x: 0, y: 0 };
}

export function getSvgEdgePath(edge: DiagramEdge, endpoints: EdgeEndpoints) {
  return getSvgEdgePathResult(edge, endpoints).path;
}

export function getSvgEdgePathResult(edge: DiagramEdge, endpoints: EdgeEndpoints) {
  const [path, labelX, labelY] = getDiagramEdgePath({
    type: String(edge.type ?? "smoothstep"),
    sourceX: endpoints.sx,
    sourceY: endpoints.sy,
    sourcePosition: endpoints.sourcePosition,
    targetX: endpoints.tx,
    targetY: endpoints.ty,
    targetPosition: endpoints.targetPosition,
    bendOffset: getEdgeBendOffset(edge),
    waypoints: getEdgeWaypoints(edge)
  });
  return { path, labelX, labelY: labelY - 8 };
}

export function getEdgeEndpoints(edge: DiagramEdge, nodes: DiagramNode[]) {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) return null;

  const sourceHandle = getNodeHandlePoint(source, edge.sourceHandle, "source");
  const targetHandle = getNodeHandlePoint(target, edge.targetHandle, "target");
  return {
    sx: sourceHandle.x,
    sy: sourceHandle.y,
    sourcePosition: sourceHandle.position,
    tx: targetHandle.x,
    ty: targetHandle.y,
    targetPosition: targetHandle.position
  };
}

export function getNodeHandlePoint(node: DiagramNode, handleId: string | null | undefined, role: "source" | "target") {
  const side = getNodeHandleSide(handleId, role);
  const rotate = (point: { x: number; y: number; position: Position }) => {
    const rotation = getNodeRotation(node.data);
    if (!rotation) return point;
    const center = { x: node.position.x + node.data.width / 2, y: node.position.y + node.data.height / 2 };
    const rotated = rotatePoint(point.x, point.y, center.x, center.y, rotation);
    return { ...point, x: rotated.x, y: rotated.y };
  };
  switch (side) {
    case "top":
      return rotate({ x: node.position.x + node.data.width / 2, y: node.position.y, position: Position.Top });
    case "right":
      return rotate({ x: node.position.x + node.data.width, y: node.position.y + node.data.height / 2, position: Position.Right });
    case "bottom":
      return rotate({ x: node.position.x + node.data.width / 2, y: node.position.y + node.data.height, position: Position.Bottom });
    case "left":
      return rotate({ x: node.position.x, y: node.position.y + node.data.height / 2, position: Position.Left });
  }
}

export function getNodeHandleSide(handleId: string | null | undefined, role: "source" | "target"): "top" | "right" | "bottom" | "left" {
  const side = String(handleId ?? "").split("-")[0];
  if (side === "top" || side === "right" || side === "bottom" || side === "left") return side;
  return role === "source" ? "right" : "left";
}

export function getEdgeLabelPosition(edge: DiagramEdge, nodes: DiagramNode[]) {
  const endpoints = getEdgeEndpoints(edge, nodes);
  if (!endpoints) return null;
  const { labelX, labelY } = getSvgEdgePathResult(edge, endpoints);
  return { x: labelX, y: labelY };
}
