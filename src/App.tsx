import {
  type FitViewOptions,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type ReactFlowInstance
} from "@xyflow/react";
import { LayoutDashboard } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasWorkspace } from "./components/CanvasWorkspace";
import { CommandPalette } from "./components/CommandPalette";
import { LibrarySidebar } from "./components/LibrarySidebar";
import { LocalWorkspacePanel } from "./components/LocalWorkspacePanel";
import { ContextMenu, ImportErrorBanner } from "./components/Overlays";
import { PresentationOverlay } from "./components/PresentationOverlay";
import { PreferencesDialog } from "./components/PreferencesDialog";
import { PropertySidebar } from "./components/PropertySidebar";
import { TopToolbar } from "./components/TopToolbar";
import {
  EMPTY_ALIGNMENT_GUIDES,
  PAGE_PRESETS,
  diagramNode,
  diagramTemplates,
  edge,
  shapeCategoryMap
} from "./domain/diagramDefaults";
import type {
  AlignmentGuides,
  CanvasSettings,
  CanvasPoint,
  CanvasSize,
  CanvasViewport,
  ContextMenuState,
  DiagramComment,
  DiagramEdge,
  DiagramNode,
  DiagramPage,
  FormatSnapshot,
  Selection,
  ShapeCategory,
  ShapeKind
} from "./domain/types";
import { loadSavedDocument, normalizeCanvasSettings, normalizeComments } from "./domain/documentSession";
import { loadAppPreferences, normalizeAppPreferences, saveAppPreferences, type AppPreferences } from "./domain/preferences";
import {
  buildEditorUrl,
  buildWorkspaceUrl,
  getInitialWorkspaceOpen,
  getOrCreateEditorSessionId
} from "./domain/workspaceRoute";
import { getSvgEdgePath } from "./editor/edgeGeometry";
import { canAppendStructuredNode } from "./editor/elementOperations";
import { getBounds } from "./editor/geometry";
import { getNodeAlignmentGuides, guidesEqual } from "./editor/canvasGeometry";
import {
  buildKeyboardConnectorConnection,
  startKeyboardConnector as prepareKeyboardConnector
} from "./editor/keyboardConnector";
import {
  getAllTemplates,
  getDocumentSearchResults,
  getLayerNodes,
  getVisibleOutlineNodes,
  getVisibleShapes
} from "./editor/documentSelectors";
import {
  applyDiagramEdgeChanges,
  applyLockedAwareNodeChanges,
  connectDiagramEdge,
  reconnectDiagramEdge
} from "./editor/reactFlowChangeOperations";
import { getGroupSelectionIds } from "./editor/selection";
import { replaceActivePageGraphCommand } from "./editor/commands";
import { shapeLibrary } from "./features/shapes/shapeLibrary";
import { useShapeInsertionWorkflow } from "./features/shapes/useShapeInsertionWorkflow";
import { useCommentWorkflow } from "./features/comments/useCommentWorkflow";
import { useCustomTemplates } from "./features/document/useCustomTemplates";
import { useDocumentFileWorkflow } from "./features/document/useDocumentFileWorkflow";
import { useDocumentHistoryController } from "./features/document/useDocumentHistoryController";
import { useDocumentRestoreWorkflow } from "./features/document/useDocumentRestoreWorkflow";
import { useLocalDocumentPersistenceWorkflow } from "./features/document/useLocalDocumentPersistenceWorkflow";
import { usePageActionsWorkflow } from "./features/document/usePageActionsWorkflow";
import { usePageNavigationWorkflow } from "./features/document/usePageNavigationWorkflow";
import { useTemplateFavorites } from "./features/document/useTemplateFavorites";
import { formatVersionTime, useVersionHistory } from "./features/document/useVersionHistory";
import { useWorkspaceActionsWorkflow } from "./features/document/useWorkspaceActionsWorkflow";
import { useClipboardWorkflow } from "./features/editor/useClipboardWorkflow";
import { useCanvasSettingsWorkflow } from "./features/editor/useCanvasSettingsWorkflow";
import { useCommandItemsWorkflow } from "./features/editor/useCommandItemsWorkflow";
import { useCommandPaletteWorkflow } from "./features/editor/useCommandPaletteWorkflow";
import { useElementEditingWorkflow } from "./features/editor/useElementEditingWorkflow";
import { useEditorKeyboardWorkflow } from "./features/editor/useEditorKeyboardWorkflow";
import { useFocusSelectionWorkflow } from "./features/editor/useFocusSelectionWorkflow";
import { useInlineLabelEditingWorkflow } from "./features/editor/useInlineLabelEditingWorkflow";
import { usePresentationWorkflow } from "./features/presentation/usePresentationWorkflow";
import { useDesktopWindowLifecycle } from "./desktop/useDesktopWindowLifecycle";
import { useNativeMenuWorkflow } from "./desktop/useNativeMenuWorkflow";
import { useNativeOpenDocumentWorkflow } from "./desktop/useNativeOpenDocumentWorkflow";
import { serializeDiagramDocument } from "./io/documentFile";
import { recordDesktopLifecycleAudit } from "./io/nativeFiles";

type ResolvedAppTheme = "light" | "dark";

function getSystemTheme(): ResolvedAppTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const loadedDocument = useMemo(loadSavedDocument, []);
  const loadedSettings = useMemo(() => normalizeCanvasSettings(loadedDocument.settings), [loadedDocument]);
  const loadedPreferences = useMemo(loadAppPreferences, []);
  const loadedDocumentSnapshot = useMemo(
    () => serializeDiagramDocument({ pages: loadedDocument.pages, activePageId: loadedDocument.activePageId, settings: loadedSettings }),
    [loadedDocument, loadedSettings]
  );
  const loadedPage = loadedDocument.pages.find((page) => page.id === loadedDocument.activePageId) ?? loadedDocument.pages[0];
  const { versions, saveVersion: saveVersionSnapshot, deleteVersion } = useVersionHistory();
  const { customTemplates, saveCustomTemplate, deleteCustomTemplate } = useCustomTemplates();
  const { favoriteTemplateIdSet, toggleTemplateFavorite, removeTemplateFavorite } = useTemplateFavorites();
  const {
    commandPaletteOpen,
    commandPaletteQuery,
    setCommandPaletteQuery,
    openCommandPalette,
    closeCommandPalette,
    runCommand
  } = useCommandPaletteWorkflow();
  const [pages, setPages] = useState<DiagramPage[]>(loadedDocument.pages);
  const [activePageId, setActivePageId] = useState(loadedPage.id);
  const [nodes, setNodes] = useState<DiagramNode[]>(loadedPage.nodes);
  const [edges, setEdges] = useState<DiagramEdge[]>(loadedPage.edges);
  const [comments, setComments] = useState<DiagramComment[]>(normalizeComments(loadedPage.comments));
  const [commentDraft, setCommentDraft] = useState("");
  const [commentReplyDrafts, setCommentReplyDrafts] = useState<Record<string, string>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [draggingPageId, setDraggingPageId] = useState<string | null>(null);
  const [pageDropTargetId, setPageDropTargetId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(loadedPreferences);
  const [systemTheme, setSystemTheme] = useState<ResolvedAppTheme>(() => getSystemTheme());
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const initialWorkspaceOpen = useMemo(
    () => getInitialWorkspaceOpen(loadedPreferences.openWorkspaceOnLaunch, window.location.search),
    [loadedPreferences.openWorkspaceOnLaunch]
  );
  const [workspaceOpen, setWorkspaceOpenState] = useState(initialWorkspaceOpen);
  const [tool, setTool] = useState<"select" | "pan" | "connect">("select");
  const [keyboardConnectorSourceId, setKeyboardConnectorSourceId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const {
    showGrid,
    showRulers,
    snapToGrid,
    gridSize,
    gridVariant,
    pagePreset,
    canvasBackground,
    currentSettings,
    updateCanvasSettings
  } = useCanvasSettingsWorkflow(loadedSettings);
  const [shapeQuery, setShapeQuery] = useState("");
  const [shapeCategory, setShapeCategory] = useState<ShapeCategory>("all");
  const [documentQuery, setDocumentQuery] = useState("");
  const [outlineQuery, setOutlineQuery] = useState("");
  const [zoom, setZoom] = useState(100);
  const [viewport, setViewport] = useState<CanvasViewport>({ x: 0, y: 0, zoom: 1 });
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [reactFlow, setReactFlow] = useState<ReactFlowInstance<DiagramNode, DiagramEdge> | null>(null);
  const [canApplyFormat, setCanApplyFormat] = useState(false);
  const [formatTarget, setFormatTarget] = useState<FormatSnapshot["target"] | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuides>(EMPTY_ALIGNMENT_GUIDES);
  const fileInput = useRef<HTMLInputElement>(null);
  const mermaidInput = useRef<HTMLInputElement>(null);
  const outlineSearchRef = useRef<HTMLInputElement>(null);
  const canvasRegionRef = useRef<HTMLElement>(null);
  const formatRef = useRef<FormatSnapshot | null>(null);
  const cursorPositionRef = useRef<CanvasPoint | null>(null);

  const setCanvasCursorPosition = useCallback((position: CanvasPoint | null) => {
    cursorPositionRef.current = position;
  }, []);

  const getCanvasCursorPosition = useCallback(() => cursorPositionRef.current, []);

  useEffect(() => {
    const element = canvasRegionRef.current;
    if (!element) return;
    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      setCanvasSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [workspaceOpen]);

  const {
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
  } = useDocumentHistoryController({
    initialDocument: { pages: loadedDocument.pages, activePageId: loadedPage.id, settings: loadedSettings },
    pages,
    activePageId,
    nodes,
    edges,
    comments,
    currentSettings,
    selection,
    autosaveRecovery: appPreferences.autosaveRecovery,
    reactFlow,
    updateCanvasSettings,
    setPages,
    setActivePageId,
    setNodes,
    setEdges,
    setComments,
    setSelection,
    setActiveCommentId
  });
  const commitCanvasSettingsPatch = useCallback(
    (patch: Partial<CanvasSettings>) => {
      applyCanvasSettingsToCurrentDocument(normalizeCanvasSettings({ ...currentSettings, ...patch }));
    },
    [applyCanvasSettingsToCurrentDocument, currentSettings]
  );
  const toggleGridInHistory = useCallback(() => {
    commitCanvasSettingsPatch({ showGrid: !currentSettings.showGrid });
  }, [commitCanvasSettingsPatch, currentSettings.showGrid]);
  const toggleRulersInHistory = useCallback(() => {
    commitCanvasSettingsPatch({ showRulers: !currentSettings.showRulers });
  }, [commitCanvasSettingsPatch, currentSettings.showRulers]);
  const toggleSnapToGridInHistory = useCallback(() => {
    commitCanvasSettingsPatch({ snapToGrid: !currentSettings.snapToGrid });
  }, [commitCanvasSettingsPatch, currentSettings.snapToGrid]);
  const persistAppPreferences = useCallback((preferences: AppPreferences) => {
    const normalized = normalizeAppPreferences(preferences);
    setAppPreferences(normalized);
    try { saveAppPreferences(normalized); } catch (error) { console.warn("Local preferences save failed", error); }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => setSystemTheme(media.matches ? "dark" : "light");
    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);
  const resolvedTheme = appPreferences.theme === "system" ? systemTheme : appPreferences.theme;
  const writeWorkspaceRoute = useCallback((open: boolean) => {
    const nextUrl = open
      ? buildWorkspaceUrl(window.location.pathname, window.location.search, window.location.hash)
      : buildEditorUrl(window.location.pathname, window.location.search, window.location.hash, getOrCreateEditorSessionId());
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl === nextUrl) return;
    window.history.pushState({ myCubeWorkspaceOpen: open }, "", nextUrl);
  }, []);
  const setWorkspaceOpen = useCallback(
    (open: boolean) => {
      setWorkspaceOpenState(open);
      writeWorkspaceRoute(open);
    },
    [writeWorkspaceRoute]
  );
  useEffect(() => {
    const handlePopState = () => {
      setWorkspaceOpenState(getInitialWorkspaceOpen(appPreferences.openWorkspaceOnLaunch, window.location.search));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [appPreferences.openWorkspaceOnLaunch]);
  const { restoreDocumentSnapshot } = useDocumentRestoreWorkflow({
    replaceDocumentBaseline
  });
  const activePage = useMemo(
    () => currentPages.find((page) => page.id === activePageId) ?? currentPages[0],
    [activePageId, currentPages]
  );
  const activePageIndex = useMemo(() => currentPages.findIndex((page) => page.id === activePageId), [activePageId, currentPages]);
  const {
    presentationMode,
    presentationPageIndex,
    presentationPage,
    presentationSvg,
    openPresentation,
    movePresentationPage,
    closePresentation
  } = usePresentationWorkflow({
    pages: currentPages,
    activePage,
    activePageIndex,
    canvasBackground,
    pagePreset
  });
  const {
    recentDocuments,
    documentPath,
    documentName,
    documentDirty,
    documentStatus,
    importError,
    clearImportError,
    markRecoveryCacheSaved,
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
    importMermaidFromFileInput,
    importMermaid,
    acceptNextUnsavedPromptForAudit,
    forgetRecentDocument,
    clearRecentDocumentList
  } = useDocumentFileWorkflow({
    initialDocumentSnapshot: loadedDocumentSnapshot,
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
    defaultCanvasSettings: appPreferences.canvasSettings,
    replaceDocumentBaseline,
    applyDocumentTransaction
  });
  const { saveNow, saveVersion, restoreVersion } = useLocalDocumentPersistenceWorkflow({
    currentDocument,
    markRecoveryCacheSaved,
    saveVersionSnapshot,
    restoreDocumentSnapshot
  });
  const {
    addPage,
    duplicatePage,
    renamePage,
    deletePage,
    movePage,
    reorderPage,
    applyTemplate,
    saveCurrentPageAsTemplate
  } = usePageActionsWorkflow({
    currentDocument,
    currentPages,
    activePage,
    activePageId,
    nodes,
    edges,
    applyDocumentTransaction,
    saveCustomTemplate
  });

  const {
    newDocumentFromWorkspace,
    openDocumentFromWorkspace,
    openRecentDocumentFromWorkspace,
    applyTemplateFromWorkspace
  } = useWorkspaceActionsWorkflow({
    setWorkspaceOpen,
    newDocument,
    openDocument,
    openRecentDocument,
    applyTemplate
  });
  const openFirstRecentFromWorkspace = useCallback(() => {
    const firstRecentDocument = recentDocuments[0];
    if (!firstRecentDocument) return;
    void openRecentDocumentFromWorkspace(firstRecentDocument.path);
  }, [openRecentDocumentFromWorkspace, recentDocuments]);

  useDesktopWindowLifecycle(documentName, documentDirty);
  useEffect(() => {
    if (recentDocuments.length === 0) return;
    void recordDesktopLifecycleAudit("recent-documents", { recentDocuments });
  }, [recentDocuments]);
  const openNativeDocumentPathFromDesktop = useCallback(
    async (path: string, source: "startup" | "event") => {
      const opened = await openNativeDocumentPath(path, "打开外部文档", { skipDiscardConfirmation: source === "startup" });
      if (opened) setWorkspaceOpen(false);
      return opened;
    },
    [openNativeDocumentPath, setWorkspaceOpen]
  );
  useNativeOpenDocumentWorkflow(openNativeDocumentPathFromDesktop);

  const visibleShapes = useMemo(() => {
    return getVisibleShapes(shapeLibrary, shapeCategoryMap, shapeCategory, shapeQuery);
  }, [shapeCategory, shapeQuery]);
  const allTemplates = useMemo(() => getAllTemplates(customTemplates, diagramTemplates), [customTemplates]);
  const deleteCustomTemplateWithConfirm = useCallback(
    (templateId: string) => {
      const template = allTemplates.find((item) => item.id === templateId);
      if (template && !template.custom) return;
      const templateName = template?.name ?? "本地模板";
      if (!window.confirm(`删除本地模板“${templateName}”？`)) return;
      removeTemplateFavorite(templateId);
      deleteCustomTemplate(templateId);
    },
    [allTemplates, deleteCustomTemplate, removeTemplateFavorite]
  );
  const clearRecentDocumentListWithConfirm = useCallback(() => {
    if (recentDocuments.length === 0) return;
    if (!window.confirm(`清空 ${recentDocuments.length} 条最近文档记录？\n\n只会移除列表记录，不会删除本机文件。`)) return;
    clearRecentDocumentList();
  }, [clearRecentDocumentList, recentDocuments.length]);
  const visibleOutlineNodes = useMemo(() => {
    return getVisibleOutlineNodes(nodes, outlineQuery, shapeLibrary);
  }, [nodes, outlineQuery]);
  const layerNodes = useMemo(() => getLayerNodes(nodes), [nodes]);
  const documentSearchResults = useMemo(() => {
    return getDocumentSearchResults(currentPages, documentQuery, shapeLibrary);
  }, [currentPages, documentQuery]);

  const selectedNode = useMemo(
    () => (selection?.type === "node" ? nodes.find((node) => node.id === selection.id) : undefined),
    [nodes, selection]
  );
  const selectedEdge = useMemo(
    () => (selection?.type === "edge" ? edges.find((item) => item.id === selection.id) : undefined),
    [edges, selection]
  );
  const canAddStructuredChild = useMemo(() => canAppendStructuredNode(selectedNode, "child"), [selectedNode]);
  const canAddStructuredSibling = useMemo(() => canAppendStructuredNode(selectedNode, "sibling"), [selectedNode]);
  const {
    focusNodeById,
    focusCommentTarget,
    selectAllNodes: selectAllNodesByFocus
  } = useFocusSelectionWorkflow({
    nodes,
    edges,
    reactFlow,
    replaceGraph,
    setSelection
  });
  const { openComments, addComment, setCommentResolved, deleteComment, addCommentReply, focusComment } = useCommentWorkflow({
    comments,
    commentDraft,
    commentReplyDrafts,
    activeCommentId,
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    getCursorPosition: getCanvasCursorPosition,
    canvasSize,
    canvasRegionRef,
    reactFlow,
    setCommentDraft,
    setCommentReplyDrafts,
    setActiveCommentId,
    focusCommentTarget,
    currentDocument,
    activePageId,
    selection,
    applyDocumentTransaction
  });
  const selectedNodes = useMemo(() => nodes.filter((node) => node.selected), [nodes]);
  const selectedEdges = useMemo(() => edges.filter((item) => item.selected), [edges]);
  const mindNodeCount = useMemo(() => nodes.filter((node) => shapeCategoryMap[node.data.shape] === "mind").length, [nodes]);
  const orgNodeCount = useMemo(() => nodes.filter((node) => shapeCategoryMap[node.data.shape] === "org").length, [nodes]);
  const selectedNodeIds = useMemo(() => new Set(selectedNodes.map((node) => node.id)), [selectedNodes]);
  const selectedEdgeIds = useMemo(() => new Set(selectedEdges.map((item) => item.id)), [selectedEdges]);
  const { canPaste, copySelection, pasteClipboard, cutSelection, duplicateSelection, deleteSelection } = useClipboardWorkflow({
    nodes,
    edges,
    comments,
    currentDocument,
    activePageId,
    selectedNodes,
    selectedNodeIds,
    selectedEdgeIds,
    selection,
    applyDocumentTransaction
  });
  const {
    updateNodeData,
    updateNodePosition,
    updateSelectedNodes,
    setSelectedNodesLocked,
    setNodeLocked,
    updateSelectedEdges,
    groupSelection,
    ungroupSelection,
    updateEdge,
    autoRouteSelectedEdge,
    applyFormat: applyFormatToSelection,
    nudgeSelectedNodes,
    alignSelected,
    matchSelectedNodeSize,
    reorderSelection,
    autoLayout,
    appendStructuredNode,
    setNodeHidden,
    moveLayerNode
  } = useElementEditingWorkflow({
    nodes,
    edges,
    currentDocument,
    activePageId,
    selectedNode,
    selectedNodes,
    selectedEdge,
    selectedEdges,
    selectedNodeIds,
    selectedEdgeIds,
    selection,
    applyDocumentTransaction
  });
  const {
    nodeEditorRef,
    edgeEditorRef,
    editingNode,
    editingNodeLabel,
    editingEdge,
    editingEdgeLabel,
    editingEdgePosition,
    setEditingNodeLabel,
    setEditingEdgeLabel,
    startNodeLabelEdit,
    commitNodeLabelEdit,
    cancelNodeLabelEdit,
    editNodeLabel,
    startEdgeLabelEdit,
    commitEdgeLabelEdit,
    cancelEdgeLabelEdit,
    editEdgeLabel
  } = useInlineLabelEditingWorkflow({
    nodes,
    edges,
    currentDocument,
    activePageId,
    nodesRef,
    edgesRef,
    setNodes,
    setEdges,
    setSelection,
    setContextMenu,
    applyDocumentTransaction
  });

  const pageNavigationState = useMemo(
    () => ({ pages, activePageId, nodes, edges, comments }),
    [activePageId, comments, edges, nodes, pages]
  );
  const { openPage, openDocumentSearchResult } = usePageNavigationWorkflow({
    state: pageNavigationState,
    applyPageNavigationBaseline,
    fitView: (options) => reactFlow?.fitView(options)
  });

  const addShape = useShapeInsertionWorkflow({
    nodes,
    edges,
    currentDocument,
    activePageId,
    canvasRegionRef,
    reactFlow,
    applyDocumentTransaction
  });

  const onNodesChange = useCallback(
    (changes: NodeChange<DiagramNode>[]) => {
      const result = applyLockedAwareNodeChanges(nodesRef.current, changes);
      setNodes(result.nodes);
      nodesRef.current = result.nodes;

      if (result.shouldRecordSnapshot) {
        window.setTimeout(() => commitActivePageGraph(), 0);
      }
    },
    [commitActivePageGraph]
  );

  const onEdgesChange = useCallback((changes: EdgeChange<DiagramEdge>[]) => {
    setEdges((current) => {
      const nextEdges = applyDiagramEdgeChanges(current, changes);
      edgesRef.current = nextEdges;
      return nextEdges;
    });
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = connectDiagramEdge(edgesRef.current, connection);
      const entry = replaceActivePageGraphCommand(currentDocument, activePageId, nodesRef.current, nextEdges, selection);
      if (entry) {
        applyDocumentTransaction(entry);
      }
    },
    [activePageId, applyDocumentTransaction, currentDocument, selection]
  );

  const keyboardConnectorActive = Boolean(keyboardConnectorSourceId);
  const startKeyboardConnector = useCallback(() => {
    const nextConnector = prepareKeyboardConnector(selectedNodes);
    setKeyboardConnectorSourceId(nextConnector.sourceNodeId);
    if (nextConnector.sourceNodeId) {
      setTool("connect");
    }
  }, [selectedNodes]);

  const completeKeyboardConnector = useCallback(() => {
    const connection = buildKeyboardConnectorConnection({ sourceNodeId: keyboardConnectorSourceId }, selectedNodes);
    if (!connection) return false;
    onConnect(connection);
    setKeyboardConnectorSourceId(null);
    setTool("select");
    return true;
  }, [keyboardConnectorSourceId, onConnect, selectedNodes]);

  useEffect(() => {
    setKeyboardConnectorSourceId(null);
  }, [activePageId]);

  const onReconnect = useCallback(
    (oldEdge: DiagramEdge, connection: Connection) => {
      const nextEdges = reconnectDiagramEdge(edgesRef.current, oldEdge, connection);
      const entry = replaceActivePageGraphCommand(currentDocument, activePageId, nodesRef.current, nextEdges, selection);
      if (entry) {
        applyDocumentTransaction(entry);
      }
    },
    [activePageId, applyDocumentTransaction, currentDocument, selection]
  );

  const copyFormat = useCallback(() => {
    if (selectedNode) {
      formatRef.current = {
        target: "node",
        data: {
          fill: selectedNode.data.fill,
          stroke: selectedNode.data.stroke,
          text: selectedNode.data.text,
          fontSize: selectedNode.data.fontSize,
          textAlign: selectedNode.data.textAlign,
          fontFamily: selectedNode.data.fontFamily,
          bold: selectedNode.data.bold,
          italic: selectedNode.data.italic,
          underline: selectedNode.data.underline,
          strokeWidth: selectedNode.data.strokeWidth,
          strokeStyle: selectedNode.data.strokeStyle,
          opacity: selectedNode.data.opacity,
          rotation: selectedNode.data.rotation
        }
      };
      setCanApplyFormat(true);
      setFormatTarget("node");
      return;
    }
    if (selectedEdge) {
      formatRef.current = {
        target: "edge",
        edge: {
          type: selectedEdge.type,
          data: selectedEdge.data ? { ...selectedEdge.data } : undefined,
          style: selectedEdge.style ? { ...selectedEdge.style } : undefined,
          labelStyle: selectedEdge.labelStyle ? { ...selectedEdge.labelStyle } : undefined,
          labelBgStyle: selectedEdge.labelBgStyle ? { ...selectedEdge.labelBgStyle } : undefined,
          markerStart: selectedEdge.markerStart,
          markerEnd: selectedEdge.markerEnd,
          animated: selectedEdge.animated
        }
      };
      setCanApplyFormat(true);
      setFormatTarget("edge");
    }
  }, [selectedEdge, selectedNode]);

  const applyFormat = useCallback(() => {
    applyFormatToSelection(formatRef.current);
  }, [applyFormatToSelection]);

  const fitCanvas = useCallback(() => {
    reactFlow?.fitView({ padding: 0.22, duration: 240 });
  }, [reactFlow]);

  const resetZoom = useCallback(() => {
    reactFlow?.zoomTo(1, { duration: 180 });
  }, [reactFlow]);

  const fitSelection = useCallback(() => {
    if (selectedNodes.length === 0) return;
    const options = { nodes: selectedNodes.map((node) => ({ id: node.id })), padding: 0.35, duration: 240 } as FitViewOptions<DiagramNode>;
    reactFlow?.fitView(options);
  }, [reactFlow, selectedNodes]);

  const selectNodeById = useCallback(
    (id: string) => {
      focusNodeById(id);
    },
    [focusNodeById]
  );

  const selectAllNodes = useCallback(() => {
    selectAllNodesByFocus();
  }, [selectAllNodesByFocus]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      const kind = event.dataTransfer.getData("application/structra-shape") as ShapeKind;
      if (!kind || !reactFlow) return;
      addShape(kind, reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addShape, reactFlow]
  );

  const updateAlignmentGuides = useCallback(
    (_event: MouseEvent | TouchEvent, node: DiagramNode) => {
      const guides = getNodeAlignmentGuides(node, nodesRef.current, zoom / 100);
      setAlignmentGuides((current) => (guidesEqual(current, guides) ? current : guides));
    },
    [zoom]
  );

  const clearAlignmentGuides = useCallback(() => {
    setAlignmentGuides(EMPTY_ALIGNMENT_GUIDES);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const exitPreviewMode = useCallback(() => {
    setPreviewMode(false);
  }, []);

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);

  useEditorKeyboardWorkflow({
    outlineSearchRef,
    openCommandPalette,
    saveDocument,
    saveDocumentAs,
    openDocument,
    newDocument,
    nudgeSelectedNodes,
    reactFlow,
    undo,
    redo,
    copySelection,
    cutSelection,
    deleteSelection,
    duplicateSelection,
    pasteClipboard,
    selectAllNodes,
    closeContextMenu,
    exitPreviewMode,
    completeKeyboardConnector,
    appendStructuredNode
  });

  const exportDefaultFormat = useCallback(() => {
    if (appPreferences.defaultExportFormat === "json") {
      void exportJson();
      return;
    }
    if (appPreferences.defaultExportFormat === "png") {
      void exportPng();
      return;
    }
    if (appPreferences.defaultExportFormat === "pdf") {
      void exportPdf();
      return;
    }
    void exportSvg();
  }, [appPreferences.defaultExportFormat, exportJson, exportPdf, exportPng, exportSvg]);

  const commandItems = useCommandItemsWorkflow({
    newDocument,
    openDocument,
    saveDocument,
    saveDocumentAs,
    setTool,
    addShape,
    addPage,
    duplicatePage,
    saveCache: saveNow,
    saveVersion,
    importJson,
    importMermaid,
    exportDefault: exportDefaultFormat,
    exportJson,
    exportMermaid,
    exportSvg,
    exportPng,
    exportPdf,
    exportDocumentPdf,
    printCurrentPage,
    openPreferences,
    openPresentation,
    toggleSnapToGrid: toggleSnapToGridInHistory,
    fitCanvas,
    fitSelection,
    matchNodeSize: matchSelectedNodeSize,
    autoLayout,
    appendStructuredNode,
    startKeyboardConnector,
    completeKeyboardConnector,
    selectedNodeCount: selectedNodes.length,
    nodeCount: nodes.length,
    mindNodeCount,
    orgNodeCount,
    canAddStructuredChild,
    canAddStructuredSibling,
    keyboardConnectorActive
  });

  const zoomIn = useCallback(() => {
    reactFlow?.zoomIn();
  }, [reactFlow]);

  const zoomOut = useCallback(() => {
    reactFlow?.zoomOut();
  }, [reactFlow]);

  const exportDocumentPdfFromMenu = useCallback(() => {
    void exportDocumentPdf();
  }, [exportDocumentPdf]);

  const togglePreviewMode = useCallback(() => {
    setPreviewMode((value) => !value);
  }, []);

  useNativeMenuWorkflow({
    commandItems,
    openCommandPalette,
    runCommand,
    undo,
    redo,
    copySelection,
    cutSelection,
    pasteClipboard,
    duplicateSelection,
    deleteSelection,
    selectAllNodes,
    toggleGrid: toggleGridInHistory,
    toggleRulers: toggleRulersInHistory,
    toggleSnapToGrid: toggleSnapToGridInHistory,
    openWorkspace: () => setWorkspaceOpen(true),
    openFirstRecentFromWorkspace,
    acceptNextUnsavedPromptForAudit,
    openPreferences,
    zoomIn,
    zoomOut,
    resetZoom,
    togglePreviewMode,
    exportDocumentPdf: exportDocumentPdfFromMenu,
    printCurrentPage,
    canUndo,
    canRedo,
    canPaste,
    documentDirty,
    selectedNodeCount: selectedNodes.length,
    selectedEdgeCount: selectedEdges.length,
    hasSelection: Boolean(selection)
  });

  const pageFrame = pagePreset === "content" ? null : PAGE_PRESETS[pagePreset];
  const workspacePanel = (
    <LocalWorkspacePanel
      open={workspaceOpen}
      documentName={documentName}
      documentDirty={documentDirty}
      documentPath={documentPath}
      documentStatus={documentStatus}
      recentDocuments={recentDocuments}
      templates={allTemplates}
      onClose={() => setWorkspaceOpen(false)}
      onNewDocument={newDocumentFromWorkspace}
      onOpenDocument={() => void openDocumentFromWorkspace()}
      onOpenRecentDocument={openRecentDocumentFromWorkspace}
      onForgetRecentDocument={forgetRecentDocument}
      onClearRecentDocuments={clearRecentDocumentListWithConfirm}
      onApplyTemplate={applyTemplateFromWorkspace}
      onDeleteCustomTemplate={deleteCustomTemplateWithConfirm}
      favoriteTemplateIds={favoriteTemplateIdSet}
      onToggleTemplateFavorite={toggleTemplateFavorite}
      formatVersionTime={formatVersionTime}
    />
  );
  const hiddenFileInputs = (
    <>
      <input ref={fileInput} type="file" accept="application/json,.json,.structra" className="hidden-file" onChange={importJsonFromFileInput} />
      <input ref={mermaidInput} type="file" accept=".mmd,.md,.txt,text/plain" className="hidden-file" onChange={importMermaidFromFileInput} />
    </>
  );

  if (workspaceOpen) {
    return (
      <div className="app-shell workspace-shell" data-theme={resolvedTheme} data-theme-preference={appPreferences.theme}>
        {importError ? <ImportErrorBanner error={importError} onDismiss={clearImportError} /> : null}
        {workspacePanel}
        <PreferencesDialog
          open={preferencesOpen}
          currentCanvasSettings={currentSettings}
          preferences={appPreferences}
          onClose={() => setPreferencesOpen(false)}
          onApplyDocumentSettings={commitCanvasSettingsPatch}
          onSavePreferences={persistAppPreferences}
        />
        {hiddenFileInputs}
      </div>
    );
  }

  return (
    <div className={`app-shell${previewMode ? " preview-mode" : ""}`} data-theme={resolvedTheme} data-theme-preference={appPreferences.theme}>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">ST</div>
          <div>
            <strong>Structra</strong>
            <span>桌面流程图工作台</span>
          </div>
        </div>
        <button className="workspace-return-button" type="button" onClick={() => setWorkspaceOpen(true)} aria-label="返回本地工作台">
          <LayoutDashboard size={16} aria-hidden="true" />
          <span>返回工作台</span>
        </button>
        <TopToolbar
          tool={tool}
          previewMode={previewMode}
          showGrid={showGrid}
          showRulers={showRulers}
          canUndo={canUndo}
          canRedo={canRedo}
          canPaste={canPaste}
          canApplyFormat={canApplyFormat}
          formatTarget={formatTarget}
          hasSelectedNode={Boolean(selectedNode)}
          hasSelectedEdge={Boolean(selectedEdge)}
          hasSelection={Boolean(selection)}
          selectedNodeCount={selectedNodes.length}
          selectedNodeIdCount={selectedNodeIds.size}
          selectedEdgeIdCount={selectedEdgeIds.size}
          selectedNodeHasGroup={selectedNodes.some((node) => node.data.groupId)}
          selectedNodesAllLocked={selectedNodes.every((node) => node.data.locked)}
          selectedNodesAllUnlocked={selectedNodes.every((node) => !node.data.locked)}
          nodeCount={nodes.length}
          mindNodeCount={mindNodeCount}
          orgNodeCount={orgNodeCount}
          canAddStructuredChild={canAddStructuredChild}
          canAddStructuredSibling={canAddStructuredSibling}
          zoom={zoom}
          documentDirty={documentDirty}
          defaultExportFormat={appPreferences.defaultExportFormat}
          onToolChange={setTool}
          onTogglePreview={togglePreviewMode}
          onOpenPresentation={openPresentation}
          onOpenPreferences={openPreferences}
          onOpenWorkspace={() => setWorkspaceOpen(true)}
          onToggleGrid={toggleGridInHistory}
          onToggleRulers={toggleRulersInHistory}
          onUndo={undo}
          onRedo={redo}
          onCopy={copySelection}
          onCut={cutSelection}
          onPaste={pasteClipboard}
          onDuplicate={duplicateSelection}
          onCopyFormat={copyFormat}
          onApplyFormat={applyFormat}
          onDelete={deleteSelection}
          onAlign={alignSelected}
          onMatchSize={matchSelectedNodeSize}
          onAutoLayout={autoLayout}
          onAddStructuredNode={appendStructuredNode}
          onReorder={reorderSelection}
          onGroup={groupSelection}
          onUngroup={ungroupSelection}
          onSetLocked={setSelectedNodesLocked}
          onNewDocument={newDocument}
          onOpenDocument={() => void openDocument()}
          onSaveDocument={() => void saveDocument()}
          onSaveDocumentAs={() => void saveDocumentAs()}
          onSaveCache={saveNow}
          onSaveVersion={saveVersion}
          onImportJson={() => void importJson()}
          onImportMermaid={() => void importMermaid()}
          onExportDefault={exportDefaultFormat}
          onExportJson={() => void exportJson()}
          onExportMermaid={() => void exportMermaid()}
          onExportSvg={() => void exportSvg()}
          onExportPng={() => void exportPng()}
          onExportPdf={() => void exportPdf()}
          onExportDocumentPdf={() => void exportDocumentPdf()}
          onPrint={printCurrentPage}
        />
        <div className="status-pill" role="status" aria-live="polite" aria-atomic="true" title={documentPath ?? documentStatus}>
          {documentDirty ? "*" : ""}{documentName} · {documentDirty ? "未保存" : documentStatus} · {activePage.name} · {nodes.length} 节点 / {edges.length} 连线
          {keyboardConnectorActive ? " · 键盘连线：选择目标并按 Enter" : ""}
        </div>
      </header>
      {importError ? <ImportErrorBanner error={importError} onDismiss={clearImportError} /> : null}

      <main className="workspace">
        <LibrarySidebar
          shapeQuery={shapeQuery}
          shapeCategory={shapeCategory}
          visibleShapes={visibleShapes}
          pages={currentPages}
          activePageId={activePageId}
          activePageIndex={activePageIndex}
          draggingPageId={draggingPageId}
          pageDropTargetId={pageDropTargetId}
          documentQuery={documentQuery}
          documentSearchResults={documentSearchResults}
          recentDocuments={recentDocuments}
          templates={allTemplates}
          nodes={nodes}
          outlineQuery={outlineQuery}
          outlineSearchRef={outlineSearchRef}
          visibleOutlineNodes={visibleOutlineNodes}
          layerNodes={layerNodes}
          onShapeQueryChange={setShapeQuery}
          onShapeCategoryChange={setShapeCategory}
          onAddShape={addShape}
          onOpenPage={openPage}
          onDraggingPageChange={setDraggingPageId}
          onPageDropTargetChange={setPageDropTargetId}
          onReorderPage={reorderPage}
          onAddPage={addPage}
          onDuplicatePage={duplicatePage}
          onMovePage={movePage}
          onRenamePage={renamePage}
          onDeletePage={deletePage}
          onDocumentQueryChange={setDocumentQuery}
          onOpenDocumentSearchResult={openDocumentSearchResult}
          onOpenRecentDocument={openRecentDocument}
          onForgetRecentDocument={forgetRecentDocument}
          formatVersionTime={formatVersionTime}
          onSaveCurrentPageAsTemplate={saveCurrentPageAsTemplate}
          onApplyTemplate={applyTemplate}
          onDeleteCustomTemplate={deleteCustomTemplateWithConfirm}
          favoriteTemplateIds={favoriteTemplateIdSet}
          onToggleTemplateFavorite={toggleTemplateFavorite}
          onOutlineQueryChange={setOutlineQuery}
          onSetNodeHidden={setNodeHidden}
          onSelectNode={selectNodeById}
          onSetNodeLocked={setNodeLocked}
          onMoveLayerNode={moveLayerNode}
        />
        {workspacePanel}

        <CanvasWorkspace
          canvasRegionRef={canvasRegionRef}
          nodeEditorRef={nodeEditorRef}
          edgeEditorRef={edgeEditorRef}
          nodes={nodes}
          edges={edges}
          selectedNodes={selectedNodes}
          selectedEdges={selectedEdges}
          openComments={openComments}
          activeCommentId={activeCommentId}
          reactFlow={reactFlow}
          tool={tool}
          previewMode={previewMode}
          canvasBackground={canvasBackground}
          canvasSize={canvasSize}
          viewport={viewport}
          showRulers={showRulers}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
          gridVariant={gridVariant}
          pagePreset={pagePreset}
          pageFrame={pageFrame}
          alignmentGuides={alignmentGuides}
          editingNode={editingNode}
          editingNodeLabel={editingNodeLabel}
          editingEdge={editingEdge}
          editingEdgeLabel={editingEdgeLabel}
          editingEdgePosition={editingEdgePosition}
          onReactFlowChange={setReactFlow}
          onViewportChange={setViewport}
          onZoomChange={setZoom}
          onCursorPositionChange={setCanvasCursorPosition}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onDrop={onDrop}
          onNodeDrag={updateAlignmentGuides}
          onNodeDragStop={commitActivePageGraph}
          onSetNodes={setNodes}
          onSetEdges={setEdges}
          onSelectionChange={setSelection}
          onContextMenuChange={setContextMenu}
          onStartNodeLabelEdit={startNodeLabelEdit}
          onStartEdgeLabelEdit={startEdgeLabelEdit}
          onCopySelection={copySelection}
          onDuplicateSelection={duplicateSelection}
          onDeleteSelection={deleteSelection}
          onGroupSelection={groupSelection}
          onUngroupSelection={ungroupSelection}
          onSetSelectedNodesLocked={setSelectedNodesLocked}
          onMatchSelectedNodeSize={matchSelectedNodeSize}
          onAutoRouteSelectedEdge={autoRouteSelectedEdge}
          onNodeLabelDraftChange={setEditingNodeLabel}
          onEdgeLabelDraftChange={setEditingEdgeLabel}
          onCommitNodeLabelEdit={commitNodeLabelEdit}
          onCancelNodeLabelEdit={cancelNodeLabelEdit}
          onCommitEdgeLabelEdit={commitEdgeLabelEdit}
          onCancelEdgeLabelEdit={cancelEdgeLabelEdit}
          onFocusComment={focusComment}
          onGetGroupSelectionIds={getGroupSelectionIds}
          onClearAlignmentGuides={clearAlignmentGuides}
          onResetZoom={resetZoom}
          onFitSelection={fitSelection}
          onFitCanvas={fitCanvas}
          onSnapToGridChange={(value) => commitCanvasSettingsPatch({ snapToGrid: value })}
          onShowRulersChange={(value) => commitCanvasSettingsPatch({ showRulers: value })}
          onGridSizeChange={(value) => commitCanvasSettingsPatch({ gridSize: value })}
          onGridVariantChange={(value) => commitCanvasSettingsPatch({ gridVariant: value })}
          onPagePresetChange={(value) => commitCanvasSettingsPatch({ pagePreset: value })}
          onCanvasBackgroundChange={(value) => commitCanvasSettingsPatch({ background: value })}
        />

        <PropertySidebar
          selectedNodes={selectedNodes}
          selectedNode={selectedNode}
          selectedEdges={selectedEdges}
          selectedEdge={selectedEdge}
          pageName={activePage.name}
          pageCount={currentPages.length}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          canvasSettings={currentSettings}
          versions={versions}
          comments={comments}
          activeCommentId={activeCommentId}
          commentDraft={commentDraft}
          commentReplyDrafts={commentReplyDrafts}
          nodes={nodes}
          edges={edges}
          formatVersionTime={formatVersionTime}
          onSelectedNodesChange={updateSelectedNodes}
          onNodeChange={updateNodeData}
          onNodePositionChange={updateNodePosition}
          onSelectedEdgesChange={updateSelectedEdges}
          onEdgeChange={updateEdge}
          onAutoRouteEdge={autoRouteSelectedEdge}
          onCanvasSettingsChange={commitCanvasSettingsPatch}
          onSaveVersion={saveVersion}
          onRestoreVersion={restoreVersion}
          onDeleteVersion={deleteVersion}
          onCommentDraftChange={setCommentDraft}
          onCommentReplyDraftChange={(id, value) => setCommentReplyDrafts((current) => ({ ...current, [id]: value }))}
          onAddComment={addComment}
          onAddCommentReply={addCommentReply}
          onFocusComment={focusComment}
          onResolveComment={setCommentResolved}
          onDeleteComment={deleteComment}
        />
      </main>
      {commandPaletteOpen ? (
        <CommandPalette
          items={commandItems}
          query={commandPaletteQuery}
          onQueryChange={setCommandPaletteQuery}
          onClose={closeCommandPalette}
          onRun={runCommand}
        />
      ) : null}
      {presentationMode && presentationPage ? (
        <PresentationOverlay
          page={presentationPage}
          pageIndex={presentationPageIndex}
          pageCount={currentPages.length}
          svg={presentationSvg}
          onPrevious={() => movePresentationPage(-1)}
          onNext={() => movePresentationPage(1)}
          onClose={closePresentation}
        />
      ) : null}
      <PreferencesDialog
        open={preferencesOpen}
        currentCanvasSettings={currentSettings}
        preferences={appPreferences}
        onClose={() => setPreferencesOpen(false)}
        onApplyDocumentSettings={commitCanvasSettingsPatch}
        onSavePreferences={persistAppPreferences}
      />
      {contextMenu ? (
        <ContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
          onEdit={() => {
            if (contextMenu.target === "node" && contextMenu.id) editNodeLabel(contextMenu.id);
            if (contextMenu.target === "edge" && contextMenu.id) editEdgeLabel(contextMenu.id);
            setContextMenu(null);
          }}
          onDuplicate={() => {
            duplicateSelection();
            setContextMenu(null);
          }}
          onDelete={() => {
            deleteSelection();
            setContextMenu(null);
          }}
          onBringFront={() => {
            reorderSelection("front");
            setContextMenu(null);
          }}
          onSendBack={() => {
            reorderSelection("back");
            setContextMenu(null);
          }}
          onAddProcess={() => {
            addShape("process", contextMenu.flowPosition);
            setContextMenu(null);
          }}
          onAddDecision={() => {
            addShape("decision", contextMenu.flowPosition);
            setContextMenu(null);
          }}
          onAddNote={() => {
            addShape("note", contextMenu.flowPosition);
            setContextMenu(null);
          }}
        />
      ) : null}
      {hiddenFileInputs}
    </div>
  );
}
