import { getShapeDataDefaults } from "../../domain/diagramDefaults";
import type { DiagramEdge, DiagramNode, Selection, ShapeKind } from "../../domain/types";
import { getAvailableNodePosition } from "../../editor/canvasGeometry";
import { shapeLibrary } from "./shapeLibrary";

export type ShapePlacementMode = "available" | "centered";

export type ShapeInsertion = {
  node: DiagramNode;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selection: Selection;
};

export function createShapeInsertion({
  kind,
  nodes,
  edges,
  center,
  placement,
  id
}: {
  kind: ShapeKind;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  center: { x: number; y: number };
  placement: ShapePlacementMode;
  id: string;
}): ShapeInsertion {
  const shape = shapeLibrary.find((item) => item.kind === kind) ?? shapeLibrary[1];
  const nodePosition =
    placement === "centered"
      ? { x: center.x - shape.width / 2, y: center.y - shape.height / 2 }
      : getAvailableNodePosition(center, shape, nodes);
  const node: DiagramNode = {
    id,
    type: "diagram",
    position: nodePosition,
    data: {
      label: shape.label,
      shape: kind,
      fill: shape.fill,
      stroke: shape.stroke,
      text: "#1f2937",
      fontSize: 14,
      textAlign: "center",
      ...getShapeDataDefaults(kind),
      width: shape.width,
      height: shape.height
    },
    selected: true
  };

  return {
    node,
    nodes: [...nodes.map((item) => ({ ...item, selected: false })), node],
    edges: edges.map((item) => ({ ...item, selected: false })),
    selection: { type: "node", id }
  };
}
