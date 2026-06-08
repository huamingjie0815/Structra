import type { CommandItem } from "../domain/types";

export type NativeMenuEnabledState = Record<string, boolean>;

export type NativeMenuAvailabilityInput = {
  canUndo: boolean;
  canRedo: boolean;
  canPaste: boolean;
  documentDirty: boolean;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  hasSelection: boolean;
};

export function buildNativeMenuEnabledState(input: NativeMenuAvailabilityInput): NativeMenuEnabledState {
  const hasSelectedNode = input.selectedNodeCount > 0;
  const hasAnySelection = input.hasSelection || input.selectedNodeCount > 0 || input.selectedEdgeCount > 0;

  return {
    undo: input.canUndo,
    redo: input.canRedo,
    "document-save": input.documentDirty,
    "open-workspace": true,
    preferences: true,
    "copy-selection": hasSelectedNode,
    "cut-selection": hasSelectedNode,
    "paste-selection": input.canPaste,
    "duplicate-selection": hasSelectedNode,
    "delete-selection": hasAnySelection,
    "fit-selection": hasSelectedNode,
    "toggle-snap-to-grid": true
  };
}

export function isNativeMenuCommandEnabled(
  command: string,
  enabledState?: NativeMenuEnabledState,
  commandItems: CommandItem[] = []
): boolean {
  if (enabledState?.[command] === false) return false;

  const paletteCommand = commandItems.find((item) => item.id === command);
  if (paletteCommand?.disabled) return false;

  return true;
}
