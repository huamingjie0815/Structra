import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  configFile: false,
  logLevel: "error",
  server: { hmr: false, middlewareMode: true, ws: false }
});

const results = [];

async function load(path) {
  return server.ssrLoadModule(path);
}

async function test(name, run) {
  const startedAt = performance.now();
  await run();
  results.push({ name, ms: Number((performance.now() - startedAt).toFixed(2)) });
}

try {
  const [
    documentFile,
    documentSession,
    preferences,
    workspaceRoute,
    commands,
    history,
    mermaid,
    exporters,
    importers,
    svgExport,
    edgeGeometry,
    connectorPresets,
    autoRoute,
    canvasGeometry,
    selection,
    selectionOperations,
    focusSelection,
    elementOperations,
    graphOperations,
    documentSelectors,
    keyboardShortcuts,
    keyboardConnector,
    commandRegistry,
    reactFlowChangeOperations,
    documentFileWorkflow,
    documentFileLifecycle,
    documentHistoryController,
    documentFileStatus,
    documentRestoreWorkflow,
    localDocumentPersistenceWorkflow,
    pageActionsWorkflow,
    pageNavigationWorkflow,
    workspaceActionsWorkflow,
    customTemplatesWorkflow,
    templateFavoritesWorkflow,
    versionHistory,
    commentOperations,
    commentWorkflow,
    nodeSemantics,
    diagramDefaults,
    formatSupport,
    localWorkspace,
    nativeMenuState,
    nativeMenuCommands,
    nativeMenuWorkflow,
    nativeFiles,
    nativeOpenDocumentWorkflow,
    desktopWindowLifecycle,
    overlaysComponent,
    shapeCreation,
    shapeInsertionWorkflow,
    canvasSettingsWorkflow,
    elementEditingWorkflow,
    focusSelectionWorkflow,
    inlineLabelEditingWorkflow,
    clipboardWorkflow,
    commandItemsWorkflow,
    commandPaletteWorkflow,
    commandPaletteComponent,
    editorKeyboardWorkflow,
    presentationWorkflow,
    recentDocuments
  ] = await Promise.all([
    load("/src/io/documentFile.ts"),
    load("/src/domain/documentSession.ts"),
    load("/src/domain/preferences.ts"),
    load("/src/domain/workspaceRoute.ts"),
    load("/src/editor/commands.ts"),
    load("/src/editor/history.ts"),
    load("/src/io/mermaid.ts"),
    load("/src/io/exporters.ts"),
    load("/src/io/importers.ts"),
    load("/src/io/svgExport.ts"),
    load("/src/editor/edgeGeometry.ts"),
    load("/src/editor/connectorPresets.ts"),
    load("/src/editor/autoRoute.ts"),
    load("/src/editor/canvasGeometry.ts"),
    load("/src/editor/selection.ts"),
    load("/src/editor/selectionOperations.ts"),
    load("/src/editor/focusSelection.ts"),
    load("/src/editor/elementOperations.ts"),
    load("/src/editor/graphOperations.ts"),
    load("/src/editor/documentSelectors.ts"),
    load("/src/editor/keyboardShortcuts.ts"),
    load("/src/editor/keyboardConnector.ts"),
    load("/src/editor/commandRegistry.ts"),
    load("/src/editor/reactFlowChangeOperations.ts"),
    load("/src/features/document/useDocumentFileWorkflow.ts"),
    load("/src/features/document/documentFileLifecycle.ts"),
    load("/src/features/document/useDocumentHistoryController.ts"),
    load("/src/features/document/documentFileStatus.ts"),
    load("/src/features/document/useDocumentRestoreWorkflow.ts"),
    load("/src/features/document/useLocalDocumentPersistenceWorkflow.ts"),
    load("/src/features/document/usePageActionsWorkflow.ts"),
    load("/src/features/document/usePageNavigationWorkflow.ts"),
    load("/src/features/document/useWorkspaceActionsWorkflow.ts"),
    load("/src/features/document/useCustomTemplates.ts"),
    load("/src/features/document/useTemplateFavorites.ts"),
    load("/src/features/document/useVersionHistory.ts"),
    load("/src/editor/commentOperations.ts"),
    load("/src/features/comments/useCommentWorkflow.ts"),
    load("/src/domain/nodeSemantics.ts"),
    load("/src/domain/diagramDefaults.ts"),
    load("/src/domain/formatSupport.ts"),
    load("/src/domain/localWorkspace.ts"),
    load("/src/desktop/nativeMenuState.ts"),
    load("/src/desktop/nativeMenuCommands.ts"),
    load("/src/desktop/useNativeMenuWorkflow.ts"),
    load("/src/io/nativeFiles.ts"),
    load("/src/desktop/useNativeOpenDocumentWorkflow.ts"),
    load("/src/desktop/useDesktopWindowLifecycle.ts"),
    load("/src/components/Overlays.tsx"),
    load("/src/features/shapes/shapeCreation.ts"),
    load("/src/features/shapes/useShapeInsertionWorkflow.ts"),
    load("/src/features/editor/useCanvasSettingsWorkflow.ts"),
    load("/src/features/editor/useElementEditingWorkflow.ts"),
    load("/src/features/editor/useFocusSelectionWorkflow.ts"),
    load("/src/features/editor/useInlineLabelEditingWorkflow.ts"),
    load("/src/features/editor/useClipboardWorkflow.ts"),
    load("/src/features/editor/useCommandItemsWorkflow.ts"),
    load("/src/features/editor/useCommandPaletteWorkflow.ts"),
    load("/src/components/CommandPalette.tsx"),
    load("/src/features/editor/useEditorKeyboardWorkflow.ts"),
    load("/src/features/presentation/usePresentationWorkflow.ts"),
    load("/src/io/recentDocuments.ts")
  ]);

  const baseNode = {
    id: "node-a",
    type: "diagram",
    position: { x: 10, y: 20 },
    data: {
      label: "Start",
      shape: "process",
      fill: "#ffffff",
      stroke: "#111827",
      text: "#111827",
      fontSize: 14,
      width: 120,
      height: 56
    }
  };
  const targetNode = {
    ...baseNode,
    id: "node-b",
    position: { x: 260, y: 20 },
    data: { ...baseNode.data, label: "Done", shape: "decision", width: 126, height: 92 }
  };
  const baseEdge = {
    id: "edge-a-b",
    source: "node-a",
    target: "node-b",
    sourceHandle: "right-source",
    targetHandle: "left-target",
    label: "ok",
    data: { waypoints: [{ x: 190, y: 48 }] },
    style: { stroke: "#334155", strokeWidth: 2 }
  };
  const settings = {
    showGrid: true,
    showRulers: true,
    snapToGrid: true,
    gridSize: 12,
    gridVariant: "lines",
    pagePreset: "content",
    background: "#f8fafc"
  };
  const document = {
    pages: [
      {
        id: "page-main",
        name: "Main",
        nodes: [baseNode, targetNode],
        edges: [baseEdge],
        comments: [{ id: "comment-1", target: "canvas", x: 0, y: 0, text: "note", createdAt: "2026-06-06T00:00:00.000Z" }]
      }
    ],
    activePageId: "page-main",
    settings
  };

  await test("document file roundtrip repairs active page and comments", () => {
    const serialized = documentFile.serializeDiagramDocument({ ...document, activePageId: "missing-page" });
    const parsed = documentFile.parseDiagramDocument(serialized);
    const structraFixture = documentFile.parseDiagramDocument(readFileSync("tests/fixtures/smoke-import-legacy.structra", "utf8"));
    assert.equal(parsed.activePageId, "page-main");
    assert.equal(parsed.pages[0].comments[0].replies.length, 0);
    assert.match(serialized, /structra\.diagram-document/);
    assert.equal(documentFile.ensureDocumentExtension("handoff.structra"), "handoff.structra");
    assert.equal(documentFile.ensureDocumentExtension("handoff"), "handoff.structra");
    assert.equal(documentFile.getDocumentDisplayName("/tmp/review.structra"), "review");
    assert.equal(structraFixture.activePageId, "smoke-structra-page");
    assert.equal(structraFixture.pages[0].nodes[0].data.label, "Structra导入开始");
  });

  await test("document session recovers, migrates, and normalizes local state", () => {
    const serialized = documentFile.serializeDiagramDocument(document);
    const restored = documentSession.loadSavedDocument({ getItem: () => serialized });
    const legacy = documentSession.loadSavedDocument({
      getItem: () => JSON.stringify({ nodes: [baseNode], edges: [baseEdge], settings: { gridSize: 99, background: "bad" } })
    });
    const fallback = documentSession.loadSavedDocument({ getItem: () => "{bad" });
    const normalized = documentSession.normalizeCanvasSettings({ gridSize: 99, background: "bad", pagePreset: "wide" });

    assert.equal(restored.pages[0].nodes.length, 2);
    assert.equal(legacy.settings.gridSize, 48);
    assert.equal(normalized.background, "#f8fafc");
    assert.equal(normalized.pagePreset, "wide");
    assert.ok(fallback.pages.length > 0);
  });

  await test("local app preferences normalize and persist desktop-only defaults", () => {
    const writes = [];
    const storage = {
      getItem: () =>
        JSON.stringify({
          canvasSettings: { gridSize: 99, background: "bad", pagePreset: "missing", gridVariant: "dots", showGrid: false },
          openWorkspaceOnLaunch: false,
          autosaveRecovery: false,
          defaultExportFormat: "exe"
        }),
      setItem: (key, value) => writes.push({ key, value })
    };
    const loaded = preferences.loadAppPreferences(storage);
    const saved = preferences.saveAppPreferences(
      {
        canvasSettings: { ...settings, gridSize: 20, background: "#ffffff" },
        openWorkspaceOnLaunch: false,
        autosaveRecovery: true,
        defaultExportFormat: "png"
      },
      storage
    );
    const fromCanvas = preferences.buildPreferencesFromCanvasSettings(saved, { ...settings, gridSize: 18, background: "#111827" });

    assert.equal(loaded.canvasSettings.gridSize, 48);
    assert.equal(loaded.canvasSettings.background, "#f8fafc");
    assert.equal(loaded.canvasSettings.pagePreset, "content");
    assert.equal(loaded.canvasSettings.gridVariant, "dots");
    assert.equal(loaded.openWorkspaceOnLaunch, false);
    assert.equal(loaded.autosaveRecovery, false);
    assert.equal(loaded.defaultExportFormat, "svg");
    assert.equal(saved.defaultExportFormat, "png");
    assert.equal(fromCanvas.canvasSettings.gridSize, 18);
    assert.equal(writes[0].key, preferences.PREFERENCES_STORAGE_KEY);
  });

  await test("page and template commands are undoable document transactions", () => {
    const blankPage = { id: "page-two", name: "Second", nodes: [], edges: [], comments: [] };
    const addResult = commands.addPageCommand(document, blankPage);
    const renameResult = commands.renamePageCommand(addResult.document, "page-two", "Renamed");
    const moveResult = commands.movePageCommand(renameResult.document, "page-two", "up");
    const duplicateResult = commands.duplicatePageCommand(moveResult.document, "page-two", "page-copy");
    const deleteResult = commands.deletePageCommand(duplicateResult.document, "page-copy");
    const templateResult = commands.applyTemplateCommand(deleteResult.document, "page-two", {
      id: "template-one",
      name: "Template",
      description: "template",
      nodes: [targetNode],
      edges: []
    });

    assert.equal(addResult.document.activePageId, "page-two");
    assert.equal(renameResult.document.pages.find((page) => page.id === "page-two").name, "Renamed");
    assert.equal(moveResult.document.pages[0].id, "page-two");
    assert.equal(duplicateResult.document.pages.length, 3);
    assert.equal(deleteResult.document.pages.length, 2);
    assert.equal(templateResult.document.pages.find((page) => page.id === "page-two").name, "Template");

    const start = history.createHistory({ document, selection: null });
    const afterAdd = history.pushHistoryEntry(start, addResult);
    const undone = history.undoHistory(afterAdd);
    const redone = history.redoHistory(undone.history);

    assert.equal(history.getHistoryState(afterAdd).canUndo, true);
    assert.equal(undone.entry.document.pages.length, 1);
    assert.equal(redone.entry.document.pages.length, 2);
  });

  await test("replace document command repairs whole-document baseline state", () => {
    const result = commands.replaceDocumentCommand(
      {
        pages: [
          {
            id: "page-imported",
            name: "Imported",
            nodes: [baseNode],
            edges: [baseEdge],
            comments: [{ id: "comment-imported", target: "canvas", x: 1, y: 2, text: "imported", createdAt: "2026-06-07T00:00:00.000Z" }]
          }
        ],
        activePageId: "missing-page",
        settings: { gridSize: 99, background: "bad" }
      },
      { type: "node", id: "node-a" }
    );

    assert.equal(result.document.activePageId, "page-imported");
    assert.equal(result.document.settings.gridSize, 48);
    assert.equal(result.document.settings.background, "#f8fafc");
    assert.equal(result.document.pages[0].comments[0].replies.length, 0);
    assert.deepEqual(result.selection, { type: "node", id: "node-a" });
    assert.equal(commands.replaceDocumentCommand({ pages: [], activePageId: "missing-page", settings }, null), null);
  });

  await test("label commands update only the active page through document transactions", () => {
    const pageTwoNode = { ...baseNode, data: { ...baseNode.data, label: "Other page" } };
    const pageTwoEdge = { ...baseEdge, label: "other edge" };
    const twoPageDocument = {
      ...document,
      pages: [
        document.pages[0],
        { id: "page-two", name: "Second", nodes: [pageTwoNode], edges: [pageTwoEdge], comments: [] }
      ],
      activePageId: "page-main"
    };

    const nodeResult = commands.commitNodeLabelCommand(twoPageDocument, "page-main", "node-a", "Renamed");
    const edgeResult = commands.commitEdgeLabelCommand(nodeResult.document, "page-main", "edge-a-b", "approved");
    const lockedResult = commands.commitNodeLabelCommand(
      {
        ...twoPageDocument,
        pages: [
          {
            ...twoPageDocument.pages[0],
            nodes: [{ ...baseNode, data: { ...baseNode.data, locked: true } }, targetNode]
          },
          twoPageDocument.pages[1]
        ]
      },
      "page-main",
      "node-a",
      "Blocked"
    );

    assert.equal(nodeResult.document.pages[0].nodes[0].data.label, "Renamed");
    assert.equal(nodeResult.document.pages[1].nodes[0].data.label, "Other page");
    assert.deepEqual(nodeResult.selection, { type: "node", id: "node-a" });
    assert.equal(edgeResult.document.pages[0].edges[0].label, "approved");
    assert.equal(edgeResult.document.pages[1].edges[0].label, "other edge");
    assert.deepEqual(edgeResult.selection, { type: "edge", id: "edge-a-b" });
    assert.equal(lockedResult, null);
    assert.equal(commands.commitNodeLabelCommand(twoPageDocument, "page-main", "missing-node", "Missing"), null);
    assert.equal(commands.commitEdgeLabelCommand(twoPageDocument, "page-main", "missing-edge", "Missing"), null);
    assert.equal(commands.commitNodeLabelCommand(twoPageDocument, "page-main", "node-a", "Start"), null);
    assert.equal(commands.commitEdgeLabelCommand(twoPageDocument, "page-main", "edge-a-b", "ok"), null);

    const start = history.createHistory({ document: twoPageDocument, selection: null });
    const afterRename = history.pushHistoryEntry(start, nodeResult);
    const undone = history.undoHistory(afterRename);
    const redone = history.redoHistory(undone.history);

    assert.equal(undone.entry.document.pages[0].nodes[0].data.label, "Start");
    assert.equal(redone.entry.document.pages[0].nodes[0].data.label, "Renamed");
  });

  await test("active page graph commands preserve document scope and history selection", () => {
    const pageTwoNode = { ...baseNode, data: { ...baseNode.data, label: "Other page" } };
    const pageTwoEdge = { ...baseEdge, label: "other edge" };
    const twoPageDocument = {
      ...document,
      pages: [
        document.pages[0],
        { id: "page-two", name: "Second", nodes: [pageTwoNode], edges: [pageTwoEdge], comments: [] }
      ],
      activePageId: "page-main"
    };
    const nextNodes = [{ ...baseNode, position: { x: 88, y: 99 } }, targetNode];
    const nextEdges = [{ ...baseEdge, style: { ...baseEdge.style, stroke: "#ff0000" } }];
    const graphResult = commands.replaceActivePageGraphCommand(twoPageDocument, "page-main", nextNodes, nextEdges, { type: "node", id: "node-a" });
    const snapshotResult = commands.replaceActivePageSnapshotCommand(
      twoPageDocument,
      "page-main",
      {
        nodes: nextNodes,
        edges: nextEdges,
        comments: [{ id: "comment-next", target: "canvas", x: 4, y: 5, text: "next", createdAt: "2026-06-07T00:00:00.000Z" }]
      },
      null
    );

    assert.equal(graphResult.document.pages[0].nodes[0].position.x, 88);
    assert.equal(graphResult.document.pages[0].edges[0].style.stroke, "#ff0000");
    assert.equal(graphResult.document.pages[0].comments[0].id, "comment-1");
    assert.equal(graphResult.document.pages[1].nodes[0].data.label, "Other page");
    assert.equal(graphResult.document.pages[1].edges[0].label, "other edge");
    assert.deepEqual(graphResult.selection, { type: "node", id: "node-a" });
    assert.equal(snapshotResult.document.pages[0].comments[0].id, "comment-next");
    assert.equal(snapshotResult.document.pages[0].comments[0].replies.length, 0);
    assert.equal(snapshotResult.document.pages[1].nodes[0].data.label, "Other page");
    assert.equal(commands.replaceActivePageGraphCommand(twoPageDocument, "missing-page", nextNodes, nextEdges, null), null);
    assert.equal(commands.replaceActivePageGraphCommand(twoPageDocument, "page-main", twoPageDocument.pages[0].nodes, twoPageDocument.pages[0].edges, null), null);
    assert.equal(commands.replaceActivePageSnapshotCommand(twoPageDocument, "page-main", twoPageDocument.pages[0], null), null);

    const start = history.createHistory({ document: twoPageDocument, selection: null });
    const afterGraphEdit = history.pushHistoryEntry(start, snapshotResult);
    const undone = history.undoHistory(afterGraphEdit);
    const redone = history.redoHistory(undone.history);

    assert.equal(undone.entry.document.pages[0].nodes[0].position.x, 10);
    assert.equal(undone.entry.document.pages[0].comments[0].id, "comment-1");
    assert.equal(redone.entry.document.pages[0].nodes[0].position.x, 88);
    assert.equal(redone.entry.document.pages[0].comments[0].id, "comment-next");
    assert.equal(redone.entry.selection, null);
  });

  await test("Mermaid import/export handles common flowchart syntax", () => {
    const exported = mermaid.buildMermaidExport([baseNode, targetNode], [baseEdge]);
    const parsed = mermaid.parseMermaid('flowchart LR\n  A["Start"]\n  B{"Done?"}\n  A -->|ok| B');
    const parsedLabelBrackets = mermaid.parseMermaid('flowchart LR\n  A["Need [manual] review"]');

    assert.match(exported, /Start/);
    assert.equal(parsed.nodes.length, 2);
    assert.equal(parsed.edges.length, 1);
    assert.ok(parsed.nodes.some((node) => node.data.shape === "decision"));
    assert.equal(parsedLabelBrackets.nodes[0].data.label, "Need [manual] review");
  });

  await test("Mermaid and JSON import failures expose trusted user-visible errors", () => {
    const unsupportedMermaid = readFileSync("tests/fixtures/unsupported-sequence.mmd", "utf8");
    const corruptMermaid = readFileSync("tests/fixtures/corrupt-flowchart.mmd", "utf8");
    const corruptJson = readFileSync("tests/fixtures/smoke-corrupt-diagram.json", "utf8");

    assert.throws(() => mermaid.parseMermaid(unsupportedMermaid), {
      name: "MermaidParseError",
      message: /Unsupported Mermaid diagram type: sequenceDiagram/
    });
    assert.throws(() => mermaid.parseMermaid(corruptMermaid), {
      name: "MermaidParseError",
      message: /Invalid Mermaid node syntax on line 2/
    });
    assert.throws(() => mermaid.parseMermaid("flowchart LR\n%% comments only"), {
      name: "MermaidParseError",
      message: /no supported flowchart nodes or edges/
    });
    assert.throws(() => importers.parseImportedDiagramJson(corruptJson), /Unsupported diagram JSON/);
    assert.throws(() => importers.parseImportedDiagramJson("{"), /Invalid JSON/);
  });

  await test("rich document fixtures roundtrip semantic fields and visible exports", () => {
    const raw = readFileSync("tests/fixtures/roundtrip-rich-document.structra", "utf8");
    const parsedDocument = documentFile.parseDiagramDocument(raw);
    const serialized = documentFile.serializeDiagramDocument(parsedDocument);
    const reparsedDocument = documentFile.parseDiagramDocument(serialized);
    const imported = importers.parseImportedDiagramJson(serialized);
    const activePage = reparsedDocument.pages.find((page) => page.id === reparsedDocument.activePageId);
    const bpmnTask = activePage?.nodes.find((node) => node.id === "roundtrip-bpmn-task");
    const erEntity = activePage?.nodes.find((node) => node.id === "roundtrip-er-entity");
    const table = activePage?.nodes.find((node) => node.id === "roundtrip-table");
    const hiddenNode = activePage?.nodes.find((node) => node.id === "roundtrip-hidden-note");
    const visibleGraph = exporters.getVisibleGraph(activePage?.nodes ?? [], activePage?.edges ?? []);
    const jsonExport = exporters.buildDocumentJsonExport({
      pages: reparsedDocument.pages,
      activePageId: reparsedDocument.activePageId,
      nodes: activePage?.nodes ?? [],
      edges: activePage?.edges ?? [],
      comments: activePage?.comments ?? [],
      settings: reparsedDocument.settings
    });
    const exportedJson = JSON.parse(jsonExport);
    const mermaidExport = mermaid.buildMermaidExport(activePage?.nodes ?? [], activePage?.edges ?? []);
    const svg = svgExport.buildSvg(activePage?.nodes ?? [], activePage?.edges ?? [], reparsedDocument.settings.background, reparsedDocument.settings.pagePreset);

    assert.equal(reparsedDocument.pages.length, 2);
    assert.equal(reparsedDocument.activePageId, "roundtrip-page-main");
    assert.equal(reparsedDocument.settings.gridVariant, "dots");
    assert.equal(reparsedDocument.settings.pagePreset, "wide");
    assert.equal(imported.type, "document");
    assert.equal(activePage?.comments[0].replies[0].text, "本地单机批注需要随文件保存");
    assert.equal(bpmnTask?.data.bpmnTaskType, "user");
    assert.equal(erEntity?.data.erFields[0].key, "PK");
    assert.equal(erEntity?.data.erFields[1].key, "FK");
    assert.equal(table?.data.tableCells[3], "2h");
    assert.equal(hiddenNode?.hidden, true);
    assert.deepEqual(visibleGraph.nodes.map((node) => node.id), ["roundtrip-bpmn-task", "roundtrip-er-entity", "roundtrip-table"]);
    assert.equal(visibleGraph.edges.length, 1);
    assert.equal(exportedJson.pages[0].comments[0].replies[0].id, "roundtrip-reply-1");
    assert.equal(exportedJson.settings.background, "#f7fbff");
    assert.match(mermaidExport, /人工复核/);
    assert.match(mermaidExport, /Order/);
    assert.doesNotMatch(mermaidExport, /Hidden audit note/);
    assert.doesNotMatch(mermaidExport, /隐藏审计/);
    assert.match(svg, /order_id/);
    assert.match(svg, /customer_id/);
    assert.match(svg, /Channel/);
    assert.doesNotMatch(svg, /Hidden audit note/);
  });

  await test("export helpers filter hidden graph content", () => {
    const hiddenNode = { ...baseNode, id: "hidden", hidden: true, data: { ...baseNode.data, label: "Hidden" } };
    const hiddenEdge = { id: "edge-hidden", source: "node-a", target: "hidden" };
    const visible = exporters.getVisibleGraph([baseNode, hiddenNode], [baseEdge, hiddenEdge]);

    assert.deepEqual(visible.nodes.map((node) => node.id), ["node-a"]);
    assert.equal(visible.edges.length, 0);
  });

  await test("SVG export preserves semantic table and swimlane text", () => {
    const tableNode = {
      ...baseNode,
      id: "table",
      position: { x: 0, y: 140 },
      data: {
        ...baseNode.data,
        label: "Table",
        shape: "table",
        width: 180,
        height: 90,
        tableRows: 2,
        tableColumns: 2,
        tableCells: ["A1", "A2", "B1", "B2"]
      }
    };
    const swimlaneNode = {
      ...baseNode,
      id: "lane",
      position: { x: 240, y: 140 },
      data: {
        ...baseNode.data,
        label: "Lane",
        shape: "swimlane",
        width: 260,
        height: 130,
        laneCount: 3,
        laneLabels: ["Sales", "Ops", "Finance"]
      }
    };
    const svg = svgExport.buildSvg([baseNode, targetNode, tableNode, swimlaneNode], [baseEdge], "#ffffff", "content");

    assert.match(svg, /Start/);
    assert.match(svg, /A1/);
    assert.match(svg, /Finance/);
    assert.match(svg, /<path/);
  });

  await test("SVG export escapes imported text and attribute boundaries", () => {
    const hostileNode = {
      ...baseNode,
      id: "hostile-node",
      data: {
        ...baseNode.data,
        label: '<script>alert("x")</script>',
        fill: '#fff" onload="alert(1)',
        stroke: "#111",
        text: '#222" data-leak="1',
        fontFamily: 'Inter" onclick="alert(2)'
      }
    };
    const hostileEdge = {
      ...baseEdge,
      id: "hostile-edge",
      source: "hostile-node",
      target: "node-b",
      label: 'A & B < C "quoted"',
      style: { stroke: '#333" onload="alert(3)', strokeWidth: 2 }
    };
    const svg = svgExport.buildSvg([hostileNode, targetNode], [hostileEdge], "#ffffff", "content");

    assert.match(svg, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
    assert.match(svg, /A &amp; B &lt; C &quot;quoted&quot;/);
    assert.match(svg, /fill="#fff&quot; onload=&quot;alert\(1\)"/);
    assert.doesNotMatch(svg, /<script>/);
    assert.doesNotMatch(svg, /data-leak="1/);
    assert.doesNotMatch(svg, /onload="alert/);
  });

  await test("edge and node semantics stay deterministic", () => {
    const endpoints = edgeGeometry.getEdgeEndpoints(baseEdge, [baseNode, targetNode]);
    const path = edgeGeometry.getSvgEdgePath(baseEdge, endpoints);
    const midpoint = edgeGeometry.getPolylineMidpoint([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 }
    ]);
    const tableCells = nodeSemantics.getTableCellValues({ ...baseNode.data, tableRows: 2, tableColumns: 3, tableCells: ["A"] }, 2, 3);

    assert.ok(endpoints);
    assert.match(path, /^M /);
    assert.deepEqual(midpoint, { x: 100, y: 0 });
    assert.equal(tableCells.length, 6);
    assert.equal(nodeSemantics.normalizeNodeRotation(400), 180);
  });

  await test("connector presets persist semantic edge intent and SVG markers", () => {
    const inherited = connectorPresets.applyConnectorPreset(baseEdge, "inheritance");
    const composed = connectorPresets.applyConnectorPreset(baseEdge, "composition");
    const associated = connectorPresets.applyConnectorPreset(baseEdge, "association");
    const cleared = connectorPresets.clearConnectorPreset({ ...baseEdge.data, connectorPreset: "composition" });
    const batchCleared = elementOperations.applyEdgePatchToIds(
      [{ ...baseEdge, data: { ...baseEdge.data, connectorPreset: "composition" } }],
      new Set(["edge-a-b"]),
      { data: cleared }
    );
    const compositionEdge = { ...baseEdge, ...composed, id: "edge-composition" };
    const svg = svgExport.buildSvg([baseNode, targetNode], [compositionEdge], "#ffffff", "content");

    assert.equal(connectorPresets.CONNECTOR_PRESETS.some((preset) => preset.id === "aggregation"), true);
    assert.equal(typeof connectorPresets.applyConnectorPreset, "function");
    assert.equal(inherited.type, "straight");
    assert.equal(inherited.data.connectorPreset, "inheritance");
    assert.ok(inherited.markerEnd);
    assert.equal(composed.data.connectorPreset, "composition");
    assert.equal(associated.markerEnd, undefined);
    assert.equal(cleared.connectorPreset, undefined);
    assert.equal(batchCleared[0].data.connectorPreset, undefined);
    assert.match(svg, /L 6 1 L 11 6 L 6 11 z" fill="#334155"/);
  });

  await test("canvas editor helpers keep placement, grouping, and guides deterministic", () => {
    const groupedNode = { ...baseNode, id: "node-grouped", data: { ...baseNode.data, groupId: "group-1" } };
    const groupedMate = { ...targetNode, id: "node-grouped-mate", data: { ...targetNode.data, groupId: "group-1" } };
    const hiddenGroupedMate = { ...targetNode, id: "node-hidden-grouped-mate", hidden: true, data: { ...targetNode.data, groupId: "group-1" } };
    const available = canvasGeometry.getAvailableNodePosition({ x: 70, y: 48 }, { width: 120, height: 56 }, [baseNode]);
    const guides = canvasGeometry.getNodeAlignmentGuides(
      { ...baseNode, id: "node-moving", position: { x: targetNode.position.x, y: 80 } },
      [targetNode],
      1
    );
    const selectedIds = selection.getGroupSelectionIds([groupedNode, groupedMate, hiddenGroupedMate], "node-grouped");

    assert.notDeepEqual(available, { x: 10, y: 20 });
    assert.ok(guides.x.includes(targetNode.position.x));
    assert.equal(canvasGeometry.guidesEqual(guides, { x: [...guides.x], y: [...guides.y] }), true);
    assert.deepEqual([...selectedIds].sort(), ["node-grouped", "node-grouped-mate"]);
  });

  await test("auto route helpers rank obstacle avoiding waypoints", () => {
    const obstacleNode = {
      ...baseNode,
      id: "node-obstacle",
      position: { x: 170, y: 0 },
      data: { ...baseNode.data, label: "Obstacle", width: 40, height: 120 }
    };
    const route = autoRoute.getAutoRouteWaypoints(baseEdge, [baseNode, targetNode, obstacleNode]);
    const simplified = autoRoute.simplifyRouteWaypoints({ x: 0, y: 0 }, { x: 100, y: 0 }, [
      { x: 20, y: 0 },
      { x: 50, y: 0 },
      { x: 80, y: 0 }
    ]);
    const intersections = autoRoute.countRouteIntersections(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 }
      ],
      [{ left: 40, top: -10, right: 60, bottom: 10 }]
    );

    assert.ok(Array.isArray(route));
    assert.ok(route.length > 0);
    assert.deepEqual(simplified, []);
    assert.equal(intersections, 1);
    assert.equal(autoRoute.getRouteLength([{ x: 0, y: 0 }, { x: 3, y: 4 }]), 5);
  });

  await test("graph operations copy and paste remap internal graph state", () => {
    const groupedA = { ...baseNode, id: "node-group-a", selected: true, data: { ...baseNode.data, label: "Group A", groupId: "group-original" } };
    const groupedB = {
      ...targetNode,
      id: "node-group-b",
      selected: true,
      data: { ...targetNode.data, label: "Group B", groupId: "group-original" }
    };
    const outside = { ...baseNode, id: "node-outside", position: { x: 520, y: 20 }, data: { ...baseNode.data, label: "Outside" } };
    const internalEdge = { ...baseEdge, id: "edge-internal", source: "node-group-a", target: "node-group-b", selected: true };
    const externalEdge = { ...baseEdge, id: "edge-external", source: "node-group-a", target: "node-outside" };
    const clipboard = graphOperations.copySelectedNodes([groupedA, groupedB], [internalEdge, externalEdge]);

    assert.equal(clipboard.nodes.length, 2);
    assert.deepEqual(clipboard.edges.map((edge) => edge.id), ["edge-internal"]);
    assert.equal(clipboard.nodes.some((node) => node.selected), false);
    assert.equal(clipboard.edges.some((edge) => edge.selected), false);

    const pasted = graphOperations.pasteClipboardSnapshot([outside], [externalEdge], clipboard, 2, 12345);
    const pastedNodeIds = pasted.nodes.slice(1).map((node) => node.id);
    const pastedGroupIds = new Set(pasted.nodes.slice(1).map((node) => node.data.groupId));

    assert.deepEqual(pastedNodeIds, ["node-12345-0", "node-12345-1"]);
    assert.deepEqual(pasted.nodes.slice(1).map((node) => node.position), [
      { x: groupedA.position.x + 68, y: groupedA.position.y + 68 },
      { x: groupedB.position.x + 68, y: groupedB.position.y + 68 }
    ]);
    assert.deepEqual([...pastedGroupIds], ["group-12345-0"]);
    assert.equal(pasted.edges.at(-1).id, "edge-12345-0");
    assert.equal(pasted.edges.at(-1).source, "node-12345-0");
    assert.equal(pasted.edges.at(-1).target, "node-12345-1");
    assert.deepEqual(pasted.selection, { type: "node", id: "node-12345-0" });
  });

  await test("graph operations cut, duplicate, and delete respect locked and targeted content", () => {
    const lockedNode = { ...targetNode, id: "node-locked", selected: true, data: { ...targetNode.data, label: "Locked", locked: true } };
    const freeNode = { ...baseNode, id: "node-free", selected: true, data: { ...baseNode.data, label: "Free" } };
    const mateNode = { ...targetNode, id: "node-mate", selected: true, data: { ...targetNode.data, label: "Mate" } };
    const edgeFreeLocked = { ...baseEdge, id: "edge-free-locked", source: "node-free", target: "node-locked" };
    const edgeFreeMate = { ...baseEdge, id: "edge-free-mate", source: "node-free", target: "node-mate" };
    const comments = [
      { id: "comment-node", target: "node", targetId: "node-free", x: 0, y: 0, text: "node", createdAt: "2026-06-06T00:00:00.000Z" },
      { id: "comment-edge", target: "edge", targetId: "edge-free-locked", x: 0, y: 0, text: "edge", createdAt: "2026-06-06T00:00:00.000Z" },
      { id: "comment-canvas", target: "canvas", x: 0, y: 0, text: "canvas", createdAt: "2026-06-06T00:00:00.000Z" }
    ];

    const cut = graphOperations.cutSelectedNodes([freeNode, lockedNode], [edgeFreeLocked], [freeNode, lockedNode]);
    assert.deepEqual(cut.clipboard.nodes.map((node) => node.id), ["node-free"]);
    assert.deepEqual(cut.clipboard.edges, []);
    assert.deepEqual(cut.nodes.map((node) => node.id), ["node-locked"]);
    assert.deepEqual(cut.edges, []);

    const duplicate = graphOperations.duplicateSelectedNodes([freeNode, mateNode], [edgeFreeMate], [freeNode, mateNode], 456);
    const duplicateMixedLocked = graphOperations.duplicateSelectedNodes([freeNode, lockedNode], [edgeFreeLocked], [freeNode, lockedNode], 321);
    assert.deepEqual(duplicate.nodes.slice(2).map((node) => node.id), ["node-456-0", "node-456-1"]);
    assert.equal(duplicate.nodes.at(-2).data.label, "Free");
    assert.equal(duplicate.edges.at(-1).source, "node-456-0");
    assert.equal(duplicate.edges.at(-1).target, "node-456-1");
    assert.deepEqual(duplicateMixedLocked.nodes.slice(2).map((node) => node.id), ["node-321-0"]);
    assert.equal(duplicateMixedLocked.nodes.at(-1).data.label, "Free 副本");
    assert.equal(duplicateMixedLocked.edges.length, 1);

    const singleDuplicate = graphOperations.duplicateSelectedNodes([freeNode], [], [freeNode], 789);
    assert.equal(singleDuplicate.nodes.at(-1).data.label, "Free 副本");

    const deleted = graphOperations.deleteSelectionFromGraph(
      [freeNode, lockedNode],
      [edgeFreeLocked],
      comments,
      null,
      new Set(["node-free", "node-locked"]),
      new Set()
    );
    assert.deepEqual(deleted.nodes.map((node) => node.id), ["node-locked"]);
    assert.deepEqual(deleted.edges, []);
    assert.deepEqual(deleted.comments.map((comment) => comment.id), ["comment-canvas"]);
  });

  await test("graph operations group, nudge, align, and reorder deterministically", () => {
    const nodeOne = { ...baseNode, id: "node-one", data: { ...baseNode.data, label: "One", width: 100, height: 50 } };
    const nodeTwo = { ...targetNode, id: "node-two", position: { x: 200, y: 80 }, data: { ...targetNode.data, label: "Two", width: 120, height: 60 } };
    const lockedNode = { ...baseNode, id: "node-locked", position: { x: 400, y: 200 }, data: { ...baseNode.data, label: "Locked", locked: true } };
    const grouped = graphOperations.groupSelectedNodes([nodeOne, nodeTwo, lockedNode], [nodeOne, nodeTwo], "group-new");
    const groupedWithLocked = graphOperations.groupSelectedNodes([nodeOne, nodeTwo, lockedNode], [nodeOne, nodeTwo, lockedNode], "group-mixed");
    const groupOnlyOneUnlocked = graphOperations.groupSelectedNodes([nodeOne, lockedNode], [nodeOne, lockedNode], "group-noop");

    assert.deepEqual(grouped.map((node) => node.data.groupId ?? null), ["group-new", "group-new", null]);
    assert.deepEqual(groupedWithLocked.map((node) => node.data.groupId ?? null), ["group-mixed", "group-mixed", null]);
    assert.equal(groupOnlyOneUnlocked, null);

    const ungrouped = graphOperations.ungroupSelectedNodes(grouped, [grouped[0]]);
    const lockedGrouped = { ...lockedNode, data: { ...lockedNode.data, groupId: "group-locked" } };
    const unlockedGrouped = { ...nodeOne, data: { ...nodeOne.data, groupId: "group-locked" } };
    const mixedUngrouped = graphOperations.ungroupSelectedNodes([unlockedGrouped, lockedGrouped], [unlockedGrouped, lockedGrouped]);
    assert.deepEqual(ungrouped.map((node) => node.data.groupId ?? null), [null, null, null]);
    assert.deepEqual(mixedUngrouped.map((node) => node.data.groupId ?? null), [null, "group-locked"]);

    const nudged = graphOperations.nudgeNodes([nodeOne, lockedNode], [nodeOne, lockedNode], 8, -4);
    assert.deepEqual(nudged.map((node) => node.position), [
      { x: nodeOne.position.x + 8, y: nodeOne.position.y - 4 },
      lockedNode.position
    ]);

    const aligned = graphOperations.alignNodes([nodeOne, nodeTwo, lockedNode], [nodeOne, nodeTwo], "bottom");
    const alignOnlyOneUnlocked = graphOperations.alignNodes([nodeOne, lockedNode], [nodeOne, lockedNode], "bottom");
    assert.equal(aligned.find((node) => node.id === "node-one").position.y, 90);
    assert.equal(aligned.find((node) => node.id === "node-two").position.y, 80);
    assert.equal(aligned.find((node) => node.id === "node-locked").position.y, 200);
    assert.equal(alignOnlyOneUnlocked, null);

    const distributed = graphOperations.alignNodes(
      [
        nodeOne,
        { ...nodeTwo, position: { x: 300, y: 80 } },
        { ...lockedNode, id: "node-three", position: { x: 700, y: 200 }, data: { ...lockedNode.data, locked: false } }
      ],
      [
        nodeOne,
        { ...nodeTwo, position: { x: 300, y: 80 } },
        { ...lockedNode, id: "node-three", position: { x: 700, y: 200 }, data: { ...lockedNode.data, locked: false } }
      ],
      "distributeX"
    );
    assert.deepEqual(distributed.map((node) => node.position.x), [10, 345, 700]);

    assert.deepEqual(graphOperations.reorderNodes([nodeOne, nodeTwo, lockedNode], new Set(["node-one", "node-locked"]), "front").map((node) => node.id), [
      "node-two",
      "node-locked",
      "node-one"
    ]);
    assert.equal(graphOperations.reorderNodes([nodeOne, nodeTwo, lockedNode], new Set(["node-locked"]), "front"), null);
    assert.deepEqual(graphOperations.reorderNodes([nodeOne, nodeTwo, lockedNode], new Set(["node-two"]), "back").map((node) => node.id), [
      "node-two",
      "node-one",
      "node-locked"
    ]);
  });

  await test("selection operations keep node, edge, group, and comment focus deterministic", () => {
    const groupedA = { ...baseNode, id: "node-group-a", selected: false, data: { ...baseNode.data, groupId: "group-a" } };
    const groupedB = { ...targetNode, id: "node-group-b", selected: false, data: { ...targetNode.data, groupId: "group-a" } };
    const hiddenGrouped = { ...targetNode, id: "node-group-hidden", hidden: true, selected: false, data: { ...targetNode.data, groupId: "group-a" } };
    const otherNode = { ...baseNode, id: "node-other", selected: true };
    const selectedEdge = { ...baseEdge, selected: true };

    const groupSelection = selectionOperations.selectNodeGroup([groupedA, groupedB, hiddenGrouped, otherNode], [selectedEdge], "node-group-a");
    const singleNodeSelection = selectionOperations.selectSingleNode([groupedA, groupedB], [selectedEdge], "node-group-b");
    const edgeSelection = selectionOperations.selectSingleEdge([groupedA], [selectedEdge], "edge-a-b");
    const cleared = selectionOperations.clearGraphSelection([otherNode], [selectedEdge]);
    const allNodes = selectionOperations.selectEveryNode([groupedA, groupedB], [selectedEdge]);
    const nodeCommentSelection = selectionOperations.selectCommentTarget([groupedA, groupedB], [selectedEdge], {
      id: "comment-node",
      target: "node",
      targetId: "node-group-a",
      x: 0,
      y: 0,
      text: "node",
      createdAt: "2026-06-06T00:00:00.000Z"
    });
    const edgeCommentSelection = selectionOperations.selectCommentTarget([groupedA], [selectedEdge], {
      id: "comment-edge",
      target: "edge",
      targetId: "edge-a-b",
      x: 0,
      y: 0,
      text: "edge",
      createdAt: "2026-06-06T00:00:00.000Z"
    });
    const canvasCommentSelection = selectionOperations.selectCommentTarget([otherNode], [selectedEdge], {
      id: "comment-canvas",
      target: "canvas",
      x: 0,
      y: 0,
      text: "canvas",
      createdAt: "2026-06-06T00:00:00.000Z"
    });

    assert.deepEqual(groupSelection.nodes.filter((node) => node.selected).map((node) => node.id), ["node-group-a", "node-group-b"]);
    assert.deepEqual([...groupSelection.selectedNodeIds].sort(), ["node-group-a", "node-group-b"]);
    assert.equal(groupSelection.edges[0].selected, false);
    assert.deepEqual(groupSelection.selection, { type: "node", id: "node-group-a" });
    assert.deepEqual(singleNodeSelection.nodes.filter((node) => node.selected).map((node) => node.id), ["node-group-b"]);
    assert.deepEqual(edgeSelection.selection, { type: "edge", id: "edge-a-b" });
    assert.equal(edgeSelection.nodes[0].selected, false);
    assert.equal(edgeSelection.edges[0].selected, true);
    assert.equal(cleared.nodes[0].selected, false);
    assert.equal(cleared.edges[0].selected, false);
    assert.equal(cleared.selection, null);
    assert.deepEqual(allNodes.nodes.map((node) => node.selected), [true, true]);
    assert.equal(allNodes.edges[0].selected, false);
    assert.deepEqual([...allNodes.selectedNodeIds].sort(), ["node-group-a", "node-group-b"]);
    assert.deepEqual(nodeCommentSelection.selection, { type: "node", id: "node-group-a" });
    assert.deepEqual(edgeCommentSelection.selection, { type: "edge", id: "edge-a-b" });
    assert.equal(canvasCommentSelection.selection, null);
  });

  await test("focus selection prepares non-history selection and viewport intents", () => {
    const groupedA = { ...baseNode, id: "node-group-a", selected: false, data: { ...baseNode.data, groupId: "group-a" } };
    const groupedB = { ...targetNode, id: "node-group-b", selected: false, data: { ...targetNode.data, groupId: "group-a" } };
    const selectedEdge = { ...baseEdge, selected: true };

    const nodeFocus = focusSelection.prepareNodeFocusSelection([groupedA, groupedB], [selectedEdge], "node-group-a");
    const edgeCommentFocus = focusSelection.prepareCommentFocusSelection([groupedA], [selectedEdge], {
      id: "comment-edge",
      target: "edge",
      targetId: "edge-a-b",
      x: 0,
      y: 0,
      text: "edge",
      createdAt: "2026-06-06T00:00:00.000Z"
    });
    const canvasCommentFocus = focusSelection.prepareCommentFocusSelection([groupedA], [selectedEdge], {
      id: "comment-canvas",
      target: "canvas",
      x: 88,
      y: 144,
      text: "canvas",
      createdAt: "2026-06-06T00:00:00.000Z"
    });
    const allNodesFocus = focusSelection.prepareEveryNodeFocusSelection([groupedA, groupedB], [selectedEdge]);

    assert.deepEqual(nodeFocus.selection, { type: "node", id: "node-group-a" });
    assert.deepEqual(nodeFocus.viewport, { type: "nodes", nodeIds: ["node-group-a", "node-group-b"], padding: 0.35, duration: 240 });
    assert.deepEqual(edgeCommentFocus.selection, { type: "edge", id: "edge-a-b" });
    assert.equal(edgeCommentFocus.viewport, null);
    assert.equal(canvasCommentFocus.selection, null);
    assert.deepEqual(canvasCommentFocus.viewport, { type: "canvas", x: 88, y: 144, minZoom: 0.9, duration: 220 });
    assert.deepEqual(allNodesFocus.nodes.map((node) => node.selected), [true, true]);
    assert.equal(allNodesFocus.viewport, null);

    const viewportCalls = [];
    const reactFlow = {
      fitView: (options) => viewportCalls.push(["fit", options.nodes.map((node) => node.id), options.padding, options.duration]),
      setCenter: (x, y, options) => viewportCalls.push(["center", x, y, options.zoom, options.duration]),
      getZoom: () => 0.6
    };
    focusSelection.applyFocusViewport(reactFlow, nodeFocus.viewport);
    focusSelection.applyFocusViewport(reactFlow, canvasCommentFocus.viewport);

    assert.deepEqual(viewportCalls, [
      ["fit", ["node-group-a", "node-group-b"], 0.35, 240],
      ["center", 88, 144, 0.9, 220]
    ]);
  });

  await test("element operations keep inspector, label, layout, and layer edits deterministic", () => {
    const selectedBase = { ...baseNode, selected: true };
    const selectedTarget = { ...targetNode, selected: true };
    const lockedBase = { ...baseNode, data: { ...baseNode.data, locked: true } };
    const hiddenTargetEdge = { ...baseEdge, id: "edge-hidden-target", source: "node-a", target: "node-b", selected: true };
    const dataPatched = elementOperations.applyNodeDataPatch([baseNode], "node-a", { fill: "#ffeecc", locked: true });
    const lockedDataPatch = elementOperations.applyNodeDataPatch([lockedBase], "node-a", { fill: "#000000", fontSize: 22 });
    const unlockedOnlyPatch = elementOperations.applyNodeDataPatch([lockedBase], "node-a", { fill: "#000000", locked: false });
    const moved = elementOperations.applyNodePositionPatch([baseNode], "node-a", { x: 44 });
    const lockedMove = elementOperations.applyNodePositionPatch([{ ...baseNode, data: { ...baseNode.data, locked: true } }], "node-a", { x: 44 });
    const batchPatched = elementOperations.applyNodeDataPatchToIds([baseNode, targetNode], new Set(["node-a", "node-b"]), { fontSize: 18 });
    const batchWithLocked = elementOperations.applyNodeDataPatchToIds([baseNode, { ...targetNode, data: { ...targetNode.data, locked: true } }], new Set(["node-a", "node-b"]), { fontSize: 18 });
    const locked = elementOperations.setNodeLockedByIds([baseNode, targetNode], new Set(["node-b"]), true);
    const edgePatched = elementOperations.applyEdgePatchToIds([baseEdge], new Set(["edge-a-b"]), {
      data: { bendOffset: 42 },
      style: { stroke: "#abcdef" },
      labelStyle: { fill: "#123456" }
    });
    const edgeSimplePatch = elementOperations.applyEdgePatch([baseEdge], "edge-a-b", { label: "done" });
    const edgeWaypoints = elementOperations.applyEdgeWaypoints([baseEdge], "edge-a-b", [{ x: 10, y: 20 }]);
    const nodeFormat = elementOperations.applyFormatSnapshot(
      [baseNode, targetNode],
      [baseEdge],
      new Set(["node-b"]),
      new Set(),
      { target: "node", data: { fill: "#111111", stroke: "#222222", text: "#333333", fontSize: 20 } }
    );
    const lockedNodeFormat = elementOperations.applyFormatSnapshot(
      [baseNode, { ...targetNode, data: { ...targetNode.data, locked: true } }],
      [baseEdge],
      new Set(["node-b"]),
      new Set(),
      { target: "node", data: { fill: "#111111", stroke: "#222222", text: "#333333", fontSize: 20 } }
    );
    const edgeFormat = elementOperations.applyFormatSnapshot(
      [baseNode],
      [baseEdge],
      new Set(),
      new Set(["edge-a-b"]),
      {
        target: "edge",
        edge: {
          type: "smoothstep",
          data: { bendOffset: 9 },
          style: { stroke: "#999999" },
          labelStyle: { fill: "#000000" },
          labelBgStyle: { fill: "#ffffff" },
          animated: true
        }
      }
    );
    const labeledNodes = elementOperations.applyNodeLabelValue([baseNode], "node-a", "Renamed");
    const lockedLabeledNodes = elementOperations.applyNodeLabelValue([lockedBase], "node-a", "Renamed");
    const labeledEdges = elementOperations.applyEdgeLabelValue([baseEdge], "edge-a-b", "approved");
    const autoLayout = elementOperations.autoLayoutNodes([selectedBase, selectedTarget], [selectedTarget, selectedBase], "horizontal");
    const mindCenter = { ...baseNode, id: "mind-center", position: { x: 300, y: 200 }, data: { ...baseNode.data, shape: "mindTopic", width: 180, height: 80 } };
    const mindLeft = { ...baseNode, id: "mind-left", position: { x: 80, y: 320 }, data: { ...baseNode.data, shape: "mindBranch", width: 130, height: 50 } };
    const mindRightA = { ...baseNode, id: "mind-right-a", position: { x: 740, y: 80 }, data: { ...baseNode.data, shape: "mindBranch", width: 130, height: 50 } };
    const mindRightB = { ...baseNode, id: "mind-right-b", position: { x: 780, y: 360 }, data: { ...baseNode.data, shape: "mindBranch", width: 130, height: 50 } };
    const mindLayout = elementOperations.autoLayoutMindMapNodes([mindRightB, mindCenter, mindRightA, mindLeft], [mindRightB, mindCenter, mindRightA, mindLeft]);
    const orgRoot = { ...baseNode, id: "org-root", position: { x: 300, y: 0 }, data: { ...baseNode.data, shape: "orgPerson", width: 150, height: 74 } };
    const orgProduct = { ...baseNode, id: "org-product", position: { x: 600, y: 340 }, data: { ...baseNode.data, shape: "orgUnit", width: 150, height: 62 } };
    const orgTech = { ...baseNode, id: "org-tech", position: { x: 0, y: 340 }, data: { ...baseNode.data, shape: "orgUnit", width: 150, height: 62 } };
    const orgTeam = { ...baseNode, id: "org-team", position: { x: 600, y: 520 }, data: { ...baseNode.data, shape: "orgPerson", width: 150, height: 74 } };
    const orgEdges = [
      { ...baseEdge, id: "org-edge-1", source: "org-root", target: "org-product" },
      { ...baseEdge, id: "org-edge-2", source: "org-root", target: "org-tech" },
      { ...baseEdge, id: "org-edge-3", source: "org-tech", target: "org-team" }
    ];
    const mindChildInsertion = elementOperations.appendStructuredNode({
      nodes: [mindCenter, mindLeft, mindRightA],
      edges: [{ ...baseEdge, id: "mind-edge-1", source: "mind-center", target: "mind-left" }],
      selectedNode: mindCenter,
      mode: "child",
      idSeed: 7
    });
    const mindSiblingInsertion = elementOperations.appendStructuredNode({
      nodes: [mindCenter, mindLeft],
      edges: [{ ...baseEdge, id: "mind-edge-1", source: "mind-center", target: "mind-left" }],
      selectedNode: mindLeft,
      mode: "sibling",
      idSeed: 8
    });
    const orgChildInsertion = elementOperations.appendStructuredNode({
      nodes: [orgRoot, orgProduct],
      edges: [{ ...baseEdge, id: "org-edge-1", source: "org-root", target: "org-product" }],
      selectedNode: orgProduct,
      mode: "child",
      idSeed: 9
    });
    const orgLayout = elementOperations.autoLayoutOrgChartNodes([orgProduct, orgTeam, orgRoot, orgTech], [orgProduct, orgTeam, orgRoot, orgTech], orgEdges);
    const lockedOrgLayout = elementOperations.autoLayoutOrgChartNodes(
      [orgRoot, { ...orgProduct, data: { ...orgProduct.data, locked: true } }, orgTech],
      [orgRoot, { ...orgProduct, data: { ...orgProduct.data, locked: true } }, orgTech],
      orgEdges
    );
    const lockedAutoLayout = elementOperations.autoLayoutNodes(
      [selectedBase, { ...selectedTarget, data: { ...selectedTarget.data, locked: true } }],
      [{ ...selectedTarget, data: { ...selectedTarget.data, locked: true } }, selectedBase],
      "horizontal"
    );
    const hidden = elementOperations.setNodeHiddenWithEdges([selectedBase, selectedTarget], [hiddenTargetEdge], "node-b", true);
    const layerMoved = elementOperations.moveLayerNode([baseNode, targetNode], "node-a", "up");
    const lockedLayerMove = elementOperations.moveLayerNode([lockedBase, targetNode], "node-a", "up");

    assert.equal(dataPatched[0].data.fill, "#ffeecc");
    assert.equal(dataPatched[0].data.locked, true);
    assert.equal(dataPatched[0].draggable, false);
    assert.equal(lockedDataPatch[0].data.fill, baseNode.data.fill);
    assert.equal(lockedDataPatch[0].data.fontSize, baseNode.data.fontSize);
    assert.equal(unlockedOnlyPatch[0].data.locked, false);
    assert.equal(unlockedOnlyPatch[0].data.fill, baseNode.data.fill);
    assert.deepEqual(moved[0].position, { x: 44, y: baseNode.position.y });
    assert.equal(lockedMove, null);
    assert.deepEqual(batchPatched.map((node) => node.data.fontSize), [18, 18]);
    assert.deepEqual(batchWithLocked.map((node) => node.data.fontSize), [18, targetNode.data.fontSize]);
    assert.equal(locked[1].data.locked, true);
    assert.equal(locked[1].draggable, false);
    assert.equal(edgePatched[0].data.bendOffset, 42);
    assert.equal(edgePatched[0].data.waypoints[0].x, 190);
    assert.equal(edgePatched[0].style.stroke, "#abcdef");
    assert.equal(edgePatched[0].labelStyle.fill, "#123456");
    assert.equal(edgeSimplePatch[0].label, "done");
    assert.deepEqual(edgeWaypoints[0].data.waypoints, [{ x: 10, y: 20 }]);
    assert.equal(nodeFormat.nodes[1].data.fill, "#111111");
    assert.equal(lockedNodeFormat.nodes[1].data.fill, targetNode.data.fill);
    assert.equal(edgeFormat.edges[0].animated, true);
    assert.equal(edgeFormat.edges[0].data.bendOffset, 9);
    assert.equal(labeledNodes[0].data.label, "Renamed");
    assert.equal(lockedLabeledNodes[0].data.label, baseNode.data.label);
    assert.equal(labeledEdges[0].label, "approved");
    assert.deepEqual(autoLayout.map((node) => node.position), [
      { x: baseNode.position.x, y: baseNode.position.y },
      { x: baseNode.position.x + baseNode.data.width + 96, y: baseNode.position.y }
    ]);
    assert.equal(mindLayout.find((node) => node.id === "mind-left").position.x, -60);
    assert.equal(mindLayout.find((node) => node.id === "mind-left").position.y, 215);
    assert.equal(mindLayout.find((node) => node.id === "mind-right-a").position.x, 710);
    assert.equal(mindLayout.find((node) => node.id === "mind-right-a").position.y, 169);
    assert.equal(mindLayout.find((node) => node.id === "mind-right-b").position.y, 261);
    assert.equal(elementOperations.canAppendStructuredNode(mindCenter, "child"), true);
    assert.equal(elementOperations.canAppendStructuredNode(mindCenter, "sibling"), false);
    assert.equal(mindChildInsertion.nodes.at(-1).id, "mind-child-7");
    assert.equal(mindChildInsertion.nodes.at(-1).data.shape, "mindBranch");
    assert.equal(mindChildInsertion.edges.at(-1).sourceHandle, "right-source");
    assert.deepEqual(mindChildInsertion.selection, { type: "node", id: "mind-child-7" });
    assert.equal(mindSiblingInsertion.nodes.at(-1).position.y, mindLeft.position.y + mindLeft.data.height + 34);
    assert.equal(mindSiblingInsertion.edges.at(-1).source, "mind-center");
    assert.equal(orgLayout.find((node) => node.id === "org-root").position.y, 0);
    assert.equal(orgLayout.find((node) => node.id === "org-product").position.y, 166);
    assert.equal(orgLayout.find((node) => node.id === "org-team").position.y, 320);
    assert.equal(orgChildInsertion.nodes.at(-1).id, "org-child-9");
    assert.equal(orgChildInsertion.nodes.at(-1).data.shape, "orgUnit");
    assert.equal(orgChildInsertion.edges.at(-1).sourceHandle, "bottom-source");
    assert.equal(lockedOrgLayout.find((node) => node.id === "org-product").position.x, orgProduct.position.x);
    assert.equal(lockedAutoLayout, null);
    assert.equal(hidden.nodes[1].hidden, true);
    assert.equal(hidden.nodes[1].selected, false);
    assert.equal(hidden.edges[0].hidden, true);
    assert.equal(hidden.edges[0].selected, false);
    assert.deepEqual(layerMoved.map((node) => node.id), ["node-b", "node-a"]);
    assert.equal(lockedLayerMove, null);
    assert.equal(elementOperations.moveLayerNode([baseNode, targetNode], "node-b", "up"), null);
  });

  await test("react flow change operations isolate canvas mutations", () => {
    const lockedNode = { ...baseNode, id: "node-locked", data: { ...baseNode.data, locked: true } };
    const nodeChanges = reactFlowChangeOperations.applyLockedAwareNodeChanges([lockedNode, targetNode], [
      { id: "node-locked", type: "position", position: { x: 999, y: 999 } },
      { id: "node-b", type: "dimensions", dimensions: { width: 144.4, height: 88.8 }, resizing: false }
    ]);
    const edgeChanges = reactFlowChangeOperations.applyDiagramEdgeChanges([baseEdge], [{ id: "edge-a-b", type: "select", selected: true }]);
    const connected = reactFlowChangeOperations.connectDiagramEdge(
      [],
      { source: "node-a", target: "node-b", sourceHandle: "right-source", targetHandle: "left-target" },
      123
    );
    const reconnected = reactFlowChangeOperations.reconnectDiagramEdge(
      [baseEdge],
      baseEdge,
      { source: "node-b", target: "node-a", sourceHandle: "left-source", targetHandle: "right-target" }
    );

    assert.deepEqual(nodeChanges.nodes[0].position, lockedNode.position);
    assert.equal(nodeChanges.nodes[1].data.width, 144);
    assert.equal(nodeChanges.nodes[1].data.height, 89);
    assert.equal(nodeChanges.shouldRecordSnapshot, true);
    assert.equal(edgeChanges[0].selected, true);
    assert.equal(connected[0].id, "edge-123");
    assert.equal(connected[0].type, "smoothstep");
    assert.equal(connected[0].data.bendOffset, 20);
    assert.equal(connected[0].style.stroke, "#46515f");
    assert.equal(connected[0].style.strokeWidth, 1.8);
    assert.equal(reconnected[0].source, "node-b");
    assert.equal(reconnected[0].target, "node-a");
  });

  await test("document selectors keep shape, outline, layer, and page search deterministic", () => {
    const shapes = [
      { kind: "process", label: "流程/任务" },
      { kind: "decision", label: "判断/分支" },
      { kind: "erEntity", label: "ER实体/数据表" }
    ];
    const customTemplate = { id: "custom", name: "Custom", description: "custom", nodes: [], edges: [] };
    const builtInTemplate = { id: "built-in", name: "Built In", description: "built", nodes: [], edges: [] };
    const pageTwo = {
      id: "page-two",
      name: "Data Model",
      nodes: [{ ...targetNode, id: "node-customer", data: { ...targetNode.data, label: "Customer", shape: "erEntity" } }],
      edges: [],
      comments: []
    };

    assert.deepEqual(documentSelectors.getVisibleShapes(shapes, diagramDefaults.shapeCategoryMap, "flow", "判断").map((shape) => shape.kind), ["decision"]);
    assert.deepEqual(documentSelectors.getAllTemplates([customTemplate], [builtInTemplate]).map((template) => template.id), ["custom", "built-in"]);
    assert.deepEqual(documentSelectors.getVisibleOutlineNodes([baseNode, pageTwo.nodes[0]], "er", shapes).map(({ node }) => node.id), ["node-customer"]);
    assert.deepEqual(documentSelectors.getLayerNodes([baseNode, targetNode]).map(({ node }) => node.id), ["node-b", "node-a"]);

    const searchResults = documentSelectors.getDocumentSearchResults([document.pages[0], pageTwo], "data", shapes);
    assert.deepEqual(
      searchResults.map((result) => `${result.type}:${result.page.id}:${result.node?.id ?? ""}`),
      ["page:page-two:", "node:page-two:node-customer"]
    );
  });

  await test("keyboard shortcut dispatcher preserves desktop editing semantics", () => {
    const calls = [];
    const handlers = {
      focusOutlineSearch: () => calls.push("focus"),
      openCommandPalette: () => calls.push("palette"),
      saveDocument: () => calls.push("save"),
      saveDocumentAs: () => calls.push("save-as"),
      openDocument: () => calls.push("open"),
      newDocument: () => calls.push("new"),
      nudgeSelectedNodes: (dx, dy) => calls.push(`nudge:${dx},${dy}`),
      zoomIn: () => calls.push("zoom-in"),
      zoomOut: () => calls.push("zoom-out"),
      fitCanvas: () => calls.push("fit"),
      undo: () => calls.push("undo"),
      redo: () => calls.push("redo"),
      duplicateSelection: () => calls.push("duplicate"),
      copySelection: () => calls.push("copy"),
      cutSelection: () => calls.push("cut"),
      pasteClipboard: () => calls.push("paste"),
      selectAllNodes: () => calls.push("select-all"),
      deleteSelection: () => calls.push("delete"),
      closeContextMenu: () => calls.push("close-menu"),
      exitPreviewMode: () => calls.push("exit-preview"),
      completeKeyboardConnector: () => {
        calls.push("keyboard-connect");
        return false;
      },
      appendStructuredNode: (mode) => {
        calls.push(`structured:${mode}`);
        return mode === "child";
      }
    };
    const eventFor = (key, options = {}) => {
      let prevented = false;
      return {
        event: {
          key,
          metaKey: false,
          ctrlKey: false,
          shiftKey: false,
          target: null,
          preventDefault: () => {
            prevented = true;
          },
          ...options
        },
        prevented: () => prevented
      };
    };
    const editableTarget = { closest: () => ({}) };

    let shortcut = eventFor("s", { ctrlKey: true });
    assert.equal(keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers), true);
    assert.equal(shortcut.prevented(), true);

    shortcut = eventFor("s", { ctrlKey: true, shiftKey: true });
    keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers);

    shortcut = eventFor("ArrowRight", { shiftKey: true });
    keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers);

    shortcut = eventFor("z", { metaKey: true, shiftKey: true });
    keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers);

    shortcut = eventFor("Delete", { target: editableTarget });
    assert.equal(keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers), false);
    assert.equal(shortcut.prevented(), false);

    shortcut = eventFor("f", { ctrlKey: true, target: editableTarget });
    assert.equal(keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers), true);

    shortcut = eventFor("Escape");
    keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers);

    shortcut = eventFor("Enter");
    assert.equal(keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers), false);

    shortcut = eventFor("Tab");
    assert.equal(keyboardShortcuts.handleEditorKeyDown(shortcut.event, handlers), true);
    assert.equal(shortcut.prevented(), true);

    const activeConnectorHandlers = {
      ...handlers,
      completeKeyboardConnector: () => {
        calls.push("keyboard-connect-active");
        return true;
      },
      appendStructuredNode: (mode) => {
        calls.push(`structured-active:${mode}`);
        return true;
      }
    };
    shortcut = eventFor("Enter");
    assert.equal(keyboardShortcuts.handleEditorKeyDown(shortcut.event, activeConnectorHandlers), true);
    assert.equal(shortcut.prevented(), true);
    shortcut = eventFor("Enter");
    assert.equal(
      keyboardShortcuts.handleEditorKeyDown(shortcut.event, { ...handlers, completeKeyboardConnector: () => false, appendStructuredNode: () => true }),
      true
    );
    assert.equal(shortcut.prevented(), true);

    assert.deepEqual(calls, [
      "save",
      "save-as",
      "nudge:10,0",
      "redo",
      "focus",
      "close-menu",
      "exit-preview",
      "keyboard-connect",
      "structured:sibling",
      "structured:child",
      "keyboard-connect-active"
    ]);
  });

  await test("keyboard connector builds deterministic source-to-target connections", () => {
    const lockedNode = { ...targetNode, id: "node-locked", selected: true, data: { ...targetNode.data, label: "Locked", locked: true } };
    const sourceState = keyboardConnector.startKeyboardConnector([{ ...baseNode, selected: true }]);
    const lockedState = keyboardConnector.startKeyboardConnector([lockedNode]);
    const multiState = keyboardConnector.startKeyboardConnector([{ ...baseNode, selected: true }, { ...targetNode, selected: true }]);
    const connection = keyboardConnector.buildKeyboardConnectorConnection(sourceState, [{ ...targetNode, selected: true }]);

    assert.equal(sourceState.sourceNodeId, "node-a");
    assert.equal(lockedState.sourceNodeId, null);
    assert.equal(multiState.sourceNodeId, null);
    assert.deepEqual(connection, {
      source: "node-a",
      target: "node-b",
      sourceHandle: "right-source",
      targetHandle: "left-target"
    });
    assert.equal(keyboardConnector.buildKeyboardConnectorConnection(sourceState, [{ ...baseNode, selected: true }]), null);
    assert.equal(keyboardConnector.buildKeyboardConnectorConnection(sourceState, [lockedNode]), null);
  });

  await test("command registry exposes stable command ids and disabled state", () => {
    const calls = [];
    const handlers = {
      newDocument: () => calls.push("new"),
      openDocument: () => calls.push("open"),
      saveDocument: () => calls.push("save"),
      saveDocumentAs: () => calls.push("save-as"),
      setTool: (tool) => calls.push(`tool:${tool}`),
      addShape: (kind) => calls.push(`shape:${kind}`),
      addPage: () => calls.push("page-new"),
      duplicatePage: () => calls.push("page-copy"),
      saveCache: () => calls.push("cache"),
      saveVersion: () => calls.push("version"),
      importJson: () => calls.push("import-json"),
      importMermaid: () => calls.push("import-mermaid"),
      exportDefault: () => calls.push("export-default"),
      exportJson: () => calls.push("export-json"),
      exportMermaid: () => calls.push("export-mermaid"),
      exportSvg: () => calls.push("export-svg"),
      exportPng: () => calls.push("export-png"),
      exportPdf: () => calls.push("export-pdf"),
      exportDocumentPdf: () => calls.push("export-document-pdf"),
      printCurrentPage: () => calls.push("print-current-page"),
      openPreferences: () => calls.push("preferences"),
      openPresentation: () => calls.push("presentation"),
      toggleSnapToGrid: () => calls.push("snap"),
      fitCanvas: () => calls.push("fit-canvas"),
      fitSelection: () => calls.push("fit-selection"),
      matchNodeSize: (action) => calls.push(`match:${action}`),
      autoLayout: (direction) => calls.push(`layout:${direction}`),
      appendStructuredNode: (mode) => calls.push(`structured:${mode}`),
      startKeyboardConnector: () => calls.push("keyboard-connect-start"),
      completeKeyboardConnector: () => calls.push("keyboard-connect-complete"),
      selectedNodeCount: 0,
      nodeCount: 1,
      mindNodeCount: 1,
      orgNodeCount: 1,
      canAddStructuredChild: false,
      canAddStructuredSibling: false,
      keyboardConnectorActive: false
    };
    const disabledItems = commandRegistry.buildCommandItems(handlers);
    const enabledItems = commandRegistry.buildCommandItems({
      ...handlers,
      selectedNodeCount: 2,
      nodeCount: 3,
      mindNodeCount: 3,
      orgNodeCount: 3,
      canAddStructuredChild: true,
      canAddStructuredSibling: true
    });
    const connectorItems = commandRegistry.buildCommandItems({ ...handlers, selectedNodeCount: 1, keyboardConnectorActive: true });

    assert.deepEqual(
      disabledItems.map((item) => item.id),
      [
        "document-new",
        "document-open",
        "document-save",
        "document-save-as",
        "tool-select",
        "tool-pan",
        "tool-connect",
        "keyboard-connect-start",
        "keyboard-connect-complete",
        "add-terminator",
        "add-process",
        "add-circle",
        "add-hexagon",
        "add-decision",
        "add-bpmnStartEvent",
        "add-bpmnEndEvent",
        "add-bpmnTask",
        "add-bpmnGateway",
        "add-document",
        "add-data",
        "add-database",
        "add-umlClass",
        "add-erEntity",
        "add-erAttribute",
        "add-erRelationship",
        "add-swimlane",
        "add-table",
        "add-subprocess",
        "add-manual",
        "add-delay",
        "add-preparation",
        "add-offpage",
        "add-merge",
        "add-display",
        "add-note",
        "add-text",
        "add-mindTopic",
        "add-mindBranch",
        "add-orgPerson",
        "add-orgUnit",
        "page-new",
        "page-copy",
        "save-cache",
        "save-version",
        "import-json",
        "import-mermaid",
        "export-default",
        "export-json",
        "export-mermaid",
        "export-svg",
        "export-png",
        "export-pdf",
        "export-document-pdf",
        "print-current-page",
        "preferences",
        "toggle-snap-to-grid",
        "presentation",
        "fit-canvas",
        "fit-selection",
        "match-width",
        "match-height",
        "match-size",
        "layout-horizontal",
        "layout-vertical",
        "layout-mind",
        "layout-org",
        "structured-add-child",
        "structured-add-sibling"
      ]
    );
    assert.equal(disabledItems.find((item) => item.id === "fit-selection").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "match-width").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "match-height").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "match-size").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "layout-horizontal").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "layout-mind").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "layout-org").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "structured-add-child").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "structured-add-sibling").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "keyboard-connect-start").disabled, true);
    assert.equal(disabledItems.find((item) => item.id === "keyboard-connect-complete").disabled, true);
    assert.equal(enabledItems.find((item) => item.id === "fit-selection").disabled, false);
    assert.equal(enabledItems.find((item) => item.id === "match-width").disabled, false);
    assert.equal(enabledItems.find((item) => item.id === "match-height").disabled, false);
    assert.equal(enabledItems.find((item) => item.id === "match-size").disabled, false);
    assert.equal(enabledItems.find((item) => item.id === "layout-mind").disabled, false);
    assert.equal(enabledItems.find((item) => item.id === "structured-add-child").disabled, false);
    assert.equal(enabledItems.find((item) => item.id === "structured-add-sibling").disabled, false);
    assert.equal(connectorItems.find((item) => item.id === "keyboard-connect-start").disabled, false);
    assert.equal(connectorItems.find((item) => item.id === "keyboard-connect-complete").disabled, false);

    enabledItems.find((item) => item.id === "tool-connect").run();
    enabledItems.find((item) => item.id === "add-decision").run();
    enabledItems.find((item) => item.id === "preferences").run();
    enabledItems.find((item) => item.id === "toggle-snap-to-grid").run();
    enabledItems.find((item) => item.id === "export-default").run();
    enabledItems.find((item) => item.id === "export-svg").run();
    enabledItems.find((item) => item.id === "export-document-pdf").run();
    enabledItems.find((item) => item.id === "print-current-page").run();
    enabledItems.find((item) => item.id === "match-width").run();
    enabledItems.find((item) => item.id === "match-height").run();
    enabledItems.find((item) => item.id === "match-size").run();
    enabledItems.find((item) => item.id === "layout-mind").run();
    enabledItems.find((item) => item.id === "layout-org").run();
    enabledItems.find((item) => item.id === "structured-add-child").run();
    enabledItems.find((item) => item.id === "structured-add-sibling").run();
    connectorItems.find((item) => item.id === "keyboard-connect-start").run();
    connectorItems.find((item) => item.id === "keyboard-connect-complete").run();
    assert.deepEqual(calls, [
      "tool:connect",
      "shape:decision",
      "preferences",
      "snap",
      "export-default",
      "export-svg",
      "export-document-pdf",
      "print-current-page",
      "match:width",
      "match:height",
      "match:both",
      "layout:mind",
      "layout:org",
      "structured:child",
      "structured:sibling",
      "keyboard-connect-start",
      "keyboard-connect-complete"
    ]);
  });

  await test("format support matrix states native best-effort and unsupported boundaries", () => {
    const statuses = new Set(formatSupport.FORMAT_SUPPORT_ITEMS.map((item) => item.status));
    const visio = formatSupport.FORMAT_SUPPORT_ITEMS.find((item) => item.id === "visio");
    const mermaid = formatSupport.FORMAT_SUPPORT_ITEMS.find((item) => item.id === "mermaid");
    const structra = formatSupport.FORMAT_SUPPORT_ITEMS.find((item) => item.id === "structra");

    assert.equal(statuses.has("native"), true);
    assert.equal(statuses.has("bestEffort"), true);
    assert.equal(statuses.has("unsupported"), true);
    assert.equal(formatSupport.getFormatSupportStatusLabel("native"), "原生");
    assert.equal(formatSupport.getFormatSupportStatusLabel("bestEffort"), "尽力");
    assert.equal(formatSupport.getFormatSupportStatusLabel("unsupported"), "暂不支持");
    assert.equal(formatSupport.getFormatSupportDirectionLabel("importExport"), "导入/导出");
    assert.equal(visio.status, "unsupported");
    assert.equal(visio.direction, "none");
    assert.equal(mermaid.status, "bestEffort");
    assert.equal(structra.status, "native");
    assert.match(structra.extensions, /\.structra/);
  });

  await test("local workspace filters templates and summarizes local assets", () => {
    const items = localWorkspace.buildWorkspaceTemplateItems(diagramDefaults.diagramTemplates, diagramDefaults.shapeCategoryMap);
    const erItems = localWorkspace.filterWorkspaceTemplates(items, "订单", "er");
    const bpmnItems = localWorkspace.filterWorkspaceTemplates(items, "履约", "bpmn");
    const favoriteTemplateIds = new Set([items[0].template.id, items[2].template.id]);
    const favoriteItems = localWorkspace.filterWorkspaceTemplates(items, "", "favorite", favoriteTemplateIds);
    const summary = localWorkspace.getWorkspaceSummary(
      [
        ...items,
        {
          ...items[0],
          template: { ...items[0].template, id: "custom-workspace", custom: true },
          category: "custom"
        }
      ],
      2,
      favoriteTemplateIds
    );

    assert.ok(items.length >= 3);
    assert.ok(erItems.some((item) => item.template.name === "ER订单模型"));
    assert.ok(bpmnItems.every((item) => item.category === "bpmn"));
    assert.deepEqual(favoriteItems.map((item) => item.template.id), [items[0].template.id, items[2].template.id]);
    assert.equal(summary.recentCount, 2);
    assert.equal(summary.favoriteCount, 2);
    assert.equal(summary.customCount, 1);
    assert.equal(localWorkspace.getRecentDocumentDisplayPath("/Users/hmj/Documents/flow/order.structra"), "Documents/flow/order.structra");
    assert.equal(localWorkspace.getRecentDocumentDirectory("/Users/hmj/Documents/flow/order.structra"), "Documents/flow");
    assert.deepEqual(localWorkspace.getRecentDocumentFormat("/Users/hmj/Documents/flow/order.structra"), {
      kind: "native",
      label: "原生",
      title: "Structra 原生文档"
    });
    assert.equal(localWorkspace.getRecentDocumentFormat("/Users/hmj/Documents/flow/order.structra").kind, "native");
    assert.equal(localWorkspace.getRecentDocumentFormat("/Users/hmj/Documents/flow/order.json").kind, "compatible");
    assert.equal(localWorkspace.getRecentDocumentFormat("/Users/hmj/Documents/flow/order.txt").kind, "unknown");

    const draftIdentity = localWorkspace.getLocalDocumentIdentity({
      documentPath: null,
      documentName: "未命名文档",
      documentStatus: "新建本地文档",
      documentDirty: true
    });
    const nativeIdentity = localWorkspace.getLocalDocumentIdentity({
      documentPath: "/Users/hmj/Documents/flow/order.structra",
      documentName: "order.structra",
      documentStatus: "已保存到 order.structra",
      documentDirty: false
    });
    const importedIdentity = localWorkspace.getLocalDocumentIdentity({
      documentPath: null,
      documentName: "legacy.json",
      documentStatus: "已导入 JSON，尚未保存为文档",
      documentDirty: false
    });
    const downloadIdentity = localWorkspace.getLocalDocumentIdentity({
      documentPath: null,
      documentName: "browser-copy.structra",
      documentStatus: "已下载文档副本",
      documentDirty: false
    });

    assert.equal(draftIdentity.kind, "draft");
    assert.equal(draftIdentity.badge, "本地草稿");
    assert.equal(nativeIdentity.kind, "native");
    assert.equal(nativeIdentity.badge, ".structra 原生");
    assert.equal(nativeIdentity.pathTitle, "/Users/hmj/Documents/flow/order.structra");
    assert.equal(importedIdentity.kind, "compatible");
    assert.equal(importedIdentity.title, "JSON 导入未另存");
    assert.equal(downloadIdentity.kind, "downloadCopy");
  });

  await test("workspace route state preserves explicit editor and workspace modes", () => {
    const writes = [];
    const storage = {
      value: "",
      getItem: () => storage.value,
      setItem: (key, value) => {
        writes.push({ key, value });
        storage.value = String(value);
      }
    };

    const generated = workspaceRoute.getOrCreateEditorSessionId(storage, 1_780_000_000_000, 0.42);
    const reused = workspaceRoute.getOrCreateEditorSessionId(storage, 1_780_000_000_001, 0.99);

    assert.equal(workspaceRoute.getInitialWorkspaceOpen(true, ""), true);
    assert.equal(workspaceRoute.getInitialWorkspaceOpen(false, ""), false);
    assert.equal(workspaceRoute.getInitialWorkspaceOpen(true, "?id=local-session"), false);
    assert.equal(workspaceRoute.getInitialWorkspaceOpen(false, "?workspace=1"), true);
    assert.equal(workspaceRoute.buildEditorSearch("?workspace=1&panel=shape", "local-session"), "?panel=shape&id=local-session");
    assert.equal(workspaceRoute.buildWorkspaceSearch("?id=local-session&panel=shape"), "?panel=shape&workspace=1");
    assert.equal(workspaceRoute.buildEditorUrl("/diagram", "?workspace=1&panel=shape", "#canvas", "local-session"), "/diagram?panel=shape&id=local-session#canvas");
    assert.equal(workspaceRoute.buildWorkspaceUrl("/diagram", "?id=local-session&panel=shape", "#canvas"), "/diagram?panel=shape&workspace=1#canvas");
    assert.equal(generated, reused);
    assert.match(generated, /^local-/);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].key, workspaceRoute.EDITOR_SESSION_STORAGE_KEY);
  });

  await test("native menu command bridge dispatches palette and desktop commands", () => {
    const calls = [];
    const paletteItem = { id: "export-svg", group: "导出", label: "导出当前页 SVG", run: () => calls.push("palette-export") };
    const handlers = {
      commandItems: [paletteItem],
      openCommandPalette: () => calls.push("palette"),
      runCommand: (item) => {
        calls.push(`run:${item.id}`);
        item.run();
      },
      undo: () => calls.push("undo"),
      redo: () => calls.push("redo"),
      copySelection: () => calls.push("copy"),
      cutSelection: () => calls.push("cut"),
      pasteClipboard: () => calls.push("paste"),
      duplicateSelection: () => calls.push("duplicate"),
      deleteSelection: () => calls.push("delete"),
      selectAllNodes: () => calls.push("select-all"),
      toggleGrid: () => calls.push("grid"),
      toggleRulers: () => calls.push("rulers"),
      toggleSnapToGrid: () => calls.push("snap"),
      openWorkspace: () => calls.push("workspace"),
      openFirstRecentFromWorkspace: () => calls.push("workspace-recent"),
      acceptNextUnsavedPromptForAudit: () => calls.push("accept-unsaved"),
      openPreferences: () => calls.push("preferences"),
      zoomIn: () => calls.push("zoom-in"),
      zoomOut: () => calls.push("zoom-out"),
      resetZoom: () => calls.push("reset-zoom"),
      togglePreviewMode: () => calls.push("preview"),
      exportDocumentPdf: () => calls.push("document-pdf"),
      printCurrentPage: () => calls.push("print")
    };

    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("command-palette", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("export-svg", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("toggle-grid", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("toggle-snap-to-grid", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("open-workspace", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("open-first-recent-from-workspace", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("audit-accept-next-unsaved-prompt", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("preferences", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("print-current-page", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("unknown-command", handlers), false);
    assert.deepEqual(calls, ["palette", "run:export-svg", "palette-export", "grid", "snap", "workspace", "workspace-recent", "accept-unsaved", "preferences", "print"]);
  });

  await test("native menu enabled state mirrors local editor availability", () => {
    const idle = nativeMenuState.buildNativeMenuEnabledState({
      canUndo: false,
      canRedo: false,
      canPaste: false,
      documentDirty: false,
      selectedNodeCount: 0,
      selectedEdgeCount: 0,
      hasSelection: false
    });
    const active = nativeMenuState.buildNativeMenuEnabledState({
      canUndo: true,
      canRedo: true,
      canPaste: true,
      documentDirty: true,
      selectedNodeCount: 2,
      selectedEdgeCount: 1,
      hasSelection: true
    });

    assert.equal(idle.undo, false);
    assert.equal(idle.redo, false);
    assert.equal(idle["document-save"], false);
    assert.equal(idle["open-workspace"], true);
    assert.equal(idle.preferences, true);
    assert.equal(idle["copy-selection"], false);
    assert.equal(idle["delete-selection"], false);
    assert.equal(idle["fit-selection"], false);
    assert.equal(active.undo, true);
    assert.equal(active.redo, true);
    assert.equal(active["document-save"], true);
    assert.equal(active["copy-selection"], true);
    assert.equal(active["paste-selection"], true);
    assert.equal(active["delete-selection"], true);
    assert.equal(active["toggle-snap-to-grid"], true);
    assert.equal(nativeMenuState.isNativeMenuCommandEnabled("unknown-command", idle), true);
  });

  await test("native menu command bridge blocks disabled commands", () => {
    const calls = [];
    const disabledPaletteItem = {
      id: "fit-selection",
      group: "视图",
      label: "适应选中",
      disabled: true,
      run: () => calls.push("fit-selection")
    };
    const handlers = {
      commandItems: [disabledPaletteItem],
      openCommandPalette: () => calls.push("palette"),
      runCommand: (item) => {
        calls.push(`run:${item.id}`);
        item.run();
      },
      undo: () => calls.push("undo"),
      redo: () => calls.push("redo"),
      copySelection: () => calls.push("copy"),
      cutSelection: () => calls.push("cut"),
      pasteClipboard: () => calls.push("paste"),
      duplicateSelection: () => calls.push("duplicate"),
      deleteSelection: () => calls.push("delete"),
      selectAllNodes: () => calls.push("select-all"),
      toggleGrid: () => calls.push("grid"),
      toggleRulers: () => calls.push("rulers"),
      toggleSnapToGrid: () => calls.push("snap"),
      openWorkspace: () => calls.push("workspace"),
      openPreferences: () => calls.push("preferences"),
      zoomIn: () => calls.push("zoom-in"),
      zoomOut: () => calls.push("zoom-out"),
      resetZoom: () => calls.push("reset-zoom"),
      togglePreviewMode: () => calls.push("preview"),
      exportDocumentPdf: () => calls.push("document-pdf"),
      printCurrentPage: () => calls.push("print")
    };

    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("undo", handlers, { undo: false }), false);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("paste-selection", handlers, { "paste-selection": false }), false);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("preferences", handlers, { preferences: false }), false);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("fit-selection", handlers), false);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("audit-accept-next-unsaved-prompt", handlers), false);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("toggle-snap-to-grid", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("toggle-preview", handlers), true);
    assert.equal(nativeMenuCommands.dispatchNativeMenuCommand("redo", handlers, { redo: true }), true);
    assert.deepEqual(calls, ["snap", "preview", "redo"]);
  });

  await test("native menu workflow module exposes the desktop menu hook", () => {
    assert.equal(typeof nativeMenuWorkflow.useNativeMenuWorkflow, "function");
  });

  await test("native open-document workflow deduplicates desktop file events", () => {
    const openedPaths = new Set(["/tmp/already.structra"]);
    const uniquePaths = nativeOpenDocumentWorkflow.getUniqueNativeOpenDocumentPaths(
      ["/tmp/already.structra", "  /tmp/order.structra  ", "/tmp/order.structra", "", "/tmp/review.structra"],
      openedPaths
    );

    assert.deepEqual(uniquePaths, ["/tmp/order.structra", "/tmp/review.structra"]);
    assert.deepEqual(nativeFiles.normalizeNativeOpenDocumentPaths(["/tmp/order.structra", "", 42, null, "/tmp/review.structra"]), [
      "/tmp/order.structra",
      "/tmp/review.structra"
    ]);
    assert.equal(nativeOpenDocumentWorkflow.getNativeOpenDocumentSource("startup", 20, 10), "startup");
    assert.equal(nativeOpenDocumentWorkflow.getNativeOpenDocumentSource("event", 5, 10), "startup");
    assert.equal(nativeOpenDocumentWorkflow.getNativeOpenDocumentSource("event", 15, 10), "event");
    assert.equal(typeof nativeOpenDocumentWorkflow.useNativeOpenDocumentWorkflow, "function");
  });

  await test("tauri desktop CSP is configured for local-only production builds", () => {
    const config = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
    const csp = config.app?.security?.csp ?? "";
    const devCsp = config.app?.security?.devCsp ?? "";

    assert.notEqual(csp, null);
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /connect-src 'self' ipc: http:\/\/ipc\.localhost/);
    assert.match(csp, /img-src 'self' data: blob:/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /frame-src 'none'/);
    assert.match(csp, /form-action 'none'/);
    assert.doesNotMatch(csp, /https?:\/\/(?!ipc\.localhost)/);
    assert.match(devCsp, /ws:\/\/127\.0\.0\.1:1420/);
  });

  await test("tauri desktop bundle associates native local document files", () => {
    const config = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
    const associations = config.bundle?.fileAssociations ?? [];
    const nativeDocument = associations.find((item) => item.name === "Structra Document");

    assert.ok(Array.isArray(associations), "bundle.fileAssociations must be an array");
    assert.ok(nativeDocument, "native Structra document association is missing");
    assert.deepEqual(new Set(nativeDocument.ext), new Set(["structra"]));
    assert.equal(nativeDocument.role, "Editor");
    assert.equal(nativeDocument.rank, "Owner");
    assert.equal(nativeDocument.mimeType, "application/vnd.structra.diagram+json");
    assert.equal(nativeDocument.exportedType?.identifier, "com.hmj.structra.document");
    assert.deepEqual(nativeDocument.exportedType?.conformsTo, ["public.json"]);
    assert.doesNotMatch(JSON.stringify(nativeDocument), /https?:\/\//);
  });

  await test("desktop window lifecycle exposes deterministic local document titles", () => {
    assert.equal(desktopWindowLifecycle.buildDocumentWindowTitle("订单流程.structra", false), "订单流程.structra - Structra");
    assert.equal(desktopWindowLifecycle.buildDocumentWindowTitle("订单流程.structra", true), "*订单流程.structra - Structra");
    assert.equal(typeof desktopWindowLifecycle.useDesktopWindowLifecycle, "function");
  });

  await test("native file bridge exposes desktop lifecycle audit hooks", () => {
    assert.equal(typeof nativeFiles.authorizeNativeFilePath, "function");
    assert.equal(typeof nativeFiles.recordDesktopLifecycleAudit, "function");
    assert.equal(typeof nativeFiles.recordDesktopOpenAudit, "function");
    assert.equal(typeof nativeFiles.recordDesktopSaveAudit, "function");
    assert.equal(typeof nativeFiles.recordDesktopExportAudit, "function");
    assert.equal(typeof nativeFiles.recordDesktopUnsavedDiscardPromptAudit, "function");
    assert.equal(typeof nativeFiles.recordDesktopUnsavedClosePromptAudit, "function");
    assert.equal(typeof nativeFiles.recordDesktopWorkspaceRecentOpenAttempt, "function");
    assert.equal(typeof nativeFiles.recordDesktopWorkspaceRecentOpenResult, "function");
  });

  await test("context menu keyboard navigation wraps through menu items", () => {
    assert.equal(overlaysComponent.getNextMenuItemIndex(4, 0, "next"), 1);
    assert.equal(overlaysComponent.getNextMenuItemIndex(4, 3, "next"), 0);
    assert.equal(overlaysComponent.getNextMenuItemIndex(4, 0, "previous"), 3);
    assert.equal(overlaysComponent.getNextMenuItemIndex(4, 2, "previous"), 1);
    assert.equal(overlaysComponent.getNextMenuItemIndex(0, 0, "next"), -1);
  });

  await test("document file workflow helpers normalize local document names", () => {
    assert.equal(documentFileWorkflow.getFileNameFromPath("/tmp/projects/order-flow.structra"), "order-flow.structra");
    assert.equal(documentFileWorkflow.ensureDocumentFileName("diagram"), "diagram.structra");
    assert.equal(documentFileWorkflow.ensureDocumentFileName("diagram.json"), "diagram.json");
    assert.equal(documentFileWorkflow.ensureDocumentFileName("diagram.structra"), "diagram.structra");
    assert.equal(documentFileWorkflow.ensureDocumentFileName('bad/name:"flow"'), "bad-name-flow-.structra");
  });

  await test("document file lifecycle patches model native save and local draft state", () => {
    const savedPatch = documentFileLifecycle.buildNativeSavedDocumentPatch("/tmp/projects/order-flow.structra", "snapshot-v1", [], "已保存到 order-flow.structra");
    const openedPatch = documentFileLifecycle.buildOpenedNativeDocumentPatch("/tmp/projects/opened-flow.structra", "snapshot-opened", savedPatch.recentDocuments);
    const browserPatch = documentFileLifecycle.buildSaveAsResultPatch(
      { saved: false, unavailable: true, reason: "native-unavailable" },
      "order-flow.structra",
      "snapshot-v2",
      savedPatch.recentDocuments
    );
    const failedPatch = documentFileLifecycle.buildActivePathSaveFailurePatch("/tmp/projects/order-flow.structra");
    const nativeExportPatch = documentFileLifecycle.buildExportResultPatch({ saved: true, path: "/tmp/projects/order-flow.svg" }, "diagram.svg", "SVG");
    const browserExportPatch = documentFileLifecycle.buildExportResultPatch({ saved: false, unavailable: true, reason: "native-unavailable" }, "diagram.svg", "SVG");
    const cancelledExportPatch = documentFileLifecycle.buildExportResultPatch({ saved: false, cancelled: true }, "diagram.svg", "SVG");
    const newPatch = documentFileLifecycle.buildNewUntitledDocumentPatch();
    const importedPatch = documentFileLifecycle.buildImportedBrowserDocumentPatch('bad/name:"flow"');
    const missingPatch = documentFileLifecycle.buildRecentMissingPatch("/tmp/projects/order-flow.structra", savedPatch.recentDocuments);
    const confirmCalls = [];

    assert.equal(savedPatch.documentPath, "/tmp/projects/order-flow.structra");
    assert.equal(savedPatch.documentName, "order-flow.structra");
    assert.equal(savedPatch.documentDirty, false);
    assert.equal(savedPatch.documentStatus, "已保存到 order-flow.structra");
    assert.equal(savedPatch.savedDocumentSnapshot, "snapshot-v1");
    assert.deepEqual(savedPatch.recentDocuments.map((item) => item.path), ["/tmp/projects/order-flow.structra"]);
    assert.equal(openedPatch.documentPath, "/tmp/projects/opened-flow.structra");
    assert.equal(openedPatch.documentName, "opened-flow.structra");
    assert.equal(openedPatch.documentStatus, "已打开 opened-flow.structra");
    assert.equal(openedPatch.documentDirty, false);
    assert.equal(openedPatch.savedDocumentSnapshot, "snapshot-opened");
    assert.deepEqual(openedPatch.recentDocuments.map((item) => item.path), ["/tmp/projects/opened-flow.structra", "/tmp/projects/order-flow.structra"]);
    assert.equal(browserPatch.shouldDownload, true);
    assert.equal(browserPatch.documentDirty, false);
    assert.equal(browserPatch.savedDocumentSnapshot, "snapshot-v2");
    assert.equal("documentPath" in browserPatch, false);
    assert.equal(failedPatch.documentDirty, true);
    assert.equal(failedPatch.importError.title, "无法写入本机文件");
    assert.equal(nativeExportPatch.documentStatus, "已导出SVG到 order-flow.svg");
    assert.equal(nativeExportPatch.importError, null);
    assert.equal("documentDirty" in nativeExportPatch, false);
    assert.equal(browserExportPatch.documentStatus, "已下载SVG副本：diagram.svg");
    assert.equal(browserExportPatch.shouldDownload, true);
    assert.equal(browserExportPatch.importError, null);
    assert.equal(cancelledExportPatch, null);
    assert.equal(newPatch.documentPath, null);
    assert.equal(newPatch.documentName, "未命名文档");
    assert.equal(newPatch.documentDirty, true);
    assert.match(newPatch.documentStatus, /尚未保存/);
    assert.equal(importedPatch.documentName, "bad-name-flow-.structra");
    assert.equal(importedPatch.documentDirty, true);
    assert.deepEqual(missingPatch.recentDocuments, []);
    assert.equal(missingPatch.importError.title, "无法打开最近文档");
    assert.equal(documentFileLifecycle.confirmDiscardUnsavedDocument(false, "导入其他文档", () => {
      confirmCalls.push("unexpected");
      return false;
    }), true);
    assert.deepEqual(confirmCalls, []);
    assert.equal(documentFileLifecycle.confirmDiscardUnsavedDocument(true, "导入其他文档", (message) => {
      confirmCalls.push(message);
      return false;
    }), false);
    assert.equal(confirmCalls[0], "当前文档有未保存更改，确定导入其他文档吗？");
    assert.equal(documentFileLifecycle.confirmDiscardUnsavedDocument(true, "打开最近文档", () => true), true);
  });

  await test("document history controller module exposes the local transaction hook", () => {
    assert.equal(typeof documentHistoryController.useDocumentHistoryController, "function");
  });

  await test("workspace actions workflow exposes local workspace entry actions", () => {
    assert.equal(typeof workspaceActionsWorkflow.useWorkspaceActionsWorkflow, "function");
  });

  await test("document file status keeps failed native lifecycle branches explicit", () => {
    const browserFallback = documentFileStatus.getSaveAsFallback({ saved: false, unavailable: true, reason: "native-unavailable" });
    const writeFailure = documentFileStatus.getSaveAsFallback({ saved: false, unavailable: true, reason: "write-failed" });
    const cancelled = documentFileStatus.getSaveAsFallback({ saved: false, cancelled: true });
    const writeIssue = documentFileStatus.buildDocumentFileIssue("writeFailed", "/tmp/locked/order.structra", "permission denied");
    const readIssue = documentFileStatus.buildDocumentFileIssue("readFailed", "/tmp/missing/order.structra");
    const recentIssue = documentFileStatus.buildDocumentFileIssue("recentMissing", "/tmp/missing/recent.structra");
    const nativeIssue = documentFileStatus.buildDocumentFileIssue("nativeUnavailable", "/tmp/native/recent.structra");

    assert.deepEqual(browserFallback, { shouldDownload: true, markClean: true, status: "已下载文档副本" });
    assert.equal(writeFailure.shouldDownload, false);
    assert.equal(writeFailure.markClean, false);
    assert.equal(writeFailure.status, "保存失败，文档仍未保存");
    assert.equal(cancelled.shouldDownload, false);
    assert.equal(writeIssue.title, "无法写入本机文件");
    assert.match(writeIssue.message, /仍保持未保存状态/);
    assert.equal(writeIssue.source, "/tmp/locked/order.structra");
    assert.equal(writeIssue.detail, "permission denied");
    assert.equal(readIssue.title, "无法读取本机文件");
    assert.match(recentIssue.message, /当前文档已保持不变/);
    assert.equal(nativeIssue.title, "需要桌面环境");
    assert.match(nativeIssue.message, /桌面应用/);
    assert.equal(nativeIssue.source, "/tmp/native/recent.structra");
  });

  await test("local document persistence workflow writes recovery cache documents", () => {
    const storage = {};
    const document = {
      pages: [{ id: "page-cache", name: "Cache", nodes: [baseNode], edges: [baseEdge], comments: [] }],
      activePageId: "page-cache",
      settings: {
        showGrid: true,
        showRulers: true,
        snapToGrid: true,
        gridSize: 48,
        gridVariant: "dots",
        pagePreset: "content",
        background: "#f8fafc"
      }
    };

    localDocumentPersistenceWorkflow.saveRecoveryCache(document, {
      setItem: (key, value) => {
        storage[key] = String(value);
      }
    });

    const cached = JSON.parse(storage[diagramDefaults.STORAGE_KEY]);
    assert.equal(cached.activePageId, "page-cache");
    assert.equal(cached.pages[0].nodes[0].id, "node-a");
    assert.equal(typeof localDocumentPersistenceWorkflow.useLocalDocumentPersistenceWorkflow, "function");
  });

  await test("page actions workflow module exposes local page commands", () => {
    assert.equal(typeof pageActionsWorkflow.usePageActionsWorkflow, "function");
  });

  await test("recent document helpers keep local desktop recents deterministic", () => {
    const previousLocalStorage = globalThis.localStorage;
    const storage = {};
    globalThis.localStorage = {
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => {
        storage[key] = String(value);
      },
      removeItem: (key) => {
        delete storage[key];
      }
    };

    try {
      const first = recentDocuments.upsertRecentDocument([], "/tmp/flow-a.structra", "2026-06-06T01:00:00.000Z");
      const second = recentDocuments.upsertRecentDocument(first, "/tmp/flow-b.structra", "2026-06-06T02:00:00.000Z");
      const moved = recentDocuments.upsertRecentDocument(second, "/tmp/flow-a.structra", "2026-06-06T03:00:00.000Z");
      const capped = Array.from({ length: recentDocuments.MAX_RECENT_DOCUMENTS + 3 }, (_, index) =>
        recentDocuments.upsertRecentDocument([], `/tmp/flow-${index}.structra`, `2026-06-06T00:${String(index).padStart(2, "0")}:00.000Z`)[0]
      );

      recentDocuments.saveRecentDocuments(capped);
      const loaded = recentDocuments.loadRecentDocuments();
      storage[recentDocuments.RECENT_DOCUMENTS_STORAGE_KEY] = "{bad-json";
      const corrupt = recentDocuments.loadRecentDocuments();
      storage[recentDocuments.RECENT_DOCUMENTS_STORAGE_KEY] = JSON.stringify([{ path: "", name: "bad", openedAt: "x" }, { path: "/tmp/ok.structra", name: "ok.structra", openedAt: "2026-06-06T00:00:00.000Z" }]);
      const repaired = recentDocuments.loadRecentDocuments();
      recentDocuments.clearRecentDocuments(globalThis.localStorage);

      assert.deepEqual(moved.map((item) => item.path), ["/tmp/flow-a.structra", "/tmp/flow-b.structra"]);
      assert.equal(moved[0].name, "flow-a.structra");
      assert.equal(moved[0].openedAt, "2026-06-06T03:00:00.000Z");
      assert.equal(recentDocuments.removeRecentDocument(moved, "/tmp/flow-a.structra").length, 1);
      assert.equal(loaded.length, recentDocuments.MAX_RECENT_DOCUMENTS);
      assert.deepEqual(corrupt, []);
      assert.deepEqual(repaired.map((item) => item.path), ["/tmp/ok.structra"]);
      assert.equal(storage[recentDocuments.RECENT_DOCUMENTS_STORAGE_KEY], undefined);
    } finally {
      if (previousLocalStorage === undefined) {
        delete globalThis.localStorage;
      } else {
        globalThis.localStorage = previousLocalStorage;
      }
    }
  });

  await test("custom template helpers clone, limit, and persist local templates", () => {
    const template = customTemplatesWorkflow.createCustomTemplate("  Local Template  ", [baseNode], [baseEdge], 77);
    const stored = {};

    template.nodes[0].data.label = "Changed";
    customTemplatesWorkflow.persistCustomTemplates({ setItem: (key, value) => (stored[key] = value) }, [template]);

    assert.equal(template.id, "custom-template-77");
    assert.equal(template.name, "Local Template");
    assert.equal(template.description, "自定义模板 · 1 节点 / 1 连线");
    assert.equal(baseNode.data.label, "Start");
    assert.equal(customTemplatesWorkflow.limitCustomTemplates(Array.from({ length: 20 }, (_, index) => ({ ...template, id: `template-${index}` }))).length, 16);
    assert.match(stored["structra-custom-templates-v1"], /custom-template-77/);
  });

  await test("template favorite helpers normalize, toggle, remove, and persist local picks", () => {
    const stored = {};
    const noisyIds = [
      " template-a ",
      "",
      "template-b",
      "template-a",
      ...Array.from({ length: 70 }, (_, index) => `template-${index}`)
    ];
    const normalized = templateFavoritesWorkflow.normalizeTemplateFavoriteIds(noisyIds);
    const toggledOn = templateFavoritesWorkflow.toggleTemplateFavoriteId(["template-a"], "template-b");
    const toggledOff = templateFavoritesWorkflow.toggleTemplateFavoriteId(toggledOn, "template-a");
    const removed = templateFavoritesWorkflow.removeTemplateFavoriteId(["template-a", "template-b"], "template-a");

    templateFavoritesWorkflow.persistTemplateFavorites({ setItem: (key, value) => (stored[key] = value) }, ["template-b", "template-a", "template-b"]);

    assert.deepEqual(normalized.slice(0, 3), ["template-a", "template-b", "template-0"]);
    assert.equal(normalized.length, 64);
    assert.deepEqual(toggledOn, ["template-b", "template-a"]);
    assert.deepEqual(toggledOff, ["template-b"]);
    assert.deepEqual(removed, ["template-b"]);
    assert.equal(stored[templateFavoritesWorkflow.TEMPLATE_FAVORITES_STORAGE_KEY], JSON.stringify(["template-b", "template-a"]));
    assert.deepEqual(templateFavoritesWorkflow.loadTemplateFavorites({ getItem: () => "{bad" }), []);
    assert.deepEqual(
      templateFavoritesWorkflow.loadTemplateFavorites({
        getItem: () => JSON.stringify([" template-c ", "template-c", "template-d"])
      }),
      ["template-c", "template-d"]
    );
  });

  await test("version history helpers create, limit, persist, and restore local snapshots", () => {
    const createdAt = "2026-06-06T08:09:00.000Z";
    const version = versionHistory.createVersionSnapshot({ pages: document.pages, activePageId: "missing", settings: { gridSize: 99 } }, createdAt, 42);
    const restored = versionHistory.getRestoredVersionSnapshot(version);
    const stored = {};

    versionHistory.persistVersions({ setItem: (key, value) => (stored[key] = value) }, [version]);

    assert.equal(version.id, "version-42");
    assert.match(version.name, /^版本 /);
    assert.equal(restored.activePageId, "page-main");
    assert.equal(restored.settings.gridSize, 48);
    assert.equal(restored.page.comments[0].replies.length, 0);
    assert.equal(versionHistory.limitVersionHistory(Array.from({ length: 25 }, (_, index) => ({ ...version, id: `version-${index}` }))).length, 20);
    assert.match(stored["structra-version-history-v1"], /version-42/);
    assert.equal(versionHistory.formatVersionTime("not-a-date"), "未知时间");
  });

  await test("document restore workflow prepares a document baseline history entry", () => {
    const restored = versionHistory.getRestoredVersionSnapshot({
      id: "version-restore",
      name: "restore",
      createdAt: "2026-06-06T00:00:00.000Z",
      pages: [
        {
          id: "page-restore",
          name: "Restore",
          nodes: [baseNode],
          edges: [baseEdge],
          comments: [{ id: "comment-restore", target: "canvas", x: 0, y: 0, text: "restore", createdAt: "2026-06-06T00:00:00.000Z" }]
        }
      ],
      activePageId: "page-restore",
      settings: { gridSize: 99, background: "bad" }
    });
    const prepared = documentRestoreWorkflow.prepareRestoredDocumentSnapshot(restored);

    assert.equal(prepared.entry.document.activePageId, "page-restore");
    assert.equal(prepared.entry.document.pages[0].nodes[0].id, "node-a");
    assert.equal(prepared.entry.document.pages[0].edges[0].id, "edge-a-b");
    assert.equal(prepared.entry.document.pages[0].comments[0].replies.length, 0);
    assert.equal(prepared.entry.selection, null);
    assert.equal(prepared.entry.document.settings.gridSize, 48);
    assert.equal(prepared.entry.document.settings.background, "#f8fafc");
  });

  await test("page navigation workflow prepares synced pages and search selection", () => {
    const stalePage = { id: "page-main", name: "Main", nodes: [], edges: [], comments: [] };
    const targetPage = {
      id: "page-target",
      name: "Target",
      nodes: [
        { ...baseNode, id: "node-target-a", data: { ...baseNode.data, groupId: "group-target" } },
        { ...targetNode, id: "node-target-b", data: { ...targetNode.data, groupId: "group-target" } }
      ],
      edges: [{ ...baseEdge, id: "edge-target", source: "node-target-a", target: "node-target-b", selected: true }],
      comments: [{ id: "comment-target", target: "canvas", x: 5, y: 6, text: "target", createdAt: "2026-06-06T00:00:00.000Z" }]
    };
    const navigationState = {
      pages: [stalePage, targetPage],
      activePageId: "page-main",
      nodes: [baseNode],
      edges: [baseEdge],
      comments: document.pages[0].comments
    };
    const opened = pageNavigationWorkflow.preparePageOpenNavigation(navigationState, "page-target");
    const searched = pageNavigationWorkflow.prepareDocumentSearchNavigation(navigationState, "page-target", "node-target-a");
    const cleared = pageNavigationWorkflow.prepareDocumentSearchNavigation(navigationState, "page-target");

    assert.equal(pageNavigationWorkflow.preparePageOpenNavigation(navigationState, "page-main"), null);
    assert.equal(pageNavigationWorkflow.preparePageOpenNavigation(navigationState, "missing"), null);
    assert.deepEqual(opened.pages[0].nodes.map((node) => node.id), ["node-a"]);
    assert.deepEqual(opened.nodes.map((node) => node.id), ["node-target-a", "node-target-b"]);
    assert.equal(opened.comments[0].replies.length, 0);
    assert.equal(opened.selection, null);
    assert.deepEqual(searched.nodes.filter((node) => node.selected).map((node) => node.id), ["node-target-a", "node-target-b"]);
    assert.deepEqual([...searched.selectedNodeIds].sort(), ["node-target-a", "node-target-b"]);
    assert.equal(searched.edges[0].selected, false);
    assert.deepEqual(searched.selection, { type: "node", id: "node-target-a" });
    assert.equal(cleared.selection, null);
    assert.equal(cleared.nodes.some((node) => node.selected), false);
  });

  await test("comment operations keep review state pure and deterministic", () => {
    const anchor = { target: "node", targetId: "node-a", x: 12, y: 24 };
    const added = commentOperations.addComment([], "  check this  ", anchor, "comment-new", "2026-06-06T00:00:00.000Z");
    assert.equal(added.comment.text, "check this");
    assert.equal(added.activeCommentId, "comment-new");
    assert.equal(added.commentDraft, "");

    const resolved = commentOperations.setCommentResolved(added.comments, "comment-new", true);
    assert.equal(resolved[0].resolved, true);

    const replied = commentOperations.addCommentReply(resolved, { "comment-new": "  ok  " }, "comment-new", "reply-new", "2026-06-06T00:01:00.000Z");
    assert.equal(replied.comments[0].replies[0].text, "ok");
    assert.equal(replied.commentReplyDrafts["comment-new"], "");
    assert.equal(commentOperations.addCommentReply(replied.comments, { "comment-new": " " }, "comment-new", "reply-empty", "2026-06-06T00:02:00.000Z"), null);

    const deleted = commentOperations.deleteComment(replied.comments, { "comment-new": "draft" }, "comment-new", "comment-new");
    assert.deepEqual(deleted.comments, []);
    assert.deepEqual(deleted.commentReplyDrafts, {});
    assert.equal(deleted.activeCommentId, null);
  });

  await test("comment workflow module exposes the local review hook", () => {
    assert.equal(typeof commentWorkflow.useCommentWorkflow, "function");
  });

  await test("shape defaults clone mutable semantic arrays", () => {
    const first = diagramDefaults.getShapeDataDefaults("erEntity");
    const second = diagramDefaults.getShapeDataDefaults("erEntity");
    first.erFields[0].name = "changed";

    assert.equal(second.erFields[0].name, "id");
  });

  await test("shape defaults expose editable BPMN, mind map, and org semantics", () => {
    assert.equal(diagramDefaults.getShapeDataDefaults("bpmnStartEvent").bpmnEventType, "none");
    assert.equal(diagramDefaults.getShapeDataDefaults("bpmnTask").bpmnTaskType, "task");
    assert.equal(diagramDefaults.getShapeDataDefaults("bpmnGateway").bpmnGatewayType, "exclusive");
    assert.equal(diagramDefaults.getShapeDataDefaults("mindBranch").mindSide, "auto");
    assert.equal(diagramDefaults.getShapeDataDefaults("orgUnit").orgRole, "部门");

    assert.equal(nodeSemantics.getBpmnEventType({ bpmnEventType: "timer" }), "timer");
    assert.equal(nodeSemantics.getBpmnEventType({ bpmnEventType: "bad" }), "none");
    assert.equal(nodeSemantics.getBpmnTaskType({ bpmnTaskType: "service" }), "service");
    assert.equal(nodeSemantics.getBpmnGatewayType({ bpmnGatewayType: "parallel" }), "parallel");
    assert.equal(nodeSemantics.getMindPriority({ mindPriority: 9 }), 5);
    assert.equal(nodeSemantics.getMindProgress({ mindProgress: 125 }), 100);
    assert.equal(nodeSemantics.getMindSide({ mindSide: "left" }), "left");
    assert.equal(nodeSemantics.getMindSide({ mindSide: "unknown" }), "auto");
    assert.equal(nodeSemantics.getOrgRole({ orgRole: "  负责人  " }), "负责人");
    assert.equal(nodeSemantics.BPMN_TASK_LABELS.service, "服务");
  });

  await test("shape defaults expose dedicated local mind map and org chart families", () => {
    const categoryIds = diagramDefaults.shapeCategories.map((category) => category.id);
    const mindTemplate = diagramDefaults.diagramTemplates.find((template) => template.id === "mind-map");
    const orgTemplate = diagramDefaults.diagramTemplates.find((template) => template.id === "org-chart");
    const templateCountsByFamily = diagramDefaults.diagramTemplates.reduce((counts, template) => {
      const families = new Set(template.nodes.map((node) => diagramDefaults.shapeCategoryMap[node.data.shape]));
      for (const family of families) {
        counts[family] = (counts[family] ?? 0) + 1;
      }
      return counts;
    }, {});
    const mindInsertion = shapeCreation.createShapeInsertion({
      kind: "mindTopic",
      nodes: [],
      edges: [],
      center: { x: 0, y: 0 },
      placement: "centered",
      id: "mind-new"
    });

    assert.equal(categoryIds.includes("mind"), true);
    assert.equal(categoryIds.includes("org"), true);
    assert.equal(diagramDefaults.shapeCategoryMap.mindTopic, "mind");
    assert.equal(diagramDefaults.shapeCategoryMap.orgPerson, "org");
    assert.equal(mindInsertion.node.data.shape, "mindTopic");
    assert.equal(mindTemplate.nodes.some((node) => node.data.shape === "mindTopic"), true);
    assert.equal(mindTemplate.nodes.every((node) => node.data.shape === "mindTopic" || node.data.shape === "mindBranch"), true);
    assert.equal(orgTemplate.nodes.some((node) => node.data.shape === "orgPerson"), true);
    assert.equal(orgTemplate.nodes.some((node) => node.data.shape === "orgUnit"), true);
    assert.ok(templateCountsByFamily.flow >= 3);
    assert.ok(templateCountsByFamily.bpmn >= 3);
    assert.ok(templateCountsByFamily.uml >= 3);
    assert.ok(templateCountsByFamily.er >= 3);
    assert.ok(templateCountsByFamily.mind >= 3);
    assert.ok(templateCountsByFamily.org >= 3);
  });

  await test("shape creation inserts selected nodes with deterministic placement", () => {
    const selectedNode = { ...baseNode, selected: true };
    const selectedEdge = { ...baseEdge, selected: true };
    const centered = shapeCreation.createShapeInsertion({
      kind: "decision",
      nodes: [selectedNode],
      edges: [selectedEdge],
      center: { x: 300, y: 200 },
      placement: "centered",
      id: "node-new"
    });
    const available = shapeCreation.createShapeInsertion({
      kind: "process",
      nodes: [baseNode],
      edges: [baseEdge],
      center: baseNode.position,
      placement: "available",
      id: "node-available"
    });

    assert.deepEqual(centered.selection, { type: "node", id: "node-new" });
    assert.equal(centered.nodes[0].selected, false);
    assert.equal(centered.edges[0].selected, false);
    assert.equal(centered.node.data.shape, "decision");
    assert.deepEqual(centered.node.position, { x: 245, y: 145 });
    assert.deepEqual(available.node.position, { x: -68, y: 148 });
    assert.equal(available.node.data.label, "流程/任务");
  });

  await test("shape insertion workflow module exposes the document command hook", () => {
    assert.equal(typeof shapeInsertionWorkflow.useShapeInsertionWorkflow, "function");
  });

  await test("canvas settings workflow module exposes the local settings hook", () => {
    assert.equal(typeof canvasSettingsWorkflow.useCanvasSettingsWorkflow, "function");
  });

  await test("element editing workflow module exposes the editor command hook", () => {
    assert.equal(typeof elementEditingWorkflow.useElementEditingWorkflow, "function");
  });

  await test("focus selection workflow module exposes the non-history focus hook", () => {
    assert.equal(typeof focusSelectionWorkflow.useFocusSelectionWorkflow, "function");
  });

  await test("inline label editing workflow module exposes the canvas label hook", () => {
    assert.equal(typeof inlineLabelEditingWorkflow.useInlineLabelEditingWorkflow, "function");
  });

  await test("clipboard workflow module exposes the local edit command hook", () => {
    assert.equal(typeof clipboardWorkflow.useClipboardWorkflow, "function");
  });

  await test("command items workflow module exposes the command registry hook", () => {
    assert.equal(typeof commandItemsWorkflow.useCommandItemsWorkflow, "function");
  });

  await test("command palette workflow module exposes the palette state hook", () => {
    assert.equal(typeof commandPaletteWorkflow.useCommandPaletteWorkflow, "function");
  });

  await test("command palette navigation skips disabled commands and wraps", () => {
    const items = [
      { id: "disabled-first", group: "测试", label: "Disabled", run: () => {}, disabled: true },
      { id: "enabled-a", group: "测试", label: "Enabled A", run: () => {} },
      { id: "disabled-middle", group: "测试", label: "Disabled Middle", run: () => {}, disabled: true },
      { id: "enabled-b", group: "测试", label: "Enabled B", run: () => {} }
    ];
    const allDisabled = items.map((item) => ({ ...item, disabled: true }));

    assert.equal(commandPaletteComponent.getInitialCommandIndex(items), 1);
    assert.equal(commandPaletteComponent.getInitialCommandIndex(allDisabled), -1);
    assert.equal(commandPaletteComponent.getNextCommandIndex(items, 1, "next"), 3);
    assert.equal(commandPaletteComponent.getNextCommandIndex(items, 3, "next"), 1);
    assert.equal(commandPaletteComponent.getNextCommandIndex(items, 1, "previous"), 3);
    assert.equal(commandPaletteComponent.getNextCommandIndex(items, 3, "previous"), 1);
    assert.equal(commandPaletteComponent.getNextCommandIndex(items, -1, "next"), 1);
    assert.equal(commandPaletteComponent.getNextCommandIndex(items, 2, "previous"), 3);
    assert.equal(commandPaletteComponent.getNextCommandIndex(items, 1, "first"), 1);
    assert.equal(commandPaletteComponent.getNextCommandIndex(items, 1, "last"), 3);
    assert.equal(commandPaletteComponent.getNextCommandIndex(allDisabled, -1, "next"), -1);
  });

  await test("editor keyboard workflow module exposes the desktop shortcut hook", () => {
    assert.equal(typeof editorKeyboardWorkflow.useEditorKeyboardWorkflow, "function");
  });

  await test("presentation workflow module exposes the local presentation hook", () => {
    assert.equal(typeof presentationWorkflow.usePresentationWorkflow, "function");
  });

  console.log(JSON.stringify({ ok: true, tests: results }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await server.close();
}
