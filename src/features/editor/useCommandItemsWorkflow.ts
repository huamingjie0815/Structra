import { useMemo } from "react";
import type { AutoLayoutMode, CommandItem, MatchSizeAction, ShapeKind } from "../../domain/types";
import { buildCommandItems } from "../../editor/commandRegistry";

type CommandAction = () => void | Promise<unknown>;

type CommandItemsWorkflowInput = {
  newDocument: () => void;
  openDocument: CommandAction;
  saveDocument: CommandAction;
  saveDocumentAs: CommandAction;
  setTool: (tool: "select" | "pan" | "connect") => void;
  addShape: (kind: ShapeKind) => void;
  addPage: () => void;
  duplicatePage: () => void;
  saveCache: () => void;
  saveVersion: () => void;
  importJson: CommandAction;
  importMermaid: CommandAction;
  exportDefault: CommandAction;
  exportJson: CommandAction;
  exportMermaid: CommandAction;
  exportSvg: CommandAction;
  exportPng: CommandAction;
  exportPdf: CommandAction;
  exportDocumentPdf: CommandAction;
  printCurrentPage: () => void;
  openPreferences: () => void;
  openPresentation: () => void;
  toggleSnapToGrid: () => void;
  fitCanvas: () => void;
  fitSelection: () => void;
  matchNodeSize: (action: MatchSizeAction) => void;
  autoLayout: (direction: AutoLayoutMode) => void;
  appendStructuredNode: (mode: "child" | "sibling") => void;
  startKeyboardConnector: () => void;
  completeKeyboardConnector: () => void;
  selectedNodeCount: number;
  nodeCount: number;
  mindNodeCount: number;
  orgNodeCount: number;
  canAddStructuredChild: boolean;
  canAddStructuredSibling: boolean;
  keyboardConnectorActive: boolean;
};

export function useCommandItemsWorkflow({
  newDocument,
  openDocument,
  saveDocument,
  saveDocumentAs,
  setTool,
  addShape,
  addPage,
  duplicatePage,
  saveCache,
  saveVersion,
  importJson,
  importMermaid,
  exportDefault,
  exportJson,
  exportMermaid,
  exportSvg,
  exportPng,
  exportPdf,
  exportDocumentPdf,
  printCurrentPage,
  openPreferences,
  openPresentation,
  toggleSnapToGrid,
  fitCanvas,
  fitSelection,
  matchNodeSize,
  autoLayout,
  appendStructuredNode,
  startKeyboardConnector,
  completeKeyboardConnector,
  selectedNodeCount,
  nodeCount,
  mindNodeCount,
  orgNodeCount,
  canAddStructuredChild,
  canAddStructuredSibling,
  keyboardConnectorActive
}: CommandItemsWorkflowInput): CommandItem[] {
  return useMemo(
    () =>
      buildCommandItems({
        newDocument,
        openDocument: () => void openDocument(),
        saveDocument: () => void saveDocument(),
        saveDocumentAs: () => void saveDocumentAs(),
        setTool,
        addShape,
        addPage,
        duplicatePage,
        saveCache,
        saveVersion,
        importJson: () => void importJson(),
        importMermaid: () => void importMermaid(),
        exportDefault: () => void exportDefault(),
        exportJson: () => void exportJson(),
        exportMermaid: () => void exportMermaid(),
        exportSvg: () => void exportSvg(),
        exportPng: () => void exportPng(),
        exportPdf: () => void exportPdf(),
        exportDocumentPdf: () => void exportDocumentPdf(),
        printCurrentPage,
        openPreferences,
        openPresentation,
        toggleSnapToGrid,
        fitCanvas,
        fitSelection,
        matchNodeSize,
        autoLayout,
        appendStructuredNode,
        startKeyboardConnector,
        completeKeyboardConnector,
        selectedNodeCount,
        nodeCount,
        mindNodeCount,
        orgNodeCount,
        canAddStructuredChild,
        canAddStructuredSibling,
        keyboardConnectorActive
      }),
    [
      addPage,
      addShape,
      duplicatePage,
      exportDefault,
      exportJson,
      exportMermaid,
      exportPdf,
      exportPng,
      exportSvg,
      exportDocumentPdf,
      printCurrentPage,
      fitCanvas,
      fitSelection,
      matchNodeSize,
      autoLayout,
      appendStructuredNode,
      startKeyboardConnector,
      completeKeyboardConnector,
      importJson,
      importMermaid,
      newDocument,
      openDocument,
      openPreferences,
      openPresentation,
      saveCache,
      saveDocument,
      saveDocumentAs,
      saveVersion,
      nodeCount,
      mindNodeCount,
      orgNodeCount,
      canAddStructuredChild,
      canAddStructuredSibling,
      keyboardConnectorActive,
      selectedNodeCount,
      setTool,
      toggleSnapToGrid
    ]
  );
}
