import { DEFAULT_LANE_LABELS, FONT_FAMILY_OPTIONS, SWIMLANE_TITLE_HEIGHT } from "./diagramDefaults";
import type {
  BpmnEventType,
  BpmnGatewayType,
  BpmnTaskType,
  DiagramNodeData,
  ErField,
  ErKeyType,
  FontFamily,
  LaneOrientation,
  MindBranchSide
} from "./types";

export type DividerLine = { x1: number; y1: number; x2: number; y2: number };

export function getFontFamily(value?: FontFamily) {
  return FONT_FAMILY_OPTIONS.find((item) => item.value === value)?.css ?? FONT_FAMILY_OPTIONS[0].css;
}

export function getNodeStrokeWidth(data: DiagramNodeData) {
  return data.strokeWidth ?? 2;
}

export function getNodeStrokeStyle(data: DiagramNodeData) {
  return data.strokeStyle ?? "solid";
}

export function getNodeStrokeDasharray(data: DiagramNodeData) {
  const style = getNodeStrokeStyle(data);
  if (style === "dashed") return "8 6";
  if (style === "dotted") return "2 5";
  return "";
}

export function getNodeOpacity(data: DiagramNodeData) {
  return Math.min(1, Math.max(0.1, data.opacity ?? 1));
}

export function normalizeNodeRotation(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(180, Math.max(-180, Math.round(parsed)));
}

export function getSwimlaneCount(data: DiagramNodeData) {
  return normalizeLaneCount(data.laneCount);
}

export function getSwimlaneOrientation(data: DiagramNodeData): LaneOrientation {
  return data.laneOrientation === "vertical" ? "vertical" : "horizontal";
}

export function getSwimlaneLabels(data: DiagramNodeData) {
  const laneCount = getSwimlaneCount(data);
  const rawLabels = Array.isArray(data.laneLabels) ? data.laneLabels : DEFAULT_LANE_LABELS;
  return Array.from({ length: laneCount }, (_, index) => {
    const label = rawLabels[index]?.trim();
    return label || `泳道 ${index + 1}`;
  });
}

export function normalizeSwimlaneLabels(value: string, laneCount: number) {
  const labels = value.split(/\r?\n/).map((item) => item.trim());
  return Array.from({ length: laneCount }, (_, index) => labels[index] || `泳道 ${index + 1}`);
}

export function normalizeLaneCount(value: unknown) {
  const count = Number(value ?? 3);
  return Number.isFinite(count) ? Math.min(8, Math.max(2, Math.round(count))) : 3;
}

export function getTableRows(data: DiagramNodeData) {
  return normalizeTableSize(data.tableRows);
}

export function getTableColumns(data: DiagramNodeData) {
  return normalizeTableSize(data.tableColumns);
}

export function getTableCellValues(data: DiagramNodeData, rows = getTableRows(data), columns = getTableColumns(data)) {
  const rawCells = Array.isArray(data.tableCells) ? data.tableCells : [];
  const oldColumns = getTableColumns(data);
  return Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const oldIndex = row * oldColumns + column;
    return String(rawCells[oldIndex] ?? "");
  });
}

export function updateTableCellValue(data: DiagramNodeData, index: number, value: string) {
  const cells = getTableCellValues(data);
  cells[index] = value;
  return cells;
}

export function getUmlAttributes(data: DiagramNodeData) {
  return normalizeUmlCompartment(data.umlAttributes);
}

export function getUmlMethods(data: DiagramNodeData) {
  return normalizeUmlCompartment(data.umlMethods);
}

export function normalizeUmlCompartment(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export function parseUmlCompartment(value: string) {
  return value.split(/\r?\n/).map((item) => item.trimEnd());
}

export function getErFields(data: DiagramNodeData) {
  return normalizeErFields(data.erFields);
}

export function normalizeErFields(value: unknown): ErField[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return parseErFieldLine(item);
      if (item && typeof item === "object") {
        const field = item as Partial<ErField>;
        return {
          key: normalizeErKey(field.key),
          name: String(field.name ?? "").trim(),
          type: String(field.type ?? "").trim()
        };
      }
      return null;
    })
    .filter((field): field is ErField => Boolean(field && (field.name || field.type || field.key)));
}

export function normalizeErKey(value: unknown): ErKeyType {
  return value === "PK" || value === "FK" ? value : "";
}

export function parseErFields(value: string) {
  return value
    .split(/\r?\n/)
    .map(parseErFieldLine)
    .filter((field): field is ErField => Boolean(field && (field.name || field.type || field.key)));
}

export function parseErFieldLine(value: string): ErField | null {
  const line = value.trim();
  if (!line) return null;
  const match = /^(?:(PK|FK)\s+)?([^:]+?)(?:\s*:\s*(.+))?$/.exec(line);
  if (!match) return { name: line, type: "" };
  return {
    key: normalizeErKey(match[1]),
    name: match[2].trim(),
    type: String(match[3] ?? "").trim()
  };
}

export function formatErFieldLine(field: ErField) {
  const key = field.key ? `${field.key} ` : "";
  const type = field.type ? `: ${field.type}` : "";
  return `${key}${field.name}${type}`;
}

export const BPMN_EVENT_LABELS: Record<BpmnEventType, string> = {
  none: "普通",
  message: "消息",
  timer: "定时",
  error: "错误"
};

export const BPMN_TASK_LABELS: Record<BpmnTaskType, string> = {
  task: "任务",
  user: "人工",
  service: "服务",
  manual: "手动"
};

export const BPMN_GATEWAY_LABELS: Record<BpmnGatewayType, string> = {
  exclusive: "排他",
  parallel: "并行",
  inclusive: "包容"
};

export const MIND_SIDE_LABELS: Record<MindBranchSide, string> = {
  auto: "自动",
  left: "左侧",
  right: "右侧"
};

export function getBpmnEventType(data: DiagramNodeData): BpmnEventType {
  return data.bpmnEventType === "message" || data.bpmnEventType === "timer" || data.bpmnEventType === "error" ? data.bpmnEventType : "none";
}

export function getBpmnTaskType(data: DiagramNodeData): BpmnTaskType {
  return data.bpmnTaskType === "user" || data.bpmnTaskType === "service" || data.bpmnTaskType === "manual" ? data.bpmnTaskType : "task";
}

export function getBpmnGatewayType(data: DiagramNodeData): BpmnGatewayType {
  return data.bpmnGatewayType === "parallel" || data.bpmnGatewayType === "inclusive" ? data.bpmnGatewayType : "exclusive";
}

export function getMindPriority(data: DiagramNodeData) {
  const parsed = Number(data.mindPriority ?? 0);
  return Number.isFinite(parsed) ? Math.min(5, Math.max(0, Math.round(parsed))) : 0;
}

export function getMindProgress(data: DiagramNodeData) {
  const parsed = Number(data.mindProgress ?? 0);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, Math.round(parsed))) : 0;
}

export function getMindSide(data: DiagramNodeData): MindBranchSide {
  return data.mindSide === "left" || data.mindSide === "right" ? data.mindSide : "auto";
}

export function getOrgRole(data: DiagramNodeData) {
  return String(data.orgRole ?? "").trim();
}

export function getOrgDepartment(data: DiagramNodeData) {
  return String(data.orgDepartment ?? "").trim();
}

export function normalizeTableSize(value: unknown) {
  const count = Number(value ?? 3);
  return Number.isFinite(count) ? Math.min(12, Math.max(1, Math.round(count))) : 3;
}

export function getSwimlaneDividerLines(x: number, y: number, width: number, height: number, data: DiagramNodeData): DividerLine[] {
  const laneCount = getSwimlaneCount(data);
  const laneOrientation = getSwimlaneOrientation(data);
  const laneTop = y + SWIMLANE_TITLE_HEIGHT;
  const laneHeight = Math.max(0, height - SWIMLANE_TITLE_HEIGHT);
  return Array.from({ length: laneCount - 1 }, (_, index) => {
    const ratio = (index + 1) / laneCount;
    if (laneOrientation === "horizontal") {
      const lineY = laneTop + laneHeight * ratio;
      return { x1: x, y1: lineY, x2: x + width, y2: lineY };
    }
    const lineX = x + width * ratio;
    return { x1: lineX, y1: laneTop, x2: lineX, y2: y + height };
  });
}

export function getTableDividerLines(x: number, y: number, width: number, height: number, data: DiagramNodeData): DividerLine[] {
  const rows = getTableRows(data);
  const columns = getTableColumns(data);
  return [
    ...Array.from({ length: rows - 1 }, (_, index) => {
      const lineY = y + height * ((index + 1) / rows);
      return { x1: x, y1: lineY, x2: x + width, y2: lineY };
    }),
    ...Array.from({ length: columns - 1 }, (_, index) => {
      const lineX = x + width * ((index + 1) / columns);
      return { x1: lineX, y1: y, x2: lineX, y2: y + height };
    })
  ];
}
