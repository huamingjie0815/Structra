import type { DiagramComment, DiagramDocument, DiagramPage } from "../domain/types";

export const DOCUMENT_FILE_SCHEMA = "structra.diagram-document";
export const DOCUMENT_FILE_VERSION = 1;
export const DOCUMENT_FILE_EXTENSION = ".structra";
export const DOCUMENT_FILE_EXTENSIONS = [".structra"] as const;

export type DiagramDocumentFile = {
  schema: typeof DOCUMENT_FILE_SCHEMA;
  version: typeof DOCUMENT_FILE_VERSION;
  document: DiagramDocument;
};

export class DiagramDocumentFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiagramDocumentFileError";
  }
}

export function serializeDiagramDocument(document: DiagramDocument): string {
  return `${JSON.stringify(
    {
      schema: DOCUMENT_FILE_SCHEMA,
      version: DOCUMENT_FILE_VERSION,
      document: normalizeDiagramDocument(document)
    } satisfies DiagramDocumentFile,
    null,
    2
  )}\n`;
}

export function parseDiagramDocument(input: string | unknown): DiagramDocument {
  const parsed = typeof input === "string" ? parseJson(input) : input;
  const document = readDiagramDocumentPayload(parsed);
  return normalizeDiagramDocument(document);
}

export function getDocumentDisplayName(pathOrName: string): string {
  const fileName = pathOrName.split(/[\\/]/).pop()?.trim() ?? "";
  const withoutExtension = fileName.replace(/\.structra$/i, "");
  return withoutExtension || "Untitled";
}

export function ensureDocumentExtension(pathOrName: string): string {
  const trimmed = pathOrName.trim();
  if (!trimmed) return `Untitled${DOCUMENT_FILE_EXTENSION}`;
  return /\.structra$/i.test(trimmed) ? trimmed : `${trimmed}${DOCUMENT_FILE_EXTENSION}`;
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    throw new DiagramDocumentFileError("Document file is not valid JSON.");
  }
}

function readDiagramDocumentPayload(value: unknown): DiagramDocument {
  if (!isRecord(value)) {
    throw new DiagramDocumentFileError("Document file must contain an object.");
  }

  if ("schema" in value || "version" in value || "document" in value) {
    if (value.schema !== DOCUMENT_FILE_SCHEMA) {
      throw new DiagramDocumentFileError("Document file schema is not supported.");
    }
    if (value.version !== DOCUMENT_FILE_VERSION) {
      throw new DiagramDocumentFileError("Document file version is not supported.");
    }
    if (!isDiagramDocument(value.document)) {
      throw new DiagramDocumentFileError("Document payload is not a valid diagram document.");
    }
    return value.document;
  }

  if (!isDiagramDocument(value)) {
    throw new DiagramDocumentFileError("Document file is not a valid diagram document.");
  }
  return value;
}

function normalizeDiagramDocument(document: DiagramDocument): DiagramDocument {
  if (document.pages.length === 0) {
    throw new DiagramDocumentFileError("Document must contain at least one page.");
  }

  const pages = document.pages.map(normalizeDiagramPage);
  const activePageId = pages.some((page) => page.id === document.activePageId) ? document.activePageId : pages[0].id;
  return {
    pages,
    activePageId,
    ...(document.settings ? { settings: { ...document.settings } } : {})
  };
}

function normalizeDiagramPage(page: DiagramPage): DiagramPage {
  return {
    ...page,
    comments: normalizeComments(page.comments)
  };
}

function normalizeComments(comments?: DiagramComment[]): DiagramComment[] {
  return Array.isArray(comments)
    ? comments.map((comment) => ({
        ...comment,
        replies: Array.isArray(comment.replies) ? comment.replies : []
      }))
    : [];
}

function isDiagramDocument(value: unknown): value is DiagramDocument {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.pages) || value.pages.length === 0) return false;
  if (typeof value.activePageId !== "string") return false;
  return value.pages.every(isDiagramPage);
}

function isDiagramPage(value: unknown): value is DiagramPage {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.name === "string" && Array.isArray(value.nodes) && Array.isArray(value.edges);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
