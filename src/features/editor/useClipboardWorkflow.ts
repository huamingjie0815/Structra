import { useCallback, useRef, useState } from "react";
import type { DiagramComment, DiagramDocument, DiagramEdge, DiagramNode, Selection } from "../../domain/types";
import {
  copySelectedNodes,
  cutSelectedNodes,
  deleteSelectionFromGraph,
  duplicateSelectedNodes,
  pasteClipboardSnapshot
} from "../../editor/graphOperations";
import { replaceActivePageSnapshotCommand } from "../../editor/commands";
import type { HistoryEntry } from "../../editor/history";

export function useClipboardWorkflow({
  nodes,
  edges,
  comments,
  currentDocument,
  activePageId,
  selectedNodes,
  selectedNodeIds,
  selectedEdgeIds,
  selection,
  applyDocumentTransaction
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  comments: DiagramComment[];
  currentDocument: DiagramDocument;
  activePageId: string;
  selectedNodes: DiagramNode[];
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  selection: Selection;
  applyDocumentTransaction: (entry: HistoryEntry) => void;
}) {
  const [canPaste, setCanPaste] = useState(false);
  const clipboardRef = useRef<{ nodes: DiagramNode[]; edges: DiagramEdge[]; comments?: DiagramComment[] } | null>(null);
  const pasteCountRef = useRef(0);

  const commitSnapshot = useCallback(
    (nextNodes: DiagramNode[], nextEdges: DiagramEdge[], nextSelection: Selection, nextComments?: DiagramComment[]) => {
      const entry = replaceActivePageSnapshotCommand(
        currentDocument,
        activePageId,
        { nodes: nextNodes, edges: nextEdges, comments: nextComments },
        nextSelection
      );
      if (entry) {
        applyDocumentTransaction(entry);
      }
    },
    [activePageId, applyDocumentTransaction, currentDocument]
  );

  const copySelection = useCallback(() => {
    const clipboard = copySelectedNodes(selectedNodes, edges);
    if (!clipboard) return;
    clipboardRef.current = clipboard;
    pasteCountRef.current = 0;
    setCanPaste(true);
  }, [edges, selectedNodes]);

  const pasteClipboard = useCallback(() => {
    const clipboard = clipboardRef.current;
    if (!clipboard || clipboard.nodes.length === 0) return;

    pasteCountRef.current += 1;
    const result = pasteClipboardSnapshot(nodes, edges, clipboard, pasteCountRef.current, Date.now());
    if (!result) return;
    commitSnapshot(result.nodes, result.edges, result.selection);
  }, [commitSnapshot, edges, nodes]);

  const cutSelection = useCallback(() => {
    const result = cutSelectedNodes(nodes, edges, selectedNodes);
    if (!result) return;
    clipboardRef.current = result.clipboard;
    pasteCountRef.current = 0;
    setCanPaste(true);
    commitSnapshot(result.nodes, result.edges, result.selection);
  }, [commitSnapshot, edges, nodes, selectedNodes]);

  const duplicateSelection = useCallback(() => {
    const result = duplicateSelectedNodes(nodes, edges, selectedNodes, Date.now());
    if (!result) return;
    commitSnapshot(result.nodes, result.edges, result.selection);
  }, [commitSnapshot, edges, nodes, selectedNodes]);

  const deleteSelection = useCallback(() => {
    const result = deleteSelectionFromGraph(nodes, edges, comments, selection, selectedNodeIds, selectedEdgeIds);
    if (!result) return;
    commitSnapshot(result.nodes, result.edges, result.selection, result.comments);
  }, [comments, commitSnapshot, edges, nodes, selectedEdgeIds, selectedNodeIds, selection]);

  return {
    canPaste,
    copySelection,
    pasteClipboard,
    cutSelection,
    duplicateSelection,
    deleteSelection
  };
}
