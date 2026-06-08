import { useCallback } from "react";
import type { AlignAction, AutoLayoutMode, DiagramDocument, DiagramEdge, DiagramNode, DiagramNodeData, FormatSnapshot, MatchSizeAction, Selection } from "../../domain/types";
import { getAutoRouteWaypoints } from "../../editor/autoRoute";
import { replaceActivePageGraphCommand } from "../../editor/commands";
import {
  applyEdgePatch,
  applyEdgePatchToIds,
  applyEdgeWaypoints,
  applyFormatSnapshot,
  appendStructuredNode as appendStructuredNodeOperation,
  applyNodeDataPatch,
  applyNodeDataPatchToIds,
  applyNodePositionPatch,
  autoLayoutMindMapNodes,
  autoLayoutNodes,
  autoLayoutOrgChartNodes,
  moveLayerNode as moveLayerNodeOperation,
  setNodeHiddenWithEdges,
  setNodeLockedById,
  setNodeLockedByIds
} from "../../editor/elementOperations";
import {
  alignNodes,
  groupSelectedNodes,
  matchNodeSizes,
  nudgeNodes,
  reorderNodes,
  ungroupSelectedNodes
} from "../../editor/graphOperations";
import type { HistoryEntry } from "../../editor/history";

export function useElementEditingWorkflow({
  nodes,
  edges,
  currentDocument,
  activePageId,
  selectedNode,
  selectedNodes,
  selectedEdge,
  selectedEdges,
  selectedNodeIds,
  selectedEdgeIds,
  selection,
  applyDocumentTransaction
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  currentDocument: DiagramDocument;
  activePageId: string;
  selectedNode: DiagramNode | undefined;
  selectedNodes: DiagramNode[];
  selectedEdge: DiagramEdge | undefined;
  selectedEdges: DiagramEdge[];
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  selection: Selection;
  applyDocumentTransaction: (entry: HistoryEntry, fitView?: boolean) => void;
}) {
  const commitGraph = useCallback(
    (nextNodes: DiagramNode[], nextEdges: DiagramEdge[], nextSelection: Selection = selection, fitView = false) => {
      const entry = replaceActivePageGraphCommand(currentDocument, activePageId, nextNodes, nextEdges, nextSelection);
      if (entry) {
        applyDocumentTransaction(entry, fitView);
      }
    },
    [activePageId, applyDocumentTransaction, currentDocument, selection]
  );

  const updateNodeData = useCallback(
    (patch: Partial<DiagramNodeData>) => {
      if (!selectedNode) return;
      commitGraph(applyNodeDataPatch(nodes, selectedNode.id, patch), edges);
    },
    [commitGraph, edges, nodes, selectedNode]
  );

  const updateNodePosition = useCallback(
    (patch: Partial<{ x: number; y: number }>) => {
      if (!selectedNode) return;
      const nextNodes = applyNodePositionPatch(nodes, selectedNode.id, patch);
      if (!nextNodes) return;
      commitGraph(nextNodes, edges);
    },
    [commitGraph, edges, nodes, selectedNode]
  );

  const updateSelectedNodes = useCallback(
    (patch: Partial<DiagramNodeData>) => {
      if (selectedNodes.length < 2) return;
      commitGraph(applyNodeDataPatchToIds(nodes, new Set(selectedNodes.map((node) => node.id)), patch), edges);
    },
    [commitGraph, edges, nodes, selectedNodes]
  );

  const setSelectedNodesLocked = useCallback(
    (locked: boolean) => {
      if (selectedNodes.length === 0) return;
      commitGraph(setNodeLockedByIds(nodes, new Set(selectedNodes.map((node) => node.id)), locked), edges);
    },
    [commitGraph, edges, nodes, selectedNodes]
  );

  const setNodeLocked = useCallback(
    (id: string, locked: boolean) => {
      commitGraph(setNodeLockedById(nodes, id, locked), edges);
    },
    [commitGraph, edges, nodes]
  );

  const updateSelectedEdges = useCallback(
    (patch: Partial<DiagramEdge>) => {
      if (selectedEdges.length < 2) return;
      commitGraph(nodes, applyEdgePatchToIds(edges, new Set(selectedEdges.map((edge) => edge.id)), patch));
    },
    [commitGraph, edges, nodes, selectedEdges]
  );

  const groupSelection = useCallback(() => {
    const nextNodes = groupSelectedNodes(nodes, selectedNodes, `group-${Date.now()}`);
    if (!nextNodes) return;
    commitGraph(nextNodes, edges);
  }, [commitGraph, edges, nodes, selectedNodes]);

  const ungroupSelection = useCallback(() => {
    const nextNodes = ungroupSelectedNodes(nodes, selectedNodes);
    if (!nextNodes) return;
    commitGraph(nextNodes, edges);
  }, [commitGraph, edges, nodes, selectedNodes]);

  const updateEdge = useCallback(
    (patch: Partial<DiagramEdge>) => {
      if (!selectedEdge) return;
      commitGraph(nodes, applyEdgePatch(edges, selectedEdge.id, patch));
    },
    [commitGraph, edges, nodes, selectedEdge]
  );

  const autoRouteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    const waypoints = getAutoRouteWaypoints(selectedEdge, nodes);
    if (!waypoints) return;
    commitGraph(nodes, applyEdgeWaypoints(edges, selectedEdge.id, waypoints));
  }, [commitGraph, edges, nodes, selectedEdge]);

  const applyFormat = useCallback(
    (format: FormatSnapshot | null) => {
      const result = applyFormatSnapshot(nodes, edges, selectedNodeIds, selectedEdgeIds, format);
      if (!result) return;
      commitGraph(result.nodes, result.edges);
    },
    [commitGraph, edges, nodes, selectedEdgeIds, selectedNodeIds]
  );

  const nudgeSelectedNodes = useCallback(
    (dx: number, dy: number) => {
      const nextNodes = nudgeNodes(nodes, selectedNodes, dx, dy);
      if (!nextNodes) return;
      commitGraph(nextNodes, edges);
    },
    [commitGraph, edges, nodes, selectedNodes]
  );

  const alignSelected = useCallback(
    (action: AlignAction) => {
      const nextNodes = alignNodes(nodes, selectedNodes, action);
      if (!nextNodes) return;
      commitGraph(nextNodes, edges);
    },
    [commitGraph, edges, nodes, selectedNodes]
  );

  const matchSelectedNodeSize = useCallback(
    (action: MatchSizeAction) => {
      const nextNodes = matchNodeSizes(nodes, selectedNodes, action);
      if (!nextNodes) return;
      commitGraph(nextNodes, edges);
    },
    [commitGraph, edges, nodes, selectedNodes]
  );

  const reorderSelection = useCallback(
    (direction: "front" | "back") => {
      const nextNodes = reorderNodes(nodes, selectedNodeIds, direction);
      if (!nextNodes) return;
      commitGraph(nextNodes, edges);
    },
    [commitGraph, edges, nodes, selectedNodeIds]
  );

  const autoLayout = useCallback(
    (direction: AutoLayoutMode) => {
      const targets = selectedNodes.length > 1 ? selectedNodes : nodes;
      const nextNodes =
        direction === "mind"
          ? autoLayoutMindMapNodes(nodes, targets)
          : direction === "org"
            ? autoLayoutOrgChartNodes(nodes, targets, edges)
            : autoLayoutNodes(nodes, targets, direction);
      if (!nextNodes) return;
      commitGraph(nextNodes, edges, selection, true);
    },
    [commitGraph, edges, nodes, selectedNodes, selection]
  );

  const appendStructuredNode = useCallback(
    (mode: "child" | "sibling") => {
      const result = appendStructuredNodeOperation({
        nodes,
        edges,
        selectedNode,
        mode
      });
      if (!result) return false;
      commitGraph(result.nodes, result.edges, result.selection, true);
      return true;
    },
    [commitGraph, edges, nodes, selectedNode]
  );

  const setNodeHidden = useCallback(
    (id: string, hidden: boolean) => {
      const result = setNodeHiddenWithEdges(nodes, edges, id, hidden);
      const nextSelection = hidden && selection?.type === "node" && selection.id === id ? null : selection;
      commitGraph(result.nodes, result.edges, nextSelection);
    },
    [commitGraph, edges, nodes, selection]
  );

  const moveLayerNode = useCallback(
    (id: string, direction: "up" | "down") => {
      const nextNodes = moveLayerNodeOperation(nodes, id, direction);
      if (!nextNodes) return;
      commitGraph(nextNodes, edges);
    },
    [commitGraph, edges, nodes]
  );

  return {
    updateNodeData,
    updateNodePosition,
    updateSelectedNodes,
    setSelectedNodesLocked,
    setNodeLocked,
    updateSelectedEdges,
    groupSelection,
    ungroupSelection,
    updateEdge,
    autoRouteSelectedEdge,
    applyFormat,
    nudgeSelectedNodes,
    alignSelected,
    matchSelectedNodeSize,
    reorderSelection,
    autoLayout,
    appendStructuredNode,
    setNodeHidden,
    moveLayerNode
  };
}
