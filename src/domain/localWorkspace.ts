import type { DiagramTemplate, ShapeCategory, ShapeKind } from "./types";

export type WorkspaceTemplateCategory = ShapeCategory | "custom";
export type WorkspaceTemplateFilterCategory = WorkspaceTemplateCategory | "all" | "favorite";

export type WorkspaceTemplateItem = {
  template: DiagramTemplate;
  category: WorkspaceTemplateCategory;
  nodeCount: number;
  edgeCount: number;
  keywordText: string;
};

export type LocalDocumentIdentityKind = "draft" | "native" | "compatible" | "downloadCopy";

export type LocalDocumentIdentity = {
  kind: LocalDocumentIdentityKind;
  title: string;
  badge: string;
  detail: string;
  pathTitle?: string;
};

export type RecentDocumentFormatKind = "native" | "compatible" | "unknown";

export type RecentDocumentFormat = {
  kind: RecentDocumentFormatKind;
  label: string;
  title: string;
};

export const workspaceTemplateCategories: Array<{ id: WorkspaceTemplateFilterCategory; label: string }> = [
  { id: "all", label: "全部" },
  { id: "favorite", label: "收藏" },
  { id: "flow", label: "流程" },
  { id: "bpmn", label: "BPMN" },
  { id: "uml", label: "UML" },
  { id: "er", label: "ER" },
  { id: "data", label: "数据" },
  { id: "basic", label: "容器" },
  { id: "annotation", label: "标注" },
  { id: "custom", label: "本地" }
];

export function buildWorkspaceTemplateItems(
  templates: DiagramTemplate[],
  shapeCategoryMap: Record<ShapeKind, Exclude<ShapeCategory, "all">>
): WorkspaceTemplateItem[] {
  return templates.map((template) => {
    const category = getTemplateCategory(template, shapeCategoryMap);
    const shapeKinds = template.nodes.map((node) => node.data.shape);
    const labels = template.nodes.map((node) => node.data.label);
    return {
      template,
      category,
      nodeCount: template.nodes.length,
      edgeCount: template.edges.length,
      keywordText: [template.name, template.description, category, ...shapeKinds, ...labels].join(" ").toLowerCase()
    };
  });
}

export function filterWorkspaceTemplates(
  items: WorkspaceTemplateItem[],
  query: string,
  category: WorkspaceTemplateFilterCategory,
  favoriteTemplateIds: ReadonlySet<string> = new Set(),
  limit = 12
) {
  const normalizedQuery = normalizeWorkspaceQuery(query);
  return items
    .filter((item) => {
      const matchesCategory =
        category === "all" ||
        (category === "favorite" ? favoriteTemplateIds.has(item.template.id) : item.category === category);
      const matchesQuery = !normalizedQuery || item.keywordText.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    })
    .slice(0, limit);
}

export function getRecentDocumentDisplayPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.slice(Math.max(0, parts.length - 3)).join("/") || path;
}

export function getRecentDocumentDirectory(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  if (parts.length <= 1) return "";
  const directoryParts = parts.slice(0, -1);
  return directoryParts.slice(Math.max(0, directoryParts.length - 2)).join("/");
}

export function getRecentDocumentFormat(path: string): RecentDocumentFormat {
  const extension = getPathExtension(path);
  if (extension === "structra") {
    return { kind: "native", label: "原生", title: "Structra 原生文档" };
  }
  if (extension === "json") {
    return { kind: "compatible", label: "兼容", title: "兼容 JSON 导入文档" };
  }
  return { kind: "unknown", label: "未知", title: "未知格式，打开时会验证兼容性" };
}

export function getLocalDocumentIdentity({
  documentPath,
  documentName,
  documentStatus,
  documentDirty
}: {
  documentPath: string | null;
  documentName: string;
  documentStatus: string;
  documentDirty: boolean;
}): LocalDocumentIdentity {
  const dirtySuffix = documentDirty ? " · 未保存" : " · 已保存";
  if (documentPath) {
    const format = getRecentDocumentFormat(documentPath);
    if (format.kind === "native") {
      return {
        kind: "native",
        title: `本机文件: ${documentName}`,
        badge: ".structra 原生",
        detail: `${getRecentDocumentDisplayPath(documentPath)}${dirtySuffix}`,
        pathTitle: documentPath
      };
    }
    if (format.kind === "compatible") {
      return {
        kind: "compatible",
        title: `本机兼容文件: ${documentName}`,
        badge: "JSON 兼容",
        detail: `${getRecentDocumentDisplayPath(documentPath)}${dirtySuffix}`,
        pathTitle: documentPath
      };
    }
    return {
      kind: "compatible",
      title: `本机文件: ${documentName}`,
      badge: "打开时验证",
      detail: `${getRecentDocumentDisplayPath(documentPath)}${dirtySuffix}`,
      pathTitle: documentPath
    };
  }
  if (documentStatus.includes("已导入 JSON")) {
    return {
      kind: "compatible",
      title: "JSON 导入未另存",
      badge: "兼容导入",
      detail: `${documentName} · 请另存为 .structra 建立本机文档`
    };
  }
  if (documentStatus.includes("已下载文档副本")) {
    return {
      kind: "downloadCopy",
      title: "浏览器下载副本",
      badge: "下载副本",
      detail: `${documentName} · 当前没有绑定本机路径`
    };
  }
  return {
    kind: "draft",
    title: "未命名草稿",
    badge: documentDirty ? "本地草稿" : "本地空白",
    detail: `${documentName || "未命名文档"}${documentDirty ? " · 未保存" : " · 尚未绑定本机文件"}`
  };
}

export function getWorkspaceSummary(
  templates: WorkspaceTemplateItem[],
  recentCount: number,
  favoriteTemplateIds: ReadonlySet<string> = new Set()
) {
  const customCount = templates.filter((item) => item.template.custom).length;
  return {
    templateCount: templates.length,
    customCount,
    recentCount,
    builtInCount: templates.length - customCount,
    favoriteCount: templates.filter((item) => favoriteTemplateIds.has(item.template.id)).length
  };
}

function normalizeWorkspaceQuery(value: string) {
  return value.trim().toLowerCase();
}

function getPathExtension(path: string) {
  const fileName = path.split(/[\\/]/).pop() ?? "";
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toLowerCase() : "";
}

function getTemplateCategory(
  template: DiagramTemplate,
  shapeCategoryMap: Record<ShapeKind, Exclude<ShapeCategory, "all">>
): WorkspaceTemplateCategory {
  if (template.custom) return "custom";
  const counts = new Map<WorkspaceTemplateCategory, number>();
  template.nodes.forEach((node) => {
    const category = shapeCategoryMap[node.data.shape];
    if (!category) return;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  });
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "flow";
}
