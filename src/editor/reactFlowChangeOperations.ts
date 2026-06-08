import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  reconnectEdge,
  MarkerType,
  type Connection,
  type EdgeChange,
  type NodeChange
} from "@xyflow/react";
import {
  DEFAULT_EDGE_BEND_OFFSET,
  DEFAULT_EDGE_STROKE,
  DEFAULT_EDGE_WIDTH
} from "../domain/diagramDefaults";
import type { DiagramEdge, DiagramNode } from "../domain/types";

type DimensionChange = NodeChange<DiagramNode> & { type: "dimensions"; dimensions: { width: number; height: number } };

export function applyLockedAwareNodeChanges(nodes: DiagramNode[], changes: NodeChange<DiagramNode>[]) {
  const lockedIds = new Set(nodes.filter((node) => node.data.locked).map((node) => node.id));
  const allowedChanges = changes.filter((change) => {
    if (!("id" in change) || !lockedIds.has(change.id)) return true;
    return change.type !== "position" && change.type !== "dimensions";
  });
  const dimensionChanges = allowedChanges.filter(
    (change): change is DimensionChange => change.type === "dimensions" && Boolean(change.dimensions)
  );
  const dimensions = new Map(dimensionChanges.map((change) => [change.id, change.dimensions]));
  const shouldRecordSnapshot = allowedChanges.some((change) => change.type === "dimensions" && change.resizing === false);
  const changed = applyNodeChanges(allowedChanges, nodes) as DiagramNode[];

  if (dimensions.size === 0) {
    return { nodes: changed, shouldRecordSnapshot };
  }

  return {
    nodes: changed.map((node) => {
      const nextSize = dimensions.get(node.id);
      if (!nextSize) return node;
      return {
        ...node,
        data: {
          ...node.data,
          width: Math.round(nextSize.width),
          height: Math.round(nextSize.height)
        }
      };
    }),
    shouldRecordSnapshot
  };
}

export function applyDiagramEdgeChanges(edges: DiagramEdge[], changes: EdgeChange<DiagramEdge>[]) {
  return applyEdgeChanges(changes, edges) as DiagramEdge[];
}

export function connectDiagramEdge(edges: DiagramEdge[], connection: Connection, idSeed = Date.now()) {
  return addEdge(
    {
      ...connection,
      id: `edge-${idSeed}`,
      type: "smoothstep",
      data: { bendOffset: DEFAULT_EDGE_BEND_OFFSET },
      markerEnd: edgeMarker(DEFAULT_EDGE_STROKE),
      style: { stroke: DEFAULT_EDGE_STROKE, strokeWidth: DEFAULT_EDGE_WIDTH }
    },
    edges
  ) as DiagramEdge[];
}

export function reconnectDiagramEdge(edges: DiagramEdge[], oldEdge: DiagramEdge, connection: Connection) {
  return reconnectEdge(oldEdge, connection, edges) as DiagramEdge[];
}

function edgeMarker(color: string) {
  return { type: MarkerType.ArrowClosed, width: 16, height: 16, color };
}
