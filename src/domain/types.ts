import type { Edge, Node, Position } from "@xyflow/react";

export type ShapeKind =
  | "process"
  | "circle"
  | "hexagon"
  | "terminator"
  | "decision"
  | "bpmnStartEvent"
  | "bpmnEndEvent"
  | "bpmnTask"
  | "bpmnGateway"
  | "document"
  | "data"
  | "database"
  | "umlClass"
  | "erEntity"
  | "erAttribute"
  | "erRelationship"
  | "swimlane"
  | "subprocess"
  | "manual"
  | "delay"
  | "preparation"
  | "offpage"
  | "merge"
  | "display"
  | "note"
  | "table"
  | "text"
  | "mindTopic"
  | "mindBranch"
  | "orgPerson"
  | "orgUnit";

export type DiagramNodeData = {
  label: string;
  shape: ShapeKind;
  fill: string;
  stroke: string;
  text: string;
  fontSize: number;
  textAlign?: TextAlign;
  fontFamily?: FontFamily;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strokeWidth?: number;
  strokeStyle?: NodeStrokeStyle;
  opacity?: number;
  rotation?: number;
  laneCount?: number;
  laneOrientation?: LaneOrientation;
  laneLabels?: string[];
  tableRows?: number;
  tableColumns?: number;
  tableCells?: string[];
  umlAttributes?: string[];
  umlMethods?: string[];
  erFields?: ErField[];
  erSourceCardinality?: string;
  erTargetCardinality?: string;
  bpmnEventType?: BpmnEventType;
  bpmnTaskType?: BpmnTaskType;
  bpmnGatewayType?: BpmnGatewayType;
  mindPriority?: number;
  mindProgress?: number;
  mindSide?: MindBranchSide;
  orgRole?: string;
  orgDepartment?: string;
  width: number;
  height: number;
  locked?: boolean;
  groupId?: string;
};

export type ErKeyType = "" | "PK" | "FK";
export type ErField = { name: string; type: string; key?: ErKeyType };
export type BpmnEventType = "none" | "message" | "timer" | "error";
export type BpmnTaskType = "task" | "user" | "service" | "manual";
export type BpmnGatewayType = "exclusive" | "parallel" | "inclusive";
export type MindBranchSide = "auto" | "left" | "right";
export type ConnectorPresetId = "flow" | "association" | "bidirectional" | "inheritance" | "aggregation" | "composition";
export type DiagramEdgeData = {
  bendOffset?: number;
  waypoints?: EdgeWaypoint[];
  connectorPreset?: ConnectorPresetId;
};
export type EdgeWaypoint = { x: number; y: number };

export type DiagramCommentTarget = "canvas" | "node" | "edge";
export type DiagramCommentReply = {
  id: string;
  text: string;
  createdAt: string;
};
export type DiagramComment = {
  id: string;
  target: DiagramCommentTarget;
  targetId?: string;
  x: number;
  y: number;
  text: string;
  resolved?: boolean;
  createdAt: string;
  replies?: DiagramCommentReply[];
};

export type DiagramNode = Node<DiagramNodeData, "diagram">;
export type DiagramEdge = Edge<DiagramEdgeData>;
export type Selection = { type: "node" | "edge"; id: string } | null;
export type Snapshot = { nodes: DiagramNode[]; edges: DiagramEdge[]; comments?: DiagramComment[] };
export type DiagramPage = Snapshot & { id: string; name: string };
export type CanvasSettings = {
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  gridVariant: GridVariant;
  pagePreset: PagePreset;
  background: string;
};
export type DiagramDocument = { pages: DiagramPage[]; activePageId: string; settings?: CanvasSettings };
export type DiagramVersion = DiagramDocument & { id: string; name: string; createdAt: string };
export type DiagramTemplate = Snapshot & { id: string; name: string; description: string; custom?: boolean };
export type ClipboardSnapshot = Snapshot | null;
export type AlignmentGuides = { x: number[]; y: number[] };
export type CanvasViewport = { x: number; y: number; zoom: number };
export type CanvasSize = { width: number; height: number };
export type CanvasPoint = { x: number; y: number };
export type CanvasRect = { left: number; top: number; right: number; bottom: number };
export type CommandItem = { id: string; group: string; label: string; run: () => void; disabled?: boolean };
export type EdgeEndpoints = { sx: number; sy: number; tx: number; ty: number; sourcePosition: Position; targetPosition: Position };
export type ShapeCategory = "all" | "basic" | "flow" | "bpmn" | "uml" | "er" | "mind" | "org" | "data" | "annotation";
export type EdgeArrowMode = "none" | "start" | "end" | "both";
export type EdgeDashMode = "solid" | "dashed" | "dotted";
export type GridVariant = "lines" | "dots" | "cross";
export type PagePreset = "content" | "a4Portrait" | "a4Landscape" | "wide";
export type TextAlign = "left" | "center" | "right";
export type FontFamily = "system" | "serif" | "mono";
export type NodeStrokeStyle = "solid" | "dashed" | "dotted";
export type LaneOrientation = "horizontal" | "vertical";
export type NodeLabelDraft = { id: string; value: string } | null;
export type EdgeLabelDraft = { id: string; value: string } | null;
export type FormatSnapshot =
  | {
      target: "node";
      data: Pick<
        DiagramNodeData,
        | "fill"
        | "stroke"
        | "text"
        | "fontSize"
        | "textAlign"
        | "fontFamily"
        | "bold"
        | "italic"
        | "underline"
        | "strokeWidth"
        | "strokeStyle"
        | "opacity"
        | "rotation"
      >;
    }
  | { target: "edge"; edge: Pick<DiagramEdge, "type" | "data" | "style" | "labelStyle" | "labelBgStyle" | "markerStart" | "markerEnd" | "animated"> };
export type ContextMenuState = {
  x: number;
  y: number;
  target: "node" | "edge" | "pane";
  id?: string;
  flowPosition?: { x: number; y: number };
} | null;
export type AlignAction =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom"
  | "distributeX"
  | "distributeY";
export type MatchSizeAction = "width" | "height" | "both";
export type AutoLayoutMode = "horizontal" | "vertical" | "mind" | "org";
