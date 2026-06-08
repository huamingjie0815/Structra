import { useCallback } from "react";
import { replaceDocumentCommand } from "../../editor/commands";
import type { CanvasSettings, DiagramPage } from "../../domain/types";
import type { HistoryEntry } from "../../editor/history";

export type RestorableDocumentSnapshot = {
  pages: DiagramPage[];
  activePageId: string;
  page: DiagramPage;
  settings: CanvasSettings;
};

type ReplaceDocumentBaseline = (entry: HistoryEntry, options?: Partial<{ fitView: boolean; clearActiveComment: boolean }>) => void;

export type PreparedRestoreSnapshot = {
  entry: HistoryEntry;
};

export function prepareRestoredDocumentSnapshot(snapshot: RestorableDocumentSnapshot): PreparedRestoreSnapshot | null {
  const entry = replaceDocumentCommand(
    {
      pages: snapshot.pages,
      activePageId: snapshot.activePageId,
      settings: snapshot.settings
    },
    null
  );
  return entry ? { entry } : null;
}

export function useDocumentRestoreWorkflow({
  replaceDocumentBaseline
}: {
  replaceDocumentBaseline: ReplaceDocumentBaseline;
}) {
  const restoreDocumentSnapshot = useCallback(
    (snapshot: RestorableDocumentSnapshot) => {
      const prepared = prepareRestoredDocumentSnapshot(snapshot);
      if (!prepared) return;
      replaceDocumentBaseline(prepared.entry, { fitView: true });
    },
    [replaceDocumentBaseline]
  );

  return { restoreDocumentSnapshot };
}
