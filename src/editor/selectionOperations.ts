import type { DiagramComment, DiagramEdge, DiagramNode, Selection } from "../domain/types";
import { getGroupSelectionIds } from "./selection";

export type GraphSelectionResult = {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selection: Selection;
  selectedNodeIds: Set<string>;
};

export function selectNodeGroup(nodes: DiagramNode[], edges: DiagramEdge[], id: string): GraphSelectionResult {
  const selectedNodeIds = getGroupSelectionIds(nodes, id);
  return {
    nodes: nodes.map((node) => ({ ...node, selected: selectedNodeIds.has(node.id) })),
    edges: edges.map((edge) => ({ ...edge, selected: false })),
    selection: { type: "node", id },
    selectedNodeIds
  };
}

export function selectSingleNode(nodes: DiagramNode[], edges: DiagramEdge[], id: string): GraphSelectionResult {
  const selectedNodeIds = new Set([id]);
  return {
    nodes: nodes.map((node) => ({ ...node, selected: node.id === id })),
    edges: edges.map((edge) => ({ ...edge, selected: false })),
    selection: { type: "node", id },
    selectedNodeIds
  };
}

export function selectSingleEdge(nodes: DiagramNode[], edges: DiagramEdge[], id: string): GraphSelectionResult {
  return {
    nodes: nodes.map((node) => ({ ...node, selected: false })),
    edges: edges.map((edge) => ({ ...edge, selected: edge.id === id })),
    selection: { type: "edge", id },
    selectedNodeIds: new Set()
  };
}

export function clearGraphSelection(nodes: DiagramNode[], edges: DiagramEdge[]): GraphSelectionResult {
  return {
    nodes: nodes.map((node) => ({ ...node, selected: false })),
    edges: edges.map((edge) => ({ ...edge, selected: false })),
    selection: null,
    selectedNodeIds: new Set()
  };
}

export function selectEveryNode(nodes: DiagramNode[], edges: DiagramEdge[]): GraphSelectionResult {
  return {
    nodes: nodes.map((node) => ({ ...node, selected: true })),
    edges: edges.map((edge) => ({ ...edge, selected: false })),
    selection: null,
    selectedNodeIds: new Set(nodes.map((node) => node.id))
  };
}

export function selectCommentTarget(nodes: DiagramNode[], edges: DiagramEdge[], comment: DiagramComment): GraphSelectionResult {
  if (comment.target === "node" && comment.targetId) {
    return selectNodeGroup(nodes, edges, comment.targetId);
  }
  if (comment.target === "edge" && comment.targetId) {
    return selectSingleEdge(nodes, edges, comment.targetId);
  }
  return clearGraphSelection(nodes, edges);
}
