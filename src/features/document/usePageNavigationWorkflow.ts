import type { FitViewOptions } from "@xyflow/react";
import { useCallback } from "react";
import { normalizeComments, syncActivePage } from "../../domain/documentSession";
import type { DiagramComment, DiagramEdge, DiagramNode, DiagramPage, Selection } from "../../domain/types";
import { prepareNodeFocusSelection } from "../../editor/focusSelection";
import { clearGraphSelection } from "../../editor/selectionOperations";
import type { PageNavigationBaseline } from "./useDocumentHistoryController";

export type PageNavigationState = {
  pages: DiagramPage[];
  activePageId: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  comments: DiagramComment[];
};

export type PreparedPageNavigation = {
  pages: DiagramPage[];
  activePageId: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  comments: DiagramComment[];
  selection: Selection;
  selectedNodeIds: Set<string>;
};

export function preparePageOpenNavigation(state: PageNavigationState, pageId: string): PreparedPageNavigation | null {
  if (pageId === state.activePageId) return null;

  const nextPages = syncActivePage(state.pages, state.activePageId, state.nodes, state.edges, state.comments);
  const target = nextPages.find((page) => page.id === pageId);
  if (!target) return null;

  return {
    pages: nextPages,
    activePageId: pageId,
    nodes: target.nodes,
    edges: target.edges,
    comments: normalizeComments(target.comments),
    selection: null,
    selectedNodeIds: new Set()
  };
}

export function prepareDocumentSearchNavigation(state: PageNavigationState, pageId: string, nodeId?: string): PreparedPageNavigation | null {
  const nextPages = syncActivePage(state.pages, state.activePageId, state.nodes, state.edges, state.comments);
  const target = nextPages.find((page) => page.id === pageId);
  if (!target) return null;

  const graphSelection = nodeId ? prepareNodeFocusSelection(target.nodes, target.edges, nodeId) : clearGraphSelection(target.nodes, target.edges);
  return {
    pages: nextPages,
    activePageId: pageId,
    nodes: graphSelection.nodes,
    edges: graphSelection.edges,
    comments: normalizeComments(target.comments),
    selection: graphSelection.selection,
    selectedNodeIds: graphSelection.selectedNodeIds
  };
}

export function usePageNavigationWorkflow({
  state,
  applyPageNavigationBaseline,
  fitView
}: {
  state: PageNavigationState;
  applyPageNavigationBaseline: (navigation: PageNavigationBaseline) => void;
  fitView: (options: FitViewOptions<DiagramNode>) => void;
}) {
  const applyNavigation = useCallback(
    (navigation: PreparedPageNavigation) => {
      applyPageNavigationBaseline(navigation);
    },
    [applyPageNavigationBaseline]
  );

  const openPage = useCallback(
    (pageId: string) => {
      const navigation = preparePageOpenNavigation(state, pageId);
      if (!navigation) return;
      applyNavigation(navigation);
      window.setTimeout(() => fitView({ padding: 0.22 }), 60);
    },
    [applyNavigation, fitView, state]
  );

  const openDocumentSearchResult = useCallback(
    (pageId: string, nodeId?: string) => {
      const navigation = prepareDocumentSearchNavigation(state, pageId, nodeId);
      if (!navigation) return;
      applyNavigation(navigation);
      window.setTimeout(() => {
        if (nodeId) {
          fitView({ nodes: Array.from(navigation.selectedNodeIds).map((id) => ({ id })), padding: 0.35, duration: 240 } as FitViewOptions<DiagramNode>);
          return;
        }
        fitView({ padding: 0.22, duration: 240 });
      }, 80);
    },
    [applyNavigation, fitView, state]
  );

  return { openPage, openDocumentSearchResult };
}
