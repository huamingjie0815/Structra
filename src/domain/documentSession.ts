import {
  DEFAULT_CANVAS_SETTINGS,
  GRID_BACKGROUND_VARIANTS,
  MAX_CUSTOM_TEMPLATE_COUNT,
  MAX_VERSION_COUNT,
  PAGE_PRESETS,
  STORAGE_KEY,
  TEMPLATE_STORAGE_KEY,
  VERSION_STORAGE_KEY,
  initialDocument
} from "./diagramDefaults";
import { DOCUMENT_FILE_SCHEMA, DOCUMENT_FILE_VERSION } from "../io/documentFile";
import type { CanvasSettings, DiagramComment, DiagramDocument, DiagramEdge, DiagramNode, DiagramPage, DiagramTemplate, DiagramVersion } from "./types";

type StorageReader = Pick<Storage, "getItem">;

export function syncActivePage(pages: DiagramPage[], activePageId: string, nodes: DiagramNode[], edges: DiagramEdge[], comments: DiagramComment[]) {
  return pages.map((page) => (page.id === activePageId ? { ...page, nodes, edges, comments: normalizeComments(comments) } : { ...page, comments: normalizeComments(page.comments) }));
}

export function loadSavedDocument(storage: StorageReader = localStorage): DiagramDocument {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return cloneDocument(initialDocument);
    const parsed = unwrapStoredDocument(JSON.parse(raw));
    const settings = normalizeCanvasSettings(parsed.settings);

    if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
      const pages = parsed.pages.map((page) => ({ ...page, comments: normalizeComments(page.comments) }));
      const activePageId =
        parsed.activePageId && pages.some((page) => page.id === parsed.activePageId)
          ? parsed.activePageId
          : pages[0].id;
      return { pages, activePageId, settings };
    }

    if (Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
      return {
        activePageId: "page-main",
        pages: [{ id: "page-main", name: "流程图", nodes: parsed.nodes, edges: parsed.edges, comments: normalizeComments(parsed.comments) }],
        settings
      };
    }

    return cloneDocument(initialDocument);
  } catch {
    return cloneDocument(initialDocument);
  }
}

export function loadSavedVersions(storage: StorageReader = localStorage): DiagramVersion[] {
  try {
    const raw = storage.getItem(VERSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DiagramVersion[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((version) => version.id && version.createdAt && Array.isArray(version.pages) && version.pages.length > 0)
      .map((version) => ({
        ...version,
        pages: version.pages.map((page) => ({ ...page, comments: normalizeComments(page.comments) }))
      }))
      .slice(0, MAX_VERSION_COUNT);
  } catch {
    return [];
  }
}

export function loadSavedTemplates(storage: StorageReader = localStorage): DiagramTemplate[] {
  try {
    const raw = storage.getItem(TEMPLATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DiagramTemplate[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((template) => template.id && template.name && Array.isArray(template.nodes) && Array.isArray(template.edges))
      .map((template) => ({ ...template, custom: true, comments: [] }))
      .slice(0, MAX_CUSTOM_TEMPLATE_COUNT);
  } catch {
    return [];
  }
}

export function normalizeComments(comments?: DiagramComment[]) {
  return Array.isArray(comments) ? comments.map((comment) => ({ ...comment, replies: Array.isArray(comment.replies) ? comment.replies : [] })) : [];
}

export function normalizeCanvasSettings(settings?: Partial<CanvasSettings>): CanvasSettings {
  const rawGridSize = Number(settings?.gridSize ?? DEFAULT_CANVAS_SETTINGS.gridSize);
  const gridVariant = settings?.gridVariant && settings.gridVariant in GRID_BACKGROUND_VARIANTS ? settings.gridVariant : DEFAULT_CANVAS_SETTINGS.gridVariant;
  const pagePreset = settings?.pagePreset && (settings.pagePreset === "content" || pagePresetIsPreset(settings.pagePreset)) ? settings.pagePreset : DEFAULT_CANVAS_SETTINGS.pagePreset;
  const background =
    typeof settings?.background === "string" && /^#[0-9a-fA-F]{6}$/.test(settings.background)
      ? settings.background
      : DEFAULT_CANVAS_SETTINGS.background;
  return {
    showGrid: settings?.showGrid ?? DEFAULT_CANVAS_SETTINGS.showGrid,
    showRulers: settings?.showRulers ?? DEFAULT_CANVAS_SETTINGS.showRulers,
    snapToGrid: settings?.snapToGrid ?? DEFAULT_CANVAS_SETTINGS.snapToGrid,
    gridSize: Number.isFinite(rawGridSize) ? Math.min(48, Math.max(4, Math.round(rawGridSize))) : DEFAULT_CANVAS_SETTINGS.gridSize,
    gridVariant,
    pagePreset,
    background
  };
}

export function cloneDocument(document: DiagramDocument): DiagramDocument {
  return JSON.parse(JSON.stringify(document)) as DiagramDocument;
}

function unwrapStoredDocument(value: unknown): Partial<DiagramDocument & { nodes?: DiagramNode[]; edges?: DiagramEdge[]; comments?: DiagramComment[] }> {
  if (isRecord(value) && value.schema === DOCUMENT_FILE_SCHEMA && value.version === DOCUMENT_FILE_VERSION && isRecord(value.document)) {
    return value.document as Partial<DiagramDocument & { nodes?: DiagramNode[]; edges?: DiagramEdge[]; comments?: DiagramComment[] }>;
  }
  return value as Partial<DiagramDocument & { nodes?: DiagramNode[]; edges?: DiagramEdge[]; comments?: DiagramComment[] }>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pagePresetIsPreset(value: string) {
  return value in PAGE_PRESETS;
}
