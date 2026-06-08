#!/usr/bin/env node

import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";
import { createServer } from "vite";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const NODE_COUNTS = [100, 500, 1000];
const DEFAULT_RUNS = 7;
const WARMUP_RUNS = 2;
const SHAPES = ["process", "decision", "terminator", "document", "data", "database", "bpmnTask", "umlClass", "erEntity", "note", "table"];
const FILLS = ["#f7fbff", "#fff5df", "#e6f6ee", "#f4f0ff", "#eef8fa", "#fff0f1", "#f8fbff", "#fffdf8", "#f6f3ff"];
const STROKES = ["#3178c6", "#c07a12", "#1f9d63", "#7559c7", "#248a9c", "#c84d5f", "#2f6fab", "#8a5a18", "#7357c9"];

function readRunCount() {
  const value = process.env.STRUCTRA_PERF_RUNS;
  if (!value) return DEFAULT_RUNS;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error("STRUCTRA_PERF_RUNS must be an integer from 1 to 100.");
  }
  return parsed;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function median(values) {
  assert(values.length > 0, "Cannot calculate median for an empty sample.");
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[midpoint];
  return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function roundMetric(value) {
  return Math.round(value * 1000) / 1000;
}

function summarizeSamples(samples) {
  return {
    medianMs: roundMetric(median(samples)),
    minMs: roundMetric(Math.min(...samples)),
    maxMs: roundMetric(Math.max(...samples))
  };
}

function measure(operation, runs) {
  const samples = [];
  let lastValue;

  for (let index = 0; index < WARMUP_RUNS + runs; index += 1) {
    const start = performance.now();
    lastValue = operation();
    const elapsed = performance.now() - start;
    if (index >= WARMUP_RUNS) {
      samples.push(elapsed);
    }
  }

  return { samples, lastValue };
}

function createFixtureFactory({ diagramNode, edge, edgeWithHandles, withNodeData, DEFAULT_CANVAS_SETTINGS }) {
  function nodeForIndex(index) {
    const columns = 25;
    const row = Math.floor(index / columns);
    const column = index % columns;
    const shape = SHAPES[index % SHAPES.length];
    const width = shape === "umlClass" || shape === "erEntity" ? 180 : shape === "table" ? 172 : 142;
    const height = shape === "umlClass" ? 132 : shape === "erEntity" ? 118 : shape === "table" ? 104 : shape === "decision" ? 92 : 64;
    const node = diagramNode(
      `perf-node-${index}`,
      "diagram",
      { x: 64 + column * 210, y: 64 + row * 150 },
      `Step ${index + 1}`,
      shape,
      width,
      height,
      FILLS[index % FILLS.length],
      STROKES[index % STROKES.length]
    );

    const rotation = index % 17 === 0 ? 6 : 0;
    const strokeStyle = index % 9 === 0 ? "dashed" : "solid";
    const baseData = {
      fontSize: 13 + (index % 3),
      strokeStyle,
      rotation
    };

    if (shape === "umlClass") {
      return withNodeData(node, {
        ...baseData,
        umlAttributes: [`+ id${index}: string`, "+ status: Status", "+ createdAt: Date"],
        umlMethods: ["+ validate(): boolean", "+ save(): void"]
      });
    }

    if (shape === "erEntity") {
      return withNodeData(node, {
        ...baseData,
        erFields: [
          { key: "PK", name: `id_${index}`, type: "uuid" },
          { name: "name", type: "varchar" },
          { name: "updated_at", type: "timestamp" }
        ]
      });
    }

    if (shape === "table") {
      return withNodeData(node, {
        ...baseData,
        tableRows: 4,
        tableColumns: 3,
        tableCells: Array.from({ length: 12 }, (_, cellIndex) => `R${Math.floor(cellIndex / 3) + 1}C${(cellIndex % 3) + 1}`)
      });
    }

    return withNodeData(node, baseData);
  }

  function edgeForIndex(index, columns) {
    const source = `perf-node-${index}`;
    const target = `perf-node-${index + 1}`;
    const useHandles = (index + 1) % columns === 0;
    const nextEdge = useHandles
      ? edgeWithHandles(`perf-edge-${index}`, source, target, "bottom-source", "top-target", "")
      : edge(`perf-edge-${index}`, source, target, index % 12 === 0 ? `E${index}` : "");

    if (index % 14 === 0) {
      return {
        ...nextEdge,
        type: "straight"
      };
    }

    if (index % 10 === 0) {
      return {
        ...nextEdge,
        data: {
          ...nextEdge.data,
          waypoints: [
            { x: 150 + (index % columns) * 210, y: 118 + Math.floor(index / columns) * 150 },
            { x: 190 + (index % columns) * 210, y: 180 + Math.floor(index / columns) * 150 }
          ]
        }
      };
    }

    return nextEdge;
  }

  return function createFixture(nodeCount) {
    const columns = 25;
    const nodes = Array.from({ length: nodeCount }, (_, index) => nodeForIndex(index));
    const edges = Array.from({ length: Math.max(0, nodeCount - 1) }, (_, index) => edgeForIndex(index, columns));
    const page = {
      id: `perf-page-${nodeCount}`,
      name: `Synthetic ${nodeCount}`,
      nodes,
      edges,
      comments: [
        {
          id: `perf-comment-${nodeCount}`,
          target: "canvas",
          x: 40,
          y: 40,
          text: `Performance baseline for ${nodeCount} nodes`,
          createdAt: "2026-01-01T00:00:00.000Z",
          replies: []
        }
      ]
    };

    return {
      activePageId: page.id,
      settings: { ...DEFAULT_CANVAS_SETTINGS, showRulers: false, snapToGrid: false, pagePreset: "content" },
      pages: [page]
    };
  };
}

function assertFixture(document, expectedNodeCount) {
  assert(document.pages.length === 1, `Expected one page for ${expectedNodeCount}-node fixture.`);
  const page = document.pages[0];
  assert(document.activePageId === page.id, `Active page mismatch for ${expectedNodeCount}-node fixture.`);
  assert(page.nodes.length === expectedNodeCount, `Expected ${expectedNodeCount} nodes, found ${page.nodes.length}.`);
  assert(page.edges.length === expectedNodeCount - 1, `Expected ${expectedNodeCount - 1} edges, found ${page.edges.length}.`);
  assert(page.nodes.every((node) => node.type === "diagram" && node.data?.width > 0 && node.data?.height > 0), "Fixture contains invalid nodes.");
  assert(page.edges.every((item) => page.nodes.some((node) => node.id === item.source) && page.nodes.some((node) => node.id === item.target)), "Fixture contains dangling edges.");
}

async function loadSourceModules() {
  const vite = await createServer({
    root: ROOT_DIR,
    configFile: false,
    appType: "custom",
    logLevel: "error",
    server: { middlewareMode: true, hmr: false, ws: false }
  });

  try {
    const [svgExport, diagramDefaults] = await Promise.all([
      vite.ssrLoadModule("/src/io/svgExport.ts"),
      vite.ssrLoadModule("/src/domain/diagramDefaults.ts")
    ]);
    return { vite, svgExport, diagramDefaults };
  } catch (error) {
    await vite.close();
    throw error;
  }
}

async function main() {
  const runs = readRunCount();
  const { vite, svgExport, diagramDefaults } = await loadSourceModules();

  try {
    assert(typeof svgExport.buildSvg === "function", "buildSvg export is unavailable.");
    for (const exportName of ["diagramNode", "edge", "edgeWithHandles", "withNodeData", "DEFAULT_CANVAS_SETTINGS"]) {
      assert(diagramDefaults[exportName], `${exportName} export is unavailable.`);
    }

    const createFixture = createFixtureFactory(diagramDefaults);
    const results = NODE_COUNTS.map((nodeCount) => {
      const document = createFixture(nodeCount);
      assertFixture(document, nodeCount);
      const page = document.pages[0];

      const stringify = measure(() => JSON.stringify(document), runs);
      const json = stringify.lastValue;
      assert(typeof json === "string" && json.length > 0, `JSON serialization failed for ${nodeCount} nodes.`);

      const parse = measure(() => JSON.parse(json), runs);
      const parsed = parse.lastValue;
      assertFixture(parsed, nodeCount);

      const svg = measure(() => svgExport.buildSvg(page.nodes, page.edges, document.settings.background, document.settings.pagePreset), runs);
      const lastSvg = svg.lastValue;
      assert(typeof lastSvg === "string" && lastSvg.startsWith("<svg"), `SVG export failed for ${nodeCount} nodes.`);
      assert(lastSvg.includes(`Step ${nodeCount}`), `SVG export is missing the final node label for ${nodeCount} nodes.`);

      return {
        nodes: nodeCount,
        edges: page.edges.length,
        jsonBytes: Buffer.byteLength(json, "utf8"),
        svgBytes: Buffer.byteLength(lastSvg, "utf8"),
        jsonStringify: summarizeSamples(stringify.samples),
        jsonParse: summarizeSamples(parse.samples),
        svgExport: summarizeSamples(svg.samples)
      };
    });

    process.stdout.write(
      `${JSON.stringify(
        {
          tool: "structra-performance-baseline",
          runs,
          warmupRuns: WARMUP_RUNS,
          fixtures: results
        },
        null,
        2
      )}\n`
    );
  } finally {
    await vite.close();
  }
}

main().catch((error) => {
  process.stderr.write(`[performance-baseline] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
