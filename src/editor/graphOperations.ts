import { cloneSnapshot } from "../domain/diagramDefaults";
import type { AlignAction, ClipboardSnapshot, DiagramComment, DiagramEdge, DiagramNode, DiagramNodeData, MatchSizeAction, Selection, Snapshot } from "../domain/types";
import { getNodeBounds } from "./geometry";

export function copySelectedNodes(selectedNodes: DiagramNode[], edges: DiagramEdge[]): ClipboardSnapshot {
  if (selectedNodes.length === 0) return null;
  const nodeIds = new Set(selectedNodes.map((node) => node.id));
  const copiedNodes = selectedNodes.map((node) => ({ ...node, selected: false }));
  const copiedEdges = edges
    .filter((item) => nodeIds.has(item.source) && nodeIds.has(item.target))
    .map((item) => ({ ...item, selected: false }));
  return cloneSnapshot(copiedNodes, copiedEdges);
}

export function pasteClipboardSnapshot(nodes: DiagramNode[], edges: DiagramEdge[], clipboard: Snapshot, pasteCount: number, stamp: number) {
  if (clipboard.nodes.length === 0) return null;

  const offset = 34 * pasteCount;
  const idMap = new Map(clipboard.nodes.map((node, index) => [node.id, `node-${stamp}-${index}`]));
  const groupMap = createGroupIdMap(clipboard.nodes, stamp);
  const pastedNodes = clipboard.nodes.map((node) => {
    const id = idMap.get(node.id) ?? `node-${stamp}`;
    return {
      ...node,
      id,
      selected: true,
      position: { x: node.position.x + offset, y: node.position.y + offset },
      data: remapNodeGroup(node.data, groupMap)
    };
  });
  const pastedEdges = clipboard.edges.map((item, index) => ({
    ...item,
    id: `edge-${stamp}-${index}`,
    source: idMap.get(item.source) ?? item.source,
    target: idMap.get(item.target) ?? item.target,
    selected: false
  }));
  return {
    nodes: [...nodes.map((node) => ({ ...node, selected: false })), ...pastedNodes],
    edges: [...edges.map((item) => ({ ...item, selected: false })), ...pastedEdges],
    selection: { type: "node", id: pastedNodes[0].id } as Selection
  };
}

export function cutSelectedNodes(nodes: DiagramNode[], edges: DiagramEdge[], selectedNodes: DiagramNode[]) {
  if (selectedNodes.length === 0) return null;
  const unlockedNodes = selectedNodes.filter((node) => !node.data.locked);
  if (unlockedNodes.length === 0) return null;
  const nodeIds = new Set(unlockedNodes.map((node) => node.id));
  const copiedEdges = edges
    .filter((item) => nodeIds.has(item.source) && nodeIds.has(item.target))
    .map((item) => ({ ...item, selected: false }));
  return {
    clipboard: cloneSnapshot(unlockedNodes.map((node) => ({ ...node, selected: false })), copiedEdges),
    nodes: nodes.filter((node) => !nodeIds.has(node.id)),
    edges: edges.filter((item) => !nodeIds.has(item.source) && !nodeIds.has(item.target)),
    selection: null as Selection
  };
}

export function duplicateSelectedNodes(nodes: DiagramNode[], edges: DiagramEdge[], selectedNodes: DiagramNode[], stamp: number) {
  const unlockedNodes = selectedNodes.filter((node) => !node.data.locked);
  if (unlockedNodes.length === 0) return null;

  const idMap = new Map(unlockedNodes.map((node, index) => [node.id, `node-${stamp}-${index}`]));
  const groupMap = createGroupIdMap(unlockedNodes, stamp);
  const duplicates = unlockedNodes.map((node) => {
    const id = idMap.get(node.id) ?? `node-${stamp}`;
    return {
      ...node,
      id,
      selected: true,
      position: { x: node.position.x + 34, y: node.position.y + 34 },
      data: {
        ...remapNodeGroup(node.data, groupMap),
        label: unlockedNodes.length === 1 ? `${node.data.label} 副本` : node.data.label
      }
    };
  });
  const duplicatedEdges = edges
    .filter((item) => idMap.has(item.source) && idMap.has(item.target))
    .map((item, index) => ({
      ...item,
      id: `edge-${stamp}-${index}`,
      source: idMap.get(item.source) ?? item.source,
      target: idMap.get(item.target) ?? item.target,
      selected: false
    }));
  return {
    nodes: [...nodes.map((node) => ({ ...node, selected: false })), ...duplicates],
    edges: [...edges.map((item) => ({ ...item, selected: false })), ...duplicatedEdges],
    selection: { type: "node", id: duplicates[0].id } as Selection
  };
}

export function deleteSelectionFromGraph(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  comments: DiagramComment[],
  selection: Selection,
  selectedNodeIds: Set<string>,
  selectedEdgeIds: Set<string>
) {
  if (!selection && selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return null;

  const nodeIds = selectedNodeIds.size > 0 ? selectedNodeIds : new Set(selection?.type === "node" ? [selection.id] : []);
  const edgeIds = selectedEdgeIds.size > 0 ? selectedEdgeIds : new Set(selection?.type === "edge" ? [selection.id] : []);
  const removableNodeIds = new Set(nodes.filter((node) => nodeIds.has(node.id) && !node.data.locked).map((node) => node.id));
  const nextNodes = nodes.filter((node) => !removableNodeIds.has(node.id));
  const nextEdges = edges.filter((item) => !edgeIds.has(item.id) && !removableNodeIds.has(item.source) && !removableNodeIds.has(item.target));
  const removedEdgeIds = new Set(edges.filter((item) => !nextEdges.some((nextEdge) => nextEdge.id === item.id)).map((item) => item.id));
  const nextComments = comments.filter((comment) => {
    if (comment.target === "node") return !comment.targetId || !removableNodeIds.has(comment.targetId);
    if (comment.target === "edge") return !comment.targetId || !removedEdgeIds.has(comment.targetId);
    return true;
  });
  return { nodes: nextNodes, edges: nextEdges, comments: nextComments, selection: null as Selection };
}

export function groupSelectedNodes(nodes: DiagramNode[], selectedNodes: DiagramNode[], groupId: string) {
  const unlockedNodes = selectedNodes.filter((node) => !node.data.locked);
  if (unlockedNodes.length < 2) return null;
  const ids = new Set(unlockedNodes.map((node) => node.id));
  return nodes.map((node) => (ids.has(node.id) ? { ...node, data: { ...node.data, groupId } } : node));
}

export function ungroupSelectedNodes(nodes: DiagramNode[], selectedNodes: DiagramNode[]) {
  const groupIds = new Set(selectedNodes.filter((node) => !node.data.locked).map((node) => node.data.groupId).filter(Boolean));
  if (groupIds.size === 0) return null;
  return nodes.map((node) => {
    if (node.data.locked) return node;
    if (!node.data.groupId || !groupIds.has(node.data.groupId)) return node;
    const { groupId, ...data } = node.data;
    return { ...node, data };
  });
}

export function nudgeNodes(nodes: DiagramNode[], selectedNodes: DiagramNode[], dx: number, dy: number) {
  const movableIds = new Set(selectedNodes.filter((node) => !node.data.locked).map((node) => node.id));
  if (movableIds.size === 0) return null;

  return nodes.map((node) =>
    movableIds.has(node.id)
      ? {
          ...node,
          position: {
            x: node.position.x + dx,
            y: node.position.y + dy
          }
        }
      : node
  );
}

export function alignNodes(nodes: DiagramNode[], selectedNodes: DiagramNode[], action: AlignAction) {
  const unlockedNodes = selectedNodes.filter((node) => !node.data.locked);
  if (unlockedNodes.length < 2) return null;

  const bounds = getNodeBounds(unlockedNodes);
  const selectedIds = new Set(unlockedNodes.map((node) => node.id));
  const sortedX = [...unlockedNodes].sort((a, b) => a.position.x - b.position.x);
  const sortedY = [...unlockedNodes].sort((a, b) => a.position.y - b.position.y);
  const xGap =
    unlockedNodes.length > 2
      ? (bounds.right - bounds.left - sortedX.reduce((sum, node) => sum + node.data.width, 0)) / (unlockedNodes.length - 1)
      : 0;
  const yGap =
    unlockedNodes.length > 2
      ? (bounds.bottom - bounds.top - sortedY.reduce((sum, node) => sum + node.data.height, 0)) / (unlockedNodes.length - 1)
      : 0;
  let xCursor = bounds.left;
  let yCursor = bounds.top;
  const distributedX = new Map<string, number>();
  const distributedY = new Map<string, number>();

  sortedX.forEach((node) => {
    distributedX.set(node.id, xCursor);
    xCursor += node.data.width + xGap;
  });
  sortedY.forEach((node) => {
    distributedY.set(node.id, yCursor);
    yCursor += node.data.height + yGap;
  });

  return nodes.map((node) => {
    if (!selectedIds.has(node.id)) return node;

    const position = { ...node.position };
    if (action === "left") position.x = bounds.left;
    if (action === "center") position.x = bounds.left + bounds.width / 2 - node.data.width / 2;
    if (action === "right") position.x = bounds.right - node.data.width;
    if (action === "top") position.y = bounds.top;
    if (action === "middle") position.y = bounds.top + bounds.height / 2 - node.data.height / 2;
    if (action === "bottom") position.y = bounds.bottom - node.data.height;
    if (action === "distributeX") position.x = distributedX.get(node.id) ?? position.x;
    if (action === "distributeY") position.y = distributedY.get(node.id) ?? position.y;
    return { ...node, position };
  });
}

export function matchNodeSizes(nodes: DiagramNode[], selectedNodes: DiagramNode[], action: MatchSizeAction) {
  const unlockedNodes = selectedNodes.filter((node) => !node.data.locked);
  if (unlockedNodes.length < 2) return null;

  const reference = unlockedNodes[0];
  const selectedIds = new Set(unlockedNodes.map((node) => node.id));
  return nodes.map((node) => {
    if (!selectedIds.has(node.id)) return node;
    return {
      ...node,
      data: {
        ...node.data,
        width: action === "height" ? node.data.width : reference.data.width,
        height: action === "width" ? node.data.height : reference.data.height
      }
    };
  });
}

export function reorderNodes(nodes: DiagramNode[], selectedNodeIds: Set<string>, direction: "front" | "back") {
  if (selectedNodeIds.size === 0) return null;
  const selected = nodes.filter((node) => selectedNodeIds.has(node.id) && !node.data.locked);
  if (selected.length === 0) return null;
  const selectedIds = new Set(selected.map((node) => node.id));
  const rest = nodes.filter((node) => !selectedIds.has(node.id));
  return direction === "front" ? [...rest, ...selected] : [...selected, ...rest];
}

export function createGroupIdMap(nodes: DiagramNode[], stamp: number) {
  const counts = new Map<string, number>();
  nodes.forEach((node) => {
    if (node.data.groupId) {
      counts.set(node.data.groupId, (counts.get(node.data.groupId) ?? 0) + 1);
    }
  });

  const groupMap = new Map<string, string>();
  Array.from(counts.entries()).forEach(([groupId, count], index) => {
    if (count > 1) {
      groupMap.set(groupId, `group-${stamp}-${index}`);
    }
  });
  return groupMap;
}

export function remapNodeGroup(data: DiagramNodeData, groupMap: Map<string, string>): DiagramNodeData {
  if (!data.groupId) return { ...data };
  const groupId = groupMap.get(data.groupId);
  if (!groupId) {
    const nextData = { ...data };
    delete nextData.groupId;
    return nextData;
  }
  return { ...data, groupId };
}
