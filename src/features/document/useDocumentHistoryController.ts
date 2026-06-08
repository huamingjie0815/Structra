import type { ReactFlowInstance } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EDGE_ROUTE_COMMIT_EVENT } from "../../components/CanvasPrimitives";
import { cloneDocument, normalizeCanvasSettings, normalizeComments, syncActivePage } from "../../domain/documentSession";
import type { CanvasSettings, DiagramComment, DiagramDocument, DiagramEdge, DiagramNode, DiagramPage, Selection } from "../../domain/types";
import { replaceActivePageGraphCommand } from "../../editor/commands";
import {
  createHistory,
  getHistoryState,
  pushHistoryEntry,
  redoHistory,
  resetHistoryEntry,
  undoHistory,
  type HistoryEntry
} from "../../editor/history";
import { saveRecoveryCache } from "./useLocalDocumentPersistenceWorkflow";

type DocumentHistoryControllerInput = {
  initialDocument: DiagramDocument;
  pages: DiagramPage[];
  activePageId: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  comments: DiagramComment[];
  currentSettings: CanvasSettings;
  selection: Selection;
  autosaveRecovery: boolean;
  reactFlow: ReactFlowInstance<DiagramNode, DiagramEdge> | null;
  updateCanvasSettings: (patch: Partial<CanvasSettings>) => void;
  setPages: (pages: DiagramPage[]) => void;
  setActivePageId: (pageId: string) => void;
  setNodes: (nodes: DiagramNode[]) => void;
  setEdges: (edges: DiagramEdge[]) => void;
  setComments: (comments: DiagramComment[]) => void;
  setSelection: (selection: Selection) => void;
  setActiveCommentId: (commentId: string | null) => void;
};

type BuildHistoryEntryOptions = Partial<{
  pages: DiagramPage[];
  activePageId: string;
  settings: CanvasSettings;
  selection: Selection;
}>;

export type PageNavigationBaseline = {
  pages: DiagramPage[];
  activePageId: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  comments: DiagramComment[];
  selection: Selection;
};

export function useDocumentHistoryController({
  initialDocument,
  pages,
  activePageId,
  nodes,
  edges,
  comments,
  currentSettings,
  selection,
  autosaveRecovery,
  reactFlow,
  updateCanvasSettings,
  setPages,
  setActivePageId,
  setNodes,
  setEdges,
  setComments,
  setSelection,
  setActiveCommentId
}: DocumentHistoryControllerInput) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const pagesRef = useRef(pages);
  const activePageIdRef = useRef(activePageId);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const commentsRef = useRef(comments);
  const settingsRef = useRef(initialDocument.settings);
  const selectionRef = useRef<Selection>(selection);
  const historyRef = useRef(createHistory({ document: initialDocument, selection: null }));

  useEffect(() => {
    pagesRef.current = pages;
    activePageIdRef.current = activePageId;
    nodesRef.current = nodes;
    edgesRef.current = edges;
    commentsRef.current = comments;
    settingsRef.current = currentSettings;
    selectionRef.current = selection;
    if (autosaveRecovery) {
      saveRecoveryCache({
        pages: syncActivePage(pages, activePageId, nodes, edges, comments),
        activePageId,
        settings: currentSettings
      });
    }
  }, [activePageId, autosaveRecovery, comments, currentSettings, edges, nodes, pages, selection]);

  const currentPages = useMemo(() => syncActivePage(pages, activePageId, nodes, edges, comments), [activePageId, comments, edges, nodes, pages]);
  const currentDocument = useMemo<DiagramDocument>(
    () => ({ pages: currentPages, activePageId, settings: currentSettings }),
    [activePageId, currentPages, currentSettings]
  );

  const refreshHistoryState = useCallback(() => {
    const state = getHistoryState(historyRef.current);
    setCanUndo(state.canUndo);
    setCanRedo(state.canRedo);
  }, []);

  const buildHistoryEntry = useCallback(
    (
      nextNodes = nodesRef.current,
      nextEdges = edgesRef.current,
      nextComments = commentsRef.current,
      options: BuildHistoryEntryOptions = {}
    ): HistoryEntry => {
      const nextActivePageId = options.activePageId ?? activePageIdRef.current;
      return {
        document: {
          pages: syncActivePage(options.pages ?? pagesRef.current, nextActivePageId, nextNodes, nextEdges, nextComments),
          activePageId: nextActivePageId,
          settings: options.settings ?? settingsRef.current
        },
        selection: options.selection ?? selectionRef.current
      };
    },
    []
  );

  const applyHistoryEntry = useCallback(
    (entry: HistoryEntry) => {
      const document = cloneDocument(entry.document);
      const settings = normalizeCanvasSettings(document.settings);
      const nextActivePageId = document.pages.some((page) => page.id === document.activePageId) ? document.activePageId : document.pages[0].id;
      const nextPage = document.pages.find((page) => page.id === nextActivePageId) ?? document.pages[0];
      const nextComments = normalizeComments(nextPage.comments);

      setPages(document.pages);
      setActivePageId(nextActivePageId);
      updateCanvasSettings(settings);
      setNodes(nextPage.nodes);
      setEdges(nextPage.edges);
      setComments(nextComments);
      setSelection(entry.selection);

      pagesRef.current = document.pages;
      activePageIdRef.current = nextActivePageId;
      nodesRef.current = nextPage.nodes;
      edgesRef.current = nextPage.edges;
      commentsRef.current = nextComments;
      settingsRef.current = settings;
      selectionRef.current = entry.selection;
    },
    [setActivePageId, setComments, setEdges, setNodes, setPages, setSelection, updateCanvasSettings]
  );

  const recordSnapshot = useCallback(
    (nextNodes = nodesRef.current, nextEdges = edgesRef.current, nextComments = commentsRef.current) => {
      historyRef.current = pushHistoryEntry(historyRef.current, buildHistoryEntry(nextNodes, nextEdges, nextComments));
      refreshHistoryState();
    },
    [buildHistoryEntry, refreshHistoryState]
  );

  const replaceGraph = useCallback(
    (nextNodes: DiagramNode[], nextEdges: DiagramEdge[], shouldRecord = true, nextComments = commentsRef.current) => {
      setNodes(nextNodes);
      setEdges(nextEdges);
      setComments(nextComments);
      nodesRef.current = nextNodes;
      edgesRef.current = nextEdges;
      commentsRef.current = nextComments;
      if (shouldRecord) {
        recordSnapshot(nextNodes, nextEdges, nextComments);
      }
    },
    [recordSnapshot, setComments, setEdges, setNodes]
  );

  const applyPageNavigationBaseline = useCallback(
    (navigation: PageNavigationBaseline) => {
      const nextComments = normalizeComments(navigation.comments);
      const entry = buildHistoryEntry(navigation.nodes, navigation.edges, nextComments, {
        pages: navigation.pages,
        activePageId: navigation.activePageId,
        selection: navigation.selection
      });

      historyRef.current = resetHistoryEntry(entry);
      setPages(navigation.pages);
      setActivePageId(navigation.activePageId);
      setNodes(navigation.nodes);
      setEdges(navigation.edges);
      setComments(nextComments);
      setSelection(navigation.selection);
      setActiveCommentId(null);

      pagesRef.current = navigation.pages;
      activePageIdRef.current = navigation.activePageId;
      nodesRef.current = navigation.nodes;
      edgesRef.current = navigation.edges;
      commentsRef.current = nextComments;
      selectionRef.current = navigation.selection;
      refreshHistoryState();
    },
    [buildHistoryEntry, refreshHistoryState, setActiveCommentId, setActivePageId, setComments, setEdges, setNodes, setPages, setSelection]
  );

  const applyDocumentTransaction = useCallback(
    (entry: HistoryEntry, fitView = false) => {
      historyRef.current = pushHistoryEntry(historyRef.current, entry);
      applyHistoryEntry(entry);
      refreshHistoryState();
      setActiveCommentId(null);
      if (fitView) {
        window.setTimeout(() => reactFlow?.fitView({ padding: 0.22 }), 60);
      }
    },
    [applyHistoryEntry, reactFlow, refreshHistoryState, setActiveCommentId]
  );

  const replaceDocumentBaseline = useCallback(
    (entry: HistoryEntry, options: Partial<{ fitView: boolean; clearActiveComment: boolean }> = {}) => {
      historyRef.current = resetHistoryEntry(entry);
      applyHistoryEntry(entry);
      refreshHistoryState();
      if (options.clearActiveComment ?? true) {
        setActiveCommentId(null);
      }
      if (options.fitView) {
        window.setTimeout(() => reactFlow?.fitView({ padding: 0.22 }), 60);
      }
    },
    [applyHistoryEntry, reactFlow, refreshHistoryState, setActiveCommentId]
  );

  const commitActivePageGraph = useCallback(
    (nextNodes = nodesRef.current, nextEdges = edgesRef.current, nextSelection = selectionRef.current) => {
      const previousDocument: DiagramDocument = {
        pages: pagesRef.current,
        activePageId: activePageIdRef.current,
        settings: settingsRef.current
      };
      const entry = replaceActivePageGraphCommand(previousDocument, activePageIdRef.current, nextNodes, nextEdges, nextSelection);
      if (entry) {
        applyDocumentTransaction(entry);
      }
    },
    [applyDocumentTransaction]
  );

  useEffect(() => {
    const onEdgeRouteCommit = () => window.setTimeout(() => commitActivePageGraph(), 0);
    window.addEventListener(EDGE_ROUTE_COMMIT_EVENT, onEdgeRouteCommit);
    return () => window.removeEventListener(EDGE_ROUTE_COMMIT_EVENT, onEdgeRouteCommit);
  }, [commitActivePageGraph]);

  const applyCanvasSettingsToCurrentDocument = useCallback(
    (settings: CanvasSettings) => {
      const nextSettings = normalizeCanvasSettings(settings);
      if (JSON.stringify(nextSettings) === JSON.stringify(settingsRef.current)) return;
      updateCanvasSettings(nextSettings);
      settingsRef.current = nextSettings;
      historyRef.current = pushHistoryEntry(historyRef.current, buildHistoryEntry(undefined, undefined, undefined, { settings: nextSettings }));
      refreshHistoryState();
    },
    [buildHistoryEntry, refreshHistoryState, updateCanvasSettings]
  );

  const undo = useCallback(() => {
    const result = undoHistory(historyRef.current);
    historyRef.current = result.history;
    if (result.entry) {
      applyHistoryEntry(result.entry);
    }
    refreshHistoryState();
  }, [applyHistoryEntry, refreshHistoryState]);

  const redo = useCallback(() => {
    const result = redoHistory(historyRef.current);
    historyRef.current = result.history;
    if (result.entry) {
      applyHistoryEntry(result.entry);
    }
    refreshHistoryState();
  }, [applyHistoryEntry, refreshHistoryState]);

  return {
    canUndo,
    canRedo,
    currentPages,
    currentDocument,
    nodesRef,
    edgesRef,
    replaceGraph,
    applyPageNavigationBaseline,
    applyDocumentTransaction,
    replaceDocumentBaseline,
    commitActivePageGraph,
    applyCanvasSettingsToCurrentDocument,
    undo,
    redo
  };
}
