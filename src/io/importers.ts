import type { CanvasSettings, DiagramDocument, Snapshot } from "../domain/types";
import { parseDiagramDocument } from "./documentFile";

export type ImportedDiagramJson =
  | { type: "document"; document: DiagramDocument }
  | { type: "legacySnapshot"; snapshot: Snapshot & { settings?: Partial<CanvasSettings> } };

export function parseImportedDiagramJson(raw: string): ImportedDiagramJson {
  const parsed = parseJson(raw);
  const document = tryParseDocument(parsed);
  if (document) {
    return { type: "document", document };
  }
  if (isLegacySnapshot(parsed)) {
    return { type: "legacySnapshot", snapshot: parsed };
  }
  throw new Error("Unsupported diagram JSON.");
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Invalid JSON.");
  }
}

function tryParseDocument(value: unknown): DiagramDocument | null {
  try {
    return parseDiagramDocument(value);
  } catch {
    return null;
  }
}

function isLegacySnapshot(value: unknown): value is Snapshot & { settings?: Partial<CanvasSettings> } {
  if (!isRecord(value)) return false;
  return Array.isArray(value.nodes) && Array.isArray(value.edges);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
