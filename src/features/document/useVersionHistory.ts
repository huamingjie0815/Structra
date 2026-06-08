import { useCallback, useState } from "react";
import { MAX_VERSION_COUNT, VERSION_STORAGE_KEY } from "../../domain/diagramDefaults";
import { loadSavedVersions, normalizeCanvasSettings, normalizeComments } from "../../domain/documentSession";
import type { CanvasSettings, DiagramDocument, DiagramPage, DiagramVersion } from "../../domain/types";

type VersionStorage = Pick<Storage, "getItem" | "setItem">;

export type RestoredVersionSnapshot = {
  pages: DiagramPage[];
  activePageId: string;
  page: DiagramPage;
  settings: CanvasSettings;
};

export function formatVersionTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知时间";
  return date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function createVersionSnapshot(document: DiagramDocument, createdAt = new Date().toISOString(), idSeed = Date.now()): DiagramVersion {
  return {
    id: `version-${idSeed}`,
    name: `版本 ${formatVersionTime(createdAt)}`,
    createdAt,
    pages: document.pages,
    activePageId: document.activePageId,
    settings: document.settings
  };
}

export function limitVersionHistory(versions: DiagramVersion[]) {
  return versions.slice(0, MAX_VERSION_COUNT);
}

export function getRestoredVersionSnapshot(version: DiagramVersion): RestoredVersionSnapshot | null {
  const pages = version.pages.map((page) => ({ ...page, comments: normalizeComments(page.comments) }));
  if (pages.length === 0) return null;

  const activePageId = pages.some((page) => page.id === version.activePageId) ? version.activePageId : pages[0].id;
  const page = pages.find((candidate) => candidate.id === activePageId) ?? pages[0];
  return {
    pages,
    activePageId,
    page,
    settings: normalizeCanvasSettings(version.settings)
  };
}

export function persistVersions(storage: Pick<Storage, "setItem">, versions: DiagramVersion[]) {
  storage.setItem(VERSION_STORAGE_KEY, JSON.stringify(versions));
}

export function useVersionHistory(storage: VersionStorage = localStorage) {
  const [versions, setVersions] = useState<DiagramVersion[]>(() => loadSavedVersions(storage));

  const saveVersion = useCallback(
    (document: DiagramDocument) => {
      const version = createVersionSnapshot(document);
      setVersions((current) => {
        const nextVersions = limitVersionHistory([version, ...current]);
        persistVersions(storage, nextVersions);
        return nextVersions;
      });
    },
    [storage]
  );

  const deleteVersion = useCallback(
    (id: string) => {
      setVersions((current) => {
        const nextVersions = current.filter((version) => version.id !== id);
        persistVersions(storage, nextVersions);
        return nextVersions;
      });
    },
    [storage]
  );

  return {
    versions,
    saveVersion,
    deleteVersion
  };
}
