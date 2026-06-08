import type { ReactFlowInstance } from "@xyflow/react";
import { useCallback } from "react";
import type { DiagramComment, DiagramEdge, DiagramNode, Selection } from "../../domain/types";
import {
  applyFocusViewport,
  prepareCommentFocusSelection,
  prepareEveryNodeFocusSelection,
  prepareNodeFocusSelection,
  type FocusSelectionResult
} from "../../editor/focusSelection";

export function useFocusSelectionWorkflow({
  nodes,
  edges,
  reactFlow,
  replaceGraph,
  setSelection
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  reactFlow: ReactFlowInstance<DiagramNode, DiagramEdge> | null;
  replaceGraph: (nextNodes: DiagramNode[], nextEdges: DiagramEdge[], shouldRecord?: boolean) => void;
  setSelection: (selection: Selection) => void;
}) {
  const applyFocusSelection = useCallback(
    (result: FocusSelectionResult) => {
      setSelection(result.selection);
      replaceGraph(result.nodes, result.edges, false);
      applyFocusViewport(reactFlow, result.viewport);
    },
    [reactFlow, replaceGraph, setSelection]
  );

  const focusNodeById = useCallback(
    (id: string) => {
      applyFocusSelection(prepareNodeFocusSelection(nodes, edges, id));
    },
    [applyFocusSelection, edges, nodes]
  );

  const focusCommentTarget = useCallback(
    (comment: DiagramComment) => {
      applyFocusSelection(prepareCommentFocusSelection(nodes, edges, comment));
    },
    [applyFocusSelection, edges, nodes]
  );

  const selectAllNodes = useCallback(() => {
    applyFocusSelection(prepareEveryNodeFocusSelection(nodes, edges));
  }, [applyFocusSelection, edges, nodes]);

  return {
    applyFocusSelection,
    focusNodeById,
    focusCommentTarget,
    selectAllNodes
  };
}
