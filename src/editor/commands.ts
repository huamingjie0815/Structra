import { cloneSnapshot } from "../domain/diagramDefaults";
import { cloneDocument, normalizeCanvasSettings, normalizeComments } from "../domain/documentSession";
import type { DiagramDocument, DiagramPage, DiagramTemplate, Selection, Snapshot } from "../domain/types";

export type CommandResult = {
  document: DiagramDocument;
  selection: Selection;
};

export function replaceDocumentCommand(document: DiagramDocument, selection: Selection = null): CommandResult | null {
  const nextDocument = normalizeDocument(document);
  if (nextDocument.pages.length === 0) return null;
  const activePageId = nextDocument.pages.some((page) => page.id === nextDocument.activePageId)
    ? nextDocument.activePageId
    : nextDocument.pages[0].id;

  return {
    document: {
      ...nextDocument,
      activePageId
    },
    selection
  };
}

export function addPageCommand(document: DiagramDocument, page: DiagramPage): CommandResult {
  const nextDocument = normalizeDocument(document);
  const nextPage = clonePage(page);

  return {
    document: {
      ...nextDocument,
      pages: [...nextDocument.pages, nextPage],
      activePageId: nextPage.id
    },
    selection: null
  };
}

export function duplicatePageCommand(document: DiagramDocument, activePageId: string, nextPageId: string): CommandResult | null {
  const nextDocument = normalizeDocument(document);
  const page = nextDocument.pages.find((item) => item.id === activePageId);
  if (!page) return null;

  const snapshot = cloneSnapshot(page.nodes, page.edges, page.comments);
  const nextPage: DiagramPage = {
    id: nextPageId,
    name: `${page.name} 副本`,
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    comments: normalizeComments(snapshot.comments)
  };

  return {
    document: {
      ...nextDocument,
      pages: [...nextDocument.pages, nextPage],
      activePageId: nextPage.id
    },
    selection: null
  };
}

export function renamePageCommand(document: DiagramDocument, pageId: string, name: string): CommandResult | null {
  const nextName = name.trim();
  if (!nextName) return null;

  const nextDocument = normalizeDocument(document);
  if (!nextDocument.pages.some((page) => page.id === pageId)) return null;

  return {
    document: {
      ...nextDocument,
      pages: nextDocument.pages.map((page) => (page.id === pageId ? { ...page, name: nextName } : page))
    },
    selection: null
  };
}

export function deletePageCommand(document: DiagramDocument, pageId: string): CommandResult | null {
  const nextDocument = normalizeDocument(document);
  if (nextDocument.pages.length <= 1) return null;

  const deletedIndex = nextDocument.pages.findIndex((page) => page.id === pageId);
  if (deletedIndex < 0) return null;

  const nextPages = nextDocument.pages.filter((page) => page.id !== pageId);
  const activePageId =
    nextDocument.activePageId === pageId
      ? nextPages[Math.min(deletedIndex, nextPages.length - 1)].id
      : nextDocument.activePageId;

  return {
    document: {
      ...nextDocument,
      pages: nextPages,
      activePageId
    },
    selection: null
  };
}

export function movePageCommand(document: DiagramDocument, pageId: string, direction: "up" | "down"): CommandResult | null {
  const nextDocument = normalizeDocument(document);
  const index = nextDocument.pages.findIndex((page) => page.id === pageId);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= nextDocument.pages.length) return null;

  const pages = [...nextDocument.pages];
  [pages[index], pages[targetIndex]] = [pages[targetIndex], pages[index]];

  return {
    document: { ...nextDocument, pages },
    selection: null
  };
}

export function reorderPageCommand(document: DiagramDocument, sourceId: string, targetId: string): CommandResult | null {
  if (sourceId === targetId) return null;

  const nextDocument = normalizeDocument(document);
  const sourceIndex = nextDocument.pages.findIndex((page) => page.id === sourceId);
  const targetIndex = nextDocument.pages.findIndex((page) => page.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return null;

  const pages = [...nextDocument.pages];
  const [movedPage] = pages.splice(sourceIndex, 1);
  pages.splice(targetIndex, 0, movedPage);

  return {
    document: { ...nextDocument, pages },
    selection: null
  };
}

export function applyTemplateCommand(document: DiagramDocument, activePageId: string, template: DiagramTemplate): CommandResult | null {
  const nextDocument = normalizeDocument(document);
  if (!nextDocument.pages.some((page) => page.id === activePageId)) return null;

  const snapshot = cloneSnapshot(template.nodes, template.edges, []);

  return {
    document: {
      ...nextDocument,
      pages: nextDocument.pages.map((page) =>
        page.id === activePageId
          ? { ...page, name: template.name, nodes: snapshot.nodes, edges: snapshot.edges, comments: [] }
          : page
      ),
      activePageId
    },
    selection: null
  };
}

export function commitNodeLabelCommand(document: DiagramDocument, activePageId: string, nodeId: string, label: string): CommandResult | null {
  const nextDocument = normalizeDocument(document);
  const activePage = nextDocument.pages.find((page) => page.id === activePageId);
  if (!activePage) return null;

  const node = activePage.nodes.find((item) => item.id === nodeId);
  if (!node || node.data.locked || node.data.label === label) return null;

  return {
    document: {
      ...nextDocument,
      pages: nextDocument.pages.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              nodes: page.nodes.map((item) => (item.id === nodeId ? { ...item, data: { ...item.data, label } } : item))
            }
          : page
      ),
      activePageId
    },
    selection: { type: "node", id: nodeId }
  };
}

export function commitEdgeLabelCommand(document: DiagramDocument, activePageId: string, edgeId: string, label: string): CommandResult | null {
  const nextDocument = normalizeDocument(document);
  const activePage = nextDocument.pages.find((page) => page.id === activePageId);
  if (!activePage) return null;

  const edge = activePage.edges.find((item) => item.id === edgeId);
  if (!edge || (edge.label ?? "") === label) return null;

  return {
    document: {
      ...nextDocument,
      pages: nextDocument.pages.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              edges: page.edges.map((item) => (item.id === edgeId ? { ...item, label } : item))
            }
          : page
      ),
      activePageId
    },
    selection: { type: "edge", id: edgeId }
  };
}

export function replaceActivePageGraphCommand(
  document: DiagramDocument,
  activePageId: string,
  nodes: DiagramPage["nodes"],
  edges: DiagramPage["edges"],
  selection: Selection
): CommandResult | null {
  return replaceActivePageSnapshotCommand(document, activePageId, { nodes, edges }, selection);
}

export function replaceActivePageSnapshotCommand(
  document: DiagramDocument,
  activePageId: string,
  snapshot: Snapshot,
  selection: Selection
): CommandResult | null {
  const nextDocument = normalizeDocument(document);
  const activePage = nextDocument.pages.find((page) => page.id === activePageId);
  if (!activePage) return null;
  const comments = snapshot.comments ? normalizeComments(snapshot.comments) : activePage.comments;

  if (
    JSON.stringify(activePage.nodes) === JSON.stringify(snapshot.nodes) &&
    JSON.stringify(activePage.edges) === JSON.stringify(snapshot.edges) &&
    JSON.stringify(activePage.comments) === JSON.stringify(comments)
  ) {
    return null;
  }

  return {
    document: {
      ...nextDocument,
      pages: nextDocument.pages.map((page) => (page.id === activePageId ? { ...page, nodes: snapshot.nodes, edges: snapshot.edges, comments } : page)),
      activePageId
    },
    selection
  };
}

function normalizeDocument(document: DiagramDocument): DiagramDocument {
  const nextDocument = cloneDocument(document);
  return {
    ...nextDocument,
    pages: nextDocument.pages.map(clonePage),
    settings: normalizeCanvasSettings(nextDocument.settings)
  };
}

function clonePage(page: DiagramPage): DiagramPage {
  const snapshot = cloneSnapshot(page.nodes, page.edges, normalizeComments(page.comments));
  return {
    ...page,
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    comments: normalizeComments(snapshot.comments)
  };
}
