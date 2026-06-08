import { MarkerType } from "@xyflow/react";
import { DEFAULT_EDGE_STROKE, DEFAULT_EDGE_WIDTH, EDGE_DASH_PATTERNS } from "../domain/diagramDefaults";
import type { ConnectorPresetId, DiagramEdge, EdgeArrowMode, EdgeDashMode } from "../domain/types";

export type ConnectorPreset = {
  id: ConnectorPresetId;
  label: string;
  description: string;
  type: "smoothstep" | "straight" | "step" | "bezier";
  arrowMode: EdgeArrowMode;
  dashMode: EdgeDashMode;
};

export const CONNECTOR_PRESETS: ConnectorPreset[] = [
  { id: "flow", label: "流程箭头", description: "默认流程方向", type: "smoothstep", arrowMode: "end", dashMode: "solid" },
  { id: "association", label: "关联", description: "UML/ER 无箭头关系", type: "straight", arrowMode: "none", dashMode: "solid" },
  { id: "bidirectional", label: "双向", description: "双向数据或依赖", type: "smoothstep", arrowMode: "both", dashMode: "solid" },
  { id: "inheritance", label: "继承", description: "UML 泛化/继承", type: "straight", arrowMode: "end", dashMode: "solid" },
  { id: "aggregation", label: "聚合", description: "UML 空心菱形", type: "straight", arrowMode: "end", dashMode: "solid" },
  { id: "composition", label: "组合", description: "UML 实心菱形", type: "straight", arrowMode: "end", dashMode: "solid" }
];

export type ConnectorPresetSelectValue = ConnectorPresetId | "custom";

export function isConnectorPresetId(value: unknown): value is ConnectorPresetId {
  return CONNECTOR_PRESETS.some((preset) => preset.id === value);
}

export function getConnectorPreset(id: ConnectorPresetId) {
  return CONNECTOR_PRESETS.find((preset) => preset.id === id) ?? CONNECTOR_PRESETS[0];
}

export function getConnectorPresetSelectValue(edge: Pick<DiagramEdge, "data">): ConnectorPresetSelectValue {
  return isConnectorPresetId(edge.data?.connectorPreset) ? edge.data.connectorPreset : "custom";
}

export function edgeMarker(color: string, type: MarkerType = MarkerType.ArrowClosed) {
  return { type, width: 16, height: 16, color };
}

export function edgeArrowPatch(mode: EdgeArrowMode, color: string, markerType: MarkerType = MarkerType.ArrowClosed): Pick<DiagramEdge, "markerStart" | "markerEnd"> {
  const marker = edgeMarker(color, markerType);
  return {
    markerStart: mode === "start" || mode === "both" ? marker : undefined,
    markerEnd: mode === "end" || mode === "both" ? marker : undefined
  };
}

export function clearConnectorPreset(data: DiagramEdge["data"]) {
  return { ...(data ?? {}), connectorPreset: undefined };
}

export function applyConnectorPreset(edge: DiagramEdge, presetId: ConnectorPresetId): Partial<DiagramEdge> {
  const preset = getConnectorPreset(presetId);
  const stroke = String(edge.style?.stroke ?? DEFAULT_EDGE_STROKE);
  const strokeWidth = Number(edge.style?.strokeWidth ?? DEFAULT_EDGE_WIDTH);
  const markerType = preset.id === "inheritance" ? MarkerType.Arrow : MarkerType.ArrowClosed;
  return {
    type: preset.type,
    data: { ...edge.data, connectorPreset: preset.id },
    style: {
      ...edge.style,
      stroke,
      strokeWidth,
      strokeDasharray: EDGE_DASH_PATTERNS[preset.dashMode] || undefined
    },
    ...edgeArrowPatch(preset.arrowMode, stroke, markerType)
  };
}

export function getSvgConnectorMarkerKind(edge: DiagramEdge): "arrow" | "triangle-open" | "diamond-open" | "diamond-filled" {
  if (edge.data?.connectorPreset === "inheritance") return "triangle-open";
  if (edge.data?.connectorPreset === "aggregation") return "diamond-open";
  if (edge.data?.connectorPreset === "composition") return "diamond-filled";
  return "arrow";
}
