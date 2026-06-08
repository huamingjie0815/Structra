export type FormatSupportStatus = "native" | "bestEffort" | "unsupported";
export type FormatSupportDirection = "importExport" | "importOnly" | "exportOnly" | "none";

export type FormatSupportItem = {
  id: string;
  name: string;
  extensions: string;
  direction: FormatSupportDirection;
  status: FormatSupportStatus;
  note: string;
};

export const FORMAT_SUPPORT_ITEMS: FormatSupportItem[] = [
  {
    id: "structra",
    name: "Structra 文档",
    extensions: ".structra",
    direction: "importExport",
    status: "native",
    note: "完整保留页面、设置、语义、评论和样式"
  },
  {
    id: "json",
    name: "文档 JSON",
    extensions: ".json",
    direction: "importExport",
    status: "native",
    note: "本地项目交换格式"
  },
  {
    id: "mermaid",
    name: "Mermaid",
    extensions: ".mmd .md .txt",
    direction: "importExport",
    status: "bestEffort",
    note: "支持常见 flowchart 节点和 --> 连线"
  },
  {
    id: "svg",
    name: "SVG",
    extensions: ".svg",
    direction: "exportOnly",
    status: "native",
    note: "当前页矢量交付，保留可见语义标记"
  },
  {
    id: "png",
    name: "PNG",
    extensions: ".png",
    direction: "exportOnly",
    status: "native",
    note: "当前页位图交付"
  },
  {
    id: "pdf",
    name: "PDF",
    extensions: ".pdf",
    direction: "exportOnly",
    status: "native",
    note: "支持当前页和整本文档导出"
  },
  {
    id: "visio",
    name: "Visio/VSDX",
    extensions: ".vsdx .vsd",
    direction: "none",
    status: "unsupported",
    note: "后续兼容性调查项，当前不会静默承诺"
  },
  {
    id: "xmind",
    name: "XMind",
    extensions: ".xmind",
    direction: "none",
    status: "unsupported",
    note: "待 mind map 专用模型稳定后评估"
  },
  {
    id: "excel",
    name: "Excel",
    extensions: ".xlsx .xls .csv",
    direction: "none",
    status: "unsupported",
    note: "待表格/ER 批量导入模型稳定后评估"
  }
];

export function getFormatSupportStatusLabel(status: FormatSupportStatus) {
  if (status === "native") return "原生";
  if (status === "bestEffort") return "尽力";
  return "暂不支持";
}

export function getFormatSupportDirectionLabel(direction: FormatSupportDirection) {
  if (direction === "importExport") return "导入/导出";
  if (direction === "importOnly") return "仅导入";
  if (direction === "exportOnly") return "仅导出";
  return "无";
}
