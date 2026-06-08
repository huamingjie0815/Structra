import { useCallback } from "react";

import type { DiagramTemplate } from "../../domain/types";
import { recordDesktopWorkspaceRecentOpenAttempt, recordDesktopWorkspaceRecentOpenResult } from "../../io/nativeFiles";

export function useWorkspaceActionsWorkflow({
  setWorkspaceOpen,
  newDocument,
  openDocument,
  openRecentDocument,
  applyTemplate
}: {
  setWorkspaceOpen: (open: boolean) => void;
  newDocument: () => void;
  openDocument: () => Promise<boolean>;
  openRecentDocument: (path: string) => Promise<boolean>;
  applyTemplate: (template: DiagramTemplate) => void;
}) {
  const newDocumentFromWorkspace = useCallback(() => {
    newDocument();
    setWorkspaceOpen(false);
  }, [newDocument, setWorkspaceOpen]);

  const openDocumentFromWorkspace = useCallback(async () => {
    if (await openDocument()) {
      setWorkspaceOpen(false);
    }
  }, [openDocument, setWorkspaceOpen]);

  const openRecentDocumentFromWorkspace = useCallback(
    async (path: string) => {
      void recordDesktopWorkspaceRecentOpenAttempt(path);
      const opened = await openRecentDocument(path);
      void recordDesktopWorkspaceRecentOpenResult(path, opened);
      if (opened) {
        setWorkspaceOpen(false);
      }
      return opened;
    },
    [openRecentDocument, setWorkspaceOpen]
  );

  const applyTemplateFromWorkspace = useCallback(
    (template: DiagramTemplate) => {
      applyTemplate(template);
      setWorkspaceOpen(false);
    },
    [applyTemplate, setWorkspaceOpen]
  );

  return {
    newDocumentFromWorkspace,
    openDocumentFromWorkspace,
    openRecentDocumentFromWorkspace,
    applyTemplateFromWorkspace
  };
}
