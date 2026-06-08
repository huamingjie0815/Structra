import type { ChangeEvent, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_CANVAS_SETTINGS,
  initialDocument
} from "../../domain/diagramDefaults";
import type { CanvasSettings, DiagramComment, DiagramDocument, DiagramEdge, DiagramNode, DiagramPage, PagePreset } from "../../domain/types";
import { cloneDocument, normalizeCanvasSettings, normalizeComments } from "../../domain/documentSession";
import { replaceActivePageSnapshotCommand, replaceDocumentCommand } from "../../editor/commands";
import { getExportBounds } from "../../editor/geometry";
import type { HistoryEntry } from "../../editor/history";
import { downloadBlob, downloadFile } from "../../io/browserDownloads";
import { ensureDocumentExtension, serializeDiagramDocument } from "../../io/documentFile";
import { buildDocumentJsonExport, getVisibleGraph } from "../../io/exporters";
import { parseImportedDiagramJson } from "../../io/importers";
import { buildMermaidExport, parseMermaid } from "../../io/mermaid";
import {
  isTauriRuntime,
  authorizeNativeFilePath,
  openTextFileWithNativeDialog,
  openTextWithNativeDialog,
  readTextFromNativePath,
  recordDesktopExportAudit,
  recordDesktopUnsavedDiscardPromptAudit,
  recordDesktopOpenAudit,
  recordDesktopSaveAudit,
  saveBlobAsNativeFile,
  saveTextAsNativeFile,
  writeTextToNativePath
} from "../../io/nativeFiles";
import { buildImagesPdfBlob, svgToPdfBlob, svgToPdfPageImage, svgToPngBlob } from "../../io/pdfExport";
import { clearRecentDocuments, loadRecentDocuments, removeRecentDocument, saveRecentDocuments, type RecentDocument } from "../../io/recentDocuments";
import { buildSvg, escapeXml } from "../../io/svgExport";
import { buildDocumentFileIssue } from "./documentFileStatus";
import {
  DEFAULT_DOCUMENT_FILE_NAME,
  buildActivePathSaveFailurePatch,
  buildExportResultPatch,
  buildImportedBrowserDocumentPatch,
  buildNativeSavedDocumentPatch,
  buildNewUntitledDocumentPatch,
  buildOpenedNativeDocumentPatch,
  buildRecentMissingPatch,
  buildSaveAsResultPatch,
  confirmDiscardUnsavedDocument,
  ensureDocumentFileName,
  getFileNameFromPath,
  type DocumentFileLifecyclePatch
} from "./documentFileLifecycle";

const DOCUMENT_FILE_FILTERS = [{ name: "Structra", extensions: ["structra", "json"] }];

type DirtyCheckHandle =
  | { type: "idle"; id: number }
  | { type: "timeout"; id: number };

type IdleCallbackWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

export type ImportErrorState = {
  title: string;
  message: string;
  source?: string;
  detail?: string;
} | null;

type ReplaceDocumentBaseline = (entry: HistoryEntry, options?: Partial<{ fitView: boolean; clearActiveComment: boolean }>) => void;
type ApplyDocumentTransaction = (entry: HistoryEntry, fitView?: boolean) => void;

export type UseDocumentFileWorkflowOptions = {
  initialDocumentSnapshot: string;
  currentDocument: DiagramDocument;
  currentPages: DiagramPage[];
  currentSettings: CanvasSettings;
  activePage: DiagramPage;
  activePageId: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  comments: DiagramComment[];
  canvasBackground: string;
  pagePreset: PagePreset;
  fileInput: RefObject<HTMLInputElement>;
  mermaidInput: RefObject<HTMLInputElement>;
  defaultCanvasSettings?: CanvasSettings;
  replaceDocumentBaseline: ReplaceDocumentBaseline;
  applyDocumentTransaction: ApplyDocumentTransaction;
};

export function useDocumentFileWorkflow({
  initialDocumentSnapshot,
  currentDocument,
  currentPages,
  currentSettings,
  activePage,
  activePageId,
  nodes,
  edges,
  comments,
  canvasBackground,
  pagePreset,
  fileInput,
  mermaidInput,
  defaultCanvasSettings = DEFAULT_CANVAS_SETTINGS,
  replaceDocumentBaseline,
  applyDocumentTransaction
}: UseDocumentFileWorkflowOptions) {
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>(loadRecentDocuments);
  const [documentPath, setDocumentPath] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState("未命名文档");
  const [documentDirty, setDocumentDirty] = useState(false);
  const [documentStatus, setDocumentStatus] = useState("本地恢复草稿");
  const [importError, setImportError] = useState<ImportErrorState>(null);
  const savedDocumentRef = useRef(initialDocumentSnapshot);
  const dirtyCheckHandleRef = useRef<DirtyCheckHandle | null>(null);
  const didMountDirtyCheckRef = useRef(false);
  const confirmedDocumentFileInputRef = useRef(false);
  const confirmedMermaidFileInputRef = useRef(false);
  const auditUnsavedPromptDecisionRef = useRef<boolean | null>(null);

  const cancelDirtyCheck = useCallback(() => {
    const handle = dirtyCheckHandleRef.current;
    if (!handle) return;
    if (handle.type === "idle") {
      (window as IdleCallbackWindow).cancelIdleCallback?.(handle.id);
    } else {
      window.clearTimeout(handle.id);
    }
    dirtyCheckHandleRef.current = null;
  }, []);

  const scheduleDirtyCheck = useCallback(
    (document: DiagramDocument) => {
      cancelDirtyCheck();
      const runCheck = () => {
        dirtyCheckHandleRef.current = null;
        setDocumentDirty(serializeDiagramDocument(document) !== savedDocumentRef.current);
      };
      const nodeCount = document.pages.reduce((total, page) => total + page.nodes.length, 0);
      const timeout = nodeCount > 500 ? 5000 : nodeCount > 150 ? 2200 : 900;
      if (nodeCount > 500) {
        dirtyCheckHandleRef.current = { type: "timeout", id: window.setTimeout(runCheck, timeout) };
        return;
      }
      const idleWindow = window as IdleCallbackWindow;
      if (idleWindow.requestIdleCallback) {
        dirtyCheckHandleRef.current = { type: "idle", id: idleWindow.requestIdleCallback(runCheck, { timeout }) };
        return;
      }
      dirtyCheckHandleRef.current = { type: "timeout", id: window.setTimeout(runCheck, timeout) };
    },
    [cancelDirtyCheck]
  );

  useEffect(() => {
    if (!didMountDirtyCheckRef.current) {
      didMountDirtyCheckRef.current = true;
      scheduleDirtyCheck(currentDocument);
      return cancelDirtyCheck;
    }
    setDocumentDirty(true);
    scheduleDirtyCheck(currentDocument);
    return cancelDirtyCheck;
  }, [cancelDirtyCheck, currentDocument, scheduleDirtyCheck]);

  const forgetRecentDocument = useCallback((path: string) => {
    setRecentDocuments((current) => {
      const next = removeRecentDocument(current, path);
      saveRecentDocuments(next);
      return next;
    });
  }, []);

  const clearRecentDocumentList = useCallback(() => {
    clearRecentDocuments();
    setRecentDocuments([]);
  }, []);

  const showImportError = useCallback((title: string, message: string, error?: unknown, source?: string) => {
    const detail = error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
    setImportError({ title, message, source, detail });
  }, []);

  const canDiscardUnsavedDocument = useCallback(
    (action: string) => {
      if (!documentDirty) return true;
      let auditOverrideUsed = false;
      const allowed = confirmDiscardUnsavedDocument(documentDirty, action, (message) => {
        if (auditUnsavedPromptDecisionRef.current !== null) {
          auditOverrideUsed = true;
          const decision = auditUnsavedPromptDecisionRef.current;
          auditUnsavedPromptDecisionRef.current = null;
          return decision;
        }
        return window.confirm(message);
      });
      void recordDesktopUnsavedDiscardPromptAudit(action, allowed, auditOverrideUsed ? "audit-override" : "user-confirm");
      return allowed;
    },
    [documentDirty]
  );

  const acceptNextUnsavedPromptForAudit = useCallback(() => {
    auditUnsavedPromptDecisionRef.current = true;
  }, []);

  const markDocumentFileInputConfirmed = useCallback(() => {
    confirmedDocumentFileInputRef.current = true;
    window.setTimeout(() => {
      confirmedDocumentFileInputRef.current = false;
    }, 15_000);
  }, []);

  const markMermaidFileInputConfirmed = useCallback(() => {
    confirmedMermaidFileInputRef.current = true;
    window.setTimeout(() => {
      confirmedMermaidFileInputRef.current = false;
    }, 15_000);
  }, []);

  const applyLifecyclePatch = useCallback((patch: DocumentFileLifecyclePatch | null) => {
    if (!patch) return;
    if ("savedDocumentSnapshot" in patch && patch.savedDocumentSnapshot !== undefined) {
      savedDocumentRef.current = patch.savedDocumentSnapshot;
    }
    if ("documentPath" in patch) {
      setDocumentPath(patch.documentPath ?? null);
    }
    if (patch.documentName !== undefined) {
      setDocumentName(patch.documentName);
    }
    if (patch.documentDirty !== undefined) {
      setDocumentDirty(patch.documentDirty);
    }
    if (patch.documentStatus !== undefined) {
      setDocumentStatus(patch.documentStatus);
    }
    if (patch.importError !== undefined) {
      setImportError(patch.importError);
    }
    if (patch.recentDocuments) {
      setRecentDocuments(patch.recentDocuments);
      saveRecentDocuments(patch.recentDocuments);
    }
  }, []);

  const markDocumentSaved = useCallback(
    (path: string | null, content: string, status: string) => {
      if (path) {
        applyLifecyclePatch(buildNativeSavedDocumentPatch(path, content, recentDocuments, status));
        return;
      }
      applyLifecyclePatch({
        documentPath: null,
        documentDirty: false,
        documentStatus: status,
        savedDocumentSnapshot: content,
        importError: null
      });
    },
    [applyLifecyclePatch, recentDocuments]
  );

  const saveDocumentAs = useCallback(async () => {
    const content = serializeDiagramDocument(currentDocument);
    const defaultPath = ensureDocumentExtension(documentPath ? getFileNameFromPath(documentPath) : documentName || activePage.name || DEFAULT_DOCUMENT_FILE_NAME);
    const result = await saveTextAsNativeFile(defaultPath, DOCUMENT_FILE_FILTERS, content);
    const patch = buildSaveAsResultPatch(result, defaultPath, content, recentDocuments);
    if (!patch) return false;
    applyLifecyclePatch(patch);
    if (result.saved) {
      void recordDesktopSaveAudit(result.path, getFileNameFromPath(result.path), "另存为");
    }
    if (patch.shouldDownload) {
      downloadFile(defaultPath, "application/json", content);
      return true;
    }
    return result.saved;
  }, [activePage.name, applyLifecyclePatch, currentDocument, documentName, documentPath, recentDocuments]);

  const saveDocument = useCallback(async () => {
    const content = serializeDiagramDocument(currentDocument);
    if (documentPath && isTauriRuntime()) {
      const saved = await writeTextToNativePath(documentPath, content);
      if (saved) {
        markDocumentSaved(documentPath, content, `已保存到 ${getFileNameFromPath(documentPath)}`);
        void recordDesktopSaveAudit(documentPath, getFileNameFromPath(documentPath), "保存");
        return true;
      }
      applyLifecyclePatch(buildActivePathSaveFailurePatch(documentPath));
      return false;
    }
    return saveDocumentAs();
  }, [applyLifecyclePatch, currentDocument, documentPath, markDocumentSaved, saveDocumentAs]);

  const exportTextFile = useCallback(
    async (fileName: string, label: string, mimeType: string, filters: typeof DOCUMENT_FILE_FILTERS, content: string) => {
      const result = await saveTextAsNativeFile(fileName, filters, content);
      const patch = buildExportResultPatch(result, fileName, label);
      if (!patch) return;
      applyLifecyclePatch(patch);
      if (result.saved) {
        void recordDesktopExportAudit(result.path, getFileNameFromPath(result.path), label);
      }
      if (patch.shouldDownload) {
        downloadFile(fileName, mimeType, content);
      }
    },
    [applyLifecyclePatch]
  );

  const exportBlobFile = useCallback(
    async (fileName: string, label: string, filters: typeof DOCUMENT_FILE_FILTERS, blob: Blob) => {
      const result = await saveBlobAsNativeFile(fileName, filters, blob);
      const patch = buildExportResultPatch(result, fileName, label);
      if (!patch) return;
      applyLifecyclePatch(patch);
      if (result.saved) {
        void recordDesktopExportAudit(result.path, getFileNameFromPath(result.path), label);
      }
      if (patch.shouldDownload) {
        downloadBlob(fileName, blob);
      }
    },
    [applyLifecyclePatch]
  );

  const newDocument = useCallback(() => {
    if (!canDiscardUnsavedDocument("新建文档")) return;
    const nextDocument = cloneDocument(initialDocument);
    const nextSettings = normalizeCanvasSettings(defaultCanvasSettings);
    const entry = replaceDocumentCommand({ ...nextDocument, settings: nextSettings }, null);
    if (!entry) return;
    replaceDocumentBaseline(entry, { fitView: true });
    applyLifecyclePatch(buildNewUntitledDocumentPatch());
  }, [applyLifecyclePatch, canDiscardUnsavedDocument, defaultCanvasSettings, replaceDocumentBaseline]);

  const exportJson = useCallback(async () => {
    const content = buildDocumentJsonExport({
      pages: currentPages,
      activePageId,
      nodes,
      edges,
      comments,
      settings: currentSettings
    });
    await exportTextFile("structra-diagram.json", "JSON", "application/json", [{ name: "JSON", extensions: ["json"] }], content);
  }, [activePageId, comments, currentPages, currentSettings, edges, exportTextFile, nodes]);

  const exportSvg = useCallback(async () => {
    const fileName = `${activePage.name || "diagram"}.svg`;
    const content = buildSvg(nodes, edges, canvasBackground, pagePreset);
    await exportTextFile(fileName, "SVG", "image/svg+xml", [{ name: "SVG", extensions: ["svg"] }], content);
  }, [activePage.name, canvasBackground, edges, exportTextFile, nodes, pagePreset]);

  const exportMermaid = useCallback(async () => {
    const fileName = `${activePage.name || "diagram"}.mmd`;
    const content = buildMermaidExport(nodes, edges);
    await exportTextFile(fileName, "Mermaid", "text/plain", [{ name: "Mermaid", extensions: ["mmd", "md"] }], content);
  }, [activePage.name, edges, exportTextFile, nodes]);

  const exportPng = useCallback(async () => {
    const visibleGraph = getVisibleGraph(nodes, edges);
    const bounds = getExportBounds(visibleGraph.nodes, pagePreset);
    const blob = await svgToPngBlob(buildSvg(visibleGraph.nodes, visibleGraph.edges, canvasBackground, pagePreset), bounds, canvasBackground);
    const fileName = `${activePage.name || "diagram"}.png`;
    await exportBlobFile(fileName, "PNG", [{ name: "PNG", extensions: ["png"] }], blob);
  }, [activePage.name, canvasBackground, edges, exportBlobFile, nodes, pagePreset]);

  const exportPdf = useCallback(async () => {
    const visibleGraph = getVisibleGraph(nodes, edges);
    const bounds = getExportBounds(visibleGraph.nodes, pagePreset);
    const blob = await svgToPdfBlob(buildSvg(visibleGraph.nodes, visibleGraph.edges, canvasBackground, pagePreset), bounds, canvasBackground);
    const fileName = `${activePage.name || "diagram"}.pdf`;
    await exportBlobFile(fileName, "PDF", [{ name: "PDF", extensions: ["pdf"] }], blob);
  }, [activePage.name, canvasBackground, edges, exportBlobFile, nodes, pagePreset]);

  const exportDocumentPdf = useCallback(async () => {
    const pdfPages = await Promise.all(
      currentPages.map((page) => {
        const visibleGraph = getVisibleGraph(page.nodes, page.edges);
        const bounds = getExportBounds(visibleGraph.nodes, pagePreset);
        return svgToPdfPageImage(buildSvg(visibleGraph.nodes, visibleGraph.edges, canvasBackground, pagePreset), bounds, canvasBackground);
      })
    );
    const blob = buildImagesPdfBlob(pdfPages);
    await exportBlobFile("structra-document.pdf", "文档 PDF", [{ name: "PDF", extensions: ["pdf"] }], blob);
  }, [canvasBackground, currentPages, exportBlobFile, pagePreset]);

  const printCurrentPage = useCallback(() => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    printWindow.document.write(
      `<!doctype html><html><head><title>${escapeXml(activePage.name)}</title><style>body{margin:0;background:${escapeXml(canvasBackground)};}svg{width:100%;height:auto;display:block}</style></head><body>${buildSvg(nodes, edges, canvasBackground, pagePreset)}<script>window.onload=()=>{window.print();}</script></body></html>`
    );
    printWindow.document.close();
  }, [activePage.name, canvasBackground, edges, nodes, pagePreset]);

  const applyImportedJson = useCallback(
    (raw: string, source?: { path?: string; fileName?: string }) => {
      try {
        const imported = parseImportedDiagramJson(raw);
        setImportError(null);
        if (imported.type === "document") {
          const parsedDocument = imported.document;
          const settings = normalizeCanvasSettings(parsedDocument.settings);
          const parsedPages = parsedDocument.pages.map((page) => ({ ...page, comments: normalizeComments(page.comments) }));
          const entry = replaceDocumentCommand({ pages: parsedPages, activePageId: parsedDocument.activePageId, settings }, null);
          if (!entry) throw new Error("Imported document has no pages");
          replaceDocumentBaseline(entry, { fitView: true });
          if (source?.path) {
            applyLifecyclePatch(buildOpenedNativeDocumentPatch(source.path, serializeDiagramDocument(entry.document), recentDocuments));
          } else if (source?.fileName) {
            applyLifecyclePatch(buildImportedBrowserDocumentPatch(source.fileName));
          }
          return true;
        }
        const parsed = imported.snapshot;
        const settings = normalizeCanvasSettings(parsed.settings);
        const page = { id: "page-main", name: "流程图", nodes: parsed.nodes, edges: parsed.edges, comments: normalizeComments(parsed.comments) };
        const entry = replaceDocumentCommand({ pages: [page], activePageId: page.id, settings }, null);
        if (!entry) throw new Error("Imported snapshot has no pages");
        replaceDocumentBaseline(entry, { fitView: true });
        if (source?.path) {
          applyLifecyclePatch(buildOpenedNativeDocumentPatch(source.path, serializeDiagramDocument(entry.document), recentDocuments));
        } else if (source?.fileName) {
          applyLifecyclePatch(buildImportedBrowserDocumentPatch(source.fileName));
        }
        return true;
      } catch (error) {
        showImportError(
          "无法导入文档",
          "当前文档已保持不变。请确认文件是 Structra 导出的 JSON 或 .structra 文档。",
          error,
          source?.path ?? source?.fileName
        );
        return false;
      }
    },
    [applyLifecyclePatch, recentDocuments, replaceDocumentBaseline, showImportError]
  );

  const importJsonFromFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const alreadyConfirmed = confirmedDocumentFileInputRef.current;
      confirmedDocumentFileInputRef.current = false;
      if (!alreadyConfirmed && !canDiscardUnsavedDocument("导入其他文档")) return;
      const reader = new FileReader();
      reader.onerror = () => showImportError("无法读取文件", "当前文档已保持不变。请选择可读取的本地 JSON 或 .structra 文件。", reader.error, file.name);
      reader.onload = () => applyImportedJson(String(reader.result), { fileName: ensureDocumentFileName(file.name) });
      reader.readAsText(file);
    },
    [applyImportedJson, canDiscardUnsavedDocument, showImportError]
  );

  const openDocument = useCallback(async () => {
    if (!canDiscardUnsavedDocument("打开其他文档")) return false;
    const result = await openTextFileWithNativeDialog(DOCUMENT_FILE_FILTERS);
    if (!result.opened && result.unavailable && result.reason === "native-unavailable") {
      markDocumentFileInputConfirmed();
      fileInput.current?.click();
      return true;
    }
    if (!result.opened) {
      if (result.cancelled) return false;
      const issue = buildDocumentFileIssue(result.reason === "read-failed" ? "readFailed" : "openFailed", result.path, result.error instanceof Error ? result.error.message : undefined);
      setImportError(issue);
      return false;
    }
    const opened = applyImportedJson(result.contents, { path: result.path });
    if (opened) {
      void recordDesktopOpenAudit(result.path, getFileNameFromPath(result.path), "打开本机文档");
    }
    return opened;
  }, [applyImportedJson, canDiscardUnsavedDocument, fileInput, markDocumentFileInputConfirmed]);

  const openNativeDocumentPath = useCallback(
    async (path: string, action = "打开本机文档", options?: { skipDiscardConfirmation?: boolean }) => {
      if (!options?.skipDiscardConfirmation && !canDiscardUnsavedDocument(action)) return false;
      if (!isTauriRuntime()) {
        setImportError(buildDocumentFileIssue("nativeUnavailable", path));
        return false;
      }
      if (!(await authorizeNativeFilePath(path))) {
        setImportError(buildDocumentFileIssue("readFailed", path));
        return false;
      }
      const contents = await readTextFromNativePath(path);
      if (contents === null) {
        setImportError(buildDocumentFileIssue("readFailed", path));
        return false;
      }
      const opened = applyImportedJson(contents, { path });
      if (opened) {
        void recordDesktopOpenAudit(path, getFileNameFromPath(path), action);
      }
      return opened;
    },
    [applyImportedJson, canDiscardUnsavedDocument]
  );

  const openRecentDocument = useCallback(
    async (path: string) => {
      if (!canDiscardUnsavedDocument("打开最近文档")) return false;
      if (!isTauriRuntime()) {
        setImportError(buildDocumentFileIssue("nativeUnavailable", path));
        return false;
      }
      if (!(await authorizeNativeFilePath(path))) {
        setImportError(buildDocumentFileIssue("readFailed", path));
        return false;
      }
      const contents = await readTextFromNativePath(path);
      if (contents === null) {
        applyLifecyclePatch(buildRecentMissingPatch(path, recentDocuments));
        return false;
      }
      const opened = applyImportedJson(contents, { path });
      if (opened) {
        void recordDesktopOpenAudit(path, getFileNameFromPath(path), "打开最近文档");
      }
      return opened;
    },
    [applyImportedJson, applyLifecyclePatch, canDiscardUnsavedDocument, recentDocuments]
  );

  const importJson = useCallback(async () => {
    if (!canDiscardUnsavedDocument("导入其他文档")) return;
    const content = await openTextWithNativeDialog([{ name: "JSON", extensions: ["json"] }]);
    if (content === undefined) {
      markDocumentFileInputConfirmed();
      fileInput.current?.click();
      return;
    }
    if (content !== null) {
      applyImportedJson(content);
    }
  }, [applyImportedJson, canDiscardUnsavedDocument, fileInput, markDocumentFileInputConfirmed]);

  const applyImportedMermaid = useCallback(
    (raw: string) => {
      try {
        const snapshot = parseMermaid(raw);
        if (snapshot.nodes.length === 0) throw new Error("Empty Mermaid diagram");
        setImportError(null);
        const page = { id: activePageId, name: activePage.name || "Mermaid 导入", nodes: snapshot.nodes, edges: snapshot.edges, comments: [] };
        const entry = replaceActivePageSnapshotCommand(currentDocument, activePageId, page, null);
        if (entry) {
          applyDocumentTransaction(entry, true);
        }
      } catch (error) {
        showImportError("无法导入 Mermaid", "当前文档已保持不变。仅支持常见 flowchart 节点和 --> 连线。", error);
      }
    },
    [activePage.name, activePageId, applyDocumentTransaction, currentDocument, showImportError]
  );

  const importMermaidFromFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const alreadyConfirmed = confirmedMermaidFileInputRef.current;
      confirmedMermaidFileInputRef.current = false;
      if (!alreadyConfirmed && !canDiscardUnsavedDocument("导入 Mermaid 并替换当前页面")) return;
      const reader = new FileReader();
      reader.onerror = () => showImportError("无法读取 Mermaid", "当前文档已保持不变。请选择可读取的 .mmd、.md 或文本文件。", reader.error, file.name);
      reader.onload = () => applyImportedMermaid(String(reader.result));
      reader.readAsText(file);
    },
    [applyImportedMermaid, canDiscardUnsavedDocument, showImportError]
  );

  const importMermaid = useCallback(async () => {
    if (!canDiscardUnsavedDocument("导入 Mermaid 并替换当前页面")) return;
    const content = await openTextWithNativeDialog([{ name: "Mermaid", extensions: ["mmd", "md", "txt"] }]);
    if (content === undefined) {
      markMermaidFileInputConfirmed();
      mermaidInput.current?.click();
      return;
    }
    if (content !== null) {
      applyImportedMermaid(content);
    }
  }, [applyImportedMermaid, canDiscardUnsavedDocument, markMermaidFileInputConfirmed, mermaidInput]);

  return {
    recentDocuments,
    documentPath,
    documentName,
    documentDirty,
    documentStatus,
    importError,
    clearImportError: () => setImportError(null),
    markRecoveryCacheSaved: () => setDocumentStatus("已保存恢复缓存"),
    saveDocumentAs,
    saveDocument,
    newDocument,
    exportJson,
    exportSvg,
    exportMermaid,
    exportPng,
    exportPdf,
    exportDocumentPdf,
    printCurrentPage,
    importJsonFromFileInput,
    openDocument,
    openNativeDocumentPath,
    openRecentDocument,
    importJson,
    applyImportedMermaid,
    importMermaidFromFileInput,
    importMermaid,
    acceptNextUnsavedPromptForAudit,
    forgetRecentDocument,
    clearRecentDocumentList
  };
}
export { ensureDocumentFileName, getFileNameFromPath };
