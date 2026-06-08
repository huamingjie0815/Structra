import type { ShapeKind } from "./types";

export type ShapeSpec = {
  kind: ShapeKind;
  label: string;
  width: number;
  height: number;
  fill: string;
  stroke: string;
};

export const SHAPE_SPECS: ShapeSpec[] = [
  { kind: "terminator", label: "开始/结束", width: 142, height: 54, fill: "#e6f6ee", stroke: "#1f9d63" },
  { kind: "process", label: "流程/任务", width: 156, height: 64, fill: "#f7fbff", stroke: "#3178c6" },
  { kind: "circle", label: "圆形/连接点", width: 112, height: 112, fill: "#f4f8ff", stroke: "#3b70c4" },
  { kind: "hexagon", label: "六边形/阶段", width: 156, height: 86, fill: "#f6f3ff", stroke: "#7357c9" },
  { kind: "decision", label: "判断/分支", width: 110, height: 110, fill: "#fff5df", stroke: "#c07a12" },
  { kind: "bpmnStartEvent", label: "BPMN开始事件", width: 94, height: 94, fill: "#f6fffb", stroke: "#22845f" },
  { kind: "bpmnEndEvent", label: "BPMN结束事件", width: 94, height: 94, fill: "#fff7f5", stroke: "#c2412d" },
  { kind: "bpmnTask", label: "BPMN任务/活动", width: 164, height: 82, fill: "#f8fbff", stroke: "#2f6fab" },
  { kind: "bpmnGateway", label: "BPMN网关/排他", width: 110, height: 110, fill: "#fff9ec", stroke: "#b7791f" },
  { kind: "document", label: "文档/输出", width: 150, height: 74, fill: "#f4f0ff", stroke: "#7559c7" },
  { kind: "data", label: "数据/输入输出", width: 150, height: 64, fill: "#eef8fa", stroke: "#248a9c" },
  { kind: "database", label: "数据库/数据存储", width: 140, height: 84, fill: "#fff0f1", stroke: "#c84d5f" },
  { kind: "umlClass", label: "UML类/接口", width: 178, height: 132, fill: "#fffdf8", stroke: "#8a5a18" },
  { kind: "erEntity", label: "ER实体/数据表", width: 190, height: 124, fill: "#f7fbff", stroke: "#255f9e" },
  { kind: "erAttribute", label: "ER属性/字段", width: 144, height: 72, fill: "#f8fff6", stroke: "#3f8f46" },
  { kind: "erRelationship", label: "ER关系/基数", width: 122, height: 90, fill: "#fff8f0", stroke: "#bd5b1f" },
  { kind: "swimlane", label: "泳道/职能带", width: 320, height: 180, fill: "#fbfcfe", stroke: "#667085" },
  { kind: "table", label: "表格/矩阵", width: 230, height: 150, fill: "#ffffff", stroke: "#667085" },
  { kind: "subprocess", label: "子流程/可展开", width: 168, height: 68, fill: "#f2f7ff", stroke: "#496eb5" },
  { kind: "manual", label: "手动输入/操作", width: 158, height: 70, fill: "#f0f8ef", stroke: "#4d8f50" },
  { kind: "delay", label: "延迟/等待", width: 130, height: 70, fill: "#fff8e8", stroke: "#b7791f" },
  { kind: "preparation", label: "准备/初始化", width: 150, height: 68, fill: "#eef7ff", stroke: "#2f6ca3" },
  { kind: "offpage", label: "页外连接", width: 130, height: 86, fill: "#f3f6ff", stroke: "#5b63b7" },
  { kind: "merge", label: "汇合/合并", width: 118, height: 92, fill: "#fff6ed", stroke: "#c26a2e" },
  { kind: "display", label: "显示/界面", width: 158, height: 72, fill: "#f1f8f6", stroke: "#267b68" },
  { kind: "note", label: "注释/便签", width: 150, height: 88, fill: "#fffbea", stroke: "#d69e2e" },
  { kind: "text", label: "文本/标题", width: 130, height: 44, fill: "#ffffff", stroke: "#94a3b8" },
  { kind: "mindTopic", label: "中心主题", width: 190, height: 86, fill: "#fff7ed", stroke: "#c2410c" },
  { kind: "mindBranch", label: "导图分支", width: 156, height: 56, fill: "#f0f9ff", stroke: "#0369a1" },
  { kind: "orgPerson", label: "组织成员", width: 150, height: 74, fill: "#f8fafc", stroke: "#475569" },
  { kind: "orgUnit", label: "组织单元", width: 160, height: 62, fill: "#f0fdf4", stroke: "#15803d" }
];

export function getShapeSpec(kind: ShapeKind) {
  return SHAPE_SPECS.find((shape) => shape.kind === kind) ?? SHAPE_SPECS.find((shape) => shape.kind === "process")!;
}
