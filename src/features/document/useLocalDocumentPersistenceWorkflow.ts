import { useCallback } from "react";
import { STORAGE_KEY } from "../../domain/diagramDefaults";
import type { DiagramDocument, DiagramVersion } from "../../domain/types";
import { getRestoredVersionSnapshot, type RestoredVersionSnapshot } from "./useVersionHistory";

type LocalDocumentStorage = Pick<Storage, "setItem">;

type LocalDocumentPersistenceWorkflowInput = {
  currentDocument: DiagramDocument;
  markRecoveryCacheSaved: () => void;
  saveVersionSnapshot: (document: DiagramDocument) => void;
  restoreDocumentSnapshot: (snapshot: RestoredVersionSnapshot) => void;
  storage?: LocalDocumentStorage;
};

export function saveRecoveryCache(document: DiagramDocument, storage: LocalDocumentStorage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(document));
}

export function useLocalDocumentPersistenceWorkflow({
  currentDocument,
  markRecoveryCacheSaved,
  saveVersionSnapshot,
  restoreDocumentSnapshot,
  storage
}: LocalDocumentPersistenceWorkflowInput) {
  const saveNow = useCallback(() => {
    saveRecoveryCache(currentDocument, storage);
    markRecoveryCacheSaved();
  }, [currentDocument, markRecoveryCacheSaved, storage]);

  const saveVersion = useCallback(() => {
    saveVersionSnapshot(currentDocument);
  }, [currentDocument, saveVersionSnapshot]);

  const restoreVersion = useCallback(
    (version: DiagramVersion) => {
      const restored = getRestoredVersionSnapshot(version);
      if (!restored) return;
      const shouldRestore = window.confirm(
        `恢复本地版本“${version.name}”？\n\n当前文档会被该版本的 ${restored.pages.length} 个页面替换，可通过撤销恢复。`
      );
      if (!shouldRestore) return;
      restoreDocumentSnapshot(restored);
    },
    [restoreDocumentSnapshot]
  );

  return { saveNow, saveVersion, restoreVersion };
}
