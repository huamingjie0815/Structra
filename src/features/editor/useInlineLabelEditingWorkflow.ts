import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import type { ContextMenuState, DiagramDocument, DiagramEdge, DiagramNode, EdgeLabelDraft, NodeLabelDraft, Selection } from "../../domain/types";
import { commitEdgeLabelCommand, commitNodeLabelCommand } from "../../editor/commands";
import { getEdgeLabelPosition } from "../../editor/edgeGeometry";
import type { HistoryEntry } from "../../editor/history";
import { selectSingleEdge, selectSingleNode } from "../../editor/selectionOperations";

export function useInlineLabelEditingWorkflow({
  nodes,
  edges,
  currentDocument,
  activePageId,
  nodesRef,
  edgesRef,
  setNodes,
  setEdges,
  setSelection,
  setContextMenu,
  applyDocumentTransaction
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  currentDocument: DiagramDocument;
  activePageId: string;
  nodesRef: MutableRefObject<DiagramNode[]>;
  edgesRef: MutableRefObject<DiagramEdge[]>;
  setNodes: (nodes: DiagramNode[]) => void;
  setEdges: (edges: DiagramEdge[]) => void;
  setSelection: (selection: Selection) => void;
  setContextMenu: (contextMenu: ContextMenuState) => void;
  applyDocumentTransaction: (entry: HistoryEntry) => void;
}) {
  const [editingNodeLabel, setEditingNodeLabel] = useState<NodeLabelDraft>(null);
  const [editingEdgeLabel, setEditingEdgeLabel] = useState<EdgeLabelDraft>(null);
  const nodeEditorRef = useRef<HTMLTextAreaElement>(null);
  const edgeEditorRef = useRef<HTMLTextAreaElement>(null);

  const editingNode = useMemo(
    () => (editingNodeLabel ? nodes.find((node) => node.id === editingNodeLabel.id) : undefined),
    [editingNodeLabel, nodes]
  );
  const editingEdge = useMemo(
    () => (editingEdgeLabel ? edges.find((edge) => edge.id === editingEdgeLabel.id) : undefined),
    [editingEdgeLabel, edges]
  );
  const editingEdgePosition = useMemo(
    () => (editingEdge ? getEdgeLabelPosition(editingEdge, nodes) : null),
    [editingEdge, nodes]
  );

  useEffect(() => {
    if (!editingNodeLabel) return;
    const editor = nodeEditorRef.current;
    if (!editor) return;
    editor.focus();
    editor.select();
  }, [editingNodeLabel?.id]);

  useEffect(() => {
    if (!editingEdgeLabel) return;
    const editor = edgeEditorRef.current;
    if (!editor) return;
    editor.focus();
    editor.select();
  }, [editingEdgeLabel?.id]);

  const startNodeLabelEdit = useCallback(
    (id: string) => {
      const node = nodesRef.current.find((item) => item.id === id);
      if (!node) return;
      setContextMenu(null);
      setEditingEdgeLabel(null);
      const graphSelection = selectSingleNode(nodesRef.current, edgesRef.current, id);
      setSelection(graphSelection.selection);
      setNodes(graphSelection.nodes);
      setEdges(graphSelection.edges);
      setEditingNodeLabel({ id, value: node.data.label });
    },
    [edgesRef, nodesRef, setContextMenu, setEdges, setNodes, setSelection]
  );

  const commitNodeLabelEdit = useCallback(() => {
    if (!editingNodeLabel) return;
    const entry = commitNodeLabelCommand(currentDocument, activePageId, editingNodeLabel.id, editingNodeLabel.value);
    setEditingNodeLabel(null);
    if (entry) {
      applyDocumentTransaction(entry);
    }
  }, [activePageId, applyDocumentTransaction, currentDocument, editingNodeLabel]);

  const cancelNodeLabelEdit = useCallback(() => {
    setEditingNodeLabel(null);
  }, []);

  const editNodeLabel = useCallback(
    (id: string) => {
      startNodeLabelEdit(id);
    },
    [startNodeLabelEdit]
  );

  const startEdgeLabelEdit = useCallback(
    (id: string) => {
      const edge = edgesRef.current.find((item) => item.id === id);
      if (!edge) return;
      setContextMenu(null);
      setEditingNodeLabel(null);
      const graphSelection = selectSingleEdge(nodesRef.current, edgesRef.current, id);
      setSelection(graphSelection.selection);
      setNodes(graphSelection.nodes);
      setEdges(graphSelection.edges);
      setEditingEdgeLabel({ id, value: String(edge.label ?? "") });
    },
    [edgesRef, nodesRef, setContextMenu, setEdges, setNodes, setSelection]
  );

  const commitEdgeLabelEdit = useCallback(() => {
    if (!editingEdgeLabel) return;
    const entry = commitEdgeLabelCommand(currentDocument, activePageId, editingEdgeLabel.id, editingEdgeLabel.value);
    setEditingEdgeLabel(null);
    if (entry) {
      applyDocumentTransaction(entry);
    }
  }, [activePageId, applyDocumentTransaction, currentDocument, editingEdgeLabel]);

  const cancelEdgeLabelEdit = useCallback(() => {
    setEditingEdgeLabel(null);
  }, []);

  const editEdgeLabel = useCallback(
    (id: string) => {
      startEdgeLabelEdit(id);
    },
    [startEdgeLabelEdit]
  );

  return {
    nodeEditorRef,
    edgeEditorRef,
    editingNode,
    editingNodeLabel,
    editingEdge,
    editingEdgeLabel,
    editingEdgePosition,
    setEditingNodeLabel,
    setEditingEdgeLabel,
    startNodeLabelEdit,
    commitNodeLabelEdit,
    cancelNodeLabelEdit,
    editNodeLabel,
    startEdgeLabelEdit,
    commitEdgeLabelEdit,
    cancelEdgeLabelEdit,
    editEdgeLabel
  };
}
