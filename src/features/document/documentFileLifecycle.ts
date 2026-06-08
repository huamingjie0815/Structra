import { removeRecentDocument, upsertRecentDocument, type RecentDocument } from "../../io/recentDocuments";
import { buildDocumentFileIssue, getSaveAsFallback, type DocumentFileIssueView } from "./documentFileStatus";

export const DEFAULT_UNTITLED_DOCUMENT_NAME = "未命名文档";
export const DEFAULT_DOCUMENT_FILE_NAME = "structra-diagram.structra";

export type DocumentFileLifecyclePatch = {
  documentPath?: string | null;
  documentName?: string;
  documentDirty?: boolean;
  documentStatus?: string;
  savedDocumentSnapshot?: string;
  recentDocuments?: RecentDocument[];
  importError?: DocumentFileIssueView | null;
  shouldDownload?: boolean;
};

export function getFileNameFromPath(path: string) {
  return path.split(/[\\/]/).pop() || DEFAULT_DOCUMENT_FILE_NAME;
}

export function ensureDocumentFileName(value: string) {
  const normalized = value.trim().replace(/[\\/:"*?<>|]+/g, "-") || DEFAULT_DOCUMENT_FILE_NAME;
  return /\.(structra|json)$/i.test(normalized) ? normalized : `${normalized}.structra`;
}

export function confirmDiscardUnsavedDocument(
  documentDirty: boolean,
  action: string,
  confirm?: (message: string) => boolean
) {
  if (!documentDirty) return true;
  const confirmAction = confirm ?? globalThis.window?.confirm;
  return confirmAction ? confirmAction(`当前文档有未保存更改，确定${action}吗？`) : false;
}

export function buildNativeSavedDocumentPatch(path: string, content: string, recentDocuments: RecentDocument[], status?: string): DocumentFileLifecyclePatch {
  return {
    documentPath: path,
    documentName: getFileNameFromPath(path),
    documentDirty: false,
    documentStatus: status ?? `已保存到 ${getFileNameFromPath(path)}`,
    savedDocumentSnapshot: content,
    recentDocuments: upsertRecentDocument(recentDocuments, path),
    importError: null
  };
}

export function buildOpenedNativeDocumentPatch(path: string, content: string, recentDocuments: RecentDocument[]): DocumentFileLifecyclePatch {
  return buildNativeSavedDocumentPatch(path, content, recentDocuments, `已打开 ${getFileNameFromPath(path)}`);
}

export function buildBrowserDownloadedCopyPatch(content: string, status = "已下载文档副本"): DocumentFileLifecyclePatch {
  return {
    documentDirty: false,
    documentStatus: status,
    savedDocumentSnapshot: content,
    importError: null,
    shouldDownload: true
  };
}

export function buildSaveAsFailurePatch(defaultPath: string, error?: unknown): DocumentFileLifecyclePatch {
  const issue = buildDocumentFileIssue("writeFailed", defaultPath, error instanceof Error ? error.message : undefined);
  return {
    documentDirty: true,
    documentStatus: "保存失败，文档仍未保存",
    importError: issue
  };
}

export function buildSaveAsResultPatch(
  result: { saved: true; path: string } | { saved: false; cancelled?: boolean; unavailable?: boolean; reason?: "native-unavailable" | "write-failed" | "dialog-failed"; error?: unknown },
  defaultPath: string,
  content: string,
  recentDocuments: RecentDocument[]
): DocumentFileLifecyclePatch | null {
  if (result.saved) {
    return buildNativeSavedDocumentPatch(result.path, content, recentDocuments);
  }
  if (result.cancelled) return null;
  const fallback = getSaveAsFallback(result);
  if (fallback.shouldDownload) {
    return buildBrowserDownloadedCopyPatch(content, fallback.status);
  }
  return buildSaveAsFailurePatch(defaultPath, result.error);
}

export function buildExportResultPatch(
  result: { saved: true; path: string } | { saved: false; cancelled?: boolean; unavailable?: boolean; reason?: "native-unavailable" | "write-failed" | "dialog-failed"; error?: unknown },
  defaultPath: string,
  label: string
): DocumentFileLifecyclePatch | null {
  if (result.saved) {
    return {
      documentStatus: `已导出${label}到 ${getFileNameFromPath(result.path)}`,
      importError: null
    };
  }
  if (result.cancelled) return null;
  return {
    documentStatus: `已下载${label}副本：${defaultPath}`,
    importError: null,
    shouldDownload: true
  };
}

export function buildActivePathSaveFailurePatch(path: string): DocumentFileLifecyclePatch {
  return {
    documentDirty: true,
    documentStatus: "保存失败，文档仍未保存",
    importError: buildDocumentFileIssue("writeFailed", path)
  };
}

export function buildNewUntitledDocumentPatch(): DocumentFileLifecyclePatch {
  return {
    documentPath: null,
    documentName: DEFAULT_UNTITLED_DOCUMENT_NAME,
    documentDirty: true,
    documentStatus: "新建本地文档，尚未保存",
    importError: null
  };
}

export function buildImportedBrowserDocumentPatch(fileName: string): DocumentFileLifecyclePatch {
  return {
    documentPath: null,
    documentName: ensureDocumentFileName(fileName),
    documentDirty: true,
    documentStatus: "已导入 JSON，尚未保存为文档",
    importError: null
  };
}

export function buildRecentMissingPatch(path: string, recentDocuments: RecentDocument[]): DocumentFileLifecyclePatch {
  return {
    recentDocuments: removeRecentDocument(recentDocuments, path),
    importError: buildDocumentFileIssue("recentMissing", path)
  };
}
