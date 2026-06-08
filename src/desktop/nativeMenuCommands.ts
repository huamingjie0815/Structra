import { useEffect } from "react";
import type { CommandItem } from "../domain/types";
import type { NativeMenuEnabledState } from "./nativeMenuState";
import { isNativeMenuCommandEnabled } from "./nativeMenuState";

export type NativeMenuCommandHandlers = {
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
};

export function dispatchNativeMenuCommand(
  command: string,
  handlers: NativeMenuCommandHandlers,
  enabledState?: NativeMenuEnabledState
): boolean {
  if (!isNativeMenuCommandEnabled(command, enabledState, handlers.commandItems)) return false;

  if (command === "command-palette") {
    handlers.openCommandPalette();
    return true;
  }

  const paletteCommand = handlers.commandItems.find((item) => item.id === command);
  if (paletteCommand) {
    handlers.runCommand(paletteCommand);
    return true;
  }

  switch (command) {
    case "undo":
      handlers.undo();
      return true;
    case "redo":
      handlers.redo();
      return true;
    case "copy-selection":
      handlers.copySelection();
      return true;
    case "cut-selection":
      handlers.cutSelection();
      return true;
    case "paste-selection":
      handlers.pasteClipboard();
      return true;
    case "duplicate-selection":
      handlers.duplicateSelection();
      return true;
    case "delete-selection":
      handlers.deleteSelection();
      return true;
    case "select-all":
      handlers.selectAllNodes();
      return true;
    case "toggle-grid":
      handlers.toggleGrid();
      return true;
    case "toggle-rulers":
      handlers.toggleRulers();
      return true;
    case "toggle-snap-to-grid":
      handlers.toggleSnapToGrid();
      return true;
    case "open-workspace":
      handlers.openWorkspace();
      return true;
    case "open-first-recent-from-workspace":
      if (!handlers.openFirstRecentFromWorkspace) return false;
      handlers.openFirstRecentFromWorkspace();
      return true;
    case "audit-accept-next-unsaved-prompt":
      if (!handlers.acceptNextUnsavedPromptForAudit) return false;
      handlers.acceptNextUnsavedPromptForAudit();
      return true;
    case "preferences":
      handlers.openPreferences();
      return true;
    case "zoom-in":
      handlers.zoomIn();
      return true;
    case "zoom-out":
      handlers.zoomOut();
      return true;
    case "reset-zoom":
      handlers.resetZoom();
      return true;
    case "toggle-preview":
      handlers.togglePreviewMode();
      return true;
    case "export-document-pdf":
      handlers.exportDocumentPdf();
      return true;
    case "print-current-page":
      handlers.printCurrentPage();
      return true;
    default:
      return false;
  }
}

export function useNativeMenuCommandListener(runNativeMenuCommand: (command: string) => void) {
  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;

    let cancelled = false;
    let unlisten: (() => void) | undefined;
    const runDomNativeMenuCommand = (event: Event) => {
      const command = (event as CustomEvent<unknown>).detail;
      if (typeof command === "string") {
        runNativeMenuCommand(command);
      }
    };

    window.addEventListener("native-menu-command", runDomNativeMenuCommand);
    void import("@tauri-apps/api/event")
      .then(({ listen }) => listen<string>("native-menu-command", (event) => runNativeMenuCommand(event.payload)))
      .then((stopListening) => {
        if (cancelled) {
          stopListening();
          return;
        }
        unlisten = stopListening;
      })
      .catch((error) => {
        console.warn("Native menu listener failed", error);
      });

    return () => {
      cancelled = true;
      unlisten?.();
      window.removeEventListener("native-menu-command", runDomNativeMenuCommand);
    };
  }, [runNativeMenuCommand]);
}
