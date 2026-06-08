import type { CanvasSettings, DiagramComment, DiagramEdge, DiagramNode, DiagramPage, Snapshot } from "../domain/types";

export type DocumentJsonExport = {
  pages: DiagramPage[];
  activePageId: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  comments: DiagramComment[];
  settings: CanvasSettings;
};

export function buildDocumentJsonExport(payload: DocumentJsonExport) {
  return JSON.stringify(payload, null, 2);
}

export function getVisibleGraph(nodes: DiagramNode[], edges: DiagramEdge[]): Snapshot {
  const visibleNodes = nodes.filter((node) => !node.hidden);
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter((item) => !item.hidden && visibleNodeIds.has(item.source) && visibleNodeIds.has(item.target));
  return { nodes: visibleNodes, edges: visibleEdges };
}
