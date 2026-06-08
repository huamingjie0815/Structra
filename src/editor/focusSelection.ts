import type { FitViewOptions, ReactFlowInstance } from "@xyflow/react";
import type { DiagramComment, DiagramEdge, DiagramNode } from "../domain/types";
import {
  selectCommentTarget,
  selectEveryNode,
  selectNodeGroup,
  type GraphSelectionResult
} from "./selectionOperations";

export type FocusViewportIntent =
  | { type: "nodes"; nodeIds: string[]; padding: number; duration: number }
  | { type: "canvas"; x: number; y: number; minZoom: number; duration: number }
  | null;

export type FocusSelectionResult = GraphSelectionResult & {
  viewport: FocusViewportIntent;
};

function withNodeViewport(selection: GraphSelectionResult, duration: number): FocusSelectionResult {
  return {
    ...selection,
    viewport: {
      type: "nodes",
      nodeIds: Array.from(selection.selectedNodeIds),
      padding: 0.35,
      duration
    }
  };
}

export function prepareNodeFocusSelection(nodes: DiagramNode[], edges: DiagramEdge[], id: string, duration = 240): FocusSelectionResult {
  return withNodeViewport(selectNodeGroup(nodes, edges, id), duration);
}

export function prepareEveryNodeFocusSelection(nodes: DiagramNode[], edges: DiagramEdge[]): FocusSelectionResult {
  return {
    ...selectEveryNode(nodes, edges),
    viewport: null
  };
}

export function prepareCommentFocusSelection(nodes: DiagramNode[], edges: DiagramEdge[], comment: DiagramComment, duration = 220): FocusSelectionResult {
  const selection = selectCommentTarget(nodes, edges, comment);
  if (selection.selection?.type === "node") {
    return withNodeViewport(selection, duration);
  }
  if (selection.selection?.type === "edge") {
    return { ...selection, viewport: null };
  }
  return {
    ...selection,
    viewport: { type: "canvas", x: comment.x, y: comment.y, minZoom: 0.9, duration }
  };
}

export function applyFocusViewport(reactFlow: ReactFlowInstance<DiagramNode, DiagramEdge> | null, viewport: FocusViewportIntent) {
  if (!reactFlow || !viewport) return;
  if (viewport.type === "nodes") {
    reactFlow.fitView({
      nodes: viewport.nodeIds.map((id) => ({ id })),
      padding: viewport.padding,
      duration: viewport.duration
    } as FitViewOptions<DiagramNode>);
    return;
  }
  reactFlow.setCenter(viewport.x, viewport.y, {
    zoom: Math.max(reactFlow.getZoom(), viewport.minZoom),
    duration: viewport.duration
  });
}
