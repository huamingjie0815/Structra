import { useCallback, useEffect, useMemo } from "react";
import type { CommandItem } from "../domain/types";
import { recordDesktopLifecycleAudit } from "../io/nativeFiles";
import { dispatchNativeMenuCommand, useNativeMenuCommandListener } from "./nativeMenuCommands";
import { buildNativeMenuEnabledState } from "./nativeMenuState";

type NativeMenuWorkflowInput = {
  commandItems: CommandItem[];
  openCommandPalette: () => void;
  runCommand: (item: CommandItem) => void;
  undo: () => void;
  redo: () => void;
  copySelection: () => void;
  cutSelection: () => void;
  pasteClipboard: () => void;
  duplicateSelection: () => void;
  deleteSelection: () => void;
  selectAllNodes: () => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSnapToGrid: () => void;
  openWorkspace: () => void;
  openFirstRecentFromWorkspace?: () => void;
  acceptNextUnsavedPromptForAudit?: () => void;
  openPreferences: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  togglePreviewMode: () => void;
  exportDocumentPdf: () => void;
  printCurrentPage: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canPaste: boolean;
  documentDirty: boolean;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  hasSelection: boolean;
};

export function useNativeMenuWorkflow({
  commandItems,
  openCommandPalette,
  runCommand,
  undo,
  redo,
  copySelection,
  cutSelection,
  pasteClipboard,
  duplicateSelection,
  deleteSelection,
  selectAllNodes,
  toggleGrid,
  toggleRulers,
  toggleSnapToGrid,
  openWorkspace,
  openFirstRecentFromWorkspace,
  acceptNextUnsavedPromptForAudit,
  openPreferences,
  zoomIn,
  zoomOut,
  resetZoom,
  togglePreviewMode,
  exportDocumentPdf,
  printCurrentPage,
  canUndo,
  canRedo,
  canPaste,
  documentDirty,
  selectedNodeCount,
  selectedEdgeCount,
  hasSelection
}: NativeMenuWorkflowInput) {
  const nativeMenuEnabledState = useMemo(
    () =>
      buildNativeMenuEnabledState({
        canUndo,
        canRedo,
        canPaste,
        documentDirty,
        selectedNodeCount,
        selectedEdgeCount,
        hasSelection
      }),
    [canPaste, canRedo, canUndo, documentDirty, hasSelection, selectedEdgeCount, selectedNodeCount]
  );

  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;

    void import("@tauri-apps/api/core")
      .then(({ invoke }) => invoke("set_native_menu_enabled_state", { states: nativeMenuEnabledState }))
      .catch((error) => {
        console.warn("Native menu enabled state sync failed", error);
      });
  }, [nativeMenuEnabledState]);

  const runNativeMenuCommand = useCallback(
    (command: string) => {
      const handled = dispatchNativeMenuCommand(
        command,
        {
          commandItems,
          openCommandPalette,
          runCommand,
          undo,
          redo,
          copySelection,
          cutSelection,
          pasteClipboard,
          duplicateSelection,
          deleteSelection,
          selectAllNodes,
          toggleGrid,
          toggleRulers,
          toggleSnapToGrid,
          openWorkspace,
          openFirstRecentFromWorkspace,
          acceptNextUnsavedPromptForAudit,
          openPreferences,
          zoomIn,
          zoomOut,
          resetZoom,
          togglePreviewMode,
          exportDocumentPdf,
          printCurrentPage
        },
        nativeMenuEnabledState
      );
      void recordDesktopLifecycleAudit("native-menu-command", { command, handled });
    },
    [
      commandItems,
      acceptNextUnsavedPromptForAudit,
      copySelection,
      cutSelection,
      deleteSelection,
      duplicateSelection,
      exportDocumentPdf,
      openCommandPalette,
      openFirstRecentFromWorkspace,
      pasteClipboard,
      printCurrentPage,
      redo,
      resetZoom,
      runCommand,
      selectAllNodes,
      nativeMenuEnabledState,
      openWorkspace,
      openPreferences,
      toggleGrid,
      toggleRulers,
      toggleSnapToGrid,
      togglePreviewMode,
      undo,
      zoomIn,
      zoomOut
    ]
  );

  useNativeMenuCommandListener(runNativeMenuCommand);
}
