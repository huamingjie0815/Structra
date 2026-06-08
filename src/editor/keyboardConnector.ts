import type { Connection } from "@xyflow/react";
import type { DiagramNode } from "../domain/types";

export type KeyboardConnectorState = {
  sourceNodeId: string | null;
};

export function startKeyboardConnector(selectedNodes: DiagramNode[]): KeyboardConnectorState {
  const source = selectedNodes.length === 1 && !selectedNodes[0].data.locked ? selectedNodes[0] : null;
  return { sourceNodeId: source?.id ?? null };
}

export function buildKeyboardConnectorConnection(state: KeyboardConnectorState, selectedNodes: DiagramNode[]): Connection | null {
  const target = selectedNodes.length === 1 && !selectedNodes[0].data.locked ? selectedNodes[0] : null;
  if (!state.sourceNodeId || !target || state.sourceNodeId === target.id) return null;
  return {
    source: state.sourceNodeId,
    target: target.id,
    sourceHandle: "right-source",
    targetHandle: "left-target"
  };
}
