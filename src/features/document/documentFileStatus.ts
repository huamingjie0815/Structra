import type { SaveTextAsNativeFileResult } from "../../io/nativeFiles";

export type DocumentFileIssue = "openFailed" | "readFailed" | "writeFailed" | "recentMissing" | "nativeUnavailable";

export type DocumentFileIssueView = {
  title: string;
  message: string;
  source?: string;
  detail?: string;
};

export function buildDocumentFileIssue(issue: DocumentFileIssue, source?: string, detail?: string): DocumentFileIssueView {
  if (issue === "writeFailed") {
    return {
      title: "无法写入本机文件",
      message: "当前文档仍保持未保存状态。请检查目标路径权限、磁盘空间，或改用另存为选择其他位置。",
      source,
      detail
    };
  }
  if (issue === "readFailed") {
    return {
      title: "无法读取本机文件",
      message: "当前文档已保持不变。请确认文件仍存在，并且当前用户有读取权限。",
      source,
      detail
    };
  }
  if (issue === "recentMissing") {
    return {
      title: "无法打开最近文档",
      message: "该文件可能已被移动、重命名或删除，已从最近文档中移除。当前文档已保持不变。",
      source,
      detail
    };
  }
  if (issue === "nativeUnavailable") {
    return {
      title: "需要桌面环境",
      message: "最近文档需要在 Structra 桌面应用中读取本机路径。当前文档已保持不变。",
      source,
      detail
    };
  }
  return {
    title: "无法打开文档",
    message: "当前文档已保持不变。请重新选择可读取的 Structra 文档。",
    source,
    detail
  };
}

export function getSaveAsFallback(result: SaveTextAsNativeFileResult, fallbackStatus = "已下载文档副本") {
  if (result.saved || result.cancelled) {
    return { shouldDownload: false, markClean: false, status: "" };
  }
  if (result.reason === "native-unavailable") {
    return { shouldDownload: true, markClean: true, status: fallbackStatus };
  }
  return { shouldDownload: false, markClean: false, status: "保存失败，文档仍未保存" };
}
