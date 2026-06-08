import { useEffect } from "react";
import type { RefObject } from "react";
import { handleEditorKeyDown } from "../../editor/keyboardShortcuts";

type KeyboardReactFlow = {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: (options?: { padding?: number }) => void;
};

type KeyboardAction = () => void | Promise<unknown>;

type EditorKeyboardWorkflowInput = {
  outlineSearchRef: RefObject<HTMLInputElement>;
  openCommandPalette: () => void;
  saveDocument: KeyboardAction;
  saveDocumentAs: KeyboardAction;
  openDocument: KeyboardAction;
  newDocument: () => void;
  nudgeSelectedNodes: (dx: number, dy: number) => void;
  reactFlow: KeyboardReactFlow | null;
  undo: () => void;
  redo: () => void;
  duplicateSelection: () => void;
  copySelection: () => void;
  cutSelection: () => void;
  pasteClipboard: () => void;
  selectAllNodes: () => void;
  deleteSelection: () => void;
  closeContextMenu: () => void;
  exitPreviewMode: () => void;
  completeKeyboardConnector: () => boolean;
  appendStructuredNode: (mode: "child" | "sibling") => boolean;
};

export function useEditorKeyboardWorkflow({
  outlineSearchRef,
  openCommandPalette,
  saveDocument,
  saveDocumentAs,
  openDocument,
  newDocument,
  nudgeSelectedNodes,
  reactFlow,
  undo,
  redo,
  duplicateSelection,
  copySelection,
  cutSelection,
  pasteClipboard,
  selectAllNodes,
  deleteSelection,
  closeContextMenu,
  exitPreviewMode,
  completeKeyboardConnector,
  appendStructuredNode
}: EditorKeyboardWorkflowInput) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleEditorKeyDown(event, {
        focusOutlineSearch: () => {
          outlineSearchRef.current?.focus();
          outlineSearchRef.current?.select();
        },
        openCommandPalette,
        saveDocument: () => void saveDocument(),
        saveDocumentAs: () => void saveDocumentAs(),
        openDocument: () => void openDocument(),
        newDocument,
        nudgeSelectedNodes,
        zoomIn: () => reactFlow?.zoomIn(),
        zoomOut: () => reactFlow?.zoomOut(),
        fitCanvas: () => reactFlow?.fitView({ padding: 0.2 }),
        undo,
        redo,
        duplicateSelection,
        copySelection,
        cutSelection,
        pasteClipboard,
        selectAllNodes,
        deleteSelection,
        closeContextMenu,
        exitPreviewMode,
        completeKeyboardConnector,
        appendStructuredNode
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    closeContextMenu,
    completeKeyboardConnector,
    appendStructuredNode,
    copySelection,
    cutSelection,
    deleteSelection,
    duplicateSelection,
    exitPreviewMode,
    newDocument,
    nudgeSelectedNodes,
    openCommandPalette,
    openDocument,
    outlineSearchRef,
    pasteClipboard,
    reactFlow,
    redo,
    saveDocument,
    saveDocumentAs,
    selectAllNodes,
    undo
  ]);
}
