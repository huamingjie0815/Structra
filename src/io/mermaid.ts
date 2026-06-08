import { diagramNode, edge } from "../domain/diagramDefaults";
import { getShapeSpec } from "../domain/shapeSpecs";
import type { DiagramEdge, DiagramNode, DiagramNodeData, ShapeKind, Snapshot } from "../domain/types";
import { getVisibleGraph } from "./exporters";

export class MermaidParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MermaidParseError";
  }
}

export function buildMermaidExport(nodes: DiagramNode[], edges: DiagramEdge[]) {
  const visibleGraph = getVisibleGraph(nodes, edges);
  const ids = new Map<string, string>();
  const usedIds = new Set<string>();
  visibleGraph.nodes.forEach((node, index) => {
    const baseId = normalizeMermaidId(node.id || `node-${index + 1}`);
    let nextId = baseId;
    let suffix = 2;
    while (usedIds.has(nextId)) {
      nextId = `${baseId}_${suffix}`;
      suffix += 1;
    }
    usedIds.add(nextId);
    ids.set(node.id, nextId);
  });

  const lines = ["flowchart LR"];
  if (visibleGraph.nodes.length === 0) {
    lines.push('  empty["空白画布"]');
    return lines.join("\n");
  }

  visibleGraph.nodes.forEach((node) => {
    const id = ids.get(node.id);
    if (!id) return;
    lines.push(`  ${mermaidNodeStatement(id, node.data)}`);
  });
  visibleGraph.edges.forEach((edge) => {
    const source = ids.get(edge.source);
    const target = ids.get(edge.target);
    if (!source || !target) return;
    const label = String(edge.label ?? "").trim();
    lines.push(label ? `  ${source} -->|${escapeMermaidEdgeLabel(label)}| ${target}` : `  ${source} --> ${target}`);
  });
  return lines.join("\n");
}

export function parseMermaid(raw: string): Snapshot {
  const nodeRecords = new Map<string, { label: string; shape: ShapeKind }>();
  const parsedEdges: Array<{ source: string; target: string; label: string }> = [];
  raw
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.replace(/%%.*$/, "").trim(), lineNumber: index + 1 }))
    .filter(({ line }) => Boolean(line))
    .forEach(({ line, lineNumber }) => {
      if (/^(flowchart|graph)\s+/i.test(line)) return;
      const unsupportedType = getUnsupportedMermaidType(line);
      if (unsupportedType) {
        throw new MermaidParseError(`Unsupported Mermaid diagram type: ${unsupportedType}.`);
      }
      const edgeMatch = line.match(/^([^\s-]+)\s*-+>\s*(?:\|([^|]*)\|\s*)?([^\s-]+)$/);
      if (edgeMatch) {
        const [, source, label = "", target] = edgeMatch;
        parsedEdges.push({ source, target, label: label.trim() });
        if (!nodeRecords.has(source)) nodeRecords.set(source, { label: source, shape: "process" });
        if (!nodeRecords.has(target)) nodeRecords.set(target, { label: target, shape: "process" });
        return;
      }

      const nodeMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*(.+)$/);
      if (!nodeMatch) {
        throw new MermaidParseError(`Unsupported Mermaid syntax on line ${lineNumber}: ${line}`);
      }
      const [, id, statement] = nodeMatch;
      nodeRecords.set(id, parseMermaidNodeStatement(id, statement, lineNumber));
    });
  if (nodeRecords.size === 0 && parsedEdges.length === 0) {
    throw new MermaidParseError("Mermaid diagram has no supported flowchart nodes or edges.");
  }

  const nodes = Array.from(nodeRecords.entries()).map(([id, record], index) => {
    const shapeSpec = getShapeSpec(record.shape);
    return diagramNode(
      id,
      "diagram",
      { x: 90 + (index % 4) * 220, y: 100 + Math.floor(index / 4) * 150 },
      record.label,
      record.shape,
      shapeSpec.width,
      shapeSpec.height,
      shapeSpec.fill,
      shapeSpec.stroke
    );
  });
  const edges = parsedEdges.map((item, index) => edge(`mermaid-edge-${index + 1}`, item.source, item.target, decodeMermaidLabel(item.label)));
  return { nodes, edges, comments: [] };
}

function getUnsupportedMermaidType(line: string) {
  const match = line.match(/^(sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline)\b/i);
  return match?.[1];
}

function normalizeMermaidId(value: string) {
  const normalized = value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+/, "");
  const id = normalized || "node";
  return /^[a-zA-Z]/.test(id) ? id : `n_${id}`;
}

function mermaidNodeStatement(id: string, data: DiagramNodeData) {
  const label = escapeMermaidLabel(data.label);
  switch (data.shape) {
    case "terminator":
      return `${id}(["${label}"])`;
    case "decision":
      return `${id}{"${label}"}`;
    case "database":
      return `${id}[("${label}")]`;
    case "data":
    case "manual":
      return `${id}[/"${label}"/]`;
    case "swimlane":
    case "subprocess":
    case "table":
      return `${id}[["${label}"]]`;
    default:
      return `${id}["${label}"]`;
  }
}

function parseMermaidNodeStatement(id: string, statement: string, lineNumber: number): { label: string; shape: ShapeKind } {
  if (!isSupportedMermaidNodeStatement(statement)) {
    throw new MermaidParseError(`Invalid Mermaid node syntax on line ${lineNumber}: ${id}${statement}`);
  }
  const shape = statement.includes("{")
    ? "decision"
    : statement.includes("([")
      ? "terminator"
      : statement.includes("[(")
        ? "database"
        : statement.includes("[[")
          ? "subprocess"
          : statement.includes("[/")
            ? "data"
            : "process";
  return { label: extractMermaidNodeLabel(statement, id), shape };
}

function isSupportedMermaidNodeStatement(statement: string) {
  const trimmed = statement.trim();
  if (!/^[\[\(\{]/.test(trimmed)) return false;
  if (trimmed.includes("-->")) return false;
  if (!hasBalancedQuotes(trimmed)) return false;
  const structural = trimmed.replace(/"[^"]*"/g, '""');
  return hasBalancedCharacters(structural, "[", "]") && hasBalancedCharacters(structural, "(", ")") && hasBalancedCharacters(structural, "{", "}");
}

function hasBalancedCharacters(value: string, open: string, close: string) {
  return Array.from(value).filter((char) => char === open).length === Array.from(value).filter((char) => char === close).length;
}

function hasBalancedQuotes(value: string) {
  return (value.match(/"/g) ?? []).length % 2 === 0;
}

function extractMermaidNodeLabel(statement: string, fallback: string) {
  const quoted = statement.match(/"([^"]*)"/);
  if (quoted) return decodeMermaidLabel(quoted[1]);
  const unquoted = statement.replace(/^[\s\[\]\(\)\{\}\\/]+|[\s\[\]\(\)\{\}\\/]+$/g, "").trim();
  return decodeMermaidLabel(unquoted || fallback);
}

function escapeMermaidLabel(value: string) {
  return value.replace(/"/g, "'").replace(/\r?\n/g, "<br/>");
}

function escapeMermaidEdgeLabel(value: string) {
  return value.replace(/\|/g, "/").replace(/\r?\n/g, " ");
}

function decodeMermaidLabel(value: string) {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/&quot;/g, '"');
}
