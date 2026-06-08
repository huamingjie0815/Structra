async (page) => {
  const appUrl = page.url();
  const result = {
    appUrl,
    template: null,
    createdGraph: null,
    undoRedo: null,
    json: null,
    svg: null,
    recovery: null,
    import: null,
    documentImport: null,
    structraDocumentImport: null,
    corruptImport: null,
    ioRoundtrip: null,
    pageUndoRedo: null,
    documentInspector: null,
    productCommands: null,
    authoringLoop: null,
    workspaceRecent: null,
    templateFavorites: null,
    contextMenuKeyboard: null,
    keyboardConnector: null,
    interactionPrecision: null
  };

  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };

  const waitForBodyText = async (text) => {
    await page.waitForFunction((expected) => document.body.textContent.includes(expected), text);
  };

  const getRouteState = async () =>
    page.evaluate(() => {
      const searchParams = new URL(window.location.href).searchParams;
      return {
        hasId: searchParams.has("id"),
        workspace: searchParams.get("workspace")
      };
    });

  const getStatusText = async () => page.locator(".status-pill").innerText();

  await page.evaluate(() => {
    localStorage.removeItem("structra-diagram-v1");
    localStorage.removeItem("structra-version-history-v1");
    localStorage.removeItem("structra-custom-templates-v1");
    localStorage.removeItem("structra-template-favorites-v1");
    localStorage.removeItem("structra-recent-documents-v1");
    localStorage.removeItem("structra.editor-session-id.v1");
  });
  await page.reload({ waitUntil: "networkidle" });

  await waitForBodyText("Structra");
  await waitForBodyText("未命名文档");
  await waitForBodyText("本地工作台");
  await waitForBodyText("未命名草稿");
  await waitForBodyText("本地空白");
  await waitForBodyText("模板中心");
  assert(await page.locator(".workspace-shell").count() === 1, "Workspace did not render as a standalone shell");
  assert(await page.locator(".topbar").count() === 0, "Workspace should not show the editor topbar");
  assert(await page.locator('[role="toolbar"][aria-label="常用命令"]').count() === 0, "Workspace should not show editor command toolbar");
  assert(await page.locator(".canvas-region").count() === 0, "Workspace should not render the editor canvas behind it");
  await page.getByRole("button", { name: "收藏模板 审批流程", exact: true }).click();
  await page.getByRole("tab", { name: "收藏", exact: true }).click();
  await page.locator(".workspace-template-card").filter({ hasText: "审批流程" }).first().waitFor();
  const favoriteStorageAfterWorkspaceClick = await page.evaluate(() => JSON.parse(localStorage.getItem("structra-template-favorites-v1") ?? "[]"));
  assert(favoriteStorageAfterWorkspaceClick.length === 1, "Workspace favorite action did not persist one favorite template");
  await page.reload({ waitUntil: "networkidle" });
  await waitForBodyText("本地工作台");
  await page.getByRole("button", { name: "取消收藏模板 审批流程", exact: true }).waitFor();
  const favoriteStorageAfterReload = await page.evaluate(() => JSON.parse(localStorage.getItem("structra-template-favorites-v1") ?? "[]"));
  assert(
    favoriteStorageAfterReload.length === 1 && favoriteStorageAfterReload[0] === favoriteStorageAfterWorkspaceClick[0],
    "Template favorite did not survive workspace reload"
  );
  result.templateFavorites = {
    workspacePersisted: favoriteStorageAfterWorkspaceClick.length === 1,
    reloadPreserved: favoriteStorageAfterReload.length === 1
  };
  await page.evaluate(() => {
    localStorage.setItem(
      "structra-recent-documents-v1",
      JSON.stringify([
        { path: "/tmp/structra/recent-a.structra", name: "recent-a.structra", openedAt: "2026-06-07T01:00:00.000Z" },
        { path: "/tmp/structra/recent-b.json", name: "recent-b.json", openedAt: "2026-06-07T02:00:00.000Z" }
      ])
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  await waitForBodyText("本地工作台");
  await waitForBodyText("recent-a.structra");
  await waitForBodyText("recent-b.json");
  await waitForBodyText("原生");
  await waitForBodyText("兼容");
  await page.locator('.workspace-recent-open[title="/tmp/structra/recent-a.structra"]').click();
  await waitForBodyText("需要桌面环境");
  await waitForBodyText("最近文档需要在 Structra 桌面应用中读取本机路径");
  await page.waitForFunction(() => Boolean(document.querySelector(".local-workspace")));
  const workspaceRouteAfterFailedRecent = await getRouteState();
  assert(!workspaceRouteAfterFailedRecent.hasId, `Failed workspace recent-open should not enter editor mode: ${page.url()}`);
  const recentStorageAfterBrowserOpen = await page.evaluate(() => JSON.parse(localStorage.getItem("structra-recent-documents-v1") ?? "[]"));
  assert(recentStorageAfterBrowserOpen.length === 2, "Browser preview recent-open removed native recent documents");
  assert(
    recentStorageAfterBrowserOpen.some((item) => item.path === "/tmp/structra/recent-a.structra"),
    "Browser preview recent-open lost the clicked native recent document"
  );
  await page.getByLabel("关闭导入错误").click();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await waitForBodyText("暂无最近文档");
  const recentStorageAfterClear = await page.evaluate(() => localStorage.getItem("structra-recent-documents-v1"));
  assert(recentStorageAfterClear === null, "Workspace clear recent did not remove local recent-document state");
  result.workspaceRecent = {
    browserOpenPreserved: recentStorageAfterBrowserOpen.length === 2,
    failedOpenStayedInWorkspace: !workspaceRouteAfterFailedRecent.hasId,
    cleared: recentStorageAfterClear === null
  };
  await page.getByRole("button", { name: "继续编辑" }).click();
  await page.waitForFunction(() => !document.querySelector(".local-workspace"));
  await waitForBodyText("图形库");
  await waitForBodyText("快捷模板");
  await page.getByRole("tab", { name: "系统模板", exact: true }).click();
  await page.getByRole("button", { name: "取消收藏模板 审批流程", exact: true }).click();
  const favoriteStorageAfterSidebarRemove = await page.evaluate(() => JSON.parse(localStorage.getItem("structra-template-favorites-v1") ?? "[]"));
  assert(favoriteStorageAfterSidebarRemove.length === 0, "Sidebar favorite action did not remove the favorite template");
  await page.getByRole("button", { name: "收藏模板 审批流程", exact: true }).click();
  const favoriteStorageAfterSidebarAdd = await page.evaluate(() => JSON.parse(localStorage.getItem("structra-template-favorites-v1") ?? "[]"));
  assert(favoriteStorageAfterSidebarAdd.length === 1, "Sidebar favorite action did not re-add the favorite template");
  result.templateFavorites.sidebarToggle = favoriteStorageAfterSidebarRemove.length === 0 && favoriteStorageAfterSidebarAdd.length === 1;
  await waitForBodyText("页面尺寸");
  await waitForBodyText("当前页对象");
  await waitForBodyText("格式支持");
  await waitForBodyText("Visio/VSDX");
  await waitForBodyText("暂不支持");
  assert(await page.locator(".topbar").count() === 1, "Editor should show the editor topbar after leaving workspace");
  assert(await page.locator('[role="toolbar"][aria-label="常用命令"]').count() === 1, "Editor command toolbar did not render after leaving workspace");
  assert(await page.locator(".canvas-region").count() === 1, "Editor canvas did not render after leaving workspace");
  const editorRouteAfterClose = await getRouteState();
  assert(editorRouteAfterClose.hasId, `Entering the editor did not write a local editor id: ${page.url()}`);
  assert(editorRouteAfterClose.workspace === null, `Editor URL retained workspace mode: ${page.url()}`);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector(".local-workspace"));
  await page.getByRole("button", { name: "返回本地工作台", exact: true }).click();
  await waitForBodyText("本地工作台");
  assert(await page.locator(".topbar").count() === 0, "Returned workspace should hide the editor topbar");
  assert(await page.locator('[role="toolbar"][aria-label="常用命令"]').count() === 0, "Returned workspace should hide the editor command toolbar");
  assert(await page.locator(".canvas-region").count() === 0, "Returned workspace should not render the editor canvas behind it");
  const workspaceRouteAfterToolbar = await getRouteState();
  assert(workspaceRouteAfterToolbar.workspace === "1", `Workspace return button did not write workspace URL state: ${page.url()}`);
  assert(!workspaceRouteAfterToolbar.hasId, `Workspace URL retained editor id: ${page.url()}`);
  await page.getByRole("button", { name: /空白文档/ }).click();
  await page.waitForFunction(() => !document.querySelector(".local-workspace"));
  const editorRouteAfterBlank = await getRouteState();
  assert(editorRouteAfterBlank.hasId, `Blank workspace entry did not return to editor URL state: ${page.url()}`);
  page.once("dialog", (dialog) => void dialog.accept());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector(".local-workspace"));
  await page.getByRole("button", { name: "返回本地工作台", exact: true }).click();
  await waitForBodyText("本地工作台");
  await page.locator(".workspace-template-card").filter({ hasText: "审批流程" }).first().click();
  await page.waitForFunction(() => !document.querySelector(".local-workspace"));
  const editorRouteAfterTemplate = await getRouteState();
  assert(editorRouteAfterTemplate.hasId, `Template workspace entry did not return to editor URL state: ${page.url()}`);
  result.workspaceRecent.editorRoutePreserved = editorRouteAfterClose.hasId && editorRouteAfterBlank.hasId;
  result.workspaceRecent.workspaceRoutePreserved = workspaceRouteAfterToolbar.workspace === "1";
  await page.locator(".react-flow").waitFor();

  const propertyPanel = page.locator(".property-panel");
  const documentPageSize = propertyPanel.getByLabel("页面尺寸");
  const documentBackground = propertyPanel.getByLabel("画布背景");
  const documentGridSize = propertyPanel.getByLabel("网格步长");
  const documentShowGrid = propertyPanel.getByLabel("显示网格");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__background").length > 0);
  await documentPageSize.selectOption("wide");
  await documentBackground.fill("#dbeafe");
  await documentGridSize.fill("24");
  await documentShowGrid.uncheck();
  await page.waitForFunction(() => document.querySelector(".canvas-region")?.style.getPropertyValue("--canvas-background").trim() === "#dbeafe");
  await page.waitForFunction(() => document.querySelector(".canvas-settings select[aria-label='页面尺寸']")?.value === "wide");
  await page.waitForFunction(() => document.querySelector(".canvas-settings input[aria-label='网格步长']")?.value === "24");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__background").length === 0);
  result.documentInspector = await page.evaluate(() => ({
    pagePreset: document.querySelector(".property-panel label.field select")?.value,
    background: document.querySelector(".canvas-region")?.style.getPropertyValue("--canvas-background").trim(),
    gridSize: document.querySelector(".canvas-settings input[aria-label='网格步长']")?.value,
    showGrid: Boolean(document.querySelector(".react-flow__background"))
  }));
  assert(result.documentInspector.pagePreset === "wide", `Document inspector page size did not update: ${result.documentInspector.pagePreset}`);
  assert(result.documentInspector.background === "#dbeafe", `Document inspector background did not update canvas: ${result.documentInspector.background}`);
  assert(result.documentInspector.gridSize === "24", `Document inspector grid size did not sync canvas controls: ${result.documentInspector.gridSize}`);
  assert(result.documentInspector.showGrid === false, "Document inspector show-grid toggle did not hide the canvas grid");

  result.ioRoundtrip = await page.evaluate(async () => {
    const [
      { serializeDiagramDocument, parseDiagramDocument },
      { loadSavedDocument, loadSavedTemplates, loadSavedVersions, normalizeCanvasSettings, normalizeComments, syncActivePage },
      { parseImportedDiagramJson },
      { buildDocumentJsonExport, getVisibleGraph },
      { buildMermaidExport, parseMermaid },
      { getExportBounds, getNodeVisualBounds },
      { getSwimlaneDividerLines, getTableCellValues, normalizeNodeRotation },
      { getEdgeEndpoints, getPolylineMidpoint, getSvgEdgePath },
      { createHistory, getHistoryState, pushHistoryEntry, redoHistory, undoHistory },
      {
        addPageCommand,
        duplicatePageCommand,
        renamePageCommand,
        deletePageCommand,
        movePageCommand,
        reorderPageCommand,
        applyTemplateCommand,
        commitNodeLabelCommand,
        commitEdgeLabelCommand,
        replaceActivePageGraphCommand,
        replaceActivePageSnapshotCommand
      },
      { buildSvg },
      { buildImagesPdfBlob }
    ] = await Promise.all([
      import("/src/io/documentFile.ts"),
      import("/src/domain/documentSession.ts"),
      import("/src/io/importers.ts"),
      import("/src/io/exporters.ts"),
      import("/src/io/mermaid.ts"),
      import("/src/editor/geometry.ts"),
      import("/src/domain/nodeSemantics.ts"),
      import("/src/editor/edgeGeometry.ts"),
      import("/src/editor/history.ts"),
      import("/src/editor/commands.ts"),
      import("/src/io/svgExport.ts"),
      import("/src/io/pdfExport.ts")
    ]);
    const node = {
      id: "node-alpha",
      type: "diagram",
      position: { x: 0, y: 0 },
      data: {
        label: "Alpha",
        shape: "process",
        fill: "#ffffff",
        stroke: "#111827",
        text: "#111827",
        fontSize: 14,
        width: 120,
        height: 60
      }
    };
    const targetNode = {
      ...node,
      id: "node-beta",
      position: { x: 240, y: 10 },
      data: { ...node.data, label: "Beta", shape: "decision", width: 120, height: 90 }
    };
    const hiddenNode = { ...node, id: "node-hidden", hidden: true, data: { ...node.data, label: "Hidden" } };
    const tableNode = {
      ...node,
      id: "node-table",
      position: { x: 0, y: 140 },
      data: {
        ...node.data,
        label: "Matrix",
        shape: "table",
        width: 180,
        height: 90,
        tableRows: 2,
        tableColumns: 2,
        tableCells: ["R1C1", "R1C2", "R2C1", "R2C2"]
      }
    };
    const swimlaneNode = {
      ...node,
      id: "node-swimlane",
      position: { x: 240, y: 140 },
      data: {
        ...node.data,
        label: "Teams",
        shape: "swimlane",
        width: 260,
        height: 130,
        laneCount: 3,
        laneLabels: ["Sales", "Ops", "Finance"]
      }
    };
    const edge = {
      id: "edge-alpha-beta",
      source: "node-alpha",
      target: "node-beta",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      label: "ok",
      data: { waypoints: [{ x: 180, y: 40 }] },
      style: { stroke: "#123456", strokeWidth: 2 }
    };
    const hiddenEdge = { id: "edge-hidden", source: "node-alpha", target: "node-hidden" };
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
          id: "page-io",
          name: "IO Roundtrip",
          nodes: [node],
          edges: [],
          comments: [{ id: "comment-io", target: "canvas", x: 1, y: 2, text: "note", createdAt: "2026-06-06T00:00:00.000Z" }]
        }
      ],
      activePageId: "missing-page",
      settings
    };
    const serialized = serializeDiagramDocument(document);
    const parsed = parseDiagramDocument(serialized);
    const restoredDocument = loadSavedDocument({ getItem: () => serialized });
    const restoredLegacy = loadSavedDocument({ getItem: () => JSON.stringify({ nodes: [node], edges: [edge], settings: { gridSize: 999, background: "bad" } }) });
    const restoredFallback = loadSavedDocument({ getItem: () => "{bad-json" });
    const restoredVersions = loadSavedVersions({
      getItem: () =>
        JSON.stringify([
          { id: "version-1", name: "v1", createdAt: "2026-06-06T00:00:00.000Z", pages: [{ id: "page-v", name: "V", nodes: [], edges: [], comments: [{ id: "c", target: "canvas", x: 0, y: 0, text: "x", createdAt: "2026-06-06T00:00:00.000Z" }] }], activePageId: "page-v" }
        ])
    });
    const restoredTemplates = loadSavedTemplates({
      getItem: () => JSON.stringify([{ id: "template-1", name: "T", description: "D", nodes: [], edges: [], comments: [{ id: "c" }] }])
    });
    const syncedPages = syncActivePage(document.pages, "page-io", [targetNode], [edge], [{ id: "c2", target: "canvas", x: 3, y: 4, text: "synced", createdAt: "2026-06-06T00:00:00.000Z" }]);
    const normalizedSettings = normalizeCanvasSettings({ gridSize: 999, background: "red", pagePreset: "wide", gridVariant: "missing" });
    const normalizedComments = normalizeComments([{ id: "c3", target: "canvas", x: 0, y: 0, text: "comment", createdAt: "2026-06-06T00:00:00.000Z" }]);
    const historyDocument = { pages: syncedPages, activePageId: "page-io", settings };
    const historyStart = createHistory({ document: restoredDocument, selection: null });
    const historyAfterPush = pushHistoryEntry(historyStart, { document: historyDocument, selection: { type: "node", id: "node-beta" } });
    const historyAfterDuplicate = pushHistoryEntry(historyAfterPush, { document: historyDocument, selection: { type: "node", id: "node-beta" } });
    const historyUndo = undoHistory(historyAfterDuplicate);
    const historyRedo = redoHistory(historyUndo.history);
    const historyAfterBranch = pushHistoryEntry(historyUndo.history, {
      document: { ...historyDocument, pages: syncedPages.map((page) => ({ ...page, name: `${page.name} branch` })) },
      selection: null
    });
    const secondPage = {
      id: "page-two",
      name: "Second",
      nodes: [targetNode],
      edges: [],
      comments: [{ id: "comment-two", target: "canvas", x: 8, y: 9, text: "two", createdAt: "2026-06-06T00:00:00.000Z" }]
    };
    const twoPageDocument = { pages: [historyDocument.pages[0], secondPage], activePageId: "page-io", settings };
    const blankPage = { id: "page-new", name: "New Page", nodes: [], edges: [], comments: [] };
    const template = { id: "template-command", name: "Command Template", description: "Command smoke template", nodes: [tableNode], edges: [], comments: [] };
    const commandAddedPage = addPageCommand(historyDocument, blankPage);
    const commandDuplicatedPage = duplicatePageCommand(historyDocument, "page-io", "page-copy");
    const commandRenamedPage = renamePageCommand(historyDocument, "page-io", "Renamed Page");
    const commandDeletedPage = deletePageCommand(twoPageDocument, "page-io");
    const commandDeleteSinglePage = deletePageCommand(historyDocument, "page-io");
    const commandMovedPage = movePageCommand(twoPageDocument, "page-two", "up");
    const commandMoveOutOfBounds = movePageCommand(twoPageDocument, "page-io", "up");
    const commandReorderedPage = reorderPageCommand(twoPageDocument, "page-io", "page-two");
    const commandReorderSamePage = reorderPageCommand(twoPageDocument, "page-io", "page-io");
    const commandAppliedTemplate = applyTemplateCommand(twoPageDocument, "page-io", template);
    const commandRenamedNodeLabel = commitNodeLabelCommand(twoPageDocument, "page-io", "node-beta", "Renamed Beta");
    const commandRenamedEdgeLabel = commitEdgeLabelCommand(twoPageDocument, "page-io", "edge-alpha-beta", "approved");
    const commandReplacedGraph = replaceActivePageGraphCommand(
      twoPageDocument,
      "page-io",
      [{ ...targetNode, position: { x: 320, y: 64 } }],
      [{ ...edge, label: "routed" }],
      { type: "node", id: "node-beta" }
    );
    const commandReplacedSnapshot = replaceActivePageSnapshotCommand(
      twoPageDocument,
      "page-io",
      {
        nodes: [{ ...targetNode, position: { x: 360, y: 84 } }],
        edges: [{ ...edge, label: "snapshot" }],
        comments: [{ id: "comment-snapshot", target: "canvas", x: 12, y: 14, text: "snapshot", createdAt: "2026-06-07T00:00:00.000Z" }]
      },
      null
    );
    const commandHistoryStart = createHistory({ document: historyDocument, selection: null });
    const commandHistoryAfterAdd = pushHistoryEntry(commandHistoryStart, commandAddedPage);
    const commandHistoryUndo = undoHistory(commandHistoryAfterAdd);
    const commandHistoryRedo = redoHistory(commandHistoryUndo.history);
    const importedDocument = parseImportedDiagramJson(serialized);
    const importedLegacy = parseImportedDiagramJson(JSON.stringify({ nodes: [node], edges: [] }));
    const exportedJson = buildDocumentJsonExport({ ...parsed, nodes: [node], edges: [], comments: [], settings });
    const visibleGraph = getVisibleGraph([node, hiddenNode], [hiddenEdge]);
    const mermaid = buildMermaidExport([node, targetNode, hiddenNode], [edge, hiddenEdge]);
    const parsedMermaid = parseMermaid('flowchart LR\n  A["Start"] -->|ok| B{"Done?"}');
    const rotatedBounds = getNodeVisualBounds({ ...node, id: "node-rotated", data: { ...node.data, rotation: 45 } });
    const exportBounds = getExportBounds([node], "a4Portrait");
    const tableCells = getTableCellValues({ ...tableNode.data, tableColumns: 3 }, 2, 3);
    const swimlaneDividers = getSwimlaneDividerLines(0, 0, 300, 180, swimlaneNode.data);
    const endpoints = getEdgeEndpoints(edge, [node, targetNode]);
    const edgePath = endpoints ? getSvgEdgePath(edge, endpoints) : "";
    const midpoint = getPolylineMidpoint([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]);
    const svg = buildSvg([node, targetNode, tableNode, swimlaneNode, hiddenNode], [edge, hiddenEdge], "#ffffff", "content");
    const pdfBlob = buildImagesPdfBlob([{ imageBytes: new Uint8Array([255, 216, 255, 217]), pageWidth: 120, pageHeight: 80, imageWidth: 2, imageHeight: 2 }]);
    return {
      hasSchema: serialized.includes('"schema": "structra.diagram-document"'),
      activePageFallback: parsed.activePageId === "page-io",
      normalizedReplies: Array.isArray(parsed.pages[0].comments[0].replies),
      documentSession:
        restoredDocument.activePageId === "page-io" &&
        restoredLegacy.pages[0].nodes.length === 1 &&
        restoredLegacy.settings.gridSize === 48 &&
        restoredFallback.pages.length > 0 &&
        Array.isArray(restoredVersions[0].pages[0].comments[0].replies) &&
        restoredTemplates[0].custom === true &&
        syncedPages[0].nodes[0].id === "node-beta" &&
        normalizedSettings.background === "#f8fafc" &&
        normalizedSettings.pagePreset === "wide" &&
        Array.isArray(normalizedComments[0].replies),
      history:
        getHistoryState(historyStart).canUndo === false &&
        getHistoryState(historyAfterPush).canUndo === true &&
        historyAfterDuplicate.entries.length === 2 &&
        historyUndo.entry?.document.activePageId === "page-io" &&
        historyRedo.entry?.selection?.id === "node-beta" &&
        getHistoryState(historyAfterBranch).canRedo === false &&
        historyAfterBranch.entries.length === 2,
      commandHelpers:
        commandAddedPage.document.pages.length === 2 &&
        commandAddedPage.document.activePageId === "page-new" &&
        commandAddedPage.selection === null &&
        commandDuplicatedPage.document.pages.length === 2 &&
        commandDuplicatedPage.document.activePageId === "page-copy" &&
        commandDuplicatedPage.document.pages[1].nodes.length === historyDocument.pages[0].nodes.length &&
        commandRenamedPage.document.pages[0].name === "Renamed Page" &&
        commandDeletedPage?.document.pages.length === 1 &&
        commandDeletedPage?.document.activePageId === "page-two" &&
        commandDeleteSinglePage === null &&
        commandMovedPage?.document.pages[0].id === "page-two" &&
        commandMovedPage?.document.activePageId === "page-io" &&
        commandMoveOutOfBounds === null &&
        commandReorderedPage?.document.pages[0].id === "page-two" &&
        commandReorderedPage?.document.pages[1].id === "page-io" &&
        commandReorderSamePage === null &&
        commandAppliedTemplate?.document.pages[0].name === "Command Template" &&
        commandAppliedTemplate?.document.pages[0].nodes[0].id === "node-table" &&
        commandAppliedTemplate?.document.pages[1].id === "page-two" &&
        commandAppliedTemplate?.selection === null &&
        commandRenamedNodeLabel?.document.pages[0].nodes[0].data.label === "Renamed Beta" &&
        commandRenamedNodeLabel?.document.pages[1].nodes[0].data.label === "Beta" &&
        commandRenamedNodeLabel?.selection?.id === "node-beta" &&
        commandRenamedEdgeLabel?.document.pages[0].edges[0].label === "approved" &&
        commandRenamedEdgeLabel?.document.pages[1].edges.length === 0 &&
        commandRenamedEdgeLabel?.selection?.id === "edge-alpha-beta" &&
        commandReplacedGraph?.document.pages[0].nodes[0].position.x === 320 &&
        commandReplacedGraph?.document.pages[0].comments[0].id === "c2" &&
        commandReplacedGraph?.document.pages[1].id === "page-two" &&
        commandReplacedGraph?.selection?.id === "node-beta" &&
        commandReplacedSnapshot?.document.pages[0].nodes[0].position.x === 360 &&
        commandReplacedSnapshot?.document.pages[0].comments[0].id === "comment-snapshot" &&
        commandReplacedSnapshot?.document.pages[0].comments[0].replies.length === 0 &&
        commandReplacedSnapshot?.document.pages[1].comments[0].id === "comment-two" &&
        commandReplacedSnapshot?.selection === null &&
        commandHistoryUndo.entry?.document.pages.length === 1 &&
        commandHistoryRedo.entry?.document.pages.length === 2 &&
        commandHistoryRedo.entry?.document.activePageId === "page-new",
      importedDocument: importedDocument.type === "document",
      importedLegacy: importedLegacy.type === "legacySnapshot",
      exportedJson: exportedJson.includes('"pages"') && exportedJson.includes('"Alpha"'),
      visibleGraph: visibleGraph.nodes.length === 1 && visibleGraph.edges.length === 0,
      mermaidFiltersHidden: mermaid.includes("Alpha") && !mermaid.includes("Hidden"),
      mermaidImport: parsedMermaid.nodes.length === 2 && parsedMermaid.edges.length === 1 && parsedMermaid.nodes.some((item) => item.data.shape === "decision"),
      rotatedBounds: rotatedBounds.left < node.position.x && rotatedBounds.right > node.position.x + node.data.width,
      pageExportBounds: exportBounds.width >= 794 && exportBounds.height >= 1123,
      nodeSemantics: normalizeNodeRotation(400) === 180 && tableCells.length === 6 && tableCells[0] === "R1C1" && swimlaneDividers.length === 2,
      edgeGeometry: Boolean(endpoints) && edgePath.includes("M ") && midpoint.x === 100 && midpoint.y === 0,
      svgExport: svg.includes("Alpha") && svg.includes("Beta") && svg.includes("R1C1") && svg.includes("Finance") && svg.includes("<path") && !svg.includes("Hidden"),
      pdfBlob: pdfBlob.type === "application/pdf" && pdfBlob.size > 100
    };
  });
  assert(result.ioRoundtrip.hasSchema, "Serialized document file does not include schema");
  assert(result.ioRoundtrip.activePageFallback, "Document parser did not repair invalid activePageId");
  assert(result.ioRoundtrip.normalizedReplies, "Document parser did not normalize comment replies");
  assert(result.ioRoundtrip.documentSession, "Document session module did not restore, migrate, or normalize document state");
  assert(result.ioRoundtrip.history, "History module did not push, dedupe, undo, redo, or truncate redo correctly");
  assert(result.ioRoundtrip.commandHelpers, "Command helpers did not mutate pages, preserve document scope, reject no-ops, or integrate with history");
  assert(result.ioRoundtrip.importedDocument, "Importer did not classify .structra document");
  assert(result.ioRoundtrip.importedLegacy, "Importer did not classify legacy snapshot JSON");
  assert(result.ioRoundtrip.exportedJson, "Exporter did not include expected JSON content");
  assert(result.ioRoundtrip.visibleGraph, "Visible graph filtering did not hide hidden-node edges");
  assert(result.ioRoundtrip.mermaidFiltersHidden, "Mermaid export did not filter hidden nodes");
  assert(result.ioRoundtrip.mermaidImport, "Mermaid import module did not parse nodes and edges");
  assert(result.ioRoundtrip.rotatedBounds, "Geometry module did not include rotated node bounds");
  assert(result.ioRoundtrip.pageExportBounds, "Geometry module did not include page export bounds");
  assert(result.ioRoundtrip.nodeSemantics, "Node semantics module did not normalize table, swimlane, or rotation data");
  assert(result.ioRoundtrip.edgeGeometry, "Edge geometry module did not produce endpoints, path, and midpoint");
  assert(result.ioRoundtrip.svgExport, "SVG export module did not render visible graph semantics");
  assert(result.ioRoundtrip.pdfBlob, "PDF export module did not produce a PDF blob");

  const toolbar = page.getByRole("toolbar", { name: "常用命令" });
  await page.evaluate(() => {
    window.__smokeDownloads = [];
    if (!window.__smokeOriginalCreateObjectURL) {
      window.__smokeOriginalCreateObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        if (blob instanceof Blob) {
          blob.text().then((text) => {
            window.__smokeDownloads.push({ type: blob.type, text });
          });
        }
        return window.__smokeOriginalCreateObjectURL(blob);
      };
    }
    if (!window.__smokeOriginalAnchorClick) {
      window.__smokeOriginalAnchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.download && (this.download.endsWith(".json") || this.download.endsWith(".svg"))) {
          return;
        }
        return window.__smokeOriginalAnchorClick.call(this);
      };
    }
  });
  const exportDocumentJsonForLayout = async () => {
    await page.evaluate(() => {
      window.__smokeDownloads = [];
    });
    await toolbar.getByRole("button", { name: "导出文档 JSON", exact: true }).click();
    await page.waitForFunction(() => window.__smokeDownloads.some((item) => item.type.includes("json") || item.text.includes('"pages"')));
    const text = await page.evaluate(() => {
      const match = window.__smokeDownloads.find((item) => item.type.includes("json") || item.text.includes('"pages"'));
      return match ? match.text : "";
    });
    return JSON.parse(text);
  };
  const getActivePage = (document) => document.pages.find((item) => item.id === document.activePageId);
  const getActivePageNode = (document, nodeId) => {
    const page = getActivePage(document);
    return page?.nodes.find((item) => item.id === nodeId);
  };
  const getActivePageEdge = (document, edgeId) => {
    const page = getActivePage(document);
    return page?.edges.find((item) => item.id === edgeId);
  };
  const getActivePageNodeIds = (document) => {
    const page = getActivePage(document);
    return page?.nodes.map((node) => node.id) ?? [];
  };
  const getActivePageNodePosition = (document, nodeId) => {
    const node = getActivePageNode(document, nodeId);
    return node?.position;
  };
  const getActivePageNodeSize = (document, nodeId) => {
    const node = getActivePageNode(document, nodeId);
    return node?.data ? { width: node.data.width, height: node.data.height } : null;
  };
  const getActivePageEdgeWaypointCount = (document, edgeId) => {
    const edge = getActivePageEdge(document, edgeId);
    return edge?.data?.waypoints?.length ?? 0;
  };
  const getActivePageEdgeWaypoints = (document, edgeId) => {
    const edge = getActivePageEdge(document, edgeId);
    return edge?.data?.waypoints ?? [];
  };
  const assertPositionChanged = (before, after, label) => {
    assert(before && after, `${label} position missing`);
    assert(before.x !== after.x || before.y !== after.y, `${label} position did not change`);
  };
  const assertPositionRestored = (before, after, label) => {
    assert(before && after, `${label} position missing after undo`);
    assert(before.x === after.x && before.y === after.y, `${label} undo did not restore position`);
  };
  const assertSizeChanged = (before, after, label) => {
    assert(before && after, `${label} size missing`);
    assert(before.width !== after.width || before.height !== after.height, `${label} size did not change`);
  };
  const assertSizeRestored = (before, after, label) => {
    assert(before && after, `${label} size missing after undo`);
    assert(before.width === after.width && before.height === after.height, `${label} undo did not restore size`);
  };
  const assertPointChanged = (before, after, label) => {
    assert(before && after, `${label} point missing`);
    assert(before.x !== after.x || before.y !== after.y, `${label} point did not change`);
  };
  const assertPointRestored = (before, after, label) => {
    assert(before && after, `${label} point missing after undo`);
    assert(before.x === after.x && before.y === after.y, `${label} point did not restore`);
  };

  const getActivePageNodePositionForLayout = (document, nodeId) => {
    const page = document.pages.find((item) => item.id === document.activePageId);
    const node = page?.nodes.find((item) => item.id === nodeId);
    return node?.position;
  };

  await page.getByRole("tab", { name: "系统模板", exact: true }).click();
  await page.locator(".template-button").filter({ hasText: "BPMN审批" }).click();
  await waitForBodyText("主管审批");
  await page.locator('.react-flow__node[data-id="bpmn-review"]').click();
  await propertyPanel.getByLabel("BPMN任务类型").selectOption("service");
  await waitForBodyText("服务");
  const bpmnSemanticDocument = await exportDocumentJsonForLayout();
  const bpmnSemanticNode = getActivePage(bpmnSemanticDocument)?.nodes.find((node) => node.id === "bpmn-review");
  assert(bpmnSemanticNode?.data?.bpmnTaskType === "service", `BPMN task semantic field was not exported: ${bpmnSemanticNode?.data?.bpmnTaskType}`);

  await page.locator(".template-button").filter({ hasText: "思维导图" }).click();
  await waitForBodyText("产品发布计划");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 7);
  await page.locator('.react-flow__node[data-id="mind-market"]').click();
  await propertyPanel.getByLabel("优先级").fill("3");
  await propertyPanel.getByLabel("进度%").fill("70");
  await propertyPanel.getByLabel("分支侧").selectOption("left");
  await waitForBodyText("P3");
  await waitForBodyText("70%");
  const mindSemanticDocument = await exportDocumentJsonForLayout();
  const mindSemanticNode = getActivePage(mindSemanticDocument)?.nodes.find((node) => node.id === "mind-market");
  assert(
    mindSemanticNode?.data?.mindPriority === 3 && mindSemanticNode?.data?.mindProgress === 70 && mindSemanticNode?.data?.mindSide === "left",
    `Mind semantic fields were not exported: ${JSON.stringify(mindSemanticNode?.data)}`
  );
  const mindBeforeLayout = await exportDocumentJsonForLayout();
  await toolbar.getByRole("button", { name: "导图自动排版", exact: true }).click();
  const mindAfterLayout = await exportDocumentJsonForLayout();
  assertPositionChanged(getActivePageNodePositionForLayout(mindBeforeLayout, "mind-market"), getActivePageNodePositionForLayout(mindAfterLayout, "mind-market"), "Mind layout");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const mindAfterUndo = await exportDocumentJsonForLayout();
  assertPositionRestored(getActivePageNodePositionForLayout(mindBeforeLayout, "mind-market"), getActivePageNodePositionForLayout(mindAfterUndo, "mind-market"), "Mind layout");
  await page.locator('.react-flow__node[data-id="mind-market"]').click();
  await toolbar.getByRole("button", { name: "添加子级节点", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 8);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 7);
  const mindChildDocument = await exportDocumentJsonForLayout();
  const mindChildPage = getActivePage(mindChildDocument);
  const mindChildNode = mindChildPage?.nodes.find((node) => node.id.startsWith("mind-child-"));
  assert(mindChildNode?.data?.shape === "mindBranch", `Mind child command did not create a branch: ${JSON.stringify(mindChildNode)}`);
  assert(mindChildPage?.edges.some((edge) => edge.source === "mind-market" && edge.target === mindChildNode?.id), "Mind child command did not connect from selected branch");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 7);
  await page.locator('.react-flow__node[data-id="mind-market"]').click();
  await toolbar.getByRole("button", { name: "添加同级节点", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 8);
  const mindSiblingDocument = await exportDocumentJsonForLayout();
  const mindSiblingPage = getActivePage(mindSiblingDocument);
  const mindSiblingNode = mindSiblingPage?.nodes.find((node) => node.id.startsWith("mind-sibling-"));
  assert(mindSiblingNode?.data?.label === "同级分支", `Mind sibling command did not create a sibling branch: ${JSON.stringify(mindSiblingNode)}`);
  assert(mindSiblingPage?.edges.some((edge) => edge.source === "mind-center" && edge.target === mindSiblingNode?.id), "Mind sibling command did not reuse the selected branch parent");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 7);
  await page.locator('.react-flow__node[data-id="mind-market"]').click();
  await page.keyboard.press("Tab");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 8);
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 7);
  await page.locator('.react-flow__node[data-id="mind-market"]').click();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 8);
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 7);

  await page.locator(".template-button").filter({ hasText: "组织架构" }).first().click();
  await waitForBodyText("总经理");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 8);
  await page.locator('.react-flow__node[data-id="org-product"]').click();
  await propertyPanel.getByLabel("角色/职级").fill("负责人");
  await propertyPanel.getByLabel("部门/归属").fill("产品中心");
  await waitForBodyText("负责人");
  await waitForBodyText("产品中心");
  const orgSemanticDocument = await exportDocumentJsonForLayout();
  const orgSemanticNode = getActivePage(orgSemanticDocument)?.nodes.find((node) => node.id === "org-product");
  assert(
    orgSemanticNode?.data?.orgRole === "负责人" && orgSemanticNode?.data?.orgDepartment === "产品中心",
    `Org semantic fields were not exported: ${JSON.stringify(orgSemanticNode?.data)}`
  );
  const orgBeforeLayout = await exportDocumentJsonForLayout();
  await toolbar.getByRole("button", { name: "组织自动排版", exact: true }).click();
  const orgAfterLayout = await exportDocumentJsonForLayout();
  assertPositionChanged(getActivePageNodePositionForLayout(orgBeforeLayout, "org-product"), getActivePageNodePositionForLayout(orgAfterLayout, "org-product"), "Org layout");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const orgAfterUndo = await exportDocumentJsonForLayout();
  assertPositionRestored(getActivePageNodePositionForLayout(orgBeforeLayout, "org-product"), getActivePageNodePositionForLayout(orgAfterUndo, "org-product"), "Org layout");
  await page.locator('.react-flow__node[data-id="org-product"]').click();
  await toolbar.getByRole("button", { name: "添加子级节点", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 9);
  const orgChildDocument = await exportDocumentJsonForLayout();
  const orgChildPage = getActivePage(orgChildDocument);
  const orgChildNode = orgChildPage?.nodes.find((node) => node.id.startsWith("org-child-"));
  assert(orgChildNode?.data?.shape === "orgUnit", `Org child command did not create an org node: ${JSON.stringify(orgChildNode)}`);
  assert(orgChildPage?.edges.some((edge) => edge.source === "org-product" && edge.target === orgChildNode?.id), "Org child command did not connect from selected org node");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 8);

  await page.locator(".template-button").filter({ hasText: "ER订单模型" }).click();
  await waitForBodyText("Customer");
  await waitForBodyText("customer_id");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 3);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 2);
  result.template = await getStatusText();
  assert(result.template.includes("3 节点 / 2 连线"), `ER template status mismatch: ${result.template}`);
  result.diagramSemantics = {
    bpmnTaskType: bpmnSemanticNode?.data?.bpmnTaskType,
    mindPriority: mindSemanticNode?.data?.mindPriority,
    mindProgress: mindSemanticNode?.data?.mindProgress,
    orgRole: orgSemanticNode?.data?.orgRole,
    orgDepartment: orgSemanticNode?.data?.orgDepartment
  };

  const getPageNames = async () => page.locator(".page-row strong").allInnerTexts();
  const pageNamesBeforeCreate = await getPageNames();
  await page.getByRole("button", { name: "新建", exact: true }).click();
  await page.waitForFunction(() => Array.from(document.querySelectorAll(".page-row strong")).some((item) => item.textContent.trim() === "页面 2"));
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 0);
  const pageStatusAfterCreate = await getStatusText();
  assert(pageStatusAfterCreate.includes("0 节点 / 0 连线"), `New page status mismatch: ${pageStatusAfterCreate}`);
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => !Array.from(document.querySelectorAll(".page-row strong")).some((item) => item.textContent.trim() === "页面 2"));
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 3);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 2);
  const pageNamesAfterUndo = await getPageNames();
  assert(pageNamesAfterUndo.length === pageNamesBeforeCreate.length, `Page create undo did not restore page count: ${pageNamesAfterUndo.join(", ")}`);
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  await page.waitForFunction(() => Array.from(document.querySelectorAll(".page-row strong")).some((item) => item.textContent.trim() === "页面 2"));
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 0);
  result.pageUndoRedo = await getStatusText();
  assert(result.pageUndoRedo.includes("0 节点 / 0 连线"), `Page create redo did not restore empty page: ${result.pageUndoRedo}`);

  await page.locator(".shape-grid .shape-tile").filter({ hasText: /^流程$/ }).click();
  await page.locator(".shape-grid .shape-tile").filter({ hasText: /^判断$/ }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);

  await page.locator(".react-flow__node").nth(0).click();
  await page.keyboard.press("Control+K");
  await page.getByLabel("搜索命令").fill("键盘连线");
  await page.getByRole("button", { name: /从选中节点开始键盘连线/ }).click();
  await waitForBodyText("键盘连线：选择目标并按 Enter");
  await page.locator(".react-flow__node").nth(1).click();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  const keyboardConnectorDocument = await exportDocumentJsonForLayout();
  const keyboardConnectorPage = getActivePage(keyboardConnectorDocument);
  const keyboardConnectorEdge = keyboardConnectorPage?.edges[0];
  assert(keyboardConnectorEdge?.sourceHandle === "right-source", `Keyboard connector source handle mismatch: ${keyboardConnectorEdge?.sourceHandle}`);
  assert(keyboardConnectorEdge?.targetHandle === "left-target", `Keyboard connector target handle mismatch: ${keyboardConnectorEdge?.targetHandle}`);
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 0);
  result.keyboardConnector = {
    source: keyboardConnectorEdge?.source,
    target: keyboardConnectorEdge?.target,
    sourceHandle: keyboardConnectorEdge?.sourceHandle,
    targetHandle: keyboardConnectorEdge?.targetHandle
  };

  await page.getByRole("toolbar", { name: "常用命令" }).getByRole("button", { name: "连线", exact: true }).click();

  const sourceHandle = page.locator(".react-flow__node").nth(0).locator(".node-handle.source.right").first();
  const targetHandle = page.locator(".react-flow__node").nth(1).locator(".node-handle.target.left").first();
  const sourceBox = await sourceHandle.boundingBox();
  const targetBox = await targetHandle.boundingBox();
  assert(sourceBox, "Source node right handle was not visible");
  assert(targetBox, "Target node left handle was not visible");

  const sourceX = sourceBox.x + sourceBox.width / 2;
  const sourceY = sourceBox.y + sourceBox.height / 2;
  const targetX = targetBox.x + targetBox.width / 2;
  const targetY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(sourceX, sourceY);
  await page.mouse.down();
  await page.mouse.move(targetX, targetY, { steps: 12 });
  await page.mouse.up();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);

  result.createdGraph = await getStatusText();
  assert(result.createdGraph.includes("2 节点 / 1 连线"), `Created graph status mismatch: ${result.createdGraph}`);
  assert(result.createdGraph.includes("未保存"), `Document dirty status was not visible: ${result.createdGraph}`);

  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 0);
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  result.undoRedo = await getStatusText();
  assert(result.undoRedo.includes("2 节点 / 1 连线"), `Undo/redo graph status mismatch: ${result.undoRedo}`);

  const reactFlowBoxForMenu = await page.locator(".react-flow").boundingBox();
  assert(reactFlowBoxForMenu, "React Flow canvas was not measurable for context menu keyboard smoke");
  await page.mouse.click(reactFlowBoxForMenu.x + reactFlowBoxForMenu.width - 40, reactFlowBoxForMenu.y + reactFlowBoxForMenu.height - 40, { button: "right" });
  await page.getByRole("menu", { name: "画布菜单" }).waitFor();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 3);
  const contextMenuAddedDocument = await exportDocumentJsonForLayout();
  const contextMenuAddedPage = getActivePage(contextMenuAddedDocument);
  assert(
    contextMenuAddedPage?.nodes.some((node) => node.data?.shape === "decision"),
    "Context menu keyboard navigation did not add a decision node"
  );
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  result.contextMenuKeyboard = {
    addedDecision: contextMenuAddedPage?.nodes.some((node) => node.data?.shape === "decision") ?? false
  };

  await toolbar.getByRole("button", { name: "保存版本", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".version-body")?.textContent.includes("1 页") && document.querySelector(".version-body")?.textContent.includes("2 节点"));
  await page.locator(".shape-grid .shape-tile").filter({ hasText: /^文档$/ }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 3);
  const statusBeforeVersionRestore = await getStatusText();
  assert(statusBeforeVersionRestore.includes("3 节点 / 1 连线"), `Version mutation setup failed: ${statusBeforeVersionRestore}`);
  await page.locator(".version-body").first().click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  result.authoringLoop = await getStatusText();
  assert(result.authoringLoop.includes("2 节点 / 1 连线"), `Version restore did not return to saved graph: ${result.authoringLoop}`);

  await page.evaluate(() => {
    window.__smokeDownloads = [];
    if (!window.__smokeOriginalCreateObjectURL) {
      window.__smokeOriginalCreateObjectURL = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (blob) => {
        if (blob instanceof Blob) {
          blob.text().then((text) => {
            window.__smokeDownloads.push({ type: blob.type, text });
          });
        }
        return window.__smokeOriginalCreateObjectURL(blob);
      };
    }
    if (!window.__smokeOriginalAnchorClick) {
      window.__smokeOriginalAnchorClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.download && (this.download.endsWith(".json") || this.download.endsWith(".svg"))) {
          return;
        }
        return window.__smokeOriginalAnchorClick.call(this);
      };
    }
  });

  const exportDocumentJson = async () => {
    await page.evaluate(() => {
      window.__smokeDownloads = [];
    });
    await toolbar.getByRole("button", { name: "导出文档 JSON", exact: true }).click();
    await page.waitForFunction(() => window.__smokeDownloads.some((item) => item.type.includes("json") || item.text.includes('"pages"')));
    const text = await page.evaluate(() => {
      const match = window.__smokeDownloads.find((item) => item.type.includes("json") || item.text.includes('"pages"'));
      return match ? match.text : "";
    });
    assert(text.includes('"pages"'), "Exported JSON does not contain pages");
    return JSON.parse(text);
  };

  await toolbar.getByRole("button", { name: "选择", exact: true }).click();
  const dragBeforeDocument = await exportDocumentJson();
  const dragPage = dragBeforeDocument.pages.find((item) => item.id === dragBeforeDocument.activePageId);
  const dragNodeId = dragPage?.nodes[0]?.id;
  const dragBeforePosition = dragNodeId ? getActivePageNodePosition(dragBeforeDocument, dragNodeId) : null;
  assert(dragNodeId && dragBeforePosition, "Drag smoke could not find a node to move");
  const dragNode = page.locator(`.react-flow__node[data-id="${dragNodeId}"]`);
  const dragBox = await dragNode.boundingBox();
  assert(dragBox, `Drag smoke could not locate node ${dragNodeId}`);
  await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(dragBox.x + dragBox.width / 2 + 90, dragBox.y + dragBox.height / 2 + 54, { steps: 10 });
  await page.mouse.up();
  await page.waitForFunction(
    ({ nodeId, before }) => {
      const node = document.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
      const transform = node?.getAttribute("style") ?? "";
      return !transform.includes(`translate(${before.x}px, ${before.y}px)`);
    },
    { nodeId: dragNodeId, before: dragBeforePosition }
  );
  const dragAfterDocument = await exportDocumentJson();
  const dragAfterPosition = getActivePageNodePosition(dragAfterDocument, dragNodeId);
  assertPositionChanged(dragBeforePosition, dragAfterPosition, "Node drag");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const dragUndoDocument = await exportDocumentJson();
  assertPositionRestored(dragBeforePosition, getActivePageNodePosition(dragUndoDocument, dragNodeId), "Node drag");
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  const dragRedoDocument = await exportDocumentJson();
  assertPositionRestored(dragAfterPosition, getActivePageNodePosition(dragRedoDocument, dragNodeId), "Node drag redo");

  await dragNode.click();
  const quickToolbar = page.getByRole("toolbar", { name: "选区快捷操作" });
  await quickToolbar.getByRole("button", { name: "快捷编辑文本", exact: true }).waitFor();
  await quickToolbar.getByRole("button", { name: "选区快速复制", exact: true }).waitFor();
  await quickToolbar.getByRole("button", { name: "选区适应视图", exact: true }).waitFor();
  const quickToolbarBeforeDocument = await exportDocumentJson();
  const quickToolbarBeforeNodeCount = getActivePage(quickToolbarBeforeDocument)?.nodes.length ?? 0;
  await quickToolbar.getByRole("button", { name: "选区快速复制", exact: true }).click();
  await page.waitForFunction((count) => document.querySelectorAll(".react-flow__node").length === count + 1, quickToolbarBeforeNodeCount);
  const quickToolbarDuplicateDocument = await exportDocumentJson();
  const quickToolbarDuplicateNodeCount = getActivePage(quickToolbarDuplicateDocument)?.nodes.length ?? 0;
  assert(
    quickToolbarDuplicateNodeCount === quickToolbarBeforeNodeCount + 1,
    `Selection quick toolbar duplicate did not add one node: ${quickToolbarBeforeNodeCount} -> ${quickToolbarDuplicateNodeCount}`
  );
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction((count) => document.querySelectorAll(".react-flow__node").length === count, quickToolbarBeforeNodeCount);
  result.selectionQuickToolbar = {
    beforeNodeCount: quickToolbarBeforeNodeCount,
    afterDuplicateNodeCount: quickToolbarDuplicateNodeCount
  };
  await page.locator(`.react-flow__node[data-id="${dragNodeId}"]`).click();
  const resizeBeforeDocument = await exportDocumentJson();
  const resizeBeforeSize = getActivePageNodeSize(resizeBeforeDocument, dragNodeId);
  await dragNode.click();
  await dragNode.locator(".node-resize-handle").first().waitFor();
  const resizeHandle = dragNode.locator(".node-resize-handle").last();
  const resizeHandleBox = await resizeHandle.boundingBox();
  assert(resizeHandleBox, `Resize smoke could not locate resize handle for node ${dragNodeId}`);
  await page.mouse.move(resizeHandleBox.x + resizeHandleBox.width / 2, resizeHandleBox.y + resizeHandleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizeHandleBox.x + resizeHandleBox.width / 2 + 72, resizeHandleBox.y + resizeHandleBox.height / 2 + 44, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(120);
  const resizeAfterDocument = await exportDocumentJson();
  const resizeAfterSize = getActivePageNodeSize(resizeAfterDocument, dragNodeId);
  assertSizeChanged(resizeBeforeSize, resizeAfterSize, "Node resize");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const resizeUndoDocument = await exportDocumentJson();
  assertSizeRestored(resizeBeforeSize, getActivePageNodeSize(resizeUndoDocument, dragNodeId), "Node resize");
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  const resizeRedoDocument = await exportDocumentJson();
  assertSizeRestored(resizeAfterSize, getActivePageNodeSize(resizeRedoDocument, dragNodeId), "Node resize redo");

  const routeBeforeDocument = await exportDocumentJson();
  const routePage = getActivePage(routeBeforeDocument);
  const routeEdgeId = routePage?.edges[0]?.id;
  const routeBeforeWaypointCount = routeEdgeId ? getActivePageEdgeWaypointCount(routeBeforeDocument, routeEdgeId) : 0;
  assert(routeEdgeId, "Route smoke could not find an edge to adjust");
  const routeEdge = page.locator(`.react-flow__edge[data-id="${routeEdgeId}"]`);
  await routeEdge.click({ force: true });
  await page.getByRole("button", { name: "添加手动折点" }).click();
  const routeAfterDocument = await exportDocumentJson();
  const routeAfterWaypointCount = getActivePageEdgeWaypointCount(routeAfterDocument, routeEdgeId);
  assert(routeAfterWaypointCount === routeBeforeWaypointCount + 1, `Route waypoint was not added: ${routeBeforeWaypointCount} -> ${routeAfterWaypointCount}`);
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const routeUndoDocument = await exportDocumentJson();
  assert(
    getActivePageEdgeWaypointCount(routeUndoDocument, routeEdgeId) === routeBeforeWaypointCount,
    "Route waypoint undo did not restore the previous waypoint count"
  );
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  const routeRedoDocument = await exportDocumentJson();
  assert(
    getActivePageEdgeWaypointCount(routeRedoDocument, routeEdgeId) === routeAfterWaypointCount,
    "Route waypoint redo did not restore the added waypoint"
  );
  const routeWaypointBeforeDrag = getActivePageEdgeWaypoints(routeRedoDocument, routeEdgeId)[0];
  assert(routeWaypointBeforeDrag, "Route waypoint drag smoke could not find the added waypoint");
  await routeEdge.click({ force: true });
  const routeWaypointHandle = page.getByLabel("拖拽手动折点 1");
  await routeWaypointHandle.waitFor();
  const routeWaypointHandleBox = await routeWaypointHandle.boundingBox();
  assert(routeWaypointHandleBox, "Route waypoint drag smoke could not locate the waypoint handle");
  await page.mouse.move(routeWaypointHandleBox.x + routeWaypointHandleBox.width / 2, routeWaypointHandleBox.y + routeWaypointHandleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(routeWaypointHandleBox.x + routeWaypointHandleBox.width / 2 + 80, routeWaypointHandleBox.y + routeWaypointHandleBox.height / 2 - 44, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(120);
  const routeWaypointDragDocument = await exportDocumentJson();
  const routeWaypointAfterDrag = getActivePageEdgeWaypoints(routeWaypointDragDocument, routeEdgeId)[0];
  assertPointChanged(routeWaypointBeforeDrag, routeWaypointAfterDrag, "Route waypoint drag");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const routeWaypointDragUndoDocument = await exportDocumentJson();
  assertPointRestored(routeWaypointBeforeDrag, getActivePageEdgeWaypoints(routeWaypointDragUndoDocument, routeEdgeId)[0], "Route waypoint drag");
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  const routeWaypointDragRedoDocument = await exportDocumentJson();
  assertPointRestored(routeWaypointAfterDrag, getActivePageEdgeWaypoints(routeWaypointDragRedoDocument, routeEdgeId)[0], "Route waypoint drag redo");

  const reconnectBeforeDocument = await exportDocumentJson();
  const reconnectBeforeEdge = getActivePageEdge(reconnectBeforeDocument, routeEdgeId);
  const reconnectExistingNodeIds = new Set(getActivePageNodeIds(reconnectBeforeDocument));
  assert(reconnectBeforeEdge?.target, "Reconnect smoke could not find the original edge target");
  await page.locator(".shape-grid .shape-tile").filter({ hasText: /^文档$/ }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 3);
  const reconnectNodeDocument = await exportDocumentJson();
  const reconnectTargetNode = getActivePage(reconnectNodeDocument)?.nodes.find((node) => !reconnectExistingNodeIds.has(node.id));
  assert(reconnectTargetNode, "Reconnect smoke could not find the added target node");
  const reconnectTargetHandle = page.locator(`.react-flow__node[data-id="${reconnectTargetNode.id}"]`).locator(".node-handle.target.left").first();
  const reconnectTargetHandleBox = await reconnectTargetHandle.boundingBox();
  assert(reconnectTargetHandleBox, `Reconnect smoke could not locate target handle for node ${reconnectTargetNode.id}`);
  await routeEdge.click({ force: true });
  const reconnectUpdater = page.locator(`.react-flow__edge[data-id="${routeEdgeId}"] .react-flow__edgeupdater-target`).first();
  await reconnectUpdater.waitFor();
  const reconnectUpdaterBox = await reconnectUpdater.boundingBox();
  assert(reconnectUpdaterBox, `Reconnect smoke could not locate target updater for edge ${routeEdgeId}`);
  await page.mouse.move(reconnectUpdaterBox.x + reconnectUpdaterBox.width / 2, reconnectUpdaterBox.y + reconnectUpdaterBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    reconnectTargetHandleBox.x + reconnectTargetHandleBox.width / 2,
    reconnectTargetHandleBox.y + reconnectTargetHandleBox.height / 2,
    { steps: 14 }
  );
  await page.mouse.up();
  await page.waitForTimeout(180);
  const reconnectAfterDocument = await exportDocumentJson();
  const reconnectAfterEdge = getActivePageEdge(reconnectAfterDocument, routeEdgeId);
  assert(reconnectAfterEdge?.target === reconnectTargetNode.id, `Reconnect did not move target to added node: ${reconnectAfterEdge?.target}`);
  assert(reconnectAfterEdge?.targetHandle === "left-target", `Reconnect did not preserve the dropped target handle: ${reconnectAfterEdge?.targetHandle}`);
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const reconnectUndoDocument = await exportDocumentJson();
  assert(getActivePageEdge(reconnectUndoDocument, routeEdgeId)?.target === reconnectBeforeEdge.target, "Reconnect undo did not restore the original target");
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  const reconnectRedoDocument = await exportDocumentJson();
  assert(getActivePageEdge(reconnectRedoDocument, routeEdgeId)?.target === reconnectTargetNode.id, "Reconnect redo did not restore the new target");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const reconnectRestoreDocument = await exportDocumentJson();
  assert(getActivePageEdge(reconnectRestoreDocument, routeEdgeId)?.target === reconnectBeforeEdge.target, "Reconnect final restore did not return to original target");
  const reconnectSourceHandle = page.locator(`.react-flow__node[data-id="${reconnectTargetNode.id}"]`).locator(".node-handle.source.right").first();
  const reconnectSourceHandleBox = await reconnectSourceHandle.boundingBox();
  assert(reconnectSourceHandleBox, `Reconnect smoke could not locate source handle for node ${reconnectTargetNode.id}`);
  await routeEdge.click({ force: true });
  const sourceReconnectUpdater = page.locator(`.react-flow__edge[data-id="${routeEdgeId}"] .react-flow__edgeupdater-source`).first();
  await sourceReconnectUpdater.waitFor();
  const sourceReconnectUpdaterBox = await sourceReconnectUpdater.boundingBox();
  assert(sourceReconnectUpdaterBox, `Reconnect smoke could not locate source updater for edge ${routeEdgeId}`);
  await page.mouse.move(sourceReconnectUpdaterBox.x + sourceReconnectUpdaterBox.width / 2, sourceReconnectUpdaterBox.y + sourceReconnectUpdaterBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    reconnectSourceHandleBox.x + reconnectSourceHandleBox.width / 2,
    reconnectSourceHandleBox.y + reconnectSourceHandleBox.height / 2,
    { steps: 14 }
  );
  await page.mouse.up();
  await page.waitForTimeout(180);
  const sourceReconnectAfterDocument = await exportDocumentJson();
  const sourceReconnectAfterEdge = getActivePageEdge(sourceReconnectAfterDocument, routeEdgeId);
  assert(sourceReconnectAfterEdge?.source === reconnectTargetNode.id, `Source reconnect did not move source to added node: ${sourceReconnectAfterEdge?.source}`);
  assert(sourceReconnectAfterEdge?.sourceHandle === "right-source", `Source reconnect did not preserve the dropped source handle: ${sourceReconnectAfterEdge?.sourceHandle}`);
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const sourceReconnectUndoDocument = await exportDocumentJson();
  assert(getActivePageEdge(sourceReconnectUndoDocument, routeEdgeId)?.source === reconnectBeforeEdge.source, "Source reconnect undo did not restore the original source");
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  const sourceReconnectRedoDocument = await exportDocumentJson();
  assert(getActivePageEdge(sourceReconnectRedoDocument, routeEdgeId)?.source === reconnectTargetNode.id, "Source reconnect redo did not restore the new source");
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const sourceReconnectRestoreDocument = await exportDocumentJson();
  assert(getActivePageEdge(sourceReconnectRestoreDocument, routeEdgeId)?.source === reconnectBeforeEdge.source, "Source reconnect final restore did not return to original source");
  await page.locator(`.react-flow__node[data-id="${reconnectTargetNode.id}"]`).click();
  await toolbar.getByRole("button", { name: "删除", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);

  result.interactionPrecision = {
    drag: {
      nodeId: dragNodeId,
      before: dragBeforePosition,
      after: dragAfterPosition
    },
    resize: {
      nodeId: dragNodeId,
      before: resizeBeforeSize,
      after: resizeAfterSize
    },
    route: {
      edgeId: routeEdgeId,
      beforeWaypointCount: routeBeforeWaypointCount,
      afterWaypointCount: routeAfterWaypointCount,
      waypointBeforeDrag: routeWaypointBeforeDrag,
      waypointAfterDrag: routeWaypointAfterDrag
    },
    reconnect: {
      edgeId: routeEdgeId,
      beforeSource: reconnectBeforeEdge.source,
      beforeTarget: reconnectBeforeEdge.target,
      afterSource: reconnectTargetNode.id,
      afterTarget: reconnectTargetNode.id
    }
  };

  await page.keyboard.press("Control+A");
  await waitForBodyText("已选择 2 个节点");
  await toolbar.getByRole("button", { name: "导图自动排版", exact: true }).waitFor();
  await toolbar.getByRole("button", { name: "组织自动排版", exact: true }).waitFor();
  await page.keyboard.press("Control+K");
  await page.getByLabel("搜索命令").fill("自动排版");
  await page.getByRole("button", { name: /布局导图自动排版/ }).waitFor();
  await page.getByRole("button", { name: /布局组织自动排版/ }).waitFor();
  await page.getByLabel("搜索命令").fill("子级节点");
  await page.getByRole("button", { name: /布局为导图\/组织图添加子级节点/ }).waitFor();
  await page.keyboard.press("Escape");

  await page.keyboard.press("Control+A");
  await waitForBodyText("已选择 2 个节点");
  await toolbar.getByRole("button", { name: "组合", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('button[aria-label="取消组合"]')?.disabled === false);
  const groupedDocument = await exportDocumentJson();
  const groupedNodes = groupedDocument.pages.find((item) => item.id === groupedDocument.activePageId)?.nodes ?? [];
  const groupedIds = groupedNodes.map((node) => node.data?.groupId).filter(Boolean);
  assert(groupedIds.length === 2 && new Set(groupedIds).size === 1, `Group command did not assign one group id to both nodes: ${JSON.stringify(groupedIds)}`);

  const groupMoveNodeIds = groupedNodes.map((node) => node.id);
  const groupMoveBeforePositions = new Map(groupMoveNodeIds.map((nodeId) => [nodeId, getActivePageNodePosition(groupedDocument, nodeId)]));
  const groupMoveAnchorId = groupMoveNodeIds[0];
  assert(groupMoveAnchorId, "Group move smoke could not find a grouped node");
  const groupMoveAnchor = page.locator(`.react-flow__node[data-id="${groupMoveAnchorId}"]`);
  const groupMoveAnchorBox = await groupMoveAnchor.boundingBox();
  assert(groupMoveAnchorBox, `Group move smoke could not locate node ${groupMoveAnchorId}`);
  await page.mouse.move(groupMoveAnchorBox.x + groupMoveAnchorBox.width / 2, groupMoveAnchorBox.y + groupMoveAnchorBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(groupMoveAnchorBox.x + groupMoveAnchorBox.width / 2 + 64, groupMoveAnchorBox.y + groupMoveAnchorBox.height / 2 + 38, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(120);
  const groupMovedDocument = await exportDocumentJson();
  for (const nodeId of groupMoveNodeIds) {
    assertPositionChanged(groupMoveBeforePositions.get(nodeId), getActivePageNodePosition(groupMovedDocument, nodeId), `Group move ${nodeId}`);
  }
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  const groupMoveUndoDocument = await exportDocumentJson();
  for (const nodeId of groupMoveNodeIds) {
    assertPositionRestored(groupMoveBeforePositions.get(nodeId), getActivePageNodePosition(groupMoveUndoDocument, nodeId), `Group move ${nodeId}`);
  }
  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  const groupMoveRedoDocument = await exportDocumentJson();
  for (const nodeId of groupMoveNodeIds) {
    assertPositionRestored(getActivePageNodePosition(groupMovedDocument, nodeId), getActivePageNodePosition(groupMoveRedoDocument, nodeId), `Group move redo ${nodeId}`);
  }
  result.interactionPrecision.groupMove = {
    nodeIds: groupMoveNodeIds,
    before: Object.fromEntries(groupMoveBeforePositions),
    after: Object.fromEntries(groupMoveNodeIds.map((nodeId) => [nodeId, getActivePageNodePosition(groupMovedDocument, nodeId)]))
  };

  await toolbar.getByRole("button", { name: "取消组合", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('button[aria-label="取消组合"]')?.disabled === true);
  const ungroupedDocument = await exportDocumentJson();
  const ungroupedNodes = ungroupedDocument.pages.find((item) => item.id === ungroupedDocument.activePageId)?.nodes ?? [];
  assert(ungroupedNodes.every((node) => !node.data?.groupId), "Ungroup command left group ids on exported nodes");

  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('button[aria-label="取消组合"]')?.disabled === false);
  const regroupedDocument = await exportDocumentJson();
  const regroupedNodes = regroupedDocument.pages.find((item) => item.id === regroupedDocument.activePageId)?.nodes ?? [];
  assert(regroupedNodes.every((node) => Boolean(node.data?.groupId)), "Undo after ungroup did not restore group ids");

  await toolbar.getByRole("button", { name: "重做", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('button[aria-label="取消组合"]')?.disabled === true);
  const redoneUngroupDocument = await exportDocumentJson();
  const redoneUngroupNodes = redoneUngroupDocument.pages.find((item) => item.id === redoneUngroupDocument.activePageId)?.nodes ?? [];
  assert(redoneUngroupNodes.every((node) => !node.data?.groupId), "Redo after ungroup did not remove group ids again");

  await page.keyboard.press("Control+A");
  await waitForBodyText("已选择 2 个节点");
  await toolbar.getByRole("button", { name: "锁定", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".diagram-node.locked").length === 2);
  const lockedDocument = await exportDocumentJson();
  const lockedNodes = lockedDocument.pages.find((item) => item.id === lockedDocument.activePageId)?.nodes ?? [];
  assert(lockedNodes.length === 2 && lockedNodes.every((node) => node.data?.locked === true), "Lock command did not persist locked state on both nodes");

  await toolbar.getByRole("button", { name: "删除", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  const lockedDeleteDocument = await exportDocumentJson();
  const lockedDeletePage = lockedDeleteDocument.pages.find((item) => item.id === lockedDeleteDocument.activePageId);
  assert(lockedDeletePage?.nodes.length === 2 && lockedDeletePage?.edges.length === 1, "Delete removed locked nodes or their edge");

  await toolbar.getByRole("button", { name: "解锁", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".diagram-node.locked").length === 0);
  await toolbar.getByRole("button", { name: "删除", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 0);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 0);
  await toolbar.getByRole("button", { name: "撤销", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  const restoredAfterDeleteDocument = await exportDocumentJson();
  const restoredAfterDeletePage = restoredAfterDeleteDocument.pages.find((item) => item.id === restoredAfterDeleteDocument.activePageId);
  assert(
    restoredAfterDeletePage?.nodes.length === 2 && restoredAfterDeletePage.nodes.every((node) => !node.data?.locked) && restoredAfterDeletePage.edges.length === 1,
    "Undo after unlocked delete did not restore the editable graph"
  );
  result.productCommands = {
    grouped: groupedIds.length,
    ungrouped: ungroupedNodes.every((node) => !node.data?.groupId),
    lockedDeletePreserved: lockedDeletePage?.nodes.length === 2 && lockedDeletePage?.edges.length === 1,
    restoredAfterDelete: restoredAfterDeletePage?.nodes.length === 2 && restoredAfterDeletePage?.edges.length === 1
  };

  await toolbar.getByRole("button", { name: "导出文档 JSON", exact: true }).click();
  await page.waitForFunction(() => window.__smokeDownloads.some((item) => item.type.includes("json") || item.text.includes('"pages"')));
  const jsonText = await page.evaluate(() => {
    const match = window.__smokeDownloads.find((item) => item.type.includes("json") || item.text.includes('"pages"'));
    return match ? match.text : "";
  });
  assert(jsonText.includes('"pages"'), "Exported JSON does not contain pages");
  assert(jsonText.includes("流程"), "Exported JSON does not contain the process node label");
  assert(jsonText.includes("判断"), "Exported JSON does not contain the decision node label");
  const jsonDocument = JSON.parse(jsonText);
  assert(jsonDocument.settings?.pagePreset === "wide", `Exported JSON did not persist DocumentInspector page size: ${jsonDocument.settings?.pagePreset}`);
  assert(jsonDocument.settings?.background === "#dbeafe", `Exported JSON did not persist DocumentInspector background: ${jsonDocument.settings?.background}`);
  assert(jsonDocument.settings?.gridSize === 24, `Exported JSON did not persist DocumentInspector grid size: ${jsonDocument.settings?.gridSize}`);
  assert(jsonDocument.settings?.showGrid === false, `Exported JSON did not persist DocumentInspector show-grid setting: ${jsonDocument.settings?.showGrid}`);
  result.json = {
    hasPages: jsonText.includes('"pages"'),
    hasProcess: jsonText.includes("流程"),
    hasDecision: jsonText.includes("判断"),
    settings: jsonDocument.settings
  };

  await toolbar.getByRole("button", { name: "导出当前页 SVG", exact: true }).click();
  await page.waitForFunction(() => window.__smokeDownloads.some((item) => item.type.includes("svg") || item.text.includes("<svg")));

  const svgText = await page.evaluate(() => {
    const match = window.__smokeDownloads.find((item) => item.type.includes("svg") || item.text.includes("<svg"));
    return match ? match.text : "";
  });
  assert(svgText.includes("流程"), "Exported SVG does not contain the process node label");
  assert(svgText.includes("判断"), "Exported SVG does not contain the decision node label");
  assert(svgText.includes("<path"), "Exported SVG does not contain an edge path");
  result.svg = {
    hasProcess: svgText.includes("流程"),
    hasDecision: svgText.includes("判断"),
    hasPath: svgText.includes("<path")
  };

  await toolbar.getByRole("button", { name: "保存到本机缓存", exact: true }).click();
  await page.reload({ waitUntil: "networkidle" });
  await waitForBodyText("流程");
  await waitForBodyText("判断");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  result.recovery = await getStatusText();
  assert(result.recovery.includes("2 节点 / 1 连线"), `Recovered graph status mismatch: ${result.recovery}`);

  const fileChooserPromise = page.waitForEvent("filechooser");
  await toolbar.getByRole("button", { name: "导入 JSON", exact: true }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles("tests/fixtures/smoke-import-diagram.json");
  await waitForBodyText("导入开始");
  await waitForBodyText("导入结束");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  result.import = await getStatusText();
  assert(result.import.includes("2 节点 / 1 连线"), `Imported graph status mismatch: ${result.import}`);

  const documentFileChooserPromise = page.waitForEvent("filechooser");
  await toolbar.getByRole("button", { name: "导入 JSON", exact: true }).click();
  const documentFileChooser = await documentFileChooserPromise;
  await documentFileChooser.setFiles("tests/fixtures/smoke-import-document.structra");
  await waitForBodyText("版本文档开始");
  await waitForBodyText("版本文档结束");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  result.documentImport = await getStatusText();
  assert(result.documentImport.includes("2 节点 / 1 连线"), `Versioned document import status mismatch: ${result.documentImport}`);

  const structraDocumentFileChooserPromise = page.waitForEvent("filechooser");
  await toolbar.getByRole("button", { name: "导入 JSON", exact: true }).click();
  const structraDocumentFileChooser = await structraDocumentFileChooserPromise;
  await structraDocumentFileChooser.setFiles("tests/fixtures/smoke-import-document.structra");
  await waitForBodyText("Structra导入开始");
  await waitForBodyText("Structra导入结束");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  result.structraDocumentImport = await getStatusText();
  assert(result.structraDocumentImport.includes("2 节点 / 1 连线"), `Structra document import status mismatch: ${result.structraDocumentImport}`);

  const graphBeforeCorruptImport = await getStatusText();
  const corruptFileChooserPromise = page.waitForEvent("filechooser");
  await toolbar.getByRole("button", { name: "导入 JSON", exact: true }).click();
  const corruptFileChooser = await corruptFileChooserPromise;
  await corruptFileChooser.setFiles("tests/fixtures/smoke-corrupt-diagram.json");
  await waitForBodyText("无法导入文档");
  await waitForBodyText("当前文档已保持不变");
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__node").length === 2);
  await page.waitForFunction(() => document.querySelectorAll(".react-flow__edge").length === 1);
  result.corruptImport = await getStatusText();
  assert(result.corruptImport === graphBeforeCorruptImport, `Corrupt import changed graph status: ${result.corruptImport}`);

  console.log(JSON.stringify(result, null, 2));
}
