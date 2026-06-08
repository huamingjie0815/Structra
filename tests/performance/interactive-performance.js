async (page) => {
  const rootPage = page;
  const baseUrl = rootPage.url();
  const browser = rootPage.context().browser();
  if (!browser) throw new Error("Playwright browser is not available for interactive performance fixtures.");

  const wireDialogHandling = (targetPage) => {
    targetPage.on("dialog", async (dialog) => {
      if (dialog.type() === "beforeunload") {
        await dialog.accept();
        return;
      }
      await dialog.dismiss();
    });
  };
  wireDialogHandling(rootPage);

  const NODE_COUNTS = [100, 500, 1000];
  const RUNS = 2;
  const WARMUP_RUNS = 1;
  const REPORT_KEY = "structra-interactive-performance-report";
  const STORAGE_KEY = "structra-diagram-v1";
  const PREFERENCES_KEY = "structra.preferences.v1";
  const DEFAULT_CANVAS_SETTINGS = {
    showGrid: true,
    showRulers: true,
    snapToGrid: true,
    gridSize: 12,
    gridVariant: "lines",
    pagePreset: "content",
    background: "#f8fafc"
  };
  const THRESHOLDS = {
    100: { renderReadyMs: 2000, panMs: 4500, zoomMs: 1800, selectionMs: 1200, dragMoveMs: 8000, areaSelectionMs: 5000, undoMs: 1200, redoMs: 900 },
    500: { renderReadyMs: 3500, panMs: 10000, zoomMs: 4500, selectionMs: 2800, dragMoveMs: 15000, areaSelectionMs: 9500, undoMs: 3000, redoMs: 2200 },
    1000: { renderReadyMs: 6000, panMs: 22000, zoomMs: 9000, selectionMs: 5600, dragMoveMs: 26000, areaSelectionMs: 18000, undoMs: 6000, redoMs: 5000 }
  };

  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  const round = (value) => Math.round(value * 1000) / 1000;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const midpoint = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 1 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
  };
  const summarize = (samples) => ({
    medianMs: round(median(samples)),
    minMs: round(Math.min(...samples)),
    maxMs: round(Math.max(...samples))
  });

  const measure = async (operation, options = {}) => {
    const runs = options.runs ?? RUNS;
    const warmupRuns = options.warmupRuns ?? WARMUP_RUNS;
    const samples = [];
    for (let index = 0; index < warmupRuns + runs; index += 1) {
      const start = Date.now();
      await operation(index);
      const elapsed = Date.now() - start;
      if (index >= warmupRuns) samples.push(elapsed);
    }
    return summarize(samples);
  };

  const waitForStatusNodeCount = async (nodeCount) => {
    try {
      await page.waitForFunction(
        (expected) => document.querySelector(".status-pill")?.textContent?.includes(`${expected} 节点`),
        nodeCount,
        { timeout: 15000 }
      );
    } catch (error) {
      throw new Error(`status did not show ${nodeCount} nodes within 15000ms. ${error instanceof Error ? error.message : ""}`);
    }
  };

  const waitForSelectedNode = async (nodeId, label) => {
    try {
      await page.waitForFunction(
        (id) => Boolean(document.querySelector(`.react-flow__node[data-id="${id}"] .diagram-node.selected`)),
        nodeId,
        { timeout: 5000 }
      );
    } catch (error) {
      throw new Error(`${label}: node selection did not update within 5000ms. ${error instanceof Error ? error.message : ""}`);
    }
  };

  const waitForAnySelectedNode = async (label) => {
    try {
      await page.waitForFunction(() => document.querySelectorAll(".diagram-node.selected").length > 0, undefined, { timeout: 8000 });
    } catch (error) {
      throw new Error(`${label}: area selection did not select any nodes within 8000ms. ${error instanceof Error ? error.message : ""}`);
    }
  };

  const serializeDiagramDocument = (document) => `${JSON.stringify({ schema: "structra.diagram-document", version: 1, document }, null, 2)}\n`;

  const buildFixtureDocument = (nodeCount) => {
    const shapeCycle = ["process", "decision", "terminator", "document", "data", "database", "umlClass", "erEntity", "note", "table"];
    const nodes = Array.from({ length: nodeCount }, (_, index) => {
      const column = index % 25;
      const row = Math.floor(index / 25);
      const shape = shapeCycle[index % shapeCycle.length];
      const data = {
        label: `Perf ${index + 1}`,
        shape,
        fill: index % 2 === 0 ? "#f7fbff" : "#fff7ed",
        stroke: index % 2 === 0 ? "#2563eb" : "#b45309",
        text: "#1f2937",
        fontSize: 14,
        textAlign: "center",
        width: shape === "umlClass" || shape === "erEntity" ? 180 : 142,
        height: shape === "umlClass" ? 132 : shape === "erEntity" ? 118 : shape === "decision" ? 92 : 64
      };
      if (shape === "umlClass") {
        data.umlAttributes = ["+ id: string", "+ status: Status"];
        data.umlMethods = ["+ save(): void"];
      }
      if (shape === "erEntity") {
        data.erFields = [{ key: "PK", name: `id_${index}`, type: "uuid" }, { name: "name", type: "varchar" }];
      }
      return {
        id: `interactive-node-${index}`,
        type: "diagram",
        position: { x: 80 + column * 210, y: 80 + row * 150 },
        data
      };
    });
    const edges = Array.from({ length: nodeCount - 1 }, (_, index) => ({
      id: `interactive-edge-${index}`,
      source: `interactive-node-${index}`,
      target: `interactive-node-${index + 1}`,
      type: "smoothstep",
      label: "",
      data: { bendOffset: 20 },
      markerEnd: { type: "arrowclosed", width: 16, height: 16, color: "#46515f" },
      style: { stroke: "#46515f", strokeWidth: 1.8 },
      labelStyle: { fill: "#1f2937", fontSize: 12, fontWeight: 600 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 }
    }));
    return {
      activePageId: "interactive-page",
      settings: { ...DEFAULT_CANVAS_SETTINGS, showRulers: false, snapToGrid: false, pagePreset: "content" },
      pages: [{ id: "interactive-page", name: `Interactive ${nodeCount}`, nodes, edges, comments: [] }]
    };
  };

  const loadFixture = async (nodeCount) => {
    const fixturePage = await browser.newPage();
    wireDialogHandling(fixturePage);
    const document = buildFixtureDocument(nodeCount);
    const preferences = {
      canvasSettings: document.settings,
      openWorkspaceOnLaunch: false,
      autosaveRecovery: false,
      defaultExportFormat: "svg"
    };
    await fixturePage.addInitScript(
      ({ documentJson, preferencesJson, preferencesKey, storageKey }) => {
        localStorage.setItem(storageKey, documentJson);
        localStorage.setItem(preferencesKey, preferencesJson);
        localStorage.removeItem("structra-version-history-v1");
        localStorage.removeItem("structra-custom-templates-v1");
        localStorage.removeItem("structra-recent-documents-v1");
      },
      {
        documentJson: serializeDiagramDocument(document),
        preferencesJson: JSON.stringify(preferences),
        preferencesKey: PREFERENCES_KEY,
        storageKey: STORAGE_KEY
      }
    );
    const start = Date.now();
    await fixturePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    page = fixturePage;
    await page.bringToFront();
    await waitForStatusNodeCount(nodeCount);
    await page.locator(".react-flow").waitFor({ timeout: 15000 });
    await page.locator(".react-flow__node").first().waitFor({ timeout: 15000 });
    return Date.now() - start;
  };

  const getViewportTransform = async () =>
    page.evaluate(() => document.querySelector(".react-flow__viewport")?.getAttribute("style") ?? "");

  const waitForViewportChange = async (previous, label) => {
    try {
      await page.waitForFunction(
        (value) => document.querySelector(".react-flow__viewport")?.getAttribute("style") !== value,
        previous,
        { timeout: 5000 }
      );
    } catch (error) {
      throw new Error(`${label}: viewport did not change within 5000ms. ${error instanceof Error ? error.message : ""}`);
    }
  };

  const clearSelection = async () => {
    await page.keyboard.press("Escape");
    const isClear = async () =>
      page
        .waitForFunction(() => document.querySelectorAll(".react-flow__node.selected, .diagram-node.selected, .react-flow__edge.selected").length === 0, undefined, {
          timeout: 1500
        })
        .then(() => true)
        .catch(() => false);
    if (await isClear()) return;
    const box = await page.locator(".react-flow__pane").boundingBox();
    assert(box, "React Flow pane is not visible for selection clearing.");
    await page.mouse.click(box.x + 12, box.y + 12);
    await page.waitForFunction(() => document.querySelectorAll(".react-flow__node.selected, .diagram-node.selected, .react-flow__edge.selected").length === 0, undefined, {
      timeout: 5000
    });
  };

  const getNodeBox = async (nodeId) => {
    const box = await page.locator(`.react-flow__node[data-id="${nodeId}"] .diagram-node`).boundingBox();
    assert(box, `Node ${nodeId} is not visible for interactive performance measurement.`);
    return box;
  };

  const waitForNodeTransformChange = async (nodeId, previous, label) => {
    try {
      await page.waitForFunction(
        ({ id, value }) => document.querySelector(`.react-flow__node[data-id="${id}"]`)?.getAttribute("style") !== value,
        { id: nodeId, value: previous },
        { timeout: 8000 }
      );
    } catch (error) {
      throw new Error(`${label}: node transform did not change within 8000ms. ${error instanceof Error ? error.message : ""}`);
    }
  };

  const getAreaSelectionBox = async () => {
    const paneBox = await page.locator(".react-flow__pane").boundingBox();
    const nodeBoxes = await page.locator(".react-flow__node").evaluateAll((items) =>
      items.slice(0, Math.min(items.length, 12)).map((item) => {
        const rect = item.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      })
    );
    assert(paneBox, "React Flow pane is not visible for area selection measurement.");
    assert(nodeBoxes.length > 0, "No nodes are visible for area selection measurement.");
    const minX = Math.min(...nodeBoxes.map((box) => box.x));
    const minY = Math.min(...nodeBoxes.map((box) => box.y));
    const maxX = Math.max(...nodeBoxes.map((box) => box.x + box.width));
    const maxY = Math.max(...nodeBoxes.map((box) => box.y + box.height));
    return {
      startX: Math.max(paneBox.x + 4, minX - 18),
      startY: Math.max(paneBox.y + 4, minY - 18),
      endX: Math.min(paneBox.x + paneBox.width - 4, maxX + 18),
      endY: Math.min(paneBox.y + paneBox.height - 4, maxY + 18)
    };
  };

  const measureInteractiveFixture = async (nodeCount) => {
    const renderReadyMs = round(await loadFixture(nodeCount));
    await page.getByRole("button", { name: "选择" }).click();
    await page.getByRole("button", { name: "适应画布" }).click();
    await page.waitForTimeout(260);

    const selection = await measure(async (index) => {
      const targetIndex = index % 2;
      const targetId = `interactive-node-${targetIndex}`;
      await page.locator(".outline-select").nth(targetIndex).click();
      await waitForSelectedNode(targetId, `${nodeCount} nodes selection run ${index}`);
    });

    const zoom = await measure(async () => {
      const before = await getViewportTransform();
      await page.getByRole("button", { name: "Zoom Out" }).click();
      await waitForViewportChange(before, `${nodeCount} nodes zoom`);
      await page.getByRole("button", { name: "Zoom In" }).click();
    });

    const pan = await measure(async () => {
      await page.getByRole("button", { name: "平移" }).click();
      const before = await getViewportTransform();
      const box = await page.locator(".react-flow__pane").boundingBox();
      assert(box, "React Flow pane is not visible for pan measurement.");
      const startX = box.x + box.width - 140;
      const startY = box.y + box.height - 140;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX - 90, startY - 36, { steps: 8 });
      await page.mouse.up();
      await waitForViewportChange(before, `${nodeCount} nodes pan`);
      await page.getByRole("button", { name: "选择" }).click();
    });

    const dragMove = await measure(async (index) => {
      await page.getByRole("button", { name: "选择" }).click();
      await clearSelection();
      const targetId = "interactive-node-0";
      await page.locator(".outline-select").first().click();
      await waitForSelectedNode(targetId, `${nodeCount} nodes drag move selection run ${index}`);
      await page.getByRole("button", { name: "适应选中" }).click();
      await page.waitForTimeout(260);
      const target = page.locator(`.react-flow__node[data-id="${targetId}"]`);
      const before = (await target.getAttribute("style")) ?? "";
      const box = await getNodeBox(targetId);
      const direction = index % 2 === 0 ? 1 : -1;
      const startX = box.x + box.width / 2;
      const startY = box.y + box.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 28 * direction, startY + 16 * direction, { steps: 8 });
      await page.mouse.up();
      await waitForNodeTransformChange(targetId, before, `${nodeCount} nodes drag move run ${index}`);
    }, { runs: 1, warmupRuns: 0 });

    const areaSelection = await measure(async (index) => {
      await page.getByRole("button", { name: "选择" }).click();
      await clearSelection();
      const selectionBox = await getAreaSelectionBox();
      await page.mouse.move(selectionBox.startX, selectionBox.startY);
      await page.mouse.down();
      await page.mouse.move(selectionBox.endX, selectionBox.endY, { steps: 8 });
      await page.mouse.up();
      await waitForAnySelectedNode(`${nodeCount} nodes area selection run ${index}`);
    }, { runs: 1, warmupRuns: 0 });

    await page.locator(".shape-grid .shape-tile").filter({ hasText: "流程/任务" }).click();
    await waitForStatusNodeCount(nodeCount + 1);
    const undoSamples = [];
    const redoSamples = [];
    for (let index = 0; index < WARMUP_RUNS + RUNS; index += 1) {
      const undoStart = Date.now();
      await page.getByRole("toolbar", { name: "常用命令" }).getByRole("button", { name: "撤销", exact: true }).click();
      await waitForStatusNodeCount(nodeCount);
      const undoElapsed = Date.now() - undoStart;

      const redoStart = Date.now();
      await page.getByRole("toolbar", { name: "常用命令" }).getByRole("button", { name: "重做", exact: true }).click();
      await waitForStatusNodeCount(nodeCount + 1);
      const redoElapsed = Date.now() - redoStart;

      if (index >= WARMUP_RUNS) {
        undoSamples.push(undoElapsed);
        redoSamples.push(redoElapsed);
      }
    }
    await page.getByRole("toolbar", { name: "常用命令" }).getByRole("button", { name: "撤销", exact: true }).click();
    await waitForStatusNodeCount(nodeCount);
    await clearSelection();
    const undo = summarize(undoSamples);
    const redo = summarize(redoSamples);

    const thresholds = THRESHOLDS[nodeCount];
    const pass =
      renderReadyMs <= thresholds.renderReadyMs &&
      pan.medianMs <= thresholds.panMs &&
      zoom.medianMs <= thresholds.zoomMs &&
      selection.medianMs <= thresholds.selectionMs &&
      dragMove.medianMs <= thresholds.dragMoveMs &&
      areaSelection.medianMs <= thresholds.areaSelectionMs &&
      undo.medianMs <= thresholds.undoMs &&
      redo.medianMs <= thresholds.redoMs;

    return { nodes: nodeCount, edges: nodeCount - 1, thresholds, renderReadyMs, selection, zoom, pan, dragMove, areaSelection, undo, redo, pass };
  };

  const fixtures = [];
  for (const nodeCount of NODE_COUNTS) {
    fixtures.push(await measureInteractiveFixture(nodeCount));
  }

  const report = {
    tool: "structra-interactive-performance",
    date: new Date().toISOString(),
    browserViewport: page.viewportSize(),
    runs: RUNS,
    warmupRuns: WARMUP_RUNS,
    fixtures
  };

  await rootPage.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value, null, 2)),
    { key: REPORT_KEY, value: report }
  );
  await rootPage.bringToFront();
  assert(fixtures.every((fixture) => fixture.pass), `Interactive performance thresholds failed: ${JSON.stringify(report, null, 2)}`);
  console.log(JSON.stringify(report, null, 2));
  return report;
}
