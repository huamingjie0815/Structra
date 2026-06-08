import { useCallback } from "react";
import type { DiagramDocument, DiagramEdge, DiagramNode, DiagramPage, DiagramTemplate } from "../../domain/types";
import {
  addPageCommand,
  applyTemplateCommand,
  deletePageCommand,
  duplicatePageCommand,
  movePageCommand,
  renamePageCommand,
  reorderPageCommand
} from "../../editor/commands";
import type { HistoryEntry } from "../../editor/history";

export function usePageActionsWorkflow({
  currentDocument,
  currentPages,
  activePage,
  activePageId,
  nodes,
  edges,
  applyDocumentTransaction,
  saveCustomTemplate
}: {
  currentDocument: DiagramDocument;
  currentPages: DiagramPage[];
  activePage: DiagramPage;
  activePageId: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  applyDocumentTransaction: (entry: HistoryEntry, fitView?: boolean) => void;
  saveCustomTemplate: (name: string, nodes: DiagramNode[], edges: DiagramEdge[]) => void;
}) {
  const addPage = useCallback(() => {
    const page: DiagramPage = {
      id: `page-${Date.now()}`,
      name: `页面 ${currentPages.length + 1}`,
      nodes: [],
      edges: [],
      comments: []
    };
    applyDocumentTransaction(addPageCommand(currentDocument, page), true);
  }, [applyDocumentTransaction, currentDocument, currentPages.length]);

  const duplicatePage = useCallback(() => {
    const result = duplicatePageCommand(currentDocument, activePageId, `page-${Date.now()}`);
    if (result) applyDocumentTransaction(result, true);
  }, [activePageId, applyDocumentTransaction, currentDocument]);

  const renamePage = useCallback(() => {
    const name = window.prompt("页面名称", activePage.name)?.trim();
    if (!name) return;
    const result = renamePageCommand(currentDocument, activePageId, name);
    if (result) applyDocumentTransaction(result);
  }, [activePage.name, activePageId, applyDocumentTransaction, currentDocument]);

  const deletePage = useCallback(() => {
    const shouldDelete = window.confirm(
      `删除页面“${activePage.name}”？\n\n该页面包含 ${activePage.nodes.length} 个节点、${activePage.edges.length} 条连线，删除后只能通过撤销恢复。`
    );
    if (!shouldDelete) return;
    const result = deletePageCommand(currentDocument, activePageId);
    if (result) applyDocumentTransaction(result, true);
  }, [activePage.edges.length, activePage.name, activePage.nodes.length, activePageId, applyDocumentTransaction, currentDocument]);

  const movePage = useCallback(
    (direction: "up" | "down") => {
      const result = movePageCommand(currentDocument, activePageId, direction);
      if (result) applyDocumentTransaction(result);
    },
    [activePageId, applyDocumentTransaction, currentDocument]
  );

  const reorderPage = useCallback(
    (sourceId: string, targetId: string) => {
      const result = reorderPageCommand(currentDocument, sourceId, targetId);
      if (result) applyDocumentTransaction(result);
    },
    [applyDocumentTransaction, currentDocument]
  );

  const applyTemplate = useCallback(
    (template: DiagramTemplate) => {
      const hasCurrentContent = activePage.nodes.length > 0 || activePage.edges.length > 0 || normalizeCommentCount(activePage.comments) > 0;
      if (hasCurrentContent) {
        const shouldReplace = window.confirm(
          `用模板“${template.name}”替换当前页面“${activePage.name}”？\n\n当前页面内容会被模板内容覆盖，可通过撤销恢复。`
        );
        if (!shouldReplace) return;
      }
      const result = applyTemplateCommand(currentDocument, activePageId, template);
      if (result) applyDocumentTransaction(result, true);
    },
    [activePage.comments, activePage.edges.length, activePage.name, activePage.nodes.length, activePageId, applyDocumentTransaction, currentDocument]
  );

  const saveCurrentPageAsTemplate = useCallback(
    (name: string) => {
      if (!name.trim()) return;
      saveCustomTemplate(name, nodes, edges);
    },
    [edges, nodes, saveCustomTemplate]
  );

  return {
    addPage,
    duplicatePage,
    renamePage,
    deletePage,
    movePage,
    reorderPage,
    applyTemplate,
    saveCurrentPageAsTemplate
  };
}

function normalizeCommentCount(comments: DiagramPage["comments"] | undefined) {
  return comments?.length ?? 0;
}
