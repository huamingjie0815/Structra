import { useCallback, type RefObject } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import type { DiagramDocument, DiagramEdge, DiagramNode, ShapeKind } from "../../domain/types";
import { replaceActivePageGraphCommand } from "../../editor/commands";
import type { HistoryEntry } from "../../editor/history";
import { createShapeInsertion } from "./shapeCreation";

export function useShapeInsertionWorkflow({
  nodes,
  edges,
  currentDocument,
  activePageId,
  canvasRegionRef,
  reactFlow,
  applyDocumentTransaction
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  currentDocument: DiagramDocument;
  activePageId: string;
  canvasRegionRef: RefObject<HTMLElement>;
  reactFlow: ReactFlowInstance<DiagramNode, DiagramEdge> | null;
  applyDocumentTransaction: (entry: HistoryEntry) => void;
}) {
  return useCallback(
    (kind: ShapeKind, position?: { x: number; y: number }) => {
      const canvasBounds = canvasRegionRef.current?.getBoundingClientRect();
      const fallbackPoint = canvasBounds
        ? { x: canvasBounds.left + canvasBounds.width / 2, y: canvasBounds.top + canvasBounds.height / 2 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const fallback =
        reactFlow?.screenToFlowPosition({ x: fallbackPoint.x, y: fallbackPoint.y }) ?? { x: 260 + nodes.length * 20, y: 160 + nodes.length * 18 };
      const result = createShapeInsertion({
        kind,
        nodes,
        edges,
        center: position ?? fallback,
        placement: position ? "centered" : "available",
        id: `node-${Date.now()}`
      });
      const entry = replaceActivePageGraphCommand(currentDocument, activePageId, result.nodes, result.edges, result.selection);
      if (entry) {
        applyDocumentTransaction(entry);
      }
    },
    [activePageId, applyDocumentTransaction, canvasRegionRef, currentDocument, edges, nodes, reactFlow]
  );
}
