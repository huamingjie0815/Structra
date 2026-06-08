export const RECENT_DOCUMENTS_STORAGE_KEY = "structra-recent-documents-v1";
export const MAX_RECENT_DOCUMENTS = 8;

export type RecentDocument = { path: string; name: string; openedAt: string };

export function loadRecentDocuments(): RecentDocument[] {
  try {
    const raw = localStorage.getItem(RECENT_DOCUMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentDocument[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentDocument).slice(0, MAX_RECENT_DOCUMENTS);
  } catch {
    return [];
  }
}

export function saveRecentDocuments(documents: RecentDocument[]) {
  localStorage.setItem(RECENT_DOCUMENTS_STORAGE_KEY, JSON.stringify(documents.slice(0, MAX_RECENT_DOCUMENTS)));
}

export function clearRecentDocuments(storage: Pick<Storage, "removeItem"> = localStorage) {
  storage.removeItem(RECENT_DOCUMENTS_STORAGE_KEY);
}

export function upsertRecentDocument(documents: RecentDocument[], path: string, openedAt = new Date().toISOString()) {
  const entry = { path, name: getFileNameFromPath(path), openedAt };
  return [entry, ...documents.filter((item) => item.path !== path)].slice(0, MAX_RECENT_DOCUMENTS);
}

export function removeRecentDocument(documents: RecentDocument[], path: string) {
  return documents.filter((item) => item.path !== path);
}

function isRecentDocument(value: unknown): value is RecentDocument {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const item = value as Partial<RecentDocument>;
  return typeof item.path === "string" && item.path.trim().length > 0 && typeof item.name === "string" && typeof item.openedAt === "string";
}

function getFileNameFromPath(path: string) {
  return path.split(/[\\/]/).pop() || "structra-diagram.structra";
}
