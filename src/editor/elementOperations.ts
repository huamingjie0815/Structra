import { DEFAULT_EDGE_BEND_OFFSET, DEFAULT_EDGE_STROKE, DEFAULT_EDGE_WIDTH, edgeMarker, getShapeDataDefaults } from "../domain/diagramDefaults";
import { getShapeSpec } from "../domain/shapeSpecs";
import type { AutoLayoutMode, DiagramEdge, DiagramNode, DiagramNodeData, FormatSnapshot, Selection, ShapeKind } from "../domain/types";
import { getNodeBounds } from "./geometry";

type PositionPatch = Partial<{ x: number; y: number }>;
type AutoLayoutDirection = Extract<AutoLayoutMode, "horizontal" | "vertical">;
type LayerMoveDirection = "up" | "down";
export type StructuredNodeMode = "child" | "sibling";
export type StructuredNodeInsertion = { nodes: DiagramNode[]; edges: DiagramEdge[]; selection: Selection };

export function applyNodeDataPatch(nodes: DiagramNode[], id: string, patch: Partial<DiagramNodeData>) {
  return nodes.map((node) => (node.id === id ? patchNodeData(node, patch) : node));
}

export function applyNodePositionPatch(nodes: DiagramNode[], id: string, patch: PositionPatch) {
  const target = nodes.find((node) => node.id === id);
  if (!target || target.data.locked) return null;
  return nodes.map((node) =>
    node.id === id
      ? {
          ...node,
          position: {
            x: patch.x ?? node.position.x,
            y: patch.y ?? node.position.y
          }
        }
      : node
  );
}

export function applyNodeDataPatchToIds(nodes: DiagramNode[], ids: ReadonlySet<string>, patch: Partial<DiagramNodeData>) {
  return nodes.map((node) => (ids.has(node.id) ? patchNodeData(node, patch) : node));
}

export function setNodeLockedByIds(nodes: DiagramNode[], ids: ReadonlySet<string>, locked: boolean) {
  return nodes.map((node) =>
    ids.has(node.id)
      ? {
          ...node,
          draggable: !locked,
          data: { ...node.data, locked }
        }
      : node
  );
}

export function setNodeLockedById(nodes: DiagramNode[], id: string, locked: boolean) {
  return setNodeLockedByIds(nodes, new Set([id]), locked);
}

export function applyEdgePatch(edges: DiagramEdge[], id: string, patch: Partial<DiagramEdge>) {
  return edges.map((edge) => (edge.id === id ? { ...edge, ...patch } : edge));
}

export function applyEdgePatchToIds(edges: DiagramEdge[], ids: ReadonlySet<string>, patch: Partial<DiagramEdge>) {
  return edges.map((edge) =>
    ids.has(edge.id)
      ? {
          ...edge,
          ...patch,
          data: patch.data ? { ...edge.data, ...patch.data } : edge.data,
          style: patch.style ? { ...edge.style, ...patch.style } : edge.style,
          labelStyle: patch.labelStyle ? { ...edge.labelStyle, ...patch.labelStyle } : edge.labelStyle,
          labelBgStyle: patch.labelBgStyle ? { ...edge.labelBgStyle, ...patch.labelBgStyle } : edge.labelBgStyle
        }
      : edge
  );
}

export function applyEdgeWaypoints(edges: DiagramEdge[], id: string, waypoints: NonNullable<DiagramEdge["data"]>["waypoints"]) {
  return edges.map((edge) =>
    edge.id === id
      ? {
          ...edge,
          data: {
            ...edge.data,
            waypoints
          }
        }
      : edge
  );
}

export function applyFormatSnapshot(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  nodeIds: ReadonlySet<string>,
  edgeIds: ReadonlySet<string>,
  format: FormatSnapshot | null
) {
  if (!format) return null;

  if (format.target === "node") {
    if (nodeIds.size === 0) return null;
    return {
      nodes: nodes.map((node) => (nodeIds.has(node.id) && !node.data.locked ? { ...node, data: { ...node.data, ...format.data } } : node)),
      edges
    };
  }

  if (edgeIds.size === 0) return null;
  return {
    nodes,
    edges: edges.map((edge) =>
      edgeIds.has(edge.id)
        ? {
            ...edge,
            type: format.edge.type,
            data: format.edge.data ? { ...format.edge.data } : undefined,
            style: format.edge.style ? { ...format.edge.style } : undefined,
            labelStyle: format.edge.labelStyle ? { ...format.edge.labelStyle } : undefined,
            labelBgStyle: format.edge.labelBgStyle ? { ...format.edge.labelBgStyle } : undefined,
            markerStart: format.edge.markerStart,
            markerEnd: format.edge.markerEnd,
            animated: format.edge.animated
          }
        : edge
    )
  };
}

export function applyNodeLabelValue(nodes: DiagramNode[], id: string, label: string) {
  return nodes.map((node) => (node.id === id && !node.data.locked ? { ...node, data: { ...node.data, label } } : node));
}

export function applyEdgeLabelValue(edges: DiagramEdge[], id: string, label: string) {
  return edges.map((edge) => (edge.id === id ? { ...edge, label } : edge));
}

export function autoLayoutNodes(nodes: DiagramNode[], targets: DiagramNode[], direction: AutoLayoutDirection, gap = 96) {
  const unlockedTargets = targets.filter((node) => !node.data.locked);
  if (unlockedTargets.length < 2) return null;

  const sorted = [...unlockedTargets].sort((a, b) => (direction === "horizontal" ? a.position.x - b.position.x : a.position.y - b.position.y));
  const targetIds = new Set(sorted.map((node) => node.id));
  const startX = Math.min(...sorted.map((node) => node.position.x));
  const startY = Math.min(...sorted.map((node) => node.position.y));
  let cursor = direction === "horizontal" ? startX : startY;
  const positions = new Map<string, { x: number; y: number }>();

  sorted.forEach((node) => {
    positions.set(node.id, {
      x: direction === "horizontal" ? cursor : startX,
      y: direction === "horizontal" ? startY : cursor
    });
    cursor += (direction === "horizontal" ? node.data.width : node.data.height) + gap;
  });

  return nodes.map((node) => (targetIds.has(node.id) ? { ...node, position: positions.get(node.id) ?? node.position } : node));
}

export function autoLayoutMindMapNodes(nodes: DiagramNode[], targets: DiagramNode[], horizontalGap = 230, verticalGap = 42) {
  const mindTargets = targets.filter((node) => node.data.shape === "mindTopic" || node.data.shape === "mindBranch");
  if (mindTargets.length < 2) return null;

  const topic = mindTargets.find((node) => node.data.shape === "mindTopic") ?? mindTargets[0];
  const branches = mindTargets.filter((node) => node.id !== topic.id);
  const movableIds = new Set(mindTargets.filter((node) => !node.data.locked).map((node) => node.id));
  if (movableIds.size === 0) return null;

  let leftBranches = branches.filter((node) => node.position.x + node.data.width / 2 < topic.position.x + topic.data.width / 2);
  let rightBranches = branches.filter((node) => !leftBranches.some((left) => left.id === node.id));
  if (leftBranches.length === 0 || rightBranches.length === 0) {
    const orderedBranches = [...branches].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    const split = Math.ceil(orderedBranches.length / 2);
    leftBranches = orderedBranches.slice(0, split);
    rightBranches = orderedBranches.slice(split);
  }

  const branchWidth = Math.max(...branches.map((node) => node.data.width));
  const topicCenterY = topic.position.y + topic.data.height / 2;
  const positions = new Map<string, { x: number; y: number }>();
  const placeSide = (sideBranches: DiagramNode[], x: number) => {
    const ordered = [...sideBranches].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
    const totalHeight = ordered.reduce((sum, node) => sum + node.data.height, 0) + Math.max(0, ordered.length - 1) * verticalGap;
    let cursorY = topicCenterY - totalHeight / 2;
    ordered.forEach((node) => {
      positions.set(node.id, { x, y: cursorY });
      cursorY += node.data.height + verticalGap;
    });
  };

  placeSide(leftBranches, topic.position.x - horizontalGap - branchWidth);
  placeSide(rightBranches, topic.position.x + topic.data.width + horizontalGap);

  return nodes.map((node) => (movableIds.has(node.id) && positions.has(node.id) ? { ...node, position: positions.get(node.id) ?? node.position } : node));
}

export function autoLayoutOrgChartNodes(nodes: DiagramNode[], targets: DiagramNode[], edges: DiagramEdge[], horizontalGap = 78, verticalGap = 92) {
  const orgTargets = targets.filter((node) => node.data.shape === "orgPerson" || node.data.shape === "orgUnit");
  if (orgTargets.length < 2) return null;

  const targetIds = new Set(orgTargets.map((node) => node.id));
  const movableIds = new Set(orgTargets.filter((node) => !node.data.locked).map((node) => node.id));
  if (movableIds.size === 0) return null;

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, number>();
  edges.forEach((edge) => {
    if (!targetIds.has(edge.source) || !targetIds.has(edge.target)) return;
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
  });

  const byPosition = (a: DiagramNode, b: DiagramNode) => a.position.y - b.position.y || a.position.x - b.position.x;
  let current = orgTargets.filter((node) => !incoming.has(node.id)).sort(byPosition);
  if (current.length === 0) current = [[...orgTargets].sort(byPosition)[0]];

  const nodeById = new Map(orgTargets.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const levels: DiagramNode[][] = [];
  while (current.length > 0) {
    const level = current.filter((node) => !visited.has(node.id));
    if (level.length === 0) break;
    level.forEach((node) => visited.add(node.id));
    levels.push(level);
    const nextIds = new Set<string>();
    level.forEach((node) => (outgoing.get(node.id) ?? []).forEach((id) => !visited.has(id) && nextIds.add(id)));
    current = Array.from(nextIds)
      .map((id) => nodeById.get(id))
      .filter((node): node is DiagramNode => Boolean(node))
      .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
  }

  const unvisited = orgTargets.filter((node) => !visited.has(node.id)).sort(byPosition);
  if (unvisited.length > 0) levels.push(unvisited);

  const bounds = getNodeBounds(orgTargets);
  const centerX = bounds.left + bounds.width / 2;
  let cursorY = bounds.top;
  const positions = new Map<string, { x: number; y: number }>();

  levels.forEach((level) => {
    const levelWidth = level.reduce((sum, node) => sum + node.data.width, 0) + Math.max(0, level.length - 1) * horizontalGap;
    let cursorX = centerX - levelWidth / 2;
    level.forEach((node) => {
      positions.set(node.id, { x: cursorX, y: cursorY });
      cursorX += node.data.width + horizontalGap;
    });
    cursorY += Math.max(...level.map((node) => node.data.height)) + verticalGap;
  });

  return nodes.map((node) => (movableIds.has(node.id) && positions.has(node.id) ? { ...node, position: positions.get(node.id) ?? node.position } : node));
}

export function canAppendStructuredNode(node: DiagramNode | undefined, mode: StructuredNodeMode) {
  if (!node || node.data.locked) return false;
  const family = getStructuredNodeFamily(node);
  if (!family) return false;
  return mode === "child" || node.data.shape !== "mindTopic";
}

export function appendStructuredNode({
  nodes,
  edges,
  selectedNode,
  mode,
  idSeed = Date.now()
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedNode: DiagramNode | undefined;
  mode: StructuredNodeMode;
  idSeed?: number;
}): StructuredNodeInsertion | null {
  if (!selectedNode || !canAppendStructuredNode(selectedNode, mode)) return null;
  const family = getStructuredNodeFamily(selectedNode);
  if (!family) return null;

  const parent = mode === "child" ? selectedNode : getStructuredParentNode(nodes, edges, selectedNode);
  if (!parent || !getStructuredNodeFamily(parent)) return null;

  const kind = getStructuredChildKind(family, parent);
  const spec = getShapeSpec(kind);
  const childIds = new Set(edges.filter((edge) => edge.source === parent.id).map((edge) => edge.target));
  const siblingIds = new Set(edges.filter((edge) => edge.source === parent.id).map((edge) => edge.target));
  const siblingCount = nodes.filter((node) => siblingIds.has(node.id)).length;
  const childCount = nodes.filter((node) => childIds.has(node.id)).length;
  const id = `${family}-${mode}-${idSeed}`;
  const position =
    family === "mind"
      ? getMindInsertionPosition(nodes, edges, parent, selectedNode, spec, mode, mode === "child" ? childCount : siblingCount)
      : getOrgInsertionPosition(parent, selectedNode, spec, mode, mode === "child" ? childCount : siblingCount);
  const mindSide = family === "mind" ? getMindInsertionSide(nodes, edges, parent, selectedNode, mode) : undefined;
  const node: DiagramNode = {
    id,
    type: "diagram",
    position,
    data: {
      label: getStructuredNodeLabel(family, mode),
      shape: kind,
      fill: spec.fill,
      stroke: spec.stroke,
      text: "#1f2937",
      fontSize: 14,
      textAlign: "center",
      ...getShapeDataDefaults(kind),
      ...(mindSide ? { mindSide } : {}),
      width: spec.width,
      height: spec.height
    },
    selected: true
  };
  const handles = family === "mind" ? getMindEdgeHandles(mindSide ?? "right") : { sourceHandle: "bottom-source", targetHandle: "top-target" };
  const edge: DiagramEdge = {
    id: `edge-${id}`,
    source: parent.id,
    target: id,
    sourceHandle: handles.sourceHandle,
    targetHandle: handles.targetHandle,
    type: "smoothstep",
    data: { bendOffset: DEFAULT_EDGE_BEND_OFFSET, connectorPreset: "flow" },
    markerEnd: edgeMarker(DEFAULT_EDGE_STROKE),
    style: { stroke: DEFAULT_EDGE_STROKE, strokeWidth: DEFAULT_EDGE_WIDTH },
    labelStyle: { fill: "#1f2937", fontSize: 12, fontWeight: 600 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 }
  };

  return {
    nodes: [...nodes.map((item) => ({ ...item, selected: false })), node],
    edges: [...edges.map((item) => ({ ...item, selected: false })), edge],
    selection: { type: "node", id }
  };
}

export function setNodeHiddenWithEdges(nodes: DiagramNode[], edges: DiagramEdge[], id: string, hidden: boolean) {
  const nextNodes = nodes.map((node) => (node.id === id ? { ...node, hidden, selected: hidden ? false : node.selected } : node));
  const hiddenNodeIds = new Set(nextNodes.filter((node) => node.hidden).map((node) => node.id));
  const nextEdges = edges.map((edge) => {
    const edgeHidden = hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target);
    return { ...edge, hidden: edgeHidden, selected: edgeHidden ? false : edge.selected };
  });
  return { nodes: nextNodes, edges: nextEdges };
}

export function moveLayerNode(nodes: DiagramNode[], id: string, direction: LayerMoveDirection) {
  const index = nodes.findIndex((node) => node.id === id);
  if (index < 0) return null;
  if (nodes[index].data.locked) return null;
  const targetIndex = direction === "up" ? index + 1 : index - 1;
  if (targetIndex < 0 || targetIndex >= nodes.length) return null;
  const nextNodes = [...nodes];
  const [node] = nextNodes.splice(index, 1);
  nextNodes.splice(targetIndex, 0, node);
  return nextNodes;
}

function getStructuredNodeFamily(node: DiagramNode | undefined): "mind" | "org" | null {
  if (!node) return null;
  if (node.data.shape === "mindTopic" || node.data.shape === "mindBranch") return "mind";
  if (node.data.shape === "orgPerson" || node.data.shape === "orgUnit") return "org";
  return null;
}

function getStructuredChildKind(family: "mind" | "org", parent: DiagramNode): ShapeKind {
  if (family === "mind") return "mindBranch";
  return parent.data.shape === "orgUnit" ? "orgUnit" : "orgPerson";
}

function getStructuredNodeLabel(family: "mind" | "org", mode: StructuredNodeMode) {
  if (family === "mind") return mode === "child" ? "新分支" : "同级分支";
  return mode === "child" ? "新成员" : "同级成员";
}

function getStructuredParentNode(nodes: DiagramNode[], edges: DiagramEdge[], selectedNode: DiagramNode) {
  const incoming = edges.find((edge) => edge.target === selectedNode.id);
  return incoming ? nodes.find((node) => node.id === incoming.source) : null;
}

function getMindInsertionPosition(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  parent: DiagramNode,
  selectedNode: DiagramNode,
  spec: { width: number; height: number },
  mode: StructuredNodeMode,
  siblingIndex: number
) {
  const horizontalGap = 210;
  const verticalGap = 34;
  const side = getMindInsertionSide(nodes, edges, parent, selectedNode, mode);
  if (mode === "sibling") {
    return {
      x: selectedNode.position.x,
      y: selectedNode.position.y + selectedNode.data.height + verticalGap
    };
  }
  const x = side === "left" ? parent.position.x - horizontalGap - spec.width : parent.position.x + parent.data.width + horizontalGap;
  return {
    x,
    y: parent.position.y + siblingIndex * (spec.height + verticalGap)
  };
}

function getMindInsertionSide(nodes: DiagramNode[], edges: DiagramEdge[], parent: DiagramNode, selectedNode: DiagramNode, mode: StructuredNodeMode): "left" | "right" {
  if (mode === "sibling") {
    return selectedNode.position.x + selectedNode.data.width / 2 < parent.position.x + parent.data.width / 2 ? "left" : "right";
  }
  if (parent.data.shape === "mindBranch") {
    const grandParent = getStructuredParentNode(nodes, edges, parent);
    if (grandParent) {
      return parent.position.x + parent.data.width / 2 < grandParent.position.x + grandParent.data.width / 2 ? "left" : "right";
    }
  }
  const childIds = new Set(edges.filter((edge) => edge.source === parent.id).map((edge) => edge.target));
  const children = nodes.filter((node) => childIds.has(node.id));
  const parentCenter = parent.position.x + parent.data.width / 2;
  const leftCount = children.filter((node) => node.position.x + node.data.width / 2 < parentCenter).length;
  const rightCount = children.length - leftCount;
  return rightCount <= leftCount ? "right" : "left";
}

function getMindEdgeHandles(side: "left" | "right") {
  return side === "left" ? { sourceHandle: "left-source", targetHandle: "right-target" } : { sourceHandle: "right-source", targetHandle: "left-target" };
}

function getOrgInsertionPosition(
  parent: DiagramNode,
  selectedNode: DiagramNode,
  spec: { width: number; height: number },
  mode: StructuredNodeMode,
  siblingIndex: number
) {
  const horizontalGap = 78;
  const verticalGap = 92;
  if (mode === "sibling") {
    return {
      x: selectedNode.position.x + selectedNode.data.width + horizontalGap,
      y: selectedNode.position.y
    };
  }
  return {
    x: parent.position.x + siblingIndex * (spec.width + horizontalGap),
    y: parent.position.y + parent.data.height + verticalGap
  };
}

function patchNodeData(node: DiagramNode, patch: Partial<DiagramNodeData>) {
  if (node.data.locked && patch.locked === undefined) return node;
  const nextPatch = node.data.locked ? { locked: patch.locked } : patch;
  return {
    ...node,
    draggable: nextPatch.locked === undefined ? node.draggable : !nextPatch.locked,
    data: { ...node.data, ...nextPatch }
  };
}
